// Unit tests for process-cancellation handler (issue #371).
// Covers the 4 cancellation policies + owner full-refund + Stripe failure
// tolerance + auth (renter vs owner ownership check).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStripeMock } from "../_shared/__tests__/stripe-mock";
import {
  createEdgeFnSupabaseMock,
  makeBooking,
  makeRequest,
  makeTestEnv,
  TEST_USER,
  TEST_OWNER,
} from "../_shared/__tests__/edge-fn-fixtures";
import { handler, calculatePolicyRefund, type Deps } from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { status: 200 })));
});

// ── Pure-function tests for calculatePolicyRefund @p0 ──────────────────────

describe("calculatePolicyRefund @p0", () => {
  it("flexible: full refund when ≥1 day out, zero otherwise", () => {
    expect(calculatePolicyRefund(1000, "flexible", 7)).toBe(1000);
    expect(calculatePolicyRefund(1000, "flexible", 1)).toBe(1000);
    expect(calculatePolicyRefund(1000, "flexible", 0)).toBe(0);
  });

  it("moderate: full ≥5 days, half 1-4 days, zero same-day", () => {
    expect(calculatePolicyRefund(1000, "moderate", 6)).toBe(1000);
    expect(calculatePolicyRefund(1000, "moderate", 5)).toBe(1000);
    expect(calculatePolicyRefund(1000, "moderate", 3)).toBe(500);
    expect(calculatePolicyRefund(1000, "moderate", 1)).toBe(500);
    expect(calculatePolicyRefund(1000, "moderate", 0)).toBe(0);
  });

  it("strict: half refund only when ≥7 days out, zero otherwise", () => {
    expect(calculatePolicyRefund(1000, "strict", 7)).toBe(500);
    expect(calculatePolicyRefund(1000, "strict", 6)).toBe(0);
    expect(calculatePolicyRefund(1000, "strict", 0)).toBe(0);
  });

  it("super_strict: never refunds", () => {
    expect(calculatePolicyRefund(1000, "super_strict", 100)).toBe(0);
  });

  it("unknown policy: returns 0 (safe default)", () => {
    expect(calculatePolicyRefund(1000, "made-up", 100)).toBe(0);
  });
});

// ── Handler tests ───────────────────────────────────────────────────────────

function setup(opts: {
  booking?: ReturnType<typeof makeBooking>;
  user?: { id: string; email: string };
  refundCreateResult?: { id: string; status: string; amount: number };
  refundCreateThrows?: boolean;
} = {}) {
  const supabase = createEdgeFnSupabaseMock(
    {
      bookings: {
        data: opts.booking ?? makeBooking({ status: "confirmed" }),
        error: null,
      },
      listings: { data: { status: "active" }, error: null },
      cancellation_requests: { data: { id: "cr-1" }, error: null },
      booking_confirmations: { data: null, error: null },
      owner_verifications: { data: { id: "v-1", cancellation_count: 0 }, error: null },
    },
    { rateLimitAllowed: true, user: opts.user ?? TEST_USER },
  );
  const stripe = createStripeMock({
    refundsCreate: opts.refundCreateThrows
      ? () => {
          throw new Error("stripe down");
        }
      : opts.refundCreateResult ?? { id: "re_test_1", status: "succeeded", amount: 50000 },
  });
  const deps: Deps = { supabase, stripe, env: makeTestEnv() };
  return { supabase, stripe, deps };
}

describe("process-cancellation handler @p0 — happy path", () => {
  it("renter cancels with moderate policy 5 days out → full refund", async () => {
    const checkInDate = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { stripe, deps } = setup({
      booking: makeBooking({
        status: "confirmed",
        total_amount: 1000,
        listing: {
          owner_id: TEST_OWNER.id,
          check_in_date: checkInDate,
          cancellation_policy: "moderate",
          property: { resort_name: "Test", location: "" },
        },
      }),
    });

    const res = await handler(
      makeRequest({ body: { bookingId: "booking-test-1", reason: "plans changed", cancelledBy: "renter" } }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.refund_amount).toBe(1000);
    expect(body.policy).toBe("moderate");
    expect(stripe.refunds.create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 100000 }),
    );
  });

  it("owner cancellation always returns full refund regardless of policy", async () => {
    const checkInDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { stripe, deps } = setup({
      user: TEST_OWNER, // owner is the authed user
      booking: makeBooking({
        status: "confirmed",
        total_amount: 1000,
        listing: {
          owner_id: TEST_OWNER.id,
          check_in_date: checkInDate,
          cancellation_policy: "super_strict",
          property: { resort_name: "Test", location: "" },
        },
      }),
    });

    const res = await handler(
      makeRequest({ body: { bookingId: "booking-test-1", reason: "owner emergency", cancelledBy: "owner" } }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.refund_amount).toBe(1000);
    expect(stripe.refunds.create).toHaveBeenCalled();
  });
});

describe("process-cancellation handler — auth + ownership checks", () => {
  it("rejects when renter tries to cancel a booking they don't own", async () => {
    const { deps } = setup({
      booking: makeBooking({ status: "confirmed", renter_id: "someone-else-id" }),
    });
    const res = await handler(
      makeRequest({ body: { bookingId: "booking-test-1", reason: "x", cancelledBy: "renter" } }),
      deps,
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/your own bookings/i);
  });

  it("rejects when owner tries to cancel a booking on someone else's listing", async () => {
    const { deps } = setup({
      user: TEST_USER, // not the owner
      booking: makeBooking({
        status: "confirmed",
        listing: { owner_id: "different-owner-id", cancellation_policy: "moderate", check_in_date: "2026-06-01", property: {} },
      }),
    });
    const res = await handler(
      makeRequest({ body: { bookingId: "booking-test-1", reason: "x", cancelledBy: "owner" } }),
      deps,
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/your own listings/i);
  });

  it("rejects cancelledBy values other than renter/owner", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({ body: { bookingId: "booking-test-1", reason: "x", cancelledBy: "admin" } }),
      deps,
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/renter.*owner/i);
  });
});

describe("process-cancellation handler — Stripe failure tolerance", () => {
  it("continues with DB cancellation even when Stripe.refunds.create throws", async () => {
    const checkInDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const { deps } = setup({
      refundCreateThrows: true,
      booking: makeBooking({
        status: "confirmed",
        total_amount: 1000,
        listing: {
          owner_id: TEST_OWNER.id,
          check_in_date: checkInDate,
          cancellation_policy: "flexible",
          property: { resort_name: "Test", location: "" },
        },
      }),
    });

    const res = await handler(
      makeRequest({ body: { bookingId: "booking-test-1", reason: "plans changed", cancelledBy: "renter" } }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.refund_reference).toBeNull();
    expect(body.refund_amount).toBe(1000); // calculated, but no Stripe ref
  });
});

describe("process-cancellation handler — short-circuits", () => {
  it("rejects cancelling a booking that isn't confirmed", async () => {
    const { deps } = setup({
      booking: makeBooking({ status: "pending" }),
    });
    const res = await handler(
      makeRequest({ body: { bookingId: "booking-test-1", reason: "x", cancelledBy: "renter" } }),
      deps,
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/cannot cancel/i);
  });

  it("rejects without bookingId", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({ body: { reason: "x", cancelledBy: "renter" } }),
      deps,
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/booking id/i);
  });
});
