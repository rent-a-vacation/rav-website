import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { buildEmailHtml, detailRow } from "../_shared/email-template.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Calculate 48-hour confirmation deadline from now
const getConfirmationDeadline = (): string => {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 48);
  return deadline.toISOString();
};

// Calculate check-in confirmation deadline (24 hours after check-in date)
const getCheckinConfirmationDeadline = (checkInDate: string): string => {
  const deadline = new Date(checkInDate);
  deadline.setHours(deadline.getHours() + 24);
  return deadline.toISOString();
};

serve(async (req) => {
  // Webhooks are POST only — no CORS preflight needed
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Read raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");

    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook received", { type: event.type, id: event.id });

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(supabase, stripe, event.data.object);
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

      // ── Subscription lifecycle events ──────────────────────────
      case "customer.subscription.created":
        await handleSubscriptionCreated(supabase, event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(supabase, event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(supabase, event.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaid(supabase, event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(supabase, event.data.object);
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
    // Return 400 for signature verification failures so Stripe retries
    const status = errorMessage.includes("signature") ? 400 : 500;
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { "Content-Type": "application/json" }, status }
    );
  }
});

/**
 * Handle checkout.session.completed
 * This is the critical safety net — if the client-side verify-booking-payment
 * didn't run (browser closed after payment), this ensures the booking is confirmed.
 */
async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
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

  // Fetch booking with listing details
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      *,
      listing:listings(
        *,
        property:properties(*)
      )
    `)
    .eq("id", bookingId)
    .single();

  if (bookingError || !booking) {
    logStep("Booking not found", { bookingId, error: bookingError?.message });
    return;
  }

  // Store the real Stripe PaymentIntent ID for future refund event lookups
  if (session.payment_intent && session.payment_intent !== booking.payment_intent_id) {
    await supabase
      .from("bookings")
      .update({ payment_intent_id: String(session.payment_intent) })
      .eq("id", bookingId);
    logStep("Updated payment_intent_id", { old: booking.payment_intent_id, new: session.payment_intent });
  }

  // Idempotency: if already confirmed/completed, skip
  if (booking.status === "confirmed" || booking.status === "completed") {
    logStep("Booking already confirmed, skipping", { status: booking.status });
    return;
  }

  if (session.payment_status !== "paid") {
    logStep("Payment not completed", { paymentStatus: session.payment_status });
    return;
  }

  // --- Confirm the booking (mirrors verify-booking-payment logic) ---

  // 1. Update booking to confirmed
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "confirmed",
      paid_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (updateError) {
    logStep("Failed to update booking", { error: updateError.message });
    return;
  }
  logStep("Booking confirmed", { bookingId });

  // 2. Update listing status to booked
  const { error: listingError } = await supabase
    .from("listings")
    .update({ status: "booked" })
    .eq("id", booking.listing_id);

  if (listingError) {
    logStep("Warning: Failed to update listing status", { error: listingError.message });
  }

  // 3. Read owner confirmation window from system_settings
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
    logStep("Using default owner confirmation window", { minutes: ownerConfirmationWindowMinutes });
  }

  // 4. Calculate deadlines
  const ownerConfirmationDeadline = new Date();
  ownerConfirmationDeadline.setMinutes(ownerConfirmationDeadline.getMinutes() + ownerConfirmationWindowMinutes);
  const confirmationDeadline = getConfirmationDeadline();

  // 5. Create booking_confirmations record (escrow)
  const { data: bookingConfirmation, error: confirmationError } = await supabase
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

  if (confirmationError) {
    logStep("Warning: Failed to create booking confirmation", { error: confirmationError.message });
  } else {
    logStep("Booking confirmation created", {
      confirmationId: bookingConfirmation.id,
      deadline: confirmationDeadline,
    });

    // Send owner notifications
    try {
      const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-booking-confirmation-reminder`;
      const authHeader = `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`;

      // New booking notification
      await fetch(notificationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify({ type: "new_booking", bookingConfirmationId: bookingConfirmation.id }),
      });
      logStep("New booking notification sent to owner");

      // Owner confirmation request
      await fetch(notificationUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": authHeader },
        body: JSON.stringify({ type: "owner_confirmation_request", bookingConfirmationId: bookingConfirmation.id }),
      });
      logStep("Owner confirmation request notification sent");
    } catch (emailError) {
      logStep("Warning: Failed to send owner notifications", { error: String(emailError) });
    }
  }

  // 6. Create checkin_confirmations record
  const checkInDate = booking.listing?.check_in_date;
  if (checkInDate) {
    const checkinDeadline = getCheckinConfirmationDeadline(checkInDate);
    const { error: checkinError } = await supabase
      .from("checkin_confirmations")
      .insert({
        booking_id: bookingId,
        traveler_id: booking.renter_id,
        confirmation_deadline: checkinDeadline,
      });

    if (checkinError) {
      logStep("Warning: Failed to create checkin confirmation", { error: checkinError.message });
    } else {
      logStep("Checkin confirmation created", { deadline: checkinDeadline });
    }
  }

  // 7. Contribute to platform guarantee fund (3% of commission)
  const guaranteeFundContribution = Math.round(booking.rav_commission * 0.03 * 100) / 100;
  const { error: fundError } = await supabase
    .from("platform_guarantee_fund")
    .insert({
      booking_id: bookingId,
      contribution_amount: guaranteeFundContribution,
      contribution_percentage: 3,
    });

  if (fundError) {
    logStep("Warning: Failed to add to guarantee fund", { error: fundError.message });
  }

  // 8. Send traveler confirmation email
  try {
    const resortName = booking.listing?.property?.resort_name || "Your Resort";
    const location = booking.listing?.property?.location || "";
    const checkIn = new Date(booking.listing?.check_in_date).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
    const checkOut = new Date(booking.listing?.check_out_date).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
    });
    const nights = Math.ceil(
      (new Date(booking.listing?.check_out_date).getTime() - new Date(booking.listing?.check_in_date).getTime()) /
      (1000 * 60 * 60 * 24)
    );
    const unitType = booking.listing?.unit_type || "Standard";

    // Fetch traveler profile
    const { data: travelerProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", booking.renter_id)
      .single();

    const travelerName = travelerProfile?.full_name || "Traveler";
    const travelerEmail = travelerProfile?.email;

    if (travelerEmail) {
      const html = buildEmailHtml({
        recipientName: travelerName,
        heading: "Booking Confirmed!",
        body: `
          <p>Congratulations! Your booking has been confirmed and payment received.</p>
          <p>Here are the details of your reservation:</p>
          <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
            ${detailRow("Booking ID", bookingId.slice(0, 8).toUpperCase())}
            ${detailRow("Resort", resortName)}
            ${location ? detailRow("Location", location) : ""}
            ${detailRow("Unit Type", unitType)}
            ${detailRow("Dates", `${checkIn} – ${checkOut}`)}
            ${detailRow("Duration", `${nights} night${nights !== 1 ? "s" : ""}`)}
            ${detailRow("Total Paid", `$${booking.total_amount?.toLocaleString()}`)}
          </div>
          <p>The property owner will confirm your reservation with the resort shortly. We'll notify you once that's complete.</p>
        `,
        cta: { label: "View My Booking", url: `https://rent-a-vacation.com/booking-success?booking_id=${bookingId}` },
      });

      await resend.emails.send({
        from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
        to: [travelerEmail],
        subject: `Booking Confirmed – ${resortName}`,
        html,
      });
      logStep("Traveler confirmation email sent", { travelerEmail });
    }
  } catch (emailError) {
    logStep("Warning: Failed to send traveler confirmation email", { error: String(emailError) });
  }

  logStep("checkout.session.completed processed successfully");
}

/**
 * Handle checkout.session.expired
 * If the session expires before payment, cancel the pending booking.
 */
async function handleCheckoutExpired(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session
) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) {
    logStep("No booking_id in expired session metadata, skipping");
    return;
  }

  logStep("Processing checkout.session.expired", { sessionId: session.id, bookingId });

  // Only cancel if still pending
  const { data: booking } = await supabase
    .from("bookings")
    .select("status")
    .eq("id", bookingId)
    .single();

  if (!booking || booking.status !== "pending") {
    logStep("Booking not pending, skipping expiry", { status: booking?.status });
    return;
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  if (error) {
    logStep("Failed to cancel expired booking", { error: error.message });
  } else {
    logStep("Pending booking cancelled due to session expiry", { bookingId });
  }
}

/**
 * Handle charge.refunded
 * Update booking record when a Stripe refund is processed.
 */
async function handleChargeRefunded(
  supabase: ReturnType<typeof createClient>,
  charge: Stripe.Charge
) {
  const paymentIntentId = typeof charge.payment_intent === "string"
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!paymentIntentId) {
    logStep("No payment_intent on charge, skipping refund tracking");
    return;
  }

  logStep("Processing charge.refunded", {
    chargeId: charge.id,
    paymentIntentId,
    amountRefunded: charge.amount_refunded,
  });

  // Look up booking by payment_intent_id
  const { data: booking, error: lookupError } = await supabase
    .from("bookings")
    .select("id, status, total_amount")
    .eq("payment_intent_id", paymentIntentId)
    .single();

  if (lookupError || !booking) {
    // Fallback: try looking up by the session ID stored before webhook updated it
    logStep("Booking not found by payment_intent_id, refund tracking skipped", {
      paymentIntentId,
      error: lookupError?.message,
    });
    return;
  }

  // Full refund = cancel booking, partial refund = keep status but log
  const refundedAmountDollars = charge.amount_refunded / 100;
  const isFullRefund = refundedAmountDollars >= booking.total_amount;

  if (isFullRefund && booking.status !== "cancelled") {
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);
    logStep("Booking cancelled due to full refund", { bookingId: booking.id });
  }

  logStep("Refund tracked", {
    bookingId: booking.id,
    refundedAmount: refundedAmountDollars,
    isFullRefund,
  });
}

/**
 * Handle account.updated (Stripe Connect)
 * Sync the owner's Connect account status when Stripe sends updates
 * (e.g., after onboarding completion, verification changes).
 */
async function handleAccountUpdated(
  supabase: ReturnType<typeof createClient>,
  account: Stripe.Account
) {
  logStep("Processing account.updated", {
    accountId: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
  });

  // Find the owner by stripe_account_id
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_account_id", account.id)
    .single();

  if (error || !profile) {
    logStep("No profile found for Stripe account", { accountId: account.id });
    return;
  }

  const onboardingComplete = !!(account.charges_enabled && account.payouts_enabled);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      stripe_charges_enabled: account.charges_enabled ?? false,
      stripe_payouts_enabled: account.payouts_enabled ?? false,
      stripe_onboarding_complete: onboardingComplete,
    })
    .eq("id", profile.id);

  if (updateError) {
    logStep("Failed to update profile", { error: updateError.message });
  } else {
    logStep("Profile updated with Connect status", {
      ownerId: profile.id,
      onboardingComplete,
    });
  }
}

/**
 * Handle transfer.created (Stripe Connect)
 * Confirm payout was initiated — update booking payout_status.
 */
async function handleTransferCreated(
  supabase: ReturnType<typeof createClient>,
  transfer: Stripe.Transfer
) {
  const bookingId = transfer.metadata?.booking_id;
  logStep("Processing transfer.created", {
    transferId: transfer.id,
    bookingId,
    amount: transfer.amount,
  });

  if (!bookingId) {
    // Try looking up by stripe_transfer_id
    const { data: booking } = await supabase
      .from("bookings")
      .select("id")
      .eq("stripe_transfer_id", transfer.id)
      .single();

    if (!booking) {
      logStep("No booking found for transfer", { transferId: transfer.id });
      return;
    }

    await supabase
      .from("bookings")
      .update({
        payout_status: "paid",
        payout_date: new Date().toISOString(),
        status: "completed",
      })
      .eq("id", booking.id);

    logStep("Booking payout marked as paid", { bookingId: booking.id });
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

  logStep("Booking payout marked as paid", { bookingId });
}

/**
 * Handle transfer.reversed (Stripe Connect)
 * Mark payout as failed if a transfer is reversed.
 */
async function handleTransferReversed(
  supabase: ReturnType<typeof createClient>,
  transfer: Stripe.Transfer
) {
  logStep("Processing transfer.reversed", {
    transferId: transfer.id,
    amount: transfer.amount,
    amountReversed: transfer.amount_reversed,
  });

  // Look up booking by transfer ID
  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("stripe_transfer_id", transfer.id)
    .single();

  if (!booking) {
    logStep("No booking found for reversed transfer", { transferId: transfer.id });
    return;
  }

  await supabase
    .from("bookings")
    .update({
      payout_status: "failed",
      payout_notes: `Transfer reversed: ${transfer.id}`,
    })
    .eq("id", booking.id);

  logStep("Booking payout marked as failed due to reversal", { bookingId: booking.id });
}

// ══════════════════════════════════════════════════════════════
// SUBSCRIPTION LIFECYCLE HANDLERS
// ══════════════════════════════════════════════════════════════

/**
 * Handle customer.subscription.created
 * Fired when a new subscription is successfully created via Stripe Checkout.
 * Updates user_memberships with Stripe IDs and new tier.
 */
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionCreated(supabase: any, subscription: any) {
  const userId = subscription.metadata?.user_id;
  const tierKey = subscription.metadata?.tier_key;
  logStep("Subscription created", { subscriptionId: subscription.id, userId, tierKey });

  if (!userId || !tierKey) {
    logStep("Missing metadata on subscription — skipping", { subscriptionId: subscription.id });
    return;
  }

  // Look up the tier
  const { data: tier } = await supabase
    .from("membership_tiers")
    .select("id, tier_name")
    .eq("tier_key", tierKey)
    .single();

  if (!tier) {
    logStep("Tier not found for tier_key", { tierKey });
    return;
  }

  // Update user membership
  const { error: updateError } = await supabase
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

  if (updateError) {
    logStep("Failed to update membership", { error: updateError.message });
    return;
  }

  logStep("Membership upgraded", { userId, tier: tier.tier_name });

  // Send welcome email
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  if (profile?.email) {
    const html = buildEmailHtml({
      recipientName: profile.full_name || "there",
      heading: `Welcome to ${tier.tier_name}!`,
      body: `
        <p>Your subscription to the <strong>${tier.tier_name}</strong> plan is now active.</p>
        ${detailRow("Plan", tier.tier_name)}
        ${detailRow("Status", "Active")}
        ${detailRow("Next billing date", new Date(subscription.current_period_end * 1000).toLocaleDateString())}
        <p>You now have access to all ${tier.tier_name} features. Enjoy!</p>
      `,
      cta: { label: "Go to Dashboard", url: "https://rent-a-vacation.com/owner-dashboard?tab=account" },
    });

    await resend.emails.send({
      from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
      to: profile.email,
      subject: `Welcome to ${tier.tier_name} — Rent-A-Vacation`,
      html,
    });
    logStep("Welcome email sent", { email: profile.email });
  }
}

/**
 * Handle customer.subscription.updated
 * Fired on: tier changes, cancellation scheduling, payment method updates, renewals.
 * Checks cancel_at_period_end and price changes.
 */
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  const userId = subscription.metadata?.user_id;
  logStep("Subscription updated", { subscriptionId: subscription.id, userId, cancelAtPeriodEnd: subscription.cancel_at_period_end });

  if (!userId) {
    logStep("Missing user_id in subscription metadata — skipping");
    return;
  }

  // Check if admin override — skip if so
  const { data: membership } = await supabase
    .from("user_memberships")
    .select("id, admin_override, tier_id, status")
    .eq("user_id", userId)
    .single();

  if (membership?.admin_override) {
    logStep("Skipping webhook update — admin override active", { userId });
    return;
  }

  // Build update payload
  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: Record<string, any> = {
    expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
  };

  // Handle cancellation scheduling
  if (subscription.cancel_at_period_end && membership?.status !== "cancelled") {
    updates.status = "cancelled";
    updates.cancelled_at = new Date().toISOString();
    logStep("Subscription cancellation scheduled", { userId });
  } else if (!subscription.cancel_at_period_end && membership?.status === "cancelled") {
    // Reactivation (user un-cancelled)
    updates.status = "active";
    updates.cancelled_at = null;
    logStep("Subscription reactivated", { userId });
  }

  // Check for price/tier change
  const currentPriceId = subscription.items?.data?.[0]?.price?.id;
  if (currentPriceId) {
    const { data: newTier } = await supabase
      .from("membership_tiers")
      .select("id, tier_name")
      .eq("stripe_price_id", currentPriceId)
      .single();

    if (newTier && newTier.id !== membership?.tier_id) {
      updates.tier_id = newTier.id;
      logStep("Tier changed via subscription update", { userId, newTier: newTier.tier_name });
    }
  }

  await supabase
    .from("user_memberships")
    .update(updates)
    .eq("user_id", userId);

  logStep("Membership updated from webhook", { userId, updates: Object.keys(updates) });
}

/**
 * Handle customer.subscription.deleted
 * Fired when subscription ends (cancellation took effect or payment retries exhausted).
 * Downgrades user to the default free tier for their role category.
 */
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubscriptionDeleted(supabase: any, subscription: any) {
  const userId = subscription.metadata?.user_id;
  logStep("Subscription deleted", { subscriptionId: subscription.id, userId });

  if (!userId) {
    logStep("Missing user_id in subscription metadata — skipping");
    return;
  }

  // Check admin override
  const { data: membership } = await supabase
    .from("user_memberships")
    .select("id, admin_override, tier:membership_tiers(role_category)")
    .eq("user_id", userId)
    .single();

  if (membership?.admin_override) {
    logStep("Skipping deletion — admin override active", { userId });
    return;
  }

  // Find the default free tier for this user's role category
  const roleCategory = membership?.tier?.role_category || "traveler";
  const { data: freeTier } = await supabase
    .from("membership_tiers")
    .select("id, tier_name")
    .eq("role_category", roleCategory)
    .eq("is_default", true)
    .single();

  if (!freeTier) {
    logStep("Could not find default free tier", { roleCategory });
    return;
  }

  // Downgrade to free tier
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

  logStep("User downgraded to free tier", { userId, tier: freeTier.tier_name });

  // Send notification email
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .single();

  if (profile?.email) {
    const html = buildEmailHtml({
      recipientName: profile.full_name || "there",
      heading: "Your Subscription Has Ended",
      body: `
        <p>Your paid subscription has ended and your account has been moved to the <strong>Free</strong> plan.</p>
        <p>You can re-subscribe at any time from your account settings to regain access to premium features.</p>
      `,
      cta: { label: "View Plans", url: "https://rent-a-vacation.com/owner-dashboard?tab=account" },
    });

    await resend.emails.send({
      from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
      to: profile.email,
      subject: "Your subscription has ended — Rent-A-Vacation",
      html,
    });
    logStep("Subscription ended email sent", { email: profile.email });
  }
}

/**
 * Handle invoice.paid
 * Fired on successful subscription renewal payments.
 * Updates expires_at to the new period end.
 */
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaid(supabase: any, invoice: any) {
  // Only process subscription renewal invoices (skip initial payment — handled by subscription.created)
  if (invoice.billing_reason !== "subscription_cycle") {
    logStep("Skipping non-renewal invoice", { billingReason: invoice.billing_reason });
    return;
  }

  const subscriptionId = invoice.subscription;
  logStep("Renewal invoice paid", { subscriptionId, invoiceId: invoice.id });

  if (!subscriptionId) return;

  // Find the membership by stripe_subscription_id
  const { data: membership } = await supabase
    .from("user_memberships")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!membership) {
    logStep("No membership found for subscription", { subscriptionId });
    return;
  }

  // Update expiry to new period end
  const periodEnd = invoice.lines?.data?.[0]?.period?.end;
  if (periodEnd) {
    await supabase
      .from("user_memberships")
      .update({
        expires_at: new Date(periodEnd * 1000).toISOString(),
        status: "active",
      })
      .eq("id", membership.id);

    logStep("Membership renewed", { userId: membership.user_id, newExpiresAt: new Date(periodEnd * 1000).toISOString() });
  }
}

/**
 * Handle invoice.payment_failed
 * Fired when a subscription payment attempt fails.
 * Sets membership to pending (grace period) and sends notification email.
 */
// deno-lint-ignore no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleInvoicePaymentFailed(supabase: any, invoice: any) {
  const subscriptionId = invoice.subscription;
  logStep("Invoice payment failed", { subscriptionId, invoiceId: invoice.id, attemptCount: invoice.attempt_count });

  if (!subscriptionId) return;

  const { data: membership } = await supabase
    .from("user_memberships")
    .select("id, user_id, stripe_customer_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single();

  if (!membership) {
    logStep("No membership found for failed invoice", { subscriptionId });
    return;
  }

  // Set status to pending (grace period — Stripe will retry)
  await supabase
    .from("user_memberships")
    .update({ status: "pending" })
    .eq("id", membership.id);

  // Send payment failed email
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", membership.user_id)
    .single();

  if (profile?.email) {
    const html = buildEmailHtml({
      recipientName: profile.full_name || "there",
      heading: "Payment Failed — Action Required",
      body: `
        <p>We were unable to process your subscription payment. Your account is currently in a grace period.</p>
        <p>Please update your payment method to avoid losing access to your premium features. Stripe will automatically retry the payment, but you can update your card now to resolve this immediately.</p>
      `,
      cta: { label: "Update Payment Method", url: "https://rent-a-vacation.com/owner-dashboard?tab=account" },
      footerNote: "If you believe this is an error, please contact support@rent-a-vacation.com.",
    });

    await resend.emails.send({
      from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
      to: profile.email,
      subject: "Payment failed — update your card — Rent-A-Vacation",
      html,
    });
    logStep("Payment failed email sent", { email: profile.email });
  }
}
