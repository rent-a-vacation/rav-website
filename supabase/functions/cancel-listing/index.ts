import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

// #377 — Atomic listing cancellation cascade.
//
// Orchestrates:
//   1. Listing → status='cancelled', cancelled_at/reason/by stamped.
//   2. All pending bids on the listing → rejected with the owner's reason.
//   3. All confirmed/pending bookings on the listing → owner-initiated
//      cancellation via the existing `process-cancellation` edge function
//      (handles Stripe refund + notifications per-booking).
//   4. owner_verifications.cancellation_count incremented.
//   5. Dispatches `listing_cancelled_by_owner` notifications to each bidder.
//
// NOT literally a single DB transaction — Stripe refund HTTP calls can't
// participate. Order is: DB-side cancellation first (fast, atomic), then
// per-booking refund loop. If a booking refund fails, the listing stays
// cancelled + the booking stays confirmed; admin has to reconcile via
// AdminDisputes. Acceptable because the listing-cancel decision was
// already made by the owner.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CANCEL-LISTING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logStep("Function started");

    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await serviceClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Rate-limit on the owner: cancelling 10 listings a minute is abusive.
    const rateCheck = await checkRateLimit(serviceClient, user.id, RATE_LIMITS.CANCELLATION);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    // ── Parse + validate ───────────────────────────────────────────────────
    const body = await req.json();
    const { listingId, reason } = body as { listingId?: string; reason?: string };
    if (!listingId) throw new Error("listingId is required");
    if (!reason || reason.trim().length < 4) {
      throw new Error("A reason of at least 4 characters is required so affected travelers understand why.");
    }
    const trimmedReason = reason.trim();

    // ── Load listing + authorize ───────────────────────────────────────────
    const { data: listing, error: listingError } = await serviceClient
      .from("listings")
      .select("id, owner_id, status, cancelled_at")
      .eq("id", listingId)
      .maybeSingle();
    if (listingError) throw new Error(`Listing lookup failed: ${listingError.message}`);
    if (!listing) throw new Error("Listing not found");
    if ((listing as { owner_id: string }).owner_id !== user.id) {
      throw new Error("You can only cancel your own listings.");
    }
    if ((listing as { cancelled_at: string | null }).cancelled_at) {
      throw new Error("This listing is already cancelled.");
    }
    const status = (listing as { status: string }).status;
    if (!["draft", "pending_approval", "active"].includes(status)) {
      throw new Error(`Listings in status '${status}' cannot be cancelled.`);
    }

    // ── 1. Flip listing status + stamp audit fields ─────────────────────────
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (serviceClient as any)
        .from("listings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancellation_reason: trimmedReason,
          cancelled_by: user.id,
        })
        .eq("id", listingId);
      if (error) throw new Error(`Listing update failed: ${error.message}`);
    }
    logStep("Listing cancelled");

    // ── 2. Bulk-reject pending bids + notify bidders ───────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingBids } = await (serviceClient as any)
      .from("listing_bids")
      .select("id, renter_id, bid_amount")
      .eq("listing_id", listingId)
      .eq("status", "pending");

    const bidRows = (pendingBids ?? []) as Array<{
      id: string;
      renter_id: string;
      bid_amount: number;
    }>;

    if (bidRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: bidUpdateError } = await (serviceClient as any)
        .from("listing_bids")
        .update({
          status: "rejected",
          rejection_reason: `Listing cancelled by owner — ${trimmedReason}`,
        })
        .in("id", bidRows.map((b) => b.id));
      if (bidUpdateError) {
        logStep("Bid bulk reject failed (non-fatal)", { error: bidUpdateError.message });
      }

      // Fire-and-forget notifications to each bidder.
      for (const bid of bidRows) {
        serviceClient.functions
          .invoke("notification-dispatcher", {
            body: {
              type_key: "listing_cancelled_by_owner",
              user_id: bid.renter_id,
              payload: {
                title: "Listing cancelled",
                message: `A listing you had a $${bid.bid_amount.toLocaleString()} Offer on was cancelled by the owner. Reason: ${trimmedReason}`,
                listing_id: listingId,
              },
            },
          })
          .catch((err: unknown) =>
            logStep("bidder notification failed (non-fatal)", {
              error: err instanceof Error ? err.message : String(err),
            }),
          );
      }
    }
    logStep("Bids processed", { count: bidRows.length });

    // ── 3. Cancel confirmed/pending bookings via process-cancellation ──────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activeBookings } = await (serviceClient as any)
      .from("bookings")
      .select("id, total_amount, status")
      .eq("listing_id", listingId)
      .in("status", ["confirmed", "pending"]);

    const bookingRows = (activeBookings ?? []) as Array<{
      id: string;
      total_amount: number;
      status: string;
    }>;

    let refundsProcessed = 0;
    let refundTotal = 0;
    const refundFailures: string[] = [];

    for (const booking of bookingRows) {
      try {
        const resp = await serviceClient.functions.invoke("process-cancellation", {
          body: {
            bookingId: booking.id,
            reason: `Owner cancelled the listing: ${trimmedReason}`,
            cancelledBy: "owner",
          },
          // Pass caller's token so process-cancellation authorises the owner.
          headers: { Authorization: authHeader },
        });
        if (resp.error) {
          refundFailures.push(`${booking.id}: ${resp.error.message}`);
          continue;
        }
        refundsProcessed += 1;
        refundTotal += booking.total_amount ?? 0;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        refundFailures.push(`${booking.id}: ${msg}`);
      }
    }
    logStep("Bookings cancelled", {
      attempted: bookingRows.length,
      succeeded: refundsProcessed,
      failed: refundFailures.length,
    });

    // ── 4. Increment owner's cancellation_count (trust signal) ─────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ownerVerif } = await (serviceClient as any)
      .from("owner_verifications")
      .select("id, cancellation_count")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (ownerVerif) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient as any)
        .from("owner_verifications")
        .update({
          cancellation_count:
            ((ownerVerif as { cancellation_count: number }).cancellation_count ?? 0) + 1,
        })
        .eq("id", (ownerVerif as { id: string }).id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        cancelledBidsCount: bidRows.length,
        cancelledBookingsCount: refundsProcessed,
        refundFailures,
        refundTotal,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logStep("Error", { error: message });
    return new Response(
      JSON.stringify({ success: false, error: message }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
