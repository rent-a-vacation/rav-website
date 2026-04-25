// Unit tests for cancel-listing handler (issue #371 + #377).
// Covers the cascade orchestration: listing flip → bid bulk-reject → notify
// bidders → cancel bookings via process-cancellation invoke → bump
// cancellation_count.

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createEdgeFnSupabaseMock,
  makeRequest,
  makeTestEnv,
  TEST_USER,
  TEST_OWNER,
} from "../_shared/__tests__/edge-fn-fixtures";
import { handler, type Deps } from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(opts: {
  listing?: Record<string, unknown> | null;
  pendingBids?: Array<{ id: string; renter_id: string; bid_amount: number }>;
  activeBookings?: Array<{ id: string; total_amount: number; status: string }>;
  ownerVerification?: { id: string; cancellation_count: number } | null;
  user?: { id: string; email: string };
  invokeError?: { message: string };
} = {}) {
  const supabase = createEdgeFnSupabaseMock(
    {
      listings: {
        data:
          opts.listing === undefined
            ? { id: "listing-1", owner_id: TEST_USER.id, status: "active", cancelled_at: null }
            : opts.listing,
        error: null,
      },
      listing_bids: { data: opts.pendingBids ?? [], error: null },
      bookings: { data: opts.activeBookings ?? [], error: null },
      owner_verifications: {
        data:
          opts.ownerVerification === undefined
            ? { id: "v-1", cancellation_count: 0 }
            : opts.ownerVerification,
        error: null,
      },
    },
    {
      rateLimitAllowed: true,
      user: opts.user ?? TEST_USER,
      functionsInvokeResult: { data: null, error: opts.invokeError ?? null },
    },
  );
  const deps: Deps = { supabase, env: makeTestEnv() };
  return { supabase, deps };
}

describe("cancel-listing handler @p0 — happy path", () => {
  it("cascades through listing flip, bid reject, booking cancel, and counter bump", async () => {
    const { supabase, deps } = setup({
      pendingBids: [
        { id: "bid-1", renter_id: "renter-1", bid_amount: 1500 },
        { id: "bid-2", renter_id: "renter-2", bid_amount: 1800 },
      ],
      activeBookings: [
        { id: "bk-1", total_amount: 1400, status: "confirmed" },
        { id: "bk-2", total_amount: 2200, status: "pending" },
      ],
    });
    const fromSpy = vi.spyOn(supabase, "from");

    const res = await handler(
      makeRequest({ body: { listingId: "listing-1", reason: "Resort double-booked" } }),
      deps,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cancelledBidsCount).toBe(2);
    expect(body.cancelledBookingsCount).toBe(2);
    expect(body.refundTotal).toBe(3600);

    // Each pending bid → 1 notification-dispatcher invoke
    // Each active booking → 1 process-cancellation invoke
    // Total = 2 + 2 = 4 invokes
    expect(supabase.functions.invoke).toHaveBeenCalledTimes(4);
    const invokeArgs = supabase.functions.invoke.mock.calls.map((c) => c[0]);
    expect(invokeArgs.filter((n) => n === "notification-dispatcher").length).toBe(2);
    expect(invokeArgs.filter((n) => n === "process-cancellation").length).toBe(2);

    // owner_verifications counter bump
    expect(fromSpy.mock.calls.filter((c) => c[0] === "owner_verifications").length).toBeGreaterThanOrEqual(2);
  });
});

describe("cancel-listing handler — auth + ownership", () => {
  it("rejects when user is not the listing owner", async () => {
    const { deps } = setup({
      listing: { id: "listing-1", owner_id: TEST_OWNER.id, status: "active", cancelled_at: null },
      user: TEST_USER,
    });
    const res = await handler(
      makeRequest({ body: { listingId: "listing-1", reason: "test cancel" } }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/your own listings/i);
  });

  it("rejects when listing is already cancelled", async () => {
    const { deps } = setup({
      listing: {
        id: "listing-1",
        owner_id: TEST_USER.id,
        status: "cancelled",
        cancelled_at: "2026-04-01T00:00:00Z",
      },
    });
    const res = await handler(
      makeRequest({ body: { listingId: "listing-1", reason: "test cancel" } }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/already cancelled/i);
  });

  it("rejects when listing is in non-cancellable status (booked)", async () => {
    const { deps } = setup({
      listing: { id: "listing-1", owner_id: TEST_USER.id, status: "booked", cancelled_at: null },
    });
    const res = await handler(
      makeRequest({ body: { listingId: "listing-1", reason: "test cancel" } }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/cannot be cancelled/i);
  });
});

describe("cancel-listing handler — input validation", () => {
  it("rejects when reason is too short", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({ body: { listingId: "listing-1", reason: "no" } }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/4 characters/i);
  });

  it("rejects without listingId", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({ body: { reason: "valid reason here" } }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/listingid is required/i);
  });
});

describe("cancel-listing handler — failure tolerance", () => {
  it("records refund failures but still returns success when process-cancellation invoke errors", async () => {
    const { deps } = setup({
      activeBookings: [{ id: "bk-1", total_amount: 1400, status: "confirmed" }],
      invokeError: { message: "process-cancellation 500" },
    });
    const res = await handler(
      makeRequest({ body: { listingId: "listing-1", reason: "test cancel" } }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.cancelledBookingsCount).toBe(0);
    expect(body.refundFailures).toHaveLength(1);
    expect(body.refundFailures[0]).toMatch(/bk-1/);
  });
});
