// Shared fixtures + helpers for edge-function unit tests (issue #371).
//
// `createEdgeFnSupabaseMock` wraps `createSupabaseMock` with edge-fn-specific
// defaults: rate-limit RPC returns allowed=true, auth.getUser returns a real
// user, and `.functions.invoke()` is stubbed (used by `cancel-listing` to
// fan out to `notification-dispatcher` + `process-cancellation`).

import { vi } from "vitest";
import { createSupabaseMock } from "../../../../src/test/helpers/supabase-mock";

export const TEST_USER = {
  id: "00000000-0000-0000-0000-000000000001",
  email: "renter@example.com",
};

export const TEST_OWNER = {
  id: "00000000-0000-0000-0000-000000000002",
  email: "owner@example.com",
};

export interface EdgeFnSupabaseMockOpts {
  /** Stub `auth.getUser()` to return this user. Defaults to TEST_USER. */
  user?: { id: string; email: string } | null;
  /** Default rate-limit `check_rate_limit` RPC response. Defaults to allowed. */
  rateLimitAllowed?: boolean;
  /** Override the response for `.functions.invoke(...)`. Defaults to no error. */
  functionsInvokeResult?: { data: unknown; error: { message: string } | null };
}

export function createEdgeFnSupabaseMock(
  tableData: Record<string, { data: unknown; error: unknown; count?: number }> = {},
  opts: EdgeFnSupabaseMockOpts = {},
) {
  const mock = createSupabaseMock(tableData);
  const user = opts.user === undefined ? TEST_USER : opts.user;
  const rateLimitAllowed = opts.rateLimitAllowed ?? true;
  const invokeResult = opts.functionsInvokeResult ?? { data: { ok: true }, error: null };

  mock.auth.getUser = vi.fn().mockResolvedValue({
    data: { user: user ? { id: user.id, email: user.email } : null },
    error: user ? null : { message: "Not authenticated" },
  });

  mock.rpc = vi.fn().mockImplementation((fnName: string) => {
    if (fnName === "check_rate_limit") {
      return Promise.resolve({ data: rateLimitAllowed, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  });

  // `.functions.invoke(name, opts)` — used by cascading edge fns
  (mock as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }).functions = {
    invoke: vi.fn().mockResolvedValue(invokeResult),
  };

  return mock as ReturnType<typeof createSupabaseMock> & {
    functions: { invoke: ReturnType<typeof vi.fn> };
  };
}

// ── Fixture builders ────────────────────────────────────────────────────────

export function makeListing(overrides: Record<string, unknown> = {}) {
  return {
    id: "listing-test-1",
    owner_id: TEST_OWNER.id,
    property_id: "prop-1",
    status: "active",
    nightly_rate: 200,
    cleaning_fee: 50,
    check_in_date: "2026-06-01",
    check_out_date: "2026-06-08",
    cancellation_policy: "moderate",
    source_type: "pre_booked",
    final_price: 1400,
    cancelled_at: null,
    property: {
      id: "prop-1",
      resort_name: "Test Resort",
      location: "Test City, FL",
    },
    ...overrides,
  };
}

export function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-test-1",
    listing_id: "listing-test-1",
    renter_id: TEST_USER.id,
    status: "confirmed",
    total_amount: 1400,
    base_amount: 1200,
    service_fee: 150,
    cleaning_fee: 50,
    rav_commission: 150,
    owner_payout: 1250,
    payment_intent_id: "cs_test_default",
    source_type: "pre_booked",
    travel_proposal_id: null,
    listing: {
      id: "listing-test-1",
      owner_id: TEST_OWNER.id,
      cancellation_policy: "moderate",
      check_in_date: "2026-06-01",
      check_out_date: "2026-06-08",
      property: {
        resort_name: "Test Resort",
        location: "Test City, FL",
      },
    },
    ...overrides,
  };
}

export function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: TEST_USER.id,
    email: TEST_USER.email,
    full_name: "Test Renter",
    stripe_account_id: null,
    stripe_charges_enabled: false,
    stripe_payouts_enabled: false,
    stripe_onboarding_complete: false,
    ...overrides,
  };
}

// ── Request builders ────────────────────────────────────────────────────────

export function makeRequest(opts: {
  method?: string;
  url?: string;
  body?: unknown;
  headers?: Record<string, string>;
}): Request {
  const headers = new Headers({
    "Content-Type": "application/json",
    Authorization: "Bearer test-jwt-token",
    Origin: "https://test.rent-a-vacation.com",
    ...opts.headers,
  });
  return new Request(opts.url ?? "https://edge.example/fn", {
    method: opts.method ?? "POST",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

// ── Test env helper ─────────────────────────────────────────────────────────

export function makeTestEnv(overrides: Record<string, string | undefined> = {}) {
  return {
    SUPABASE_URL: "https://test.supabase.example",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key-test",
    SUPABASE_ANON_KEY: "anon-key-test",
    STRIPE_SECRET_KEY: "sk_test_mock",
    STRIPE_WEBHOOK_SECRET: "whsec_test_mock",
    STRIPE_TAX_ENABLED: "false",
    RESEND_API_KEY: "re_test_mock",
    ...overrides,
  };
}
