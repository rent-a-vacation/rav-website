// Core logic for stripe-webhook (issue #371). All Stripe SDK + Supabase
// client + Resend types are intentionally `any`/`unknown` here so the file
// stays free of `https://esm.sh/...` and `npm:...` imports — those live in
// the thin `index.ts` Deno wrapper.

import { buildEmailHtml, detailRow } from "../_shared/email-template.ts";

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const getConfirmationDeadline = (): string => {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 48);
  return deadline.toISOString();
};

const getCheckinConfirmationDeadline = (checkInDate: string): string => {
  const deadline = new Date(checkInDate);
  deadline.setHours(deadline.getHours() + 24);
  return deadline.toISOString();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export interface StripeLike {
  webhooks: {
    constructEvent: (
      body: string,
      signature: string,
      secret: string,
    ) => { id: string; type: string; data: { object: Record<string, unknown> } };
  };
}

export interface ResendLike {
  emails: {
    send: (args: { from: string; to: string | string[]; subject: string; html: string }) => Promise<unknown>;
  };
}

export interface Deps {
  supabase: SupabaseLike;
  stripe: StripeLike;
  resend: ResendLike;
  env: Record<string, string | undefined>;
}

export async function handler(req: Request, deps: Deps): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { supabase, stripe, resend, env } = deps;

  try {
    if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!env.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");

    const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
    logStep("Webhook received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, resend, env, event.data.object);
        break;
      case "checkout.session.expired":
        await handleCheckoutExpired(supabase, event.data.object);
        break;
      case "charge.refunded":
        await handleChargeRefunded(supabase, event.data.object);
        break;
      case "account.updated":
        await handleAccountUpdated(supabase, event.data.object);
        break;
      case "transfer.created":
        await handleTransferCreated(supabase, event.data.object);
        break;
      case "transfer.reversed":
        await handleTransferReversed(supabase, event.data.object);
        break;
      case "customer.subscription.created":
        await handleSubscriptionCreated(supabase, resend, event.data.object);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, resend, event.data.object);
        break;
      case "invoice.paid":
        await handleInvoicePaid(supabase, event.data.object);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, resend, event.data.object);
        break;
      case "charge.dispute.created":
        await handleChargeDisputeCreated(supabase, event.data.object);
        break;
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    const status = errorMessage.toLowerCase().includes("signature") ? 400 : 500;
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { "Content-Type": "application/json" },
      status,
    });
  }
}

// ── checkout.session.completed ──────────────────────────────────────────────

export async function handleCheckoutCompleted(
  supabase: SupabaseLike,
  resend: ResendLike,
  env: Record<string, string | undefined>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any,
) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    logStep("No booking_id in session metadata, skipping");
    return;
  }

  logStep("Processing checkout.session.completed", {
    sessionId: session.id,
    bookingId,
    paymentIntent: session.payment_intent,
  });

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(
      `
      *,
      listing:listings(
        *,
        property:properties(*)
      )
    `,
    )
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    logStep("Booking not found", { bookingId, error: bookingError?.message });
    return;
  }

  if (session.payment_intent && session.payment_intent !== booking.payment_intent_id) {
    await supabase
      .from("bookings")
      .update({ payment_intent_id: String(session.payment_intent) })
      .eq("id", bookingId);
  }

  if (booking.status === "confirmed" || booking.status === "completed") {
    logStep("Booking already confirmed, skipping", { status: booking.status });
    return;
  }

  if (session.payment_status !== "paid") {
    logStep("Payment not completed", { paymentStatus: session.payment_status });
    return;
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "confirmed", paid_at: new Date().toISOString() })
    .eq("id", bookingId);

  if (updateError) {
    logStep("Failed to update booking", { error: updateError.message });
    return;
  }

  await supabase.from("listings").update({ status: "booked" }).eq("id", booking.listing_id);

  let ownerConfirmationWindowMinutes = 60;
  try {
    const { data: windowSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", "owner_confirmation_window_minutes")
      .single();
    if (windowSetting?.setting_value?.value) {
      ownerConfirmationWindowMinutes = windowSetting.setting_value.value;
    }
  } catch {
    /* default */
  }

  const ownerConfirmationDeadline = new Date();
  ownerConfirmationDeadline.setMinutes(
    ownerConfirmationDeadline.getMinutes() + ownerConfirmationWindowMinutes,
  );
  const confirmationDeadline = getConfirmationDeadline();

  const { data: bookingConfirmation } = await supabase
    .from("booking_confirmations")
    .insert({
      booking_id: bookingId,
      listing_id: booking.listing_id,
      owner_id: booking.listing?.owner_id,
      confirmation_deadline: confirmationDeadline,
      escrow_status: "pending_confirmation",
      escrow_amount: booking.total_amount,
      owner_confirmation_status: "pending_owner",
      owner_confirmation_deadline: ownerConfirmationDeadline.toISOString(),
      extensions_used: 0,
    })
    .select()
    .single();

  if (bookingConfirmation) {
    try {
      const notificationUrl = `${env.SUPABASE_URL}/functions/v1/send-booking-confirmation-reminder`;
      const authHeader = `Bearer ${env.SUPABASE_ANON_KEY}`;
      await fetch(notificationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({ type: "new_booking", bookingConfirmationId: bookingConfirmation.id }),
      });
      await fetch(notificationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          type: "owner_confirmation_request",
          bookingConfirmationId: bookingConfirmation.id,
        }),
      });
    } catch (err) {
      logStep("Owner email notification failed", { error: String(err) });
    }
  }

  const checkInDate = booking.listing?.check_in_date;
  if (checkInDate) {
    const checkinDeadline = getCheckinConfirmationDeadline(checkInDate);
    await supabase.from("checkin_confirmations").insert({
      booking_id: bookingId,
      traveler_id: booking.renter_id,
      confirmation_deadline: checkinDeadline,
    });
  }

  const guaranteeFundContribution = Math.round(booking.rav_commission * 0.03 * 100) / 100;
  await supabase.from("platform_guarantee_fund").insert({
    booking_id: bookingId,
    contribution_amount: guaranteeFundContribution,
    contribution_percentage: 3,
  });

  try {
    const resortName = booking.listing?.property?.resort_name || "Your Resort";
    const { data: travelerProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", booking.renter_id)
      .single();

    const travelerEmail = travelerProfile?.email;
    if (travelerEmail) {
      const html = buildEmailHtml({
        recipientName: travelerProfile?.full_name || "Traveler",
        heading: "Booking Confirmed!",
        body: `
          <p>Congratulations! Your booking has been confirmed and payment received.</p>
          ${detailRow("Booking ID", bookingId.slice(0, 8).toUpperCase())}
          ${detailRow("Resort", resortName)}
          ${detailRow("Total Paid", `$${booking.total_amount?.toLocaleString()}`)}
        `,
        cta: {
          label: "View My Booking",
          url: `https://rent-a-vacation.com/booking-success?booking_id=${bookingId}`,
        },
      });
      await resend.emails.send({
        from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
        to: [travelerEmail],
        subject: `Booking Confirmed – ${resortName}`,
        html,
      });
    }
  } catch (err) {
    logStep("Traveler confirmation email failed", { error: String(err) });
  }

  logStep("checkout.session.completed processed");
}

// ── checkout.session.expired ────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleCheckoutExpired(supabase: SupabaseLike, session: any) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return;

  const { data: booking } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.status !== "pending") return;

  await supabase.from("bookings").update({ status: "cancelled" }).eq("id", bookingId);
  logStep("Pending booking cancelled due to session expiry", { bookingId });
}

// ── charge.dispute.created ──────────────────────────────────────────────────
// #465 (PaySafe Gap H) — auto-mirror Stripe chargebacks to internal disputes
// row so RAV staff don't lose time hand-mirroring during the chargeback
// evidence window (typically 7-21 days).
//
// Idempotent: stripe_dispute_id is UNIQUE (migration 070). Re-firing the
// webhook returns early without creating a duplicate row.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleChargeDisputeCreated(supabase: SupabaseLike, dispute: any) {
  const stripeDisputeId: string | undefined = dispute?.id;
  if (!stripeDisputeId) {
    logStep("charge.dispute.created without id, skipping");
    return;
  }

  // Resolve the booking via payment_intent → bookings.payment_intent_id
  const paymentIntentId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id;
  if (!paymentIntentId) {
    logStep("charge.dispute.created without payment_intent, skipping", {
      stripeDisputeId,
    });
    return;
  }

  // Idempotency: skip if we already mirrored this dispute
  const { data: existing } = await supabase
    .from("disputes")
    .select("id")
    .eq("stripe_dispute_id", stripeDisputeId)
    .maybeSingle();
  if (existing) {
    logStep("Stripe dispute already mirrored, skipping", {
      stripeDisputeId,
      existingId: (existing as { id: string }).id,
    });
    return;
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, renter_id, listing:listings(owner_id)")
    .eq("payment_intent_id", paymentIntentId)
    .maybeSingle();

  if (!booking) {
    logStep("Booking not found for chargeback — alert RAV team manually", {
      stripeDisputeId,
      paymentIntentId,
    });
    // Notify RAV team so they can investigate the orphan chargeback
    supabase.functions
      .invoke("notification-dispatcher", {
        body: {
          type_key: "stripe_chargeback_orphan",
          payload: {
            title: "Stripe chargeback for unknown booking",
            message: `Stripe dispute ${stripeDisputeId} for payment_intent ${paymentIntentId} could not be matched to a booking. Manual investigation required.`,
            stripe_dispute_id: stripeDisputeId,
          },
        },
      })
      .catch((err: unknown) =>
        logStep("orphan-chargeback notification failed (non-fatal)", {
          error: err instanceof Error ? err.message : String(err),
        }),
      );
    return;
  }

  const ownerId = (booking as { listing?: { owner_id?: string } }).listing?.owner_id ?? null;
  const renterId = (booking as { renter_id: string }).renter_id;

  // Build evidence URL pointing back to the Stripe dashboard so admins can
  // jump into the chargeback context immediately.
  const stripeDashboardUrl = `https://dashboard.stripe.com/payments/${paymentIntentId}/disputes/${stripeDisputeId}`;
  const reasonText = (dispute.reason as string) || "stripe_chargeback";
  const amountDollars = ((dispute.amount as number) ?? 0) / 100;

  const { error: insertError } = await supabase.from("disputes").insert({
    booking_id: (booking as { id: string }).id,
    reporter_id: renterId,
    reported_user_id: ownerId,
    category: "payment_dispute",
    status: "open",
    priority: "high",
    description: `Stripe chargeback received: ${reasonText} ($${amountDollars.toLocaleString()}) for booking ${(booking as { id: string }).id}. Review evidence in Stripe dashboard and respond within the chargeback window.`,
    evidence_urls: [stripeDashboardUrl],
    stripe_dispute_id: stripeDisputeId,
  });

  if (insertError) {
    logStep("Failed to insert mirrored dispute", {
      stripeDisputeId,
      error: insertError.message,
    });
    return;
  }

  logStep("Stripe chargeback mirrored to disputes", {
    stripeDisputeId,
    bookingId: (booking as { id: string }).id,
  });

  // Alert RAV team so the SLA timer (Gap G) can start ticking
  supabase.functions
    .invoke("notification-dispatcher", {
      body: {
        type_key: "stripe_chargeback_received",
        payload: {
          title: "Stripe chargeback received",
          message: `${reasonText} chargeback ($${amountDollars.toLocaleString()}) — internal dispute opened.`,
          stripe_dispute_id: stripeDisputeId,
          booking_id: (booking as { id: string }).id,
        },
      },
    })
    .catch((err: unknown) =>
      logStep("chargeback notification failed (non-fatal)", {
        error: err instanceof Error ? err.message : String(err),
      }),
    );
}

// ── charge.refunded ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleChargeRefunded(supabase: SupabaseLike, charge: any) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
  if (!paymentIntentId) return;

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, total_amount")
    .eq("payment_intent_id", paymentIntentId)
    .single();

  if (!booking) return;

  const refundedAmountDollars = charge.amount_refunded / 100;
  const isFullRefund = refundedAmountDollars >= booking.total_amount;
  if (isFullRefund && booking.status !== "cancelled") {
    await supabase.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
    logStep("Booking cancelled due to full refund", { bookingId: booking.id });
  }
}

// ── account.updated ─────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleAccountUpdated(supabase: SupabaseLike, account: any) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_account_id", account.id)
    .single();
  if (!profile) return;

  const onboardingComplete = !!(account.charges_enabled && account.payouts_enabled);
  await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_onboarding_complete: onboardingComplete,
    })
    .eq("id", profile.id);
}

// ── transfer.created ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleTransferCreated(supabase: SupabaseLike, transfer: any) {
  const bookingId = transfer.metadata?.booking_id;
  if (!bookingId) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("id")
      .eq("stripe_transfer_id", transfer.id)
      .single();
    if (!booking) return;
    await supabase
      .from("bookings")
      .update({ payout_status: "paid", payout_date: new Date().toISOString(), status: "completed" })
      .eq("id", booking.id);
    return;
  }
  await supabase
    .from("bookings")
    .update({
      payout_status: "paid",
      payout_date: new Date().toISOString(),
      stripe_transfer_id: transfer.id,
      status: "completed",
    })
    .eq("id", bookingId);
}

// ── transfer.reversed ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleTransferReversed(supabase: SupabaseLike, transfer: any) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("stripe_transfer_id", transfer.id)
    .single();
  if (!booking) return;
  await supabase
    .from("bookings")
    .update({ payout_status: "failed", payout_notes: `Transfer reversed: ${transfer.id}` })
    .eq("id", booking.id);
}

// ── subscription.created ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleSubscriptionCreated(supabase: SupabaseLike, resend: ResendLike, subscription: any) {
  const userId = subscription.metadata?.user_id;
  const tierKey = subscription.metadata?.tier_key;
  if (!userId || !tierKey) return;

  const { data: tier } = await supabase
    .from("membership_tiers")
    .select("id, tier_name")
    .eq("tier_key", tierKey)
    .single();
  if (!tier) return;

  await supabase
    .from("user_memberships")
    .update({
      tier_id: tier.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: "active",
      started_at: new Date().toISOString(),
      expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelled_at: null,
    })
    .eq("user_id", userId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  if (profile?.email) {
    const html = buildEmailHtml({
      recipientName: profile.full_name || "there",
      heading: `Welcome to ${tier.tier_name}!`,
      body: `<p>Your ${tier.tier_name} subscription is now active.</p>`,
      cta: { label: "Go to Dashboard", url: "https://rent-a-vacation.com/owner-dashboard?tab=account" },
    });
    await resend.emails.send({
      from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
      to: profile.email,
      subject: `Welcome to ${tier.tier_name} — Rent-A-Vacation`,
      html,
    });
  }
}

// ── subscription.updated ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleSubscriptionUpdated(supabase: SupabaseLike, subscription: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const { data: membership } = await supabase
    .from("user_memberships")
    .select("id, admin_override, tier_id, status")
    .eq("user_id", userId)
    .single();

  if (membership?.admin_override) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
  };

  if (subscription.cancel_at_period_end && membership?.status !== "cancelled") {
    updates.status = "cancelled";
    updates.cancelled_at = new Date().toISOString();
  } else if (!subscription.cancel_at_period_end && membership?.status === "cancelled") {
    updates.status = "active";
    updates.cancelled_at = null;
  }

  const currentPriceId = subscription.items?.data?.[0]?.price?.id;
  if (currentPriceId) {
    const { data: newTier } = await supabase
      .from("membership_tiers")
      .select("id, tier_name")
      .eq("stripe_price_id", currentPriceId)
      .single();
    if (newTier && newTier.id !== membership?.tier_id) {
      updates.tier_id = newTier.id;
    }
  }

  await supabase.from("user_memberships").update(updates).eq("user_id", userId);
}

// ── subscription.deleted ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleSubscriptionDeleted(supabase: SupabaseLike, resend: ResendLike, subscription: any) {
  const userId = subscription.metadata?.user_id;
  if (!userId) return;

  const { data: membership } = await supabase
    .from("user_memberships")
    .select("id, admin_override, tier:membership_tiers(role_category)")
    .eq("user_id", userId)
    .single();
  if (membership?.admin_override) return;

  const roleCategory = membership?.tier?.role_category || "traveler";
  const { data: freeTier } = await supabase
    .from("membership_tiers")
    .select("id, tier_name")
    .eq("role_category", roleCategory)
    .eq("is_default", true)
    .single();
  if (!freeTier) return;

  await supabase
    .from("user_memberships")
    .update({
      tier_id: freeTier.id,
      status: "active",
      stripe_subscription_id: null,
      expires_at: null,
      cancelled_at: null,
    })
    .eq("user_id", userId);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();
  if (profile?.email) {
    const html = buildEmailHtml({
      recipientName: profile.full_name || "there",
      heading: "Your Subscription Has Ended",
      body: `<p>Your subscription has ended and your account is now on the Free plan.</p>`,
      cta: { label: "View Plans", url: "https://rent-a-vacation.com/owner-dashboard?tab=account" },
    });
    await resend.emails.send({
      from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
      to: profile.email,
      subject: "Your subscription has ended — Rent-A-Vacation",
      html,
    });
  }
}

// ── invoice.paid ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleInvoicePaid(supabase: SupabaseLike, invoice: any) {
  if (invoice.billing_reason !== "subscription_cycle") return;
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const { data: membership } = await supabase
    .from("user_memberships")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();
  if (!membership) return;

  const periodEnd = invoice.lines?.data?.[0]?.period?.end ?? invoice.period_end;
  if (periodEnd) {
    await supabase
      .from("user_memberships")
      .update({ expires_at: new Date(periodEnd * 1000).toISOString(), status: "active" })
      .eq("id", membership.id);
  }
}

// ── invoice.payment_failed ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleInvoicePaymentFailed(supabase: SupabaseLike, resend: ResendLike, invoice: any) {
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const { data: membership } = await supabase
    .from("user_memberships")
    .select("id, user_id, stripe_customer_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();
  if (!membership) return;

  await supabase.from("user_memberships").update({ status: "pending" }).eq("id", membership.id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", membership.user_id)
    .single();
  if (profile?.email) {
    const html = buildEmailHtml({
      recipientName: profile.full_name || "there",
      heading: "Payment Failed — Action Required",
      body: `<p>We were unable to process your subscription payment. Please update your payment method.</p>`,
      cta: { label: "Update Payment Method", url: "https://rent-a-vacation.com/owner-dashboard?tab=account" },
      footerNote: "Contact support@rent-a-vacation.com if this is an error.",
    });
    await resend.emails.send({
      from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
      to: profile.email,
      subject: "Payment failed — update your card — Rent-A-Vacation",
      html,
    });
  }
}
