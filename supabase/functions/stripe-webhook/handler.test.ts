// Unit tests for stripe-webhook handler (issue #371).
//
// Strategy: 1-2 tests for the entry handler (signature verify pass/fail,
// routing to dispatcher) + per-event-type tests calling the exported
// handleXxx functions directly. Integration through the full handler is
// covered by the routing test.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStripeMock } from "../_shared/__tests__/stripe-mock";
import {
  createEdgeFnSupabaseMock,
  makeBooking,
  makeRequest,
  makeTestEnv,
} from "../_shared/__tests__/edge-fn-fixtures";
import {
  checkoutSessionCompletedEvent,
  checkoutSessionExpiredEvent,
  chargeRefundedEvent,
  accountUpdatedEvent,
  transferCreatedEvent,
  transferReversedEvent,
  customerSubscriptionUpdatedEvent,
  invoicePaidEvent,
} from "../_shared/__tests__/stripe-events";
import {
  handler,
  handleCheckoutCompleted,
  handleCheckoutExpired,
  handleChargeRefunded,
  handleAccountUpdated,
  handleTransferCreated,
  handleTransferReversed,
  handleSubscriptionUpdated,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  type Deps,
  type ResendLike,
} from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { status: 200 })));
});

function makeResendMock(): ResendLike {
  return { emails: { send: vi.fn().mockResolvedValue({ id: "email_test" }) } };
}

function makeSignedRequest(rawBody: string) {
  return new Request("https://edge.example/stripe-webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", "stripe-signature": "t=123,v1=signed" },
    body: rawBody,
  });
}

describe("stripe-webhook handler @p0 — entry + signature", () => {
  it("rejects non-POST methods with 405", async () => {
    const supabase = createEdgeFnSupabaseMock({});
    const stripe = createStripeMock();
    const deps: Deps = { supabase, stripe, resend: makeResendMock(), env: makeTestEnv() };
    const res = await handler(new Request("https://x.example/", { method: "GET" }), deps);
    expect(res.status).toBe(405);
  });

  it("returns 400 when stripe.webhooks.constructEvent throws (signature failure)", async () => {
    const supabase = createEdgeFnSupabaseMock({});
    const stripe = createStripeMock({
      webhooksConstructEvent: () => {
        throw new Error("Invalid signature");
      },
    });
    const deps: Deps = { supabase, stripe, resend: makeResendMock(), env: makeTestEnv() };
    const res = await handler(makeSignedRequest("{}"), deps);
    expect(res.status).toBe(400);
  });

  it("returns 400 when no stripe-signature header is present", async () => {
    const supabase = createEdgeFnSupabaseMock({});
    const stripe = createStripeMock();
    const deps: Deps = { supabase, stripe, resend: makeResendMock(), env: makeTestEnv() };
    const req = new Request("https://edge.example/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const res = await handler(req, deps);
    expect(res.status).toBe(400);
  });

  it("dispatches checkout.session.completed via constructEvent return value", async () => {
    const supabase = createEdgeFnSupabaseMock({
      bookings: {
        data: makeBooking({ status: "pending", payment_intent_id: "pi_test_completed" }),
        error: null,
      },
      booking_confirmations: { data: { id: "bc-1" }, error: null },
      profiles: { data: { full_name: "Renter", email: "test@example.com" }, error: null },
      system_settings: { data: null, error: null },
      checkin_confirmations: { data: null, error: null },
      platform_guarantee_fund: { data: null, error: null },
      listings: { data: { id: "ls-1" }, error: null },
    });
    const stripe = createStripeMock({
      webhooksConstructEvent: () => checkoutSessionCompletedEvent(),
    });
    const deps: Deps = { supabase, stripe, resend: makeResendMock(), env: makeTestEnv() };
    const res = await handler(makeSignedRequest("body"), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(stripe.webhooks.constructEvent).toHaveBeenCalledTimes(1);
  });
});

describe("stripe-webhook — handleCheckoutCompleted", () => {
  it("flips a pending booking to confirmed and inserts escrow record @p0", async () => {
    const supabase = createEdgeFnSupabaseMock({
      bookings: {
        data: makeBooking({ status: "pending", payment_intent_id: "pi_test_completed" }),
        error: null,
      },
      booking_confirmations: { data: { id: "bc-1" }, error: null },
      profiles: { data: { full_name: "Renter", email: "test@example.com" }, error: null },
      system_settings: { data: null, error: null },
      checkin_confirmations: { data: null, error: null },
      platform_guarantee_fund: { data: null, error: null },
      listings: { data: { id: "ls-1" }, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    const resend = makeResendMock();
    const env = makeTestEnv();

    await handleCheckoutCompleted(supabase, resend, env, checkoutSessionCompletedEvent().data.object);

    const tablesTouched = fromSpy.mock.calls.map((c) => c[0]);
    expect(tablesTouched).toContain("bookings");
    expect(tablesTouched).toContain("booking_confirmations");
    expect(tablesTouched).toContain("checkin_confirmations");
    expect(tablesTouched).toContain("platform_guarantee_fund");
  });

  it("is idempotent — skips when booking is already confirmed", async () => {
    const supabase = createEdgeFnSupabaseMock({
      bookings: {
        data: makeBooking({ status: "confirmed", payment_intent_id: "pi_test_completed" }),
        error: null,
      },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    const resend = makeResendMock();
    const env = makeTestEnv();

    await handleCheckoutCompleted(supabase, resend, env, checkoutSessionCompletedEvent().data.object);

    const tablesTouched = fromSpy.mock.calls.map((c) => c[0]);
    expect(tablesTouched).not.toContain("booking_confirmations");
  });

  it("skips entirely when session has no booking_id metadata", async () => {
    const supabase = createEdgeFnSupabaseMock({});
    const fromSpy = vi.spyOn(supabase, "from");
    const resend = makeResendMock();
    const env = makeTestEnv();

    const session = checkoutSessionCompletedEvent({ metadata: {} }).data.object;
    await handleCheckoutCompleted(supabase, resend, env, session);

    expect(fromSpy).not.toHaveBeenCalled();
  });
});

describe("stripe-webhook — handleCheckoutExpired", () => {
  it("cancels pending bookings on session expiry", async () => {
    const supabase = createEdgeFnSupabaseMock({
      bookings: { data: { status: "pending" }, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    await handleCheckoutExpired(supabase, checkoutSessionExpiredEvent().data.object);
    expect(fromSpy).toHaveBeenCalledWith("bookings");
  });

  it("skips already-confirmed bookings on expiry event", async () => {
    const supabase = createEdgeFnSupabaseMock({
      bookings: { data: { status: "confirmed" }, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    await handleCheckoutExpired(supabase, checkoutSessionExpiredEvent().data.object);
    // Will hit `from('bookings').select('status')` once but won't update
    expect(fromSpy).toHaveBeenCalledTimes(1);
  });
});

describe("stripe-webhook — handleChargeRefunded", () => {
  it("cancels booking on full refund", async () => {
    const supabase = createEdgeFnSupabaseMock({
      bookings: { data: { id: "bk-1", status: "confirmed", total_amount: 1400 }, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    await handleChargeRefunded(supabase, chargeRefundedEvent().data.object);
    // 2 calls: lookup + update
    expect(fromSpy.mock.calls.filter((c) => c[0] === "bookings").length).toBeGreaterThanOrEqual(2);
  });
});

describe("stripe-webhook — handleAccountUpdated", () => {
  it("syncs charges_enabled / payouts_enabled / onboarding_complete to profile", async () => {
    const supabase = createEdgeFnSupabaseMock({
      profiles: { data: { id: "owner-1" }, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    await handleAccountUpdated(supabase, accountUpdatedEvent().data.object);
    expect(fromSpy.mock.calls.filter((c) => c[0] === "profiles").length).toBeGreaterThanOrEqual(2);
  });
});

describe("stripe-webhook — handleTransferCreated", () => {
  it("marks booking payout as paid when booking_id is in metadata", async () => {
    const supabase = createEdgeFnSupabaseMock({
      bookings: { data: { id: "bk-1" }, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    await handleTransferCreated(supabase, transferCreatedEvent().data.object);
    expect(fromSpy).toHaveBeenCalledWith("bookings");
  });
});

describe("stripe-webhook — handleTransferReversed", () => {
  it("marks booking payout as failed", async () => {
    const supabase = createEdgeFnSupabaseMock({
      bookings: { data: { id: "bk-1" }, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    await handleTransferReversed(supabase, transferReversedEvent().data.object);
    expect(fromSpy.mock.calls.filter((c) => c[0] === "bookings").length).toBeGreaterThanOrEqual(2);
  });
});

describe("stripe-webhook — subscription handlers", () => {
  it("subscription.updated bumps expires_at on renewal", async () => {
    const supabase = createEdgeFnSupabaseMock({
      user_memberships: { data: { id: "m-1", admin_override: false, status: "active", tier_id: "t-1" }, error: null },
      membership_tiers: { data: null, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    await handleSubscriptionUpdated(supabase, customerSubscriptionUpdatedEvent().data.object);
    expect(fromSpy).toHaveBeenCalledWith("user_memberships");
  });

  it("subscription.updated respects admin_override (no-op)", async () => {
    const supabase = createEdgeFnSupabaseMock({
      user_memberships: { data: { id: "m-1", admin_override: true, status: "active" }, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    await handleSubscriptionUpdated(supabase, customerSubscriptionUpdatedEvent().data.object);
    // Only the membership lookup, no update
    expect(fromSpy.mock.calls.filter((c) => c[0] === "user_memberships").length).toBe(1);
  });
});

describe("stripe-webhook — invoice handlers", () => {
  it("invoice.paid extends membership expires_at on subscription_cycle", async () => {
    const supabase = createEdgeFnSupabaseMock({
      user_memberships: { data: { id: "m-1", user_id: "u-1" }, error: null },
    });
    const fromSpy = vi.spyOn(supabase, "from");
    await handleInvoicePaid(supabase, invoicePaidEvent().data.object);
    expect(fromSpy).toHaveBeenCalledWith("user_memberships");
  });

  it("invoice.payment_failed sets membership to pending and emails the user", async () => {
    const supabase = createEdgeFnSupabaseMock({
      user_memberships: { data: { id: "m-1", user_id: "u-1", stripe_customer_id: "cus_1" }, error: null },
      profiles: { data: { full_name: "User", email: "user@example.com" }, error: null },
    });
    const resend = makeResendMock();
    await handleInvoicePaymentFailed(supabase, resend, {
      subscription: "sub_test_1",
      attempt_count: 1,
    });
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("Payment failed") }),
    );
  });
});
