// Core logic for cancel-listing (issue #371). Extracted from index.ts.
// Orchestrates the listing-cancellation cascade documented in #377.

import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CANCEL-LISTING] ${step}${detailsStr}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export interface Deps {
  supabase: SupabaseLike;
  env: Record<string, string | undefined>;
}

export async function handler(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { supabase } = deps;

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const rateCheck = await checkRateLimit(supabase, user.id, RATE_LIMITS.CANCELLATION);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    const body = await req.json();
    const { listingId, reason } = body as { listingId?: string; reason?: string };
    if (!listingId) throw new Error("listingId is required");
    if (!reason || reason.trim().length < 4) {
      throw new Error(
        "A reason of at least 4 characters is required so affected travelers understand why.",
      );
    }
    const trimmedReason = reason.trim();

    const { data: listing, error: listingError } = await supabase
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

    {
      const { error } = await supabase
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

    const { data: pendingBids } = await supabase
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
      const { error: bidUpdateError } = await supabase
        .from("listing_bids")
        .update({
          status: "rejected",
          rejection_reason: `Listing cancelled by owner — ${trimmedReason}`,
        })
        .in("id", bidRows.map((b) => b.id));
      if (bidUpdateError) {
        logStep("Bid bulk reject failed (non-fatal)", { error: bidUpdateError.message });
      }

      for (const bid of bidRows) {
        supabase.functions
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

    const { data: activeBookings } = await supabase
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
        const resp = await supabase.functions.invoke("process-cancellation", {
          body: {
            bookingId: booking.id,
            reason: `Owner cancelled the listing: ${trimmedReason}`,
            cancelledBy: "owner",
          },
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

    const { data: ownerVerif } = await supabase
      .from("owner_verifications")
      .select("id, cancellation_count")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (ownerVerif) {
      await supabase
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
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}
