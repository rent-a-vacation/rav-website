// Core logic for process-escrow-release (issue #371 + #468 / PaySafe Gap D).
//
// Auto-releases verified escrows past the configurable hold period and
// initiates Stripe Connect payouts to owners with linked accounts.
//
// Hold period now sourced from system_settings.escrow_hold_period_days
// (migration 068). Falls back to 5 if the setting is missing.

import { buildEmailHtml, detailRow } from "../_shared/email-template.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: Record<string, unknown>) => {
  const d = details ? ` — ${JSON.stringify(details)}` : "";
  console.log(`[ESCROW-RELEASE] ${step}${d}`);
};

const DEFAULT_HOLD_PERIOD_DAYS = 5;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export interface StripeLike {
  transfers: {
    create: (args: {
      amount: number;
      currency: string;
      destination: string;
      description: string;
      metadata: Record<string, string>;
    }) => Promise<{ id: string }>;
  };
}

export interface ResendLike {
  emails: {
    send: (args: {
      from: string;
      to: string[];
      subject: string;
      html: string;
    }) => Promise<unknown>;
  };
}

export interface Deps {
  supabase: SupabaseLike;
  stripe: StripeLike | null;
  resend: ResendLike;
  env: Record<string, string | undefined>;
  /** Inject "now" for tests; defaults to real NOW() at call-time. */
  now?: () => Date;
}

/**
 * Resolve the active hold period from system_settings, falling back to the
 * documented default if the setting row is missing or malformed.
 * Exported so tests can verify the fallback path.
 */
export async function resolveHoldPeriodDays(
  supabase: SupabaseLike,
): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "escrow_hold_period_days")
      .maybeSingle();
    if (error) {
      log("hold-period setting fetch error — falling back to default", {
        error: error.message,
      });
      return DEFAULT_HOLD_PERIOD_DAYS;
    }
    const setting = (data as { setting_value?: { days?: number } } | null)?.setting_value;
    const days = setting?.days;
    if (typeof days === "number" && days >= 0 && days <= 365) {
      return Math.floor(days);
    }
    return DEFAULT_HOLD_PERIOD_DAYS;
  } catch (err) {
    log("hold-period setting threw — falling back to default", {
      error: err instanceof Error ? err.message : String(err),
    });
    return DEFAULT_HOLD_PERIOD_DAYS;
  }
}

export async function handler(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { supabase, stripe, resend, now } = deps;

  try {
    log("Function started");

    // ── Auth: accept admin JWT or service-role (for scheduled calls) ──
    const authHeader = req.headers.get("Authorization");
    if (authHeader && !authHeader.includes("service_role")) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData.user) throw new Error("Authentication failed");

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      const isAdmin = roles?.some(
        (r: { role: string }) => r.role === "rav_admin" || r.role === "rav_staff",
      );
      if (!isAdmin) throw new Error("Only RAV admins can trigger escrow release");
      log("Admin authenticated", { userId: userData.user.id });
    }

    const holdPeriodDays = await resolveHoldPeriodDays(supabase);
    log("Hold period resolved", { holdPeriodDays });

    // ── Find all verified escrows past the hold period ──
    const { data: escrows, error: escrowErr } = await supabase
      .from("booking_confirmations")
      .select(`
        id, booking_id, escrow_amount, escrow_status, payout_held,
        booking:bookings(
          id, status, owner_payout, payout_status, listing_id,
          listing:listings(
            check_out_date,
            property:properties(resort_name),
            owner:profiles!listings_owner_id_fkey(
              id, full_name, email,
              stripe_account_id, stripe_payouts_enabled
            )
          )
        )
      `)
      .eq("escrow_status", "verified")
      .eq("payout_held", false);

    if (escrowErr) throw new Error(`Failed to fetch escrows: ${escrowErr.message}`);

    if (!escrows || escrows.length === 0) {
      log("No verified escrows found");
      return new Response(
        JSON.stringify({ released: 0, payouts_initiated: 0, skipped: 0, hold_period_days: holdPeriodDays }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    log("Found verified escrows", { count: escrows.length });

    const nowDate = now ? now() : new Date();
    const cutoffDate = new Date(nowDate);
    cutoffDate.setDate(cutoffDate.getDate() - holdPeriodDays);

    let released = 0;
    let payoutsInitiated = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const escrow of escrows as Array<Record<string, unknown>>) {
      const booking = escrow.booking as Record<string, unknown> | null;
      if (!booking) {
        log("Skipping: no booking", { escrowId: escrow.id });
        skipped++;
        continue;
      }

      const listing = booking.listing as Record<string, unknown> | null;
      if (!listing) {
        log("Skipping: no listing", { escrowId: escrow.id });
        skipped++;
        continue;
      }

      const checkOutDate = new Date(listing.check_out_date as string);
      if (isNaN(checkOutDate.getTime())) {
        log("Skipping: invalid checkout date", { escrowId: escrow.id });
        skipped++;
        continue;
      }

      if (checkOutDate > cutoffDate) {
        log("Skipping: hold period not elapsed", {
          escrowId: escrow.id,
          checkOut: listing.check_out_date,
          daysRemaining: Math.ceil(
            (checkOutDate.getTime() - cutoffDate.getTime()) / 86400000,
          ),
        });
        skipped++;
        continue;
      }

      if (booking.status !== "confirmed" && booking.status !== "completed") {
        log("Skipping: booking not confirmed/completed", {
          escrowId: escrow.id,
          bookingStatus: booking.status,
        });
        skipped++;
        continue;
      }

      if (booking.payout_status === "paid" || booking.payout_status === "processing") {
        log("Skipping: payout already in progress/paid", {
          escrowId: escrow.id,
          payoutStatus: booking.payout_status,
        });
        skipped++;
        continue;
      }

      const { error: releaseErr } = await supabase
        .from("booking_confirmations")
        .update({
          escrow_status: "released",
          escrow_released_at: nowDate.toISOString(),
          auto_released: true,
        })
        .eq("id", escrow.id);

      if (releaseErr) {
        errors.push(`Failed to release escrow ${escrow.id}: ${releaseErr.message}`);
        continue;
      }

      released++;
      log("Escrow released", { escrowId: escrow.id, bookingId: booking.id });

      const owner = listing.owner as Record<string, unknown> | null;
      if (!owner) {
        log("No owner found for payout", { escrowId: escrow.id });
        continue;
      }

      const ownerPayoutAmount = booking.owner_payout as number;
      const ownerStripeAccount = owner.stripe_account_id as string | null;
      const ownerPayoutsEnabled = owner.stripe_payouts_enabled as boolean;

      if (!stripe || !ownerStripeAccount || !ownerPayoutsEnabled) {
        await supabase
          .from("bookings")
          .update({
            payout_status: "pending",
            payout_notes:
              "Escrow auto-released. Manual payout required (no Stripe Connect).",
          })
          .eq("id", booking.id);
        log("Manual payout needed", { ownerId: owner.id, bookingId: booking.id });
        continue;
      }

      try {
        const payoutCents = Math.round(ownerPayoutAmount * 100);
        const property = listing.property as Record<string, unknown> | null;
        const resortName = (property?.resort_name as string) || "Vacation Rental";

        const transfer = await stripe.transfers.create({
          amount: payoutCents,
          currency: "usd",
          destination: ownerStripeAccount,
          description: `Auto-payout for booking ${(booking.id as string).slice(0, 8).toUpperCase()} — ${resortName}`,
          metadata: {
            booking_id: booking.id as string,
            listing_id: booking.listing_id as string,
            owner_id: owner.id as string,
            auto_release: "true",
          },
        });

        await supabase
          .from("bookings")
          .update({
            payout_status: "processing",
            stripe_transfer_id: transfer.id,
            payout_reference: transfer.id,
            payout_notes: "Automated escrow release + Stripe payout",
          })
          .eq("id", booking.id);

        payoutsInitiated++;
        log("Stripe payout created", {
          transferId: transfer.id,
          amount: ownerPayoutAmount,
        });

        try {
          const html = buildEmailHtml({
            recipientName: (owner.full_name as string) || "Property Owner",
            heading: "Your Payout Is On Its Way!",
            body: `
              <p>Great news! Your escrow has been automatically released and a payout has been initiated.</p>
              <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
                ${detailRow("Property", resortName)}
                ${detailRow("Payout Amount", `$${ownerPayoutAmount.toLocaleString()}`)}
                ${detailRow("Transfer ID", transfer.id)}
              </div>
              <p>Funds typically arrive in your bank account within 2&ndash;3 business days.</p>
            `,
            cta: {
              label: "View My Earnings",
              url: "https://rent-a-vacation.com/owner-dashboard?tab=earnings",
            },
          });

          await resend.emails.send({
            from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
            to: [owner.email as string],
            subject: `Payout Initiated — $${ownerPayoutAmount.toLocaleString()} for ${resortName}`,
            html,
          });
        } catch (emailErr) {
          log("Warning: email send failed", { error: String(emailErr) });
        }
      } catch (stripeErr) {
        const msg = stripeErr instanceof Error ? stripeErr.message : String(stripeErr);
        errors.push(`Stripe payout failed for booking ${booking.id}: ${msg}`);
        log("Stripe payout failed", { bookingId: booking.id, error: msg });

        await supabase
          .from("bookings")
          .update({
            payout_status: "failed",
            payout_notes: `Auto-payout failed: ${msg}`,
          })
          .eq("id", booking.id);
      }
    }

    const result = {
      released,
      payouts_initiated: payoutsInitiated,
      skipped,
      hold_period_days: holdPeriodDays,
      errors: errors.length > 0 ? errors : undefined,
    };

    log("Completed", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}
