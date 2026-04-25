// Unit tests for create-stripe-payout handler (issue #442).
// Covers: admin role check, booking eligibility (status + payout_status guards),
// owner Connect account validation, Stripe Transfer creation, profile sync
// when Stripe says payouts are disabled, email notification fire-and-forget.

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
import { handler, type Deps, type ResendLike } from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeResendMock(): ResendLike {
  return { emails: { send: vi.fn().mockResolvedValue({ id: "email_test" }) } };
}

interface SetupOpts {
  isAdmin?: boolean;
  booking?: ReturnType<typeof makeBooking>;
  ownerStripeAccountId?: string | null;
  ownerPayoutsEnabled?: boolean;
  stripePayoutsEnabled?: boolean;
  user?: { id: string; email: string };
}

function setup(opts: SetupOpts = {}) {
  const isAdmin = opts.isAdmin ?? true;
  const baseBooking = opts.booking ?? makeBooking({
    status: "confirmed",
    payout_status: null,
    owner_payout: 1250,
  });

  // Inject the owner shape that the join produces
  const bookingWithOwner = {
    ...baseBooking,
    listing: {
      ...((baseBooking as Record<string, unknown>).listing as Record<string, unknown>),
      owner: {
        id: TEST_OWNER.id,
        full_name: "Owner Full",
        email: TEST_OWNER.email,
        stripe_account_id: opts.ownerStripeAccountId === undefined ? "acct_owner_test" : opts.ownerStripeAccountId,
        stripe_onboarding_complete: true,
        stripe_payouts_enabled: opts.ownerPayoutsEnabled ?? true,
      },
      property: { resort_name: "Test Resort", location: "Test City, FL" },
      check_in_date: "2026-06-01",
    },
  };

  const supabase = createEdgeFnSupabaseMock(
    {
      user_roles: {
        data: isAdmin ? [{ role: "rav_admin" }] : [{ role: "renter" }],
        error: null,
      },
      bookings: { data: bookingWithOwner, error: null },
      profiles: { data: null, error: null },
    },
    { user: opts.user ?? { id: "admin-1", email: "admin@example.com" } },
  );
  const stripe = createStripeMock({
    accountsRetrieve: {
      id: opts.ownerStripeAccountId === undefined ? "acct_owner_test" : opts.ownerStripeAccountId,
      charges_enabled: true,
      payouts_enabled: opts.stripePayoutsEnabled ?? true,
    },
    transfersCreate: {
      id: "tr_test_payout_1",
      amount: 125000,
      destination: opts.ownerStripeAccountId === undefined ? "acct_owner_test" : opts.ownerStripeAccountId,
    },
  });
  const resend = makeResendMock();
  const deps: Deps = { supabase, stripe, resend, env: makeTestEnv() };
  return { supabase, stripe, resend, deps };
}

describe("create-stripe-payout handler @p0 — happy path", () => {
  it("creates a Transfer and sends payout notification email", async () => {
    const { stripe, resend, deps } = setup();
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.transfer_id).toBe("tr_test_payout_1");
    expect(body.amount).toBe(1250);
    expect(stripe.transfers.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 125000,
        currency: "usd",
        destination: "acct_owner_test",
      }),
    );
    expect(resend.emails.send).toHaveBeenCalledWith(
      expect.objectContaining({ subject: expect.stringContaining("Payout Initiated") }),
    );
  });
});

describe("create-stripe-payout handler — auth + role", () => {
  it("rejects non-admin callers", async () => {
    const { deps, stripe } = setup({ isAdmin: false });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/only rav admins/i);
    expect(stripe.transfers.create).not.toHaveBeenCalled();
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

describe("create-stripe-payout handler — booking eligibility guards", () => {
  it("rejects when booking status is not confirmed/completed", async () => {
    const { deps, stripe } = setup({
      booking: makeBooking({ status: "pending", payout_status: null }),
    });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/confirmed or completed/i);
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it("rejects when payout already paid (idempotency)", async () => {
    const { deps, stripe } = setup({
      booking: makeBooking({ status: "completed", payout_status: "paid" }),
    });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/already completed/i);
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it("rejects when payout already in processing state", async () => {
    const { deps, stripe } = setup({
      booking: makeBooking({ status: "confirmed", payout_status: "processing" }),
    });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/already being processed/i);
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });
});

describe("create-stripe-payout handler — Connect onboarding guards", () => {
  it("rejects when owner has no Stripe Connect account", async () => {
    const { deps, stripe } = setup({ ownerStripeAccountId: null });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/has not set up their stripe connect/i);
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it("rejects when owner profile says payouts are not enabled", async () => {
    const { deps, stripe } = setup({ ownerPayoutsEnabled: false });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/not fully verified/i);
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it("syncs profile when Stripe says payouts disabled but our DB said enabled", async () => {
    const { deps, supabase, stripe } = setup({
      ownerPayoutsEnabled: true, // our DB thinks it's enabled
      stripePayoutsEnabled: false, // but Stripe says no
    });
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/currently disabled/i);
    // Confirm we tried to update profiles to sync the disabled state
    expect(supabase.from).toHaveBeenCalledWith("profiles");
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });
});

describe("create-stripe-payout handler — fire-and-forget", () => {
  it("returns success even when Resend.send rejects", async () => {
    const { resend, deps } = setup();
    (resend.emails.send as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("resend down"),
    );
    const res = await handler(makeRequest({ body: { bookingId: "booking-test-1" } }), deps);
    expect(res.status).toBe(200);
  });
});
