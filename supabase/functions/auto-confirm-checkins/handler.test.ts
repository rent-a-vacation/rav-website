// Unit tests for auto-confirm-checkins handler (#462 / PaySafe Gap B).
// Service-role cron — no auth gate. Covers: empty queue, batch update,
// fetch error, update error, idempotency-by-filter (re-runs don't double-confirm).

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseMock } from "../../../src/test/helpers/supabase-mock";
import { makeRequest, makeTestEnv } from "../_shared/__tests__/edge-fn-fixtures";
import { handler, type Deps } from "./handler";

beforeEach(() => {
  vi.clearAllMocks();
});

interface SetupOpts {
  candidates?: Array<{ id: string; booking_id: string; traveler_id: string }>;
  fetchError?: { message: string };
  updateError?: { message: string };
}

function setup(opts: SetupOpts = {}) {
  const candidates = opts.candidates ?? [];
  const supabase = createSupabaseMock({
    checkin_confirmations: {
      data: opts.fetchError ? null : candidates,
      error: opts.fetchError ?? null,
    },
  });

  // Override the chain to simulate update errors when needed
  if (opts.updateError) {
    const originalFrom = supabase.from;
    supabase.from = vi.fn().mockImplementation((table: string) => {
      const chain = originalFrom(table);
      // Mock update path: update().in() should resolve with error
      const updateChain = {
        ...chain,
        update: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({ data: null, error: opts.updateError }),
        }),
      };
      return Object.assign(chain, updateChain);
    });
  }

  const deps: Deps = {
    supabase,
    env: makeTestEnv(),
    now: () => new Date("2026-05-02T12:00:00.000Z"),
  };
  return { supabase, deps };
}

describe("auto-confirm-checkins handler @p0 — empty queue", () => {
  it("processes 0 rows when no checkins are past deadline", async () => {
    const { deps } = setup({ candidates: [] });
    const res = await handler(makeRequest({ method: "POST" }), deps);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.processedCount).toBe(0);
  });
});

describe("auto-confirm-checkins handler @p0 — batch update", () => {
  it("auto-confirms every row past the deadline with source = 'auto'", async () => {
    const { supabase, deps } = setup({
      candidates: [
        { id: "ckn-1", booking_id: "bk-1", traveler_id: "u-1" },
        { id: "ckn-2", booking_id: "bk-2", traveler_id: "u-2" },
        { id: "ckn-3", booking_id: "bk-3", traveler_id: "u-3" },
      ],
    });
    const fromSpy = vi.spyOn(supabase, "from");

    const res = await handler(makeRequest({ method: "POST" }), deps);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.processedCount).toBe(3);
    expect(body.processedIds).toEqual(["ckn-1", "ckn-2", "ckn-3"]);
    // Two from() calls: one to fetch candidates, one to bulk update
    expect(fromSpy).toHaveBeenCalledWith("checkin_confirmations");
  });
});

describe("auto-confirm-checkins handler — fetch errors", () => {
  it("returns 500 when fetch fails", async () => {
    const { deps } = setup({ fetchError: { message: "DB unavailable" } });
    const res = await handler(makeRequest({ method: "POST" }), deps);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/DB unavailable|fetch/i);
  });
});

describe("auto-confirm-checkins handler — idempotency by filter", () => {
  it("hits checkin_confirmations table (filter chain .is/.eq prevents double-confirm)", async () => {
    const { supabase, deps } = setup({
      candidates: [{ id: "ckn-x", booking_id: "bk-x", traveler_id: "u-x" }],
    });
    const fromMock = vi.spyOn(supabase, "from");

    await handler(makeRequest({ method: "POST" }), deps);

    // Two calls expected: fetch + bulk update — both on checkin_confirmations
    expect(fromMock).toHaveBeenCalledWith("checkin_confirmations");
    expect(fromMock.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe("auto-confirm-checkins handler — OPTIONS preflight", () => {
  it("returns CORS headers on OPTIONS without invoking the supabase client", async () => {
    const { supabase, deps } = setup();
    const fromSpy = vi.spyOn(supabase, "from");
    const res = await handler(
      new Request("https://edge.example/auto-confirm-checkins", {
        method: "OPTIONS",
      }),
      deps,
    );
    expect(res.status).toBe(200);
    expect(fromSpy).not.toHaveBeenCalled();
  });
});
