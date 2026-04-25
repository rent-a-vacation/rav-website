// Sample Stripe webhook event payloads for `stripe-webhook` handler tests.
// Each builder accepts overrides; the defaults represent the most common
// happy-path shape so tests can focus on what they're actually asserting.

export function checkoutSessionCompletedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test_checkout_completed",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_completed",
        payment_status: "paid",
        payment_intent: "pi_test_completed",
        customer: "cus_test_default",
        amount_total: 140000,
        total_details: { amount_tax: 0 },
        metadata: {
          booking_id: "booking-test-1",
          listing_id: "listing-test-1",
          renter_id: "00000000-0000-0000-0000-000000000001",
        },
        ...overrides,
      },
    },
  };
}

export function checkoutSessionExpiredEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test_checkout_expired",
    type: "checkout.session.expired",
    data: {
      object: {
        id: "cs_test_expired",
        payment_status: "unpaid",
        metadata: { booking_id: "booking-test-1" },
        ...overrides,
      },
    },
  };
}

export function chargeRefundedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test_charge_refunded",
    type: "charge.refunded",
    data: {
      object: {
        id: "ch_test_refunded",
        payment_intent: "pi_test_completed",
        amount_refunded: 140000,
        amount: 140000,
        ...overrides,
      },
    },
  };
}

export function accountUpdatedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test_account_updated",
    type: "account.updated",
    data: {
      object: {
        id: "acct_test_owner",
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
        ...overrides,
      },
    },
  };
}

export function transferCreatedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test_transfer_created",
    type: "transfer.created",
    data: {
      object: {
        id: "tr_test_created",
        amount: 125000,
        destination: "acct_test_owner",
        metadata: { booking_id: "booking-test-1" },
        ...overrides,
      },
    },
  };
}

export function transferReversedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test_transfer_reversed",
    type: "transfer.reversed",
    data: {
      object: {
        id: "tr_test_reversed",
        amount: 125000,
        destination: "acct_test_owner",
        metadata: { booking_id: "booking-test-1" },
        ...overrides,
      },
    },
  };
}

export function customerSubscriptionUpdatedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test_subscription_updated",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_test_updated",
        customer: "cus_test_default",
        status: "active",
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        cancel_at_period_end: false,
        items: {
          data: [{ price: { id: "price_test_premium", lookup_key: "premium_monthly" } }],
        },
        metadata: { user_id: "00000000-0000-0000-0000-000000000001" },
        ...overrides,
      },
    },
  };
}

export function invoicePaidEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: "evt_test_invoice_paid",
    type: "invoice.paid",
    data: {
      object: {
        id: "in_test_paid",
        customer: "cus_test_default",
        subscription: "sub_test_updated",
        billing_reason: "subscription_cycle",
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        ...overrides,
      },
    },
  };
}
