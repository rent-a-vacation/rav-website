// Unit tests for create-connect-account handler (issue #442).
// Covers: role check (must be property_owner), new account creation,
// existing-but-incomplete onboarding refresh, already-onboarded short-circuit,
// missing STRIPE_SECRET_KEY, missing auth header.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStripeMock } from "../_shared/__tests__/stripe-mock";
import {
  createEdgeFnSupabaseMock,
  makeRequest,
  makeTestEnv,
  TEST_OWNER,
  TEST_USER,
} from "../_shared/__tests__/edge-fn-fixtures";
import { handler, type Deps } from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(opts: {
  isOwner?: boolean;
  existingAccountId?: string | null;
  existingAccount?: { id: string; charges_enabled: boolean; payouts_enabled: boolean };
  user?: { id: string; email: string };
} = {}) {
  const isOwner = opts.isOwner ?? true;
  const supabase = createEdgeFnSupabaseMock(
    {
      user_roles: {
        data: isOwner ? [{ role: "property_owner" }] : [{ role: "renter" }],
        error: null,
      },
      profiles: {
        data: {
          stripe_account_id: opts.existingAccountId ?? null,
          stripe_onboarding_complete: false,
          full_name: "Test Owner",
        },
        error: null,
      },
    },
    { user: opts.user ?? TEST_OWNER },
  );
  const stripe = createStripeMock({
    accountsCreate: { id: "acct_test_new" },
    accountsRetrieve: opts.existingAccount ?? {
      id: opts.existingAccountId ?? "acct_test_default",
      charges_enabled: true,
      payouts_enabled: true,
    },
    accountLinksCreate: {
      url: "https://connect.stripe.example/onboard/acct_test_new",
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    },
  });
  const deps: Deps = { supabase, stripe, env: makeTestEnv() };
  return { supabase, stripe, deps };
}

describe("create-connect-account handler @p0 — happy path", () => {
  it("creates a new Express account + onboarding link for a fresh property_owner", async () => {
    const { stripe, deps } = setup({ existingAccountId: null });
    const res = await handler(makeRequest({ body: {} }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.account_id).toBe("acct_test_new");
    expect(body.url).toContain("connect.stripe.example");
    expect(stripe.accounts.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "express",
        email: TEST_OWNER.email,
        capabilities: { transfers: { requested: true } },
      }),
    );
    expect(stripe.accountLinks.create).toHaveBeenCalledTimes(1);
  });

  it("uses provided returnUrl in account link refresh/return URLs", async () => {
    const { stripe, deps } = setup({ existingAccountId: null });
    await handler(
      makeRequest({ body: { returnUrl: "https://custom.example/back" } }),
      deps,
    );
    expect(stripe.accountLinks.create).toHaveBeenCalledWith(
      expect.objectContaining({
        refresh_url: "https://custom.example/back",
        return_url: "https://custom.example/back",
      }),
    );
  });
});

describe("create-connect-account handler — role check", () => {
  it("rejects non-property_owner users", async () => {
    const { deps, stripe } = setup({ isOwner: false });
    const res = await handler(makeRequest({ body: {} }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/only property owners/i);
    expect(stripe.accounts.create).not.toHaveBeenCalled();
  });
});

describe("create-connect-account handler — existing account paths", () => {
  it("short-circuits when existing account is fully onboarded", async () => {
    const { stripe, deps } = setup({
      existingAccountId: "acct_test_existing",
      existingAccount: { id: "acct_test_existing", charges_enabled: true, payouts_enabled: true },
    });
    const res = await handler(makeRequest({ body: {} }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.already_complete).toBe(true);
    expect(body.account_id).toBe("acct_test_existing");
    // Should NOT generate a new account link
    expect(stripe.accountLinks.create).not.toHaveBeenCalled();
    // Should NOT create a new account
    expect(stripe.accounts.create).not.toHaveBeenCalled();
  });

  it("generates a new onboarding link when existing account is incomplete", async () => {
    const { stripe, deps } = setup({
      existingAccountId: "acct_test_pending",
      existingAccount: { id: "acct_test_pending", charges_enabled: false, payouts_enabled: false },
    });
    const res = await handler(makeRequest({ body: {} }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.account_id).toBe("acct_test_pending");
    expect(stripe.accounts.create).not.toHaveBeenCalled(); // reused
    expect(stripe.accountLinks.create).toHaveBeenCalledTimes(1);
  });

  it("generates a new onboarding link when only one of charges/payouts is enabled", async () => {
    // Stripe sometimes enables charges before payouts; that's still incomplete.
    const { stripe, deps } = setup({
      existingAccountId: "acct_test_partial",
      existingAccount: { id: "acct_test_partial", charges_enabled: true, payouts_enabled: false },
    });
    await handler(makeRequest({ body: {} }), deps);
    expect(stripe.accountLinks.create).toHaveBeenCalledTimes(1);
  });
});

describe("create-connect-account handler — env + auth guards", () => {
  it("rejects when STRIPE_SECRET_KEY is missing", async () => {
    const { deps } = setup({ existingAccountId: null });
    deps.env.STRIPE_SECRET_KEY = undefined;
    const res = await handler(makeRequest({ body: {} }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/stripe_secret_key/i);
  });

  it("rejects when no Authorization header is provided", async () => {
    const { deps } = setup({ existingAccountId: null });
    const req = new Request("https://edge.example/fn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await handler(req, deps);
    expect(res.status).toBe(500);
  });

  it("OPTIONS preflight returns CORS headers", async () => {
    const { deps } = setup();
    const res = await handler(makeRequest({ method: "OPTIONS" }), deps);
    expect(res.status).toBe(200);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });
});
