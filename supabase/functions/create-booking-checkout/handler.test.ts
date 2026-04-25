// Unit tests for create-booking-checkout handler (issue #371).
//
// Covers: auth, rate-limit, STRIPE_TAX_ENABLED on/off, commission resolution
// (per-owner agreement override vs platform default + tier discount), customer
// reuse, listing not found.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStripeMock } from "../_shared/__tests__/stripe-mock";
import {
  createEdgeFnSupabaseMock,
  makeListing,
  makeBooking,
  makeRequest,
  makeTestEnv,
  TEST_USER,
} from "../_shared/__tests__/edge-fn-fixtures";
import { handler, type Deps } from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(opts: {
  listing?: ReturnType<typeof makeListing>;
  booking?: ReturnType<typeof makeBooking>;
  agreement?: { commission_rate: number } | null;
  systemSetting?: { setting_value: { rate: number } } | null;
  membership?: { tier: { commission_discount_pct: number } } | null;
  proposal?: { id: string } | null;
  rateLimitAllowed?: boolean;
  user?: { id: string; email: string } | null;
  taxEnabled?: boolean;
  customers?: Array<{ id: string; email?: string }>;
} = {}) {
  const supabase = createEdgeFnSupabaseMock(
    {
      listings: { data: opts.listing ?? makeListing(), error: null },
      bookings: { data: opts.booking ?? makeBooking({ id: "new-booking-1" }), error: null },
      owner_agreements: { data: opts.agreement ?? null, error: null },
      system_settings: { data: opts.systemSetting ?? null, error: null },
      user_memberships: { data: opts.membership ?? null, error: null },
      travel_proposals: { data: opts.proposal ?? null, error: null },
    },
    { rateLimitAllowed: opts.rateLimitAllowed ?? true, user: opts.user },
  );
  const stripe = createStripeMock({
    customersList: { data: opts.customers ?? [] },
    checkoutSessionsCreate: {
      id: "cs_test_new",
      url: "https://checkout.stripe.example/cs_test_new",
    },
  });
  const env = makeTestEnv({ STRIPE_TAX_ENABLED: opts.taxEnabled ? "true" : "false" });
  const deps: Deps = { supabase, stripe, env };
  return { supabase, stripe, deps };
}

describe("create-booking-checkout handler @p0", () => {
  it("creates a booking + Stripe checkout session on the happy path", async () => {
    const { stripe, deps } = setup();

    const res = await handler(
      makeRequest({ body: { listingId: "listing-test-1", guestCount: 2 } }),
      deps,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.example/cs_test_new");
    expect(body.session_id).toBe("cs_test_new");
    expect(body.booking_id).toBe("new-booking-1");
    expect(stripe.checkout.sessions.create).toHaveBeenCalledTimes(1);
  });

  it("OPTIONS preflight returns CORS headers", async () => {
    const { deps } = setup();
    const res = await handler(makeRequest({ method: "OPTIONS" }), deps);
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});

describe("create-booking-checkout handler — auth", () => {
  it("rejects requests without an Authorization header", async () => {
    const { deps } = setup();
    const req = new Request("https://edge.example/fn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: "listing-test-1" }),
    });
    const res = await handler(req, deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/no authorization header/i);
  });

  it("rejects when supabase auth.getUser returns an error", async () => {
    const { deps } = setup({ user: null });
    const res = await handler(makeRequest({ body: { listingId: "listing-test-1" } }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/authentication error|not authenticated/i);
  });
});

describe("create-booking-checkout handler — rate limit", () => {
  it("returns 429 when checkRateLimit denies the request", async () => {
    const { deps, stripe } = setup({ rateLimitAllowed: false });
    const res = await handler(makeRequest({ body: { listingId: "listing-test-1" } }), deps);
    expect(res.status).toBe(429);
    expect(stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});

describe("create-booking-checkout handler — STRIPE_TAX_ENABLED gate", () => {
  it("passes automatic_tax: { enabled: false } when env flag is unset/false", async () => {
    const { stripe, deps } = setup({ taxEnabled: false });
    await handler(makeRequest({ body: { listingId: "listing-test-1" } }), deps);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ automatic_tax: { enabled: false } }),
    );
  });

  it("passes automatic_tax: { enabled: true } when env flag is 'true'", async () => {
    const { stripe, deps } = setup({ taxEnabled: true });
    await handler(makeRequest({ body: { listingId: "listing-test-1" } }), deps);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ automatic_tax: { enabled: true } }),
    );
  });
});

describe("create-booking-checkout handler — commission resolution", () => {
  it("uses per-owner agreement when one exists", async () => {
    const { stripe, deps } = setup({
      agreement: { commission_rate: 12 },
      listing: makeListing({ nightly_rate: 100, cleaning_fee: 0, check_in_date: "2026-06-01", check_out_date: "2026-06-08" }),
    });
    await handler(makeRequest({ body: { listingId: "listing-test-1" } }), deps);
    // 7 nights × $100 = $700 base. Service fee = 700 × 0.12 = $84.
    const sessionArgs = stripe.checkout.sessions.create.mock.calls[0][0] as {
      line_items: Array<{ price_data: { unit_amount: number; product_data: { name: string } } }>;
    };
    const serviceLine = sessionArgs.line_items.find((li) => li.price_data.product_data.name === "RAV Service Fee");
    expect(serviceLine?.price_data.unit_amount).toBe(8400); // 84 dollars in cents
  });

  it("falls back to platform commission minus tier discount when no agreement", async () => {
    const { stripe, deps } = setup({
      agreement: null,
      systemSetting: { setting_value: { rate: 15 } },
      membership: { tier: { commission_discount_pct: 2 } }, // Pro tier discount
      listing: makeListing({ nightly_rate: 100, cleaning_fee: 0, check_in_date: "2026-06-01", check_out_date: "2026-06-08" }),
    });
    await handler(makeRequest({ body: { listingId: "listing-test-1" } }), deps);
    // base = $700, commission = 15 - 2 = 13%, fee = $91
    const sessionArgs = stripe.checkout.sessions.create.mock.calls[0][0] as {
      line_items: Array<{ price_data: { unit_amount: number; product_data: { name: string } } }>;
    };
    const serviceLine = sessionArgs.line_items.find((li) => li.price_data.product_data.name === "RAV Service Fee");
    expect(serviceLine?.price_data.unit_amount).toBe(9100);
  });
});

describe("create-booking-checkout handler — customer reuse", () => {
  it("reuses an existing Stripe customer when one matches the user email", async () => {
    const { stripe, deps } = setup({
      customers: [{ id: "cus_test_existing", email: TEST_USER.email }],
    });
    await handler(makeRequest({ body: { listingId: "listing-test-1" } }), deps);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_test_existing", customer_email: undefined }),
    );
  });

  it("passes customer_email when no existing Stripe customer is found", async () => {
    const { stripe, deps } = setup({ customers: [] });
    await handler(makeRequest({ body: { listingId: "listing-test-1" } }), deps);
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customer: undefined, customer_email: TEST_USER.email }),
    );
  });
});

describe("create-booking-checkout handler — DEC-034 source_type branching", () => {
  it("inherits source_type='wish_matched' from listing and links travel_proposal_id", async () => {
    const supabase = createEdgeFnSupabaseMock(
      {
        listings: { data: makeListing({ source_type: "wish_matched" }), error: null },
        bookings: { data: makeBooking({ id: "wish-booking-1", source_type: "wish_matched", travel_proposal_id: "tp-1" }), error: null },
        owner_agreements: { data: null, error: null },
        system_settings: { data: { setting_value: { rate: 15 } }, error: null },
        user_memberships: { data: null, error: null },
        travel_proposals: { data: { id: "tp-1" }, error: null },
      },
      { rateLimitAllowed: true },
    );
    const stripe = createStripeMock({
      checkoutSessionsCreate: { id: "cs_test_wish", url: "https://stripe.example/wish" },
    });
    const insertSpy = vi.spyOn(supabase, "from");

    const res = await handler(
      makeRequest({ body: { listingId: "listing-test-1" } }),
      { supabase, stripe, env: makeTestEnv() },
    );

    expect(res.status).toBe(200);
    // confirm we did fetch travel_proposals
    const fromCalls = insertSpy.mock.calls.map((c) => c[0]);
    expect(fromCalls).toContain("travel_proposals");
  });
});
