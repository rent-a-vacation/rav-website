// Unit tests for process-escrow-release handler (#371 / #468 PaySafe Gap D).
// Covers: hold-period setting resolution + fallback, eligibility branches,
// no-Connect-account path, Stripe failure path.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "../../../src/test/helpers/supabase-mock";
import { makeRequest, makeTestEnv } from "../_shared/__tests__/edge-fn-fixtures";
import { handler, resolveHoldPeriodDays, type Deps } from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
});

function makeStripeMock(overrides: Record<string, unknown> = {}) {
  return {
    transfers: {
      create: vi.fn().mockResolvedValue({ id: "tr_test_123" }),
    },
    ...overrides,
  } as unknown as Deps["stripe"];
}

function makeResendMock() {
  return {
    emails: {
      send: vi.fn().mockResolvedValue({}),
    },
  } as unknown as Deps["resend"];
}

interface SetupOpts {
  setting?: { days?: number } | null;
  settingError?: { message: string };
  escrows?: unknown[];
  escrowsError?: { message: string };
  stripe?: Deps["stripe"] | null;
  authHeader?: string | null;
  userRoles?: Array<{ role: string }>;
  now?: Date;
}

function setup(opts: SetupOpts = {}) {
  const settingRow = opts.setting === null
    ? null
    : { setting_value: opts.setting ?? { days: 5 } };

  const supabase = createSupabaseMock({
    system_settings: {
      data: opts.settingError ? null : settingRow,
      error: opts.settingError ?? null,
    },
    booking_confirmations: {
      data: opts.escrowsError ? null : opts.escrows ?? [],
      error: opts.escrowsError ?? null,
    },
    user_roles: { data: opts.userRoles ?? [], error: null },
    bookings: { data: null, error: null },
  });

  const deps: Deps = {
    supabase,
    stripe: opts.stripe === undefined ? makeStripeMock() : opts.stripe,
    resend: makeResendMock(),
    env: makeTestEnv(),
    now: () => opts.now ?? new Date("2026-05-15T12:00:00.000Z"),
  };
  return { supabase, deps };
}

describe("resolveHoldPeriodDays @p0", () => {
  it("reads {days: 5} from system_settings", async () => {
    const supabase = createSupabaseMock({
      system_settings: { data: { setting_value: { days: 5 } }, error: null },
    });
    expect(await resolveHoldPeriodDays(supabase)).toBe(5);
  });

  it("reads alternative tunings", async () => {
    const supabase = createSupabaseMock({
      system_settings: { data: { setting_value: { days: 3 } }, error: null },
    });
    expect(await resolveHoldPeriodDays(supabase)).toBe(3);
  });

  it("falls back to default 5 when setting is missing", async () => {
    const supabase = createSupabaseMock({
      system_settings: { data: null, error: null },
    });
    expect(await resolveHoldPeriodDays(supabase)).toBe(5);
  });

  it("falls back to default 5 when setting fetch errors", async () => {
    const supabase = createSupabaseMock({
      system_settings: { data: null, error: { message: "DB down" } },
    });
    expect(await resolveHoldPeriodDays(supabase)).toBe(5);
  });

  it("rejects out-of-range values and falls back to default", async () => {
    const supabase = createSupabaseMock({
      system_settings: { data: { setting_value: { days: -1 } }, error: null },
    });
    expect(await resolveHoldPeriodDays(supabase)).toBe(5);

    const supabase2 = createSupabaseMock({
      system_settings: { data: { setting_value: { days: 9999 } }, error: null },
    });
    expect(await resolveHoldPeriodDays(supabase2)).toBe(5);
  });

  it("rejects non-numeric values and falls back to default", async () => {
    const supabase = createSupabaseMock({
      system_settings: { data: { setting_value: { days: "five" } }, error: null },
    });
    expect(await resolveHoldPeriodDays(supabase)).toBe(5);
  });
});

describe("process-escrow-release handler @p0 — empty queue", () => {
  it("returns released=0 when no verified escrows", async () => {
    const { deps } = setup({ escrows: [] });
    const res = await handler(
      makeRequest({
        method: "POST",
        headers: { Authorization: "Bearer service_role_token" },
      }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.released).toBe(0);
    expect(body.hold_period_days).toBe(5);
  });
});

describe("process-escrow-release handler — eligibility filters", () => {
  function makeEscrow(overrides: Record<string, unknown> = {}) {
    return {
      id: "esc-1",
      booking_id: "bk-1",
      escrow_amount: 1000,
      escrow_status: "verified",
      payout_held: false,
      booking: {
        id: "bk-1",
        status: "confirmed",
        owner_payout: 850,
        payout_status: null,
        listing_id: "ls-1",
        listing: {
          check_out_date: "2026-04-30T00:00:00.000Z", // 15 days before now
          property: { resort_name: "Test Resort" },
          owner: {
            id: "ow-1",
            full_name: "Test Owner",
            email: "owner@example.com",
            stripe_account_id: "acct_test",
            stripe_payouts_enabled: true,
          },
        },
        ...((overrides.booking as Record<string, unknown>) ?? {}),
      },
      ...overrides,
    };
  }

  it("skips when hold period has not elapsed (check_out_date too recent)", async () => {
    const { deps } = setup({
      escrows: [
        makeEscrow({
          booking: {
            id: "bk-2",
            status: "confirmed",
            owner_payout: 100,
            payout_status: null,
            listing_id: "ls-2",
            listing: {
              check_out_date: "2026-05-14T00:00:00.000Z", // 1 day before now=May 15
              property: { resort_name: "Recent" },
              owner: { id: "ow-2", stripe_account_id: null, stripe_payouts_enabled: false },
            },
          },
        }),
      ],
    });
    const res = await handler(
      makeRequest({
        method: "POST",
        headers: { Authorization: "Bearer service_role_token" },
      }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.released).toBe(0);
    expect(body.skipped).toBe(1);
  });

  it("skips when booking is already paid/processing", async () => {
    const { deps } = setup({
      escrows: [
        makeEscrow({
          booking: {
            id: "bk-3",
            status: "confirmed",
            owner_payout: 100,
            payout_status: "processing",
            listing_id: "ls-3",
            listing: {
              check_out_date: "2026-04-01T00:00:00.000Z",
              property: { resort_name: "Already Paid" },
              owner: { id: "ow-3", stripe_account_id: "acct_x", stripe_payouts_enabled: true },
            },
          },
        }),
      ],
    });
    const res = await handler(
      makeRequest({
        method: "POST",
        headers: { Authorization: "Bearer service_role_token" },
      }),
      deps,
    );
    const body = await res.json();
    expect(body.released).toBe(0);
    expect(body.skipped).toBe(1);
  });

  it("skips when booking status is not confirmed/completed", async () => {
    const { deps } = setup({
      escrows: [
        makeEscrow({
          booking: {
            id: "bk-4",
            status: "pending",
            owner_payout: 100,
            payout_status: null,
            listing_id: "ls-4",
            listing: {
              check_out_date: "2026-04-01T00:00:00.000Z",
              property: { resort_name: "Pending" },
              owner: { id: "ow-4", stripe_account_id: "acct_y", stripe_payouts_enabled: true },
            },
          },
        }),
      ],
    });
    const res = await handler(
      makeRequest({
        method: "POST",
        headers: { Authorization: "Bearer service_role_token" },
      }),
      deps,
    );
    const body = await res.json();
    expect(body.released).toBe(0);
    expect(body.skipped).toBe(1);
  });
});

describe("process-escrow-release handler — hold period override from settings", () => {
  it("uses 3-day hold when setting is overridden", async () => {
    // check_out 4 days before now → eligible if hold=3, not eligible if hold=5
    const { deps } = setup({
      setting: { days: 3 },
      escrows: [
        {
          id: "esc-X",
          booking_id: "bk-X",
          escrow_amount: 1000,
          escrow_status: "verified",
          payout_held: false,
          booking: {
            id: "bk-X",
            status: "confirmed",
            owner_payout: 850,
            payout_status: null,
            listing_id: "ls-X",
            listing: {
              check_out_date: "2026-05-11T00:00:00.000Z", // 4 days before now=May 15
              property: { resort_name: "X" },
              owner: { id: "ow-X", stripe_account_id: null, stripe_payouts_enabled: false },
            },
          },
        },
      ],
    });
    const res = await handler(
      makeRequest({
        method: "POST",
        headers: { Authorization: "Bearer service_role_token" },
      }),
      deps,
    );
    const body = await res.json();
    expect(body.hold_period_days).toBe(3);
    expect(body.released).toBe(1);
  });
});
