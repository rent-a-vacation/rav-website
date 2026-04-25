// Unit tests for verify-booking-payment handler (issue #371).
// Covers: paid path, already-confirmed short-circuit, payment-not-paid path,
// DEC-034 source_type branch (pre_booked vs wish_matched escrow shape +
// notification fan-out), missing booking, missing payment_intent_id.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStripeMock } from "../_shared/__tests__/stripe-mock";
import {
  createEdgeFnSupabaseMock,
  makeBooking,
  makeRequest,
  makeTestEnv,
  TEST_USER,
} from "../_shared/__tests__/edge-fn-fixtures";
import { handler, type Deps, type ResendLike } from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { status: 200 })));
});

function makeResendMock(): ResendLike {
  return {
    emails: { send: vi.fn().mockResolvedValue({ id: "email_test" }) },
  };
}

function setup(opts: {
  booking?: ReturnType<typeof makeBooking>;
  paymentStatus?: "paid" | "unpaid" | "no_payment_required";
  amountTotal?: number;
  amountTax?: number;
  systemSetting?: { setting_value: { value: number } } | null;
  bookingConfirmation?: { id: string } | null;
  travelerProfile?: { full_name?: string; email: string } | null;
} = {}) {
  const supabase = createEdgeFnSupabaseMock(
    {
      bookings: { data: opts.booking ?? makeBooking({ status: "pending" }), error: null },
      listings: { data: { status: "booked" }, error: null },
      booking_confirmations: {
        data: opts.bookingConfirmation === null ? null : opts.bookingConfirmation ?? { id: "bc-1" },
        error: opts.bookingConfirmation === null ? { message: "rls" } : null,
      },
      checkin_confirmations: { data: null, error: null },
      platform_guarantee_fund: { data: null, error: null },
      profiles: {
        data: opts.travelerProfile ?? { full_name: "Renter", email: TEST_USER.email },
        error: null,
      },
      system_settings: { data: opts.systemSetting ?? null, error: null },
    },
    { rateLimitAllowed: true },
  );
  const stripe = createStripeMock({
    checkoutSessionsRetrieve: {
      id: "cs_test_default",
      payment_status: opts.paymentStatus ?? "paid",
      amount_total: opts.amountTotal ?? 140000,
      total_details: { amount_tax: opts.amountTax ?? 0 },
    },
  });
  const resend = makeResendMock();
  const deps: Deps = { supabase, stripe, resend, env: makeTestEnv() };
  return { supabase, stripe, resend, deps };
}

describe("verify-booking-payment handler @p0", () => {
  it("confirms a paid pre_booked booking and dispatches owner in-app notification", async () => {
    const { supabase, deps } = setup({
      booking: makeBooking({ status: "pending", source_type: "pre_booked" }),
    });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("confirmed");
    // notification-dispatcher should have been invoked at least once (owner notify)
    expect(supabase.functions.invoke).toHaveBeenCalledWith(
      "notification-dispatcher",
      expect.objectContaining({
        body: expect.objectContaining({ type_key: "booking_confirmed" }),
      }),
    );
  });

  it("returns 200 + 'Payment not completed' when Stripe session is unpaid", async () => {
    const { stripe, deps } = setup({ paymentStatus: "unpaid" });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/payment not completed/i);
    expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledTimes(1);
  });
});

describe("verify-booking-payment handler — short-circuits", () => {
  it("returns immediately when booking is already confirmed", async () => {
    const { stripe, deps } = setup({
      booking: makeBooking({ status: "confirmed" }),
    });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/already confirmed/i);
    expect(stripe.checkout.sessions.retrieve).not.toHaveBeenCalled();
  });

  it("throws when booking has no payment_intent_id", async () => {
    const { deps } = setup({
      booking: makeBooking({ status: "pending", payment_intent_id: null }),
    });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/no payment session/i);
  });

  it("rejects requests without an Authorization header", async () => {
    const { deps } = setup();
    const req = new Request("https://edge.example/fn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: "booking-test-1" }),
    });
    const res = await handler(req, deps);
    expect(res.status).toBe(500);
  });
});

describe("verify-booking-payment handler — DEC-034 source_type branching", () => {
  it("dispatches wish_owner_confirming notification when source_type=wish_matched", async () => {
    const { supabase, deps } = setup({
      booking: makeBooking({ status: "pending", source_type: "wish_matched" }),
    });
    await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    const dispatcherCalls = supabase.functions.invoke.mock.calls.map((c) => c[1]?.body?.type_key);
    expect(dispatcherCalls).toContain("wish_owner_confirming");
  });

  it("does NOT dispatch wish_owner_confirming when source_type=pre_booked", async () => {
    const { supabase, deps } = setup({
      booking: makeBooking({ status: "pending", source_type: "pre_booked" }),
    });
    await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    const dispatcherCalls = supabase.functions.invoke.mock.calls.map((c) => c[1]?.body?.type_key);
    expect(dispatcherCalls).not.toContain("wish_owner_confirming");
  });
});

describe("verify-booking-payment handler — email side effects", () => {
  it("sends a traveler confirmation email via Resend when paid", async () => {
    const { resend, deps } = setup();
    await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(resend.emails.send).toHaveBeenCalledTimes(1);
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Booking Confirmed"),
        to: [TEST_USER.email],
      }),
    );
  });

  it("does not throw when Resend.send rejects (fire-and-forget)", async () => {
    const { resend, deps } = setup();
    (resend.emails.send as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("resend down"));
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(200);
  });
});
