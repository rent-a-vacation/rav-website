// Unit tests for sla-monitor handler (#464 / PaySafe Gap G).
// Service-role cron — no auth gate. Covers: empty queue, triage breach,
// resolution breach, idempotency, on-site categories use wall-clock,
// business-hours categories use business minutes, terminal-status skipped.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "../../../src/test/helpers/supabase-mock";
import { makeRequest, makeTestEnv } from "../_shared/__tests__/edge-fn-fixtures";
import { handler, computeElapsedMinutes, type Deps } from "./handler";
import { DEFAULT_BUSINESS_HOURS } from "../../../src/lib/disputeSla";

beforeEach(() => {
  vi.clearAllMocks();
});

interface SetupOpts {
  disputes?: Array<Record<string, unknown>>;
  fetchError?: { message: string };
  businessHours?: Record<string, unknown> | null;
  now?: Date;
}

function setup(opts: SetupOpts = {}) {
  const supabase = createSupabaseMock({
    disputes: {
      data: opts.fetchError ? null : opts.disputes ?? [],
      error: opts.fetchError ?? null,
    },
    business_hours_config: {
      data:
        opts.businessHours === null
          ? null
          : opts.businessHours ?? {
              start_hour: 9,
              end_hour: 18,
              timezone: "America/New_York",
              federal_holidays: [],
              weekend_days: [0, 6],
            },
      error: null,
    },
  });

  // Add functions.invoke stub
  (supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }).functions = {
    invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  const deps: Deps = {
    supabase,
    env: makeTestEnv(),
    now: () => opts.now ?? new Date("2026-05-04T18:00:00.000Z"), // Mon 18:00
  };
  return { supabase, deps };
}

describe("computeElapsedMinutes @p0", () => {
  it("uses wall-clock for on-site categories (safety_concerns)", () => {
    const created = new Date("2026-05-02T10:00:00.000Z"); // Sat 10:00
    const now = new Date("2026-05-04T10:00:00.000Z"); // Mon 10:00 — 48h later
    expect(
      computeElapsedMinutes(
        { category: "safety_concerns", created_at: created.toISOString() },
        now,
        DEFAULT_BUSINESS_HOURS,
      ),
    ).toBe(48 * 60);
  });

  it("uses business hours for non-on-site categories (cleanliness)", () => {
    const created = new Date("2026-05-02T10:00:00.000Z"); // Sat 10:00
    const now = new Date("2026-05-04T10:00:00.000Z"); // Mon 10:00
    // Sat + Sun excluded; Monday 09:00 → 10:00 = 60 minutes
    expect(
      computeElapsedMinutes(
        { category: "cleanliness", created_at: created.toISOString() },
        now,
        DEFAULT_BUSINESS_HOURS,
      ),
    ).toBe(60);
  });
});

describe("sla-monitor handler @p0 — empty queue", () => {
  it("returns no alerts when no active disputes", async () => {
    const { deps } = setup({ disputes: [] });
    const res = await handler(makeRequest({ method: "POST" }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.triageAlerts).toBe(0);
    expect(body.resolutionAlerts).toBe(0);
  });
});

describe("sla-monitor handler @p0 — triage breach", () => {
  it("alerts when on-site category dispute is past triage SLA + unassigned", async () => {
    const { supabase, deps } = setup({
      now: new Date("2026-05-04T18:00:00.000Z"), // Mon 18:00
      disputes: [
        {
          id: "dsp-1",
          category: "safety_concerns",
          status: "open",
          assigned_to: null,
          triage_alerted_at: null,
          resolution_alerted_at: null,
          sla_triage_minutes: 120,
          sla_resolution_minutes: 1440,
          created_at: "2026-05-04T10:00:00.000Z", // 8h ago — way past 2h triage
          reporter_id: "u-1",
        },
      ],
    });

    const res = await handler(makeRequest({ method: "POST" }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.triageAlerts).toBe(1);
    expect(body.alertedDisputeIds).toContain("dsp-1");

    const invokeMock = (
      supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }
    ).functions.invoke;
    expect(invokeMock).toHaveBeenCalledWith(
      "notification-dispatcher",
      expect.objectContaining({
        body: expect.objectContaining({ type_key: "dispute_sla_breach" }),
      }),
    );
  });
});

describe("sla-monitor handler — idempotency", () => {
  it("does not re-alert when triage_alerted_at is already set", async () => {
    const { supabase, deps } = setup({
      disputes: [
        {
          id: "dsp-2",
          category: "safety_concerns",
          status: "open",
          assigned_to: null,
          triage_alerted_at: "2026-05-04T10:30:00.000Z", // Already alerted
          resolution_alerted_at: null,
          sla_triage_minutes: 120,
          sla_resolution_minutes: 1440,
          created_at: "2026-05-04T10:00:00.000Z",
          reporter_id: "u-1",
        },
      ],
    });

    const res = await handler(makeRequest({ method: "POST" }), deps);
    const body = await res.json();
    expect(body.triageAlerts).toBe(0);

    const invokeMock = (
      supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }
    ).functions.invoke;
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("does not alert if dispute is already assigned (triaged)", async () => {
    const { deps } = setup({
      disputes: [
        {
          id: "dsp-3",
          category: "safety_concerns",
          status: "investigating",
          assigned_to: "staff-1",
          triage_alerted_at: null,
          resolution_alerted_at: null,
          sla_triage_minutes: 120,
          sla_resolution_minutes: 1440,
          created_at: "2026-05-04T10:00:00.000Z",
          reporter_id: "u-1",
        },
      ],
    });

    const res = await handler(makeRequest({ method: "POST" }), deps);
    const body = await res.json();
    expect(body.triageAlerts).toBe(0);
  });
});

describe("sla-monitor handler — resolution breach", () => {
  it("alerts when active dispute is past resolution SLA", async () => {
    const { supabase, deps } = setup({
      now: new Date("2026-05-10T12:00:00.000Z"),
      disputes: [
        {
          id: "dsp-4",
          category: "safety_concerns",
          status: "investigating",
          assigned_to: "staff-1", // triaged so triage doesn't fire
          triage_alerted_at: null,
          resolution_alerted_at: null,
          sla_triage_minutes: 120,
          sla_resolution_minutes: 1440, // 24h
          // Created 6 days ago — way past 24h resolution
          created_at: "2026-05-04T12:00:00.000Z",
          reporter_id: "u-1",
        },
      ],
    });

    const res = await handler(makeRequest({ method: "POST" }), deps);
    const body = await res.json();
    expect(body.resolutionAlerts).toBe(1);

    const invokeMock = (
      supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }
    ).functions.invoke;
    expect(invokeMock).toHaveBeenCalled();
  });
});

describe("sla-monitor handler — terminal-status skip", () => {
  it("does not alert on resolved/closed disputes (filtered at query level)", async () => {
    // We filter via .not("status", "in", ...) — even if a resolved row sneaks
    // through, isResolutionBreached returns false.
    const { deps } = setup({
      disputes: [
        {
          id: "dsp-5",
          category: "safety_concerns",
          status: "resolved_full_refund",
          assigned_to: "staff-1",
          triage_alerted_at: null,
          resolution_alerted_at: null,
          sla_triage_minutes: 120,
          sla_resolution_minutes: 1440,
          created_at: "2026-04-01T12:00:00.000Z",
          reporter_id: "u-1",
        },
      ],
    });

    const res = await handler(makeRequest({ method: "POST" }), deps);
    const body = await res.json();
    expect(body.resolutionAlerts).toBe(0);
  });
});

describe("sla-monitor handler — defensive", () => {
  it("skips disputes without sla_triage_minutes or sla_resolution_minutes", async () => {
    const { deps } = setup({
      disputes: [
        {
          id: "dsp-6",
          category: "safety_concerns",
          status: "open",
          assigned_to: null,
          triage_alerted_at: null,
          resolution_alerted_at: null,
          sla_triage_minutes: null, // missing
          sla_resolution_minutes: null,
          created_at: "2026-05-04T10:00:00.000Z",
          reporter_id: "u-1",
        },
      ],
    });

    const res = await handler(makeRequest({ method: "POST" }), deps);
    const body = await res.json();
    expect(body.triageAlerts).toBe(0);
    expect(body.resolutionAlerts).toBe(0);
  });
});
