// Stripe mock factory for edge-function unit tests (issue #371).
//
// Usage:
//   const stripe = createStripeMock({
//     checkoutSessionsCreate: { id: "cs_test_123", url: "https://checkout.example/cs_test_123" },
//     refundsCreate: { id: "re_test_456", status: "succeeded" },
//   });
//   await handler(req, { stripe, supabase, env });
//   expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(...)
//
// Each surface returns a sensible default if no override is provided. Override
// shapes mirror real Stripe response shapes — keep them minimal and add only
// what the handler reads.

import { vi, type Mock } from "vitest";

type Override<T = unknown> = T | ((...args: unknown[]) => T) | Promise<T>;

function resolver<T>(override: Override<T> | undefined, fallback: T): Mock {
  if (override === undefined) {
    return vi.fn().mockResolvedValue(fallback);
  }
  if (typeof override === "function") {
    return vi.fn().mockImplementation(override as (...args: unknown[]) => T);
  }
  return vi.fn().mockResolvedValue(override);
}

function syncResolver<T>(override: Override<T> | undefined, fallback: T): Mock {
  if (override === undefined) {
    return vi.fn().mockReturnValue(fallback);
  }
  if (typeof override === "function") {
    return vi.fn().mockImplementation(override as (...args: unknown[]) => T);
  }
  return vi.fn().mockReturnValue(override);
}

export interface StripeMockOverrides {
  customersList?: Override<{ data: Array<{ id: string; email?: string }> }>;
  checkoutSessionsCreate?: Override<{
    id: string;
    url: string;
    payment_intent?: string;
    customer?: string;
  }>;
  checkoutSessionsRetrieve?: Override<{
    id: string;
    payment_status: "paid" | "unpaid" | "no_payment_required";
    payment_intent?: string;
    customer?: string;
    amount_total?: number;
    total_details?: { amount_tax?: number };
  }>;
  refundsCreate?: Override<{ id: string; status: string; amount: number }>;
  refundsRetrieve?: Override<{ id: string; status: string; amount: number; arrival_date?: number }>;
  webhooksConstructEvent?: Override<{ type: string; data: { object: Record<string, unknown> } }>;
  accountsCreate?: Override<{ id: string }>;
  accountsRetrieve?: Override<{
    id: string;
    charges_enabled?: boolean;
    payouts_enabled?: boolean;
    details_submitted?: boolean;
  }>;
  accountLinksCreate?: Override<{ url: string; expires_at: number }>;
  transfersCreate?: Override<{ id: string; amount: number; destination: string }>;
}

export function createStripeMock(overrides: StripeMockOverrides = {}) {
  return {
    customers: {
      list: resolver(overrides.customersList, { data: [] }),
    },
    checkout: {
      sessions: {
        create: resolver(overrides.checkoutSessionsCreate, {
          id: "cs_test_default",
          url: "https://checkout.stripe.example/cs_test_default",
          payment_intent: "pi_test_default",
        }),
        retrieve: resolver(overrides.checkoutSessionsRetrieve, {
          id: "cs_test_default",
          payment_status: "paid" as const,
          payment_intent: "pi_test_default",
          customer: "cus_test_default",
          amount_total: 100000,
          total_details: { amount_tax: 0 },
        }),
      },
    },
    refunds: {
      create: resolver(overrides.refundsCreate, {
        id: "re_test_default",
        status: "succeeded",
        amount: 50000,
      }),
      retrieve: resolver(overrides.refundsRetrieve, {
        id: "re_test_default",
        status: "succeeded",
        amount: 50000,
      }),
    },
    webhooks: {
      // constructEvent is sync in real Stripe SDK
      constructEvent: syncResolver(overrides.webhooksConstructEvent, {
        type: "unknown.event",
        data: { object: {} },
      }),
    },
    accounts: {
      create: resolver(overrides.accountsCreate, { id: "acct_test_default" }),
      retrieve: resolver(overrides.accountsRetrieve, {
        id: "acct_test_default",
        charges_enabled: true,
        payouts_enabled: true,
        details_submitted: true,
      }),
    },
    accountLinks: {
      create: resolver(overrides.accountLinksCreate, {
        url: "https://connect.stripe.example/onboard/acct_test_default",
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      }),
    },
    transfers: {
      create: resolver(overrides.transfersCreate, {
        id: "tr_test_default",
        amount: 50000,
        destination: "acct_test_default",
      }),
    },
  };
}

export type StripeMock = ReturnType<typeof createStripeMock>;
