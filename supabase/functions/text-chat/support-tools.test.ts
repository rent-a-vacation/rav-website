// Unit tests for support agent tools.
// Phase 22 C4 (#408) — each tool covers happy path + auth failure / RLS
// rejection + domain-rule rejection where relevant.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "../../../src/test/helpers/supabase-mock";
import {
  lookupBooking,
  checkRefundStatus,
  checkDisputeStatus,
  openDispute,
  querySupportDocs,
  dispatchSupportTool,
  isSupportTool,
  type StripeLike,
  type UserContext,
} from "./support-tools";

const USER: UserContext = {
  userId: "00000000-0000-0000-0000-000000000001",
  userEmail: "traveler@example.com",
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ── lookup_booking @p0 ─────────────────────────────────────────────────────

describe("lookup_booking @p0", () => {
  it("returns a booking the authenticated user can see", async () => {
    const booking = {
      id: "bk-1",
      listing_id: "ls-1",
      renter_id: USER.userId,
      status: "confirmed",
      total_amount: 1200,
    };
    const supa = createSupabaseMock({
      bookings: { data: booking, error: null },
    });

    const result = await lookupBooking(supa, USER, { booking_id: "bk-1" });

    expect(result.success).toBe(true);
    expect((result.data as { booking: typeof booking }).booking).toEqual(booking);
  });

  it("returns an auth-safe error when RLS hides the booking", async () => {
    // RLS produces { data: null, error: null } on a miss via maybeSingle().
    const supa = createSupabaseMock({ bookings: { data: null, error: null } });

    const result = await lookupBooking(supa, USER, { booking_id: "bk-owned-by-someone-else" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/no booking found/i);
  });

  it("rejects cross-account email lookups", async () => {
    const supa = createSupabaseMock({ bookings: { data: [], error: null } });

    const result = await lookupBooking(supa, USER, { email: "someone-else@example.com" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/your own account/i);
  });

  it("lists recent bookings when only the user's own email is given", async () => {
    const supa = createSupabaseMock({
      bookings: { data: [{ id: "bk-1" }, { id: "bk-2" }], error: null },
    });

    const result = await lookupBooking(supa, USER, { email: USER.userEmail });

    expect(result.success).toBe(true);
    expect((result.data as { total: number }).total).toBe(2);
  });

  it("requires at least one of booking_id or email", async () => {
    const supa = createSupabaseMock({});
    const result = await lookupBooking(supa, USER, {});
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/required/i);
  });
});

// ── check_refund_status ────────────────────────────────────────────────────

describe("check_refund_status", () => {
  it("returns DB state when refund is already processed (no Stripe call)", async () => {
    const cancellation = {
      id: "cr-1",
      booking_id: "bk-1",
      status: "refunded",
      final_refund_amount: 500,
      refund_reference: "re_123",
      refund_processed_at: "2026-04-20T00:00:00Z",
    };
    const supa = createSupabaseMock({
      cancellation_requests: { data: cancellation, error: null },
    });
    const stripe: StripeLike = {
      refunds: { retrieve: vi.fn() },
    };

    const result = await checkRefundStatus(supa, USER, { booking_id: "bk-1" }, stripe);

    expect(result.success).toBe(true);
    expect(stripe.refunds.retrieve).not.toHaveBeenCalled();
    expect((result.data as { source: string }).source).toBe("db");
  });

  it("reconciles with Stripe when refund is referenced but not yet processed", async () => {
    const cancellation = {
      id: "cr-2",
      booking_id: "bk-2",
      status: "approved",
      refund_reference: "re_456",
      refund_processed_at: null,
    };
    const supa = createSupabaseMock({
      cancellation_requests: { data: cancellation, error: null },
    });
    const stripe: StripeLike = {
      refunds: {
        retrieve: vi.fn().mockResolvedValue({
          id: "re_456",
          status: "pending",
          amount: 50000,
          arrival_date: 1713830400,
        }),
      },
    };

    const result = await checkRefundStatus(supa, USER, { booking_id: "bk-2" }, stripe);

    expect(result.success).toBe(true);
    expect(stripe.refunds.retrieve).toHaveBeenCalledWith("re_456");
    expect((result.data as { source: string }).source).toBe("db+stripe");
    expect((result.data as { stripe_refund: { status: string } }).stripe_refund.status).toBe(
      "pending",
    );
  });

  it("fails closed: returns DB state with a note when Stripe throws", async () => {
    const cancellation = {
      id: "cr-3",
      booking_id: "bk-3",
      status: "approved",
      refund_reference: "re_789",
      refund_processed_at: null,
    };
    const supa = createSupabaseMock({
      cancellation_requests: { data: cancellation, error: null },
    });
    const stripe: StripeLike = {
      refunds: { retrieve: vi.fn().mockRejectedValue(new Error("stripe down")) },
    };

    const result = await checkRefundStatus(supa, USER, { booking_id: "bk-3" }, stripe);

    expect(result.success).toBe(true);
    expect(result.note).toMatch(/stripe/i);
    expect((result.data as { source: string }).source).toBe("db");
  });

  it("reports no cancellation on file when none exists (auth-safe)", async () => {
    const supa = createSupabaseMock({
      cancellation_requests: { data: null, error: null },
    });

    const result = await checkRefundStatus(supa, USER, { booking_id: "bk-none" });

    expect(result.success).toBe(true);
    expect((result.data as { has_cancellation: boolean }).has_cancellation).toBe(false);
  });
});

// ── check_dispute_status ───────────────────────────────────────────────────

describe("check_dispute_status", () => {
  it("returns disputes on a booking the user is part of", async () => {
    const supa = createSupabaseMock({
      disputes: { data: [{ id: "dp-1", status: "open" }], error: null },
    });

    const result = await checkDisputeStatus(supa, USER, { booking_id: "bk-1" });

    expect(result.success).toBe(true);
    expect((result.data as { total: number }).total).toBe(1);
  });

  it("returns an empty array (auth-safe) when RLS hides everything", async () => {
    const supa = createSupabaseMock({ disputes: { data: [], error: null } });

    const result = await checkDisputeStatus(supa, USER, { booking_id: "bk-other" });

    expect(result.success).toBe(true);
    expect((result.data as { total: number }).total).toBe(0);
  });
});

// ── open_dispute ───────────────────────────────────────────────────────────

describe("open_dispute", () => {
  const validArgs = {
    booking_id: "bk-1",
    category: "owner_no_show",
    description: "Owner never sent check-in details and is not responding to messages.",
  };

  it("opens a dispute when the user owns the booking", async () => {
    const created = { id: "dp-new", status: "open", category: "owner_no_show" };
    const supa = createSupabaseMock({ disputes: { data: created, error: null } });

    const result = await openDispute(supa, USER, validArgs);

    expect(result.success).toBe(true);
    expect((result.data as { dispute: typeof created }).dispute).toEqual(created);
    expect(result.note).toMatch(/RAV team/);
  });

  it("tags agent-opened disputes with source='ravio_support' (#409)", async () => {
    // Hand-rolled mock that captures the insert payload so we can assert on it.
    const insertSpy = vi.fn().mockReturnValue({
      select: () => ({
        single: () => Promise.resolve({ data: { id: "dp-tagged" }, error: null }),
      }),
    });
    const spySupa = {
      from: () => ({ insert: insertSpy }),
    };

    const result = await openDispute(spySupa, USER, validArgs);

    expect(result.success).toBe(true);
    expect(insertSpy).toHaveBeenCalledTimes(1);
    const payload = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.source).toBe("ravio_support");
    expect(payload.reporter_id).toBe(USER.userId);
    expect(payload.status).toBe("open");
  });

  it("surfaces RLS rejection when the user does not own the booking", async () => {
    const supa = createSupabaseMock({
      disputes: {
        data: null,
        error: { message: 'new row violates row-level security policy', code: "42501" },
      },
    });

    const result = await openDispute(supa, USER, validArgs);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/could not open dispute/i);
  });

  it("rejects invalid categories before touching the DB", async () => {
    const supa = createSupabaseMock({});
    const result = await openDispute(supa, USER, { ...validArgs, category: "made_up" });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid category/i);
  });

  it("requires a non-trivial description", async () => {
    const supa = createSupabaseMock({});
    const result = await openDispute(supa, USER, { ...validArgs, description: "bad" });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/20 characters/i);
  });
});

// ── query_support_docs ─────────────────────────────────────────────────────

describe("query_support_docs", () => {
  it("returns active docs matching a keyword query", async () => {
    const docs = [
      { slug: "policies/cancellation-policy", title: "Cancellation Policy", doc_type: "policy" },
      { slug: "faqs/booking-faq", title: "Booking FAQ", doc_type: "faq" },
    ];
    const supa = createSupabaseMock({ support_docs: { data: docs, error: null } });

    const result = await querySupportDocs(supa, USER, { query: "cancel refund" });

    expect(result.success).toBe(true);
    expect((result.data as { total: number }).total).toBe(2);
  });

  it("requires a non-empty query", async () => {
    const supa = createSupabaseMock({});
    const result = await querySupportDocs(supa, USER, { query: "   " });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/required/i);
  });

  it("surfaces database errors as structured tool errors", async () => {
    const supa = createSupabaseMock({
      support_docs: { data: null, error: { message: "tsvector index missing" } },
    });

    const result = await querySupportDocs(supa, USER, { query: "refund" });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/doc search failed/i);
  });
});

// ── registry + dispatcher ──────────────────────────────────────────────────

describe("isSupportTool / dispatchSupportTool", () => {
  it("accepts only the 5 declared tools", () => {
    expect(isSupportTool("lookup_booking")).toBe(true);
    expect(isSupportTool("query_support_docs")).toBe(true);
    expect(isSupportTool("drop_table")).toBe(false);
  });

  it("dispatches to the right handler", async () => {
    const supa = createSupabaseMock({
      support_docs: { data: [{ slug: "policies/refund-policy" }], error: null },
    });

    const result = await dispatchSupportTool("query_support_docs", supa, USER, { query: "refund" });

    expect(result.success).toBe(true);
    expect((result.data as { total: number }).total).toBe(1);
  });
});
