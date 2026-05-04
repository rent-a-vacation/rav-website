// Unit tests for confirm-checkin handler (#461 / PaySafe Gap A).
// Covers: confirm happy path, confirm idempotent, report_issue with photo,
// report_issue without photo, auth fail (no Bearer), auth fail (wrong renter),
// validation, notification fire-and-forget tolerance.

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

interface SetupOpts {
  checkin?: {
    id?: string;
    traveler_id?: string;
    confirmed_arrival?: boolean | null;
    issue_reported?: boolean;
  } | null;
  bookingOwnerId?: string;
  user?: { id: string; email: string } | null;
  invokeError?: { message: string };
}

function setup(opts: SetupOpts = {}) {
  const checkin =
    opts.checkin === undefined
      ? {
          id: "ckn-1",
          traveler_id: TEST_USER.id,
          confirmed_arrival: null,
          confirmed_at: null,
          issue_reported: false,
          booking_id: "bk-1",
        }
      : opts.checkin === null
        ? null
        : {
            id: opts.checkin.id ?? "ckn-1",
            traveler_id: opts.checkin.traveler_id ?? TEST_USER.id,
            confirmed_arrival: opts.checkin.confirmed_arrival ?? null,
            confirmed_at: null,
            issue_reported: opts.checkin.issue_reported ?? false,
            booking_id: "bk-1",
          };

  const supabase = createEdgeFnSupabaseMock(
    {
      checkin_confirmations: { data: checkin, error: null },
      bookings: {
        data: {
          id: "bk-1",
          listing: {
            owner_id: opts.bookingOwnerId ?? TEST_OWNER.id,
            property: { resort_name: "Test Resort" },
          },
        },
        error: null,
      },
    },
    {
      rateLimitAllowed: true,
      user: opts.user === undefined ? TEST_USER : opts.user,
      functionsInvokeResult: { data: null, error: opts.invokeError ?? null },
    },
  );
  const deps: Deps = { supabase, env: makeTestEnv() };
  return { supabase, deps };
}

describe("confirm-checkin handler @p0 — auth", () => {
  it("rejects requests without Authorization header", async () => {
    const { deps } = setup();
    const req = new Request("https://edge.example/confirm-checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: "bk-1", action: "confirm" }),
    });
    const res = await handler(req, deps);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/authorization/i);
  });

  it("rejects when the authenticated user is not the booking traveler", async () => {
    const { deps } = setup({
      checkin: { traveler_id: "00000000-0000-0000-0000-000000000099" },
    });
    const res = await handler(
      makeRequest({ body: { bookingId: "bk-1", action: "confirm" } }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/only the booking traveler/i);
  });
});

describe("confirm-checkin handler @p0 — confirm path", () => {
  it("writes confirmed_arrival = true on the happy path", async () => {
    const { supabase, deps } = setup();
    const fromSpy = vi.spyOn(supabase, "from");

    const res = await handler(
      makeRequest({ body: { bookingId: "bk-1", action: "confirm" } }),
      deps,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.confirmedAt).toBeTruthy();
    expect(body.alreadyConfirmed).toBeUndefined();
    expect(fromSpy).toHaveBeenCalledWith("checkin_confirmations");
  });

  it("is idempotent — re-tap on already-confirmed row returns alreadyConfirmed=true without re-writing", async () => {
    const { supabase, deps } = setup({
      checkin: { confirmed_arrival: true },
    });

    const res = await handler(
      makeRequest({ body: { bookingId: "bk-1", action: "confirm" } }),
      deps,
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.alreadyConfirmed).toBe(true);
    // No notification dispatch on idempotent re-tap
    const invokeMock = (
      supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }
    ).functions.invoke;
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it("dispatches owner notification on first confirm (fire-and-forget)", async () => {
    const { supabase, deps } = setup();

    await handler(
      makeRequest({ body: { bookingId: "bk-1", action: "confirm" } }),
      deps,
    );

    const invokeMock = (
      supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }
    ).functions.invoke;
    expect(invokeMock).toHaveBeenCalledWith(
      "notification-dispatcher",
      expect.objectContaining({
        body: expect.objectContaining({
          type_key: "traveler_arrival_confirmed",
          user_id: TEST_OWNER.id,
        }),
      }),
    );
  });

  it("tolerates notification dispatch errors without failing the write", async () => {
    const { supabase, deps } = setup();
    // Override invoke to reject
    (
      supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }
    ).functions.invoke = vi.fn().mockRejectedValue(new Error("network down"));

    const res = await handler(
      makeRequest({ body: { bookingId: "bk-1", action: "confirm" } }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});

describe("confirm-checkin handler @p0 — report_issue path", () => {
  it("writes issue fields on the happy path with photo", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({
        body: {
          bookingId: "bk-1",
          action: "report_issue",
          issueType: "no_access",
          issueDescription: "The lockbox code we were sent does not work.",
          verificationPhotoPath: "user-1/bk-1/door-locked.jpg",
        },
      }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.photoCaptured).toBe(true);
    expect(body.issueReportedAt).toBeTruthy();
  });

  it("writes issue fields on the happy path without photo", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({
        body: {
          bookingId: "bk-1",
          action: "report_issue",
          issueType: "cleanliness",
          issueDescription: "Bathroom has not been cleaned since last guest.",
        },
      }),
      deps,
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.photoCaptured).toBe(false);
  });

  it("rejects unknown issue types", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({
        body: {
          bookingId: "bk-1",
          action: "report_issue",
          issueType: "made-up-category",
          issueDescription: "Some issue here that is long enough.",
        },
      }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/issue type/i);
  });

  it("rejects too-short descriptions", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({
        body: {
          bookingId: "bk-1",
          action: "report_issue",
          issueType: "cleanliness",
          issueDescription: "dirty",
        },
      }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/at least 10 characters/i);
  });

  it("does not re-notify RAV team on repeat issue submission (idempotency over notification)", async () => {
    const { supabase, deps } = setup({
      checkin: { issue_reported: true },
    });
    await handler(
      makeRequest({
        body: {
          bookingId: "bk-1",
          action: "report_issue",
          issueType: "no_access",
          issueDescription: "Updated note: still cannot access the unit.",
        },
      }),
      deps,
    );

    const invokeMock = (
      supabase as unknown as { functions: { invoke: ReturnType<typeof vi.fn> } }
    ).functions.invoke;
    // Should not have been called for the team alert path
    const teamCalls = invokeMock.mock.calls.filter(
      (call: unknown[]) =>
        (call[1] as { body?: { type_key?: string } } | undefined)?.body?.type_key ===
        "traveler_reported_checkin_issue",
    );
    expect(teamCalls.length).toBe(0);
  });
});

describe("confirm-checkin handler — input validation", () => {
  it("requires a bookingId", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({ body: { action: "confirm" } as Record<string, unknown> }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/bookingId/);
  });

  it("requires a known action", async () => {
    const { deps } = setup();
    const res = await handler(
      makeRequest({
        body: { bookingId: "bk-1", action: "delete" } as Record<string, unknown>,
      }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/action/);
  });

  it("returns 404-ish error if no checkin row exists for the booking", async () => {
    const { deps } = setup({ checkin: null });
    const res = await handler(
      makeRequest({ body: { bookingId: "bk-1", action: "confirm" } }),
      deps,
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/no check-in/i);
  });
});
