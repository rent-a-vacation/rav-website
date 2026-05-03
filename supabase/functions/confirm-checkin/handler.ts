// Core logic for confirm-checkin (#461 / PaySafe Gap A).
//
// Two action types on a single endpoint:
//   - "confirm"      → renter confirms arrival
//   - "report_issue" → renter reports a check-in issue (optional photo path)
//
// Server-side guarantees:
//   1. Auth: only the booking's renter (checkin_confirmations.traveler_id = auth.uid())
//   2. Idempotent re-tap on already-confirmed row → returns success without re-writing
//   3. On confirm success: dispatch traveler_arrival_confirmed to the owner (fire-and-forget)
//   4. On report_issue success: dispatch traveler_reported_checkin_issue to RAV team (fire-and-forget)
//
// Replaces the direct supabase.from("checkin_confirmations").update() calls
// previously made from src/pages/TravelerCheckin.tsx.

import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CONFIRM-CHECKIN] ${step}${detailsStr}`);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export interface Deps {
  supabase: SupabaseLike;
  env: Record<string, string | undefined>;
}

export type ConfirmCheckinAction = "confirm" | "report_issue";

export interface ConfirmCheckinBody {
  bookingId: string;
  action: ConfirmCheckinAction;
  // report_issue path only:
  issueType?: string;
  issueDescription?: string;
  verificationPhotoPath?: string | null;
}

const VALID_ISSUE_TYPES = new Set([
  "no_access",
  "wrong_unit",
  "not_as_described",
  "cleanliness",
  "amenities_missing",
  "safety_concern",
  "other",
]);

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

    const rateCheck = await checkRateLimit(supabase, user.id, RATE_LIMITS.CHECKIN_CONFIRMATION);
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    const body = (await req.json()) as Partial<ConfirmCheckinBody>;
    const { bookingId, action, issueType, issueDescription, verificationPhotoPath } = body;

    if (!bookingId) throw new Error("bookingId is required");
    if (action !== "confirm" && action !== "report_issue") {
      throw new Error("action must be 'confirm' or 'report_issue'");
    }

    // Look up the checkin row + verify ownership
    const { data: checkin, error: lookupError } = await supabase
      .from("checkin_confirmations")
      .select("id, traveler_id, confirmed_arrival, confirmed_at, issue_reported, booking_id")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (lookupError) throw new Error(`Check-in lookup failed: ${lookupError.message}`);
    if (!checkin) throw new Error("No check-in confirmation found for this booking");

    const row = checkin as {
      id: string;
      traveler_id: string;
      confirmed_arrival: boolean | null;
      confirmed_at: string | null;
      issue_reported: boolean;
      booking_id: string;
    };

    if (row.traveler_id !== user.id) {
      throw new Error("Only the booking traveler can confirm check-in.");
    }

    // ── Confirm path ────────────────────────────────────────────────────────
    if (action === "confirm") {
      // Idempotency: if already confirmed (renter, auto, or admin), return success
      if (row.confirmed_arrival === true) {
        logStep("Already confirmed — idempotent no-op", { id: row.id });
        return new Response(
          JSON.stringify({ success: true, alreadyConfirmed: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const nowIso = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("checkin_confirmations")
        .update({
          confirmed_arrival: true,
          confirmed_at: nowIso,
          confirmed_at_source: "renter",
          issue_reported: false,
        })
        .eq("id", row.id);

      if (updateError) throw new Error(`Confirm update failed: ${updateError.message}`);
      logStep("Arrival confirmed", { id: row.id });

      // Look up owner_id from the booking → notify owner (fire-and-forget)
      try {
        const { data: bookingRow } = await supabase
          .from("bookings")
          .select("id, listing:listings(owner_id, property:properties(resort_name))")
          .eq("id", row.booking_id)
          .maybeSingle();
        const ownerId =
          (bookingRow as { listing?: { owner_id?: string } } | null)?.listing?.owner_id ?? null;
        const resortName =
          (bookingRow as { listing?: { property?: { resort_name?: string } } } | null)
            ?.listing?.property?.resort_name ?? "your property";

        if (ownerId) {
          supabase.functions
            .invoke("notification-dispatcher", {
              body: {
                type_key: "traveler_arrival_confirmed",
                user_id: ownerId,
                payload: {
                  title: "Traveler confirmed arrival",
                  message: `Your traveler confirmed they've arrived at ${resortName}. Escrow timing is on track for release.`,
                  booking_id: row.booking_id,
                },
              },
            })
            .catch((err: unknown) =>
              logStep("owner notification failed (non-fatal)", {
                error: err instanceof Error ? err.message : String(err),
              }),
            );
        }
      } catch (err) {
        logStep("owner notification skipped (non-fatal)", {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      return new Response(
        JSON.stringify({ success: true, confirmedAt: nowIso }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Report-issue path ───────────────────────────────────────────────────
    // Validation
    if (!issueType || !VALID_ISSUE_TYPES.has(issueType)) {
      throw new Error(
        "Please choose an issue type so we can route this to the right team.",
      );
    }
    const trimmedDescription = (issueDescription ?? "").trim();
    if (trimmedDescription.length < 10) {
      throw new Error(
        "Please describe the issue in at least 10 characters so the team can act on it.",
      );
    }

    // Idempotency: if already reported, allow update of fields but skip re-notify
    const wasAlreadyReported = row.issue_reported === true;

    const nowIso = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      confirmed_arrival: false,
      issue_reported: true,
      issue_type: issueType,
      issue_description: trimmedDescription,
      issue_reported_at: nowIso,
    };
    if (verificationPhotoPath) {
      updatePayload.verification_photo_path = verificationPhotoPath;
      updatePayload.photo_uploaded_at = nowIso;
    }

    const { error: updateError } = await supabase
      .from("checkin_confirmations")
      .update(updatePayload)
      .eq("id", row.id);

    if (updateError) throw new Error(`Issue update failed: ${updateError.message}`);
    logStep("Issue reported", { id: row.id, issueType, hasPhoto: !!verificationPhotoPath });

    // Notify RAV team (fire-and-forget) — only on the first report
    if (!wasAlreadyReported) {
      supabase.functions
        .invoke("notification-dispatcher", {
          body: {
            type_key: "traveler_reported_checkin_issue",
            // notification-dispatcher resolves a topic-based fan-out internally
            // for RAV team alerts; user_id is omitted on team broadcasts.
            payload: {
              title: "Traveler reported a check-in issue",
              message: `Issue type: ${issueType}. Booking ${row.booking_id}.`,
              booking_id: row.booking_id,
              issue_type: issueType,
              has_photo: !!verificationPhotoPath,
            },
          },
        })
        .catch((err: unknown) =>
          logStep("rav-team notification failed (non-fatal)", {
            error: err instanceof Error ? err.message : String(err),
          }),
        );
    }

    return new Response(
      JSON.stringify({
        success: true,
        issueReportedAt: nowIso,
        photoCaptured: !!verificationPhotoPath,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
