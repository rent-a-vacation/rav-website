import { describe, it, expect } from "vitest";
import {
  formatSlaCountdown,
  slaColorTier,
  isOffDay,
  elapsedBusinessMinutes,
  elapsedWallClockMinutes,
  isTriageBreached,
  isResolutionBreached,
  DEFAULT_BUSINESS_HOURS,
} from "./disputeSla";

describe("formatSlaCountdown @p0", () => {
  it("formats <60m as 'Xm'", () => {
    expect(formatSlaCountdown(0)).toBe("0m");
    expect(formatSlaCountdown(45)).toBe("45m");
  });
  it("formats hours and minutes", () => {
    expect(formatSlaCountdown(60)).toBe("1h");
    expect(formatSlaCountdown(125)).toBe("2h 5m");
  });
  it("formats days and hours", () => {
    expect(formatSlaCountdown(60 * 24)).toBe("1d");
    expect(formatSlaCountdown(60 * 25)).toBe("1d 1h");
  });
  it("appends 'overdue' for negative values", () => {
    expect(formatSlaCountdown(-30)).toBe("30m overdue");
    expect(formatSlaCountdown(-180)).toBe("3h overdue");
  });
});

describe("slaColorTier @p0", () => {
  it("returns red when breached", () => {
    expect(slaColorTier(-1, 100)).toBe("red");
  });
  it("returns amber when <25% remaining", () => {
    expect(slaColorTier(20, 100)).toBe("amber");
    expect(slaColorTier(24, 100)).toBe("amber");
  });
  it("returns green when comfortably ahead", () => {
    expect(slaColorTier(80, 100)).toBe("green");
  });
  it("handles 0 total without dividing by zero (degenerate config returns green)", () => {
    // With totalMinutes=0 we floor to 1; 10/1 = 10 ≥ 0.25 → green.
    // The contract is "don't crash"; degenerate totals shouldn't happen in
    // practice (sla_targets has CHECK > 0).
    expect(slaColorTier(10, 0)).toBe("green");
  });
});

describe("isOffDay", () => {
  const config = {
    ...DEFAULT_BUSINESS_HOURS,
    federalHolidays: ["2026-12-25"],
  };

  it("treats Saturday + Sunday as off (default config)", () => {
    expect(isOffDay(new Date("2026-05-02T12:00:00Z"), config)).toBe(true); // Sat
    expect(isOffDay(new Date("2026-05-03T12:00:00Z"), config)).toBe(true); // Sun
    expect(isOffDay(new Date("2026-05-04T12:00:00Z"), config)).toBe(false); // Mon
  });

  it("treats federal holidays as off", () => {
    expect(isOffDay(new Date("2026-12-25T15:00:00Z"), config)).toBe(true);
  });
});

describe("elapsedWallClockMinutes", () => {
  it("returns 0 when end <= start", () => {
    const t = new Date("2026-05-02T10:00:00Z");
    expect(elapsedWallClockMinutes(t, t)).toBe(0);
  });
  it("counts every minute including off-hours", () => {
    const start = new Date("2026-05-02T10:00:00Z");
    const end = new Date("2026-05-02T12:30:00Z");
    expect(elapsedWallClockMinutes(start, end)).toBe(150);
  });
});

describe("elapsedBusinessMinutes", () => {
  it("returns 0 when end <= start", () => {
    const t = new Date("2026-05-04T10:00:00Z");
    expect(elapsedBusinessMinutes(t, t)).toBe(0);
  });

  it("counts only business-window minutes within a single weekday", () => {
    // Monday 10:00 → 14:00 → 4 hours = 240m business
    const start = new Date("2026-05-04T10:00:00Z"); // Mon
    const end = new Date("2026-05-04T14:00:00Z");
    expect(elapsedBusinessMinutes(start, end)).toBe(240);
  });

  it("excludes weekend gaps", () => {
    // Friday 17:00 → Monday 10:00 — only 1h Friday + 1h Monday counts
    const start = new Date("2026-05-01T17:00:00Z"); // Fri
    const end = new Date("2026-05-04T10:00:00Z"); // Mon
    const elapsed = elapsedBusinessMinutes(start, end);
    expect(elapsed).toBe(60 + 60); // 1h Fri + 1h Mon
  });

  it("excludes federal holidays", () => {
    const config = {
      ...DEFAULT_BUSINESS_HOURS,
      federalHolidays: ["2026-05-25"], // Memorial Day (Mon)
    };
    // Start Mon (holiday) → Tue 10:00 → only 1h Tuesday
    const start = new Date("2026-05-25T10:00:00Z");
    const end = new Date("2026-05-26T10:00:00Z");
    expect(elapsedBusinessMinutes(start, end, config)).toBe(60);
  });
});

describe("isTriageBreached", () => {
  it("returns true when elapsed >= sla and unalerted + unassigned", () => {
    expect(
      isTriageBreached({
        elapsedMinutes: 150,
        slaTriageMinutes: 120,
        triageAlertedAt: null,
        assignedTo: null,
      }),
    ).toBe(true);
  });
  it("returns false if already alerted (idempotency)", () => {
    expect(
      isTriageBreached({
        elapsedMinutes: 9999,
        slaTriageMinutes: 120,
        triageAlertedAt: "2026-05-01T00:00:00Z",
        assignedTo: null,
      }),
    ).toBe(false);
  });
  it("returns false if assigned (triaged)", () => {
    expect(
      isTriageBreached({
        elapsedMinutes: 9999,
        slaTriageMinutes: 120,
        triageAlertedAt: null,
        assignedTo: "staff-1",
      }),
    ).toBe(false);
  });
  it("returns false when within window", () => {
    expect(
      isTriageBreached({
        elapsedMinutes: 60,
        slaTriageMinutes: 120,
        triageAlertedAt: null,
        assignedTo: null,
      }),
    ).toBe(false);
  });
});

describe("isResolutionBreached", () => {
  it("returns true when elapsed >= sla, unalerted, status active", () => {
    expect(
      isResolutionBreached({
        elapsedMinutes: 1500,
        slaResolutionMinutes: 1440,
        resolutionAlertedAt: null,
        status: "open",
      }),
    ).toBe(true);
  });
  it("returns false if dispute already resolved (terminal status)", () => {
    expect(
      isResolutionBreached({
        elapsedMinutes: 9999,
        slaResolutionMinutes: 1440,
        resolutionAlertedAt: null,
        status: "resolved_full_refund",
      }),
    ).toBe(false);
  });
  it("returns false if already alerted", () => {
    expect(
      isResolutionBreached({
        elapsedMinutes: 9999,
        slaResolutionMinutes: 1440,
        resolutionAlertedAt: "2026-05-01T00:00:00Z",
        status: "open",
      }),
    ).toBe(false);
  });
});
