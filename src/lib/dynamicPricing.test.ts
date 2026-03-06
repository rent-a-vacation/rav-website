import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateUrgencyDiscount,
  calculateSeasonalFactor,
  calculateDemandAdjustment,
  daysUntilDate,
  suggestDynamicPrice,
  type SeasonalDataPoint,
  type DemandSignals,
} from "./dynamicPricing";

// ---------------------------------------------------------------------------
// calculateUrgencyDiscount
// ---------------------------------------------------------------------------

describe("calculateUrgencyDiscount", () => {
  it("returns 0 for 60+ days out", () => {
    expect(calculateUrgencyDiscount(60)).toBe(0);
    expect(calculateUrgencyDiscount(100)).toBe(0);
  });

  it("returns -5 for 30-59 days", () => {
    expect(calculateUrgencyDiscount(30)).toBe(-5);
    expect(calculateUrgencyDiscount(59)).toBe(-5);
  });

  it("returns -10 for 14-29 days", () => {
    expect(calculateUrgencyDiscount(14)).toBe(-10);
    expect(calculateUrgencyDiscount(29)).toBe(-10);
  });

  it("returns -12 for 7-13 days", () => {
    expect(calculateUrgencyDiscount(7)).toBe(-12);
    expect(calculateUrgencyDiscount(13)).toBe(-12);
  });

  it("returns -15 for 0-6 days", () => {
    expect(calculateUrgencyDiscount(0)).toBe(-15);
    expect(calculateUrgencyDiscount(6)).toBe(-15);
  });

  it("returns 0 for negative days (past check-in)", () => {
    expect(calculateUrgencyDiscount(-1)).toBe(0);
    expect(calculateUrgencyDiscount(-30)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateSeasonalFactor
// ---------------------------------------------------------------------------

describe("calculateSeasonalFactor", () => {
  it("returns 0 for empty data", () => {
    expect(calculateSeasonalFactor(6, [])).toBe(0);
  });

  it("returns 0 when fewer than 2 months have bookings", () => {
    const data: SeasonalDataPoint[] = [
      { month: 3, avgNightlyRate: 200, bookingCount: 5 },
    ];
    expect(calculateSeasonalFactor(3, data)).toBe(0);
  });

  it("calculates positive seasonal factor for peak month", () => {
    const data: SeasonalDataPoint[] = [
      { month: 1, avgNightlyRate: 100, bookingCount: 10 },
      { month: 6, avgNightlyRate: 100, bookingCount: 10 },
      { month: 7, avgNightlyRate: 200, bookingCount: 10 }, // peak summer
      { month: 12, avgNightlyRate: 100, bookingCount: 10 },
    ];
    // Weighted avg = (100*10 + 100*10 + 200*10 + 100*10) / 40 = 125
    // July factor = (200-125)/125 = 60%
    expect(calculateSeasonalFactor(7, data)).toBe(60);
  });

  it("calculates negative seasonal factor for off-peak month", () => {
    const data: SeasonalDataPoint[] = [
      { month: 1, avgNightlyRate: 80, bookingCount: 5 }, // off-peak
      { month: 7, avgNightlyRate: 200, bookingCount: 15 },
    ];
    // Weighted avg = (80*5 + 200*15) / 20 = 170
    // Jan factor = (80-170)/170 = -52.9% → -53%
    expect(calculateSeasonalFactor(1, data)).toBe(-53);
  });

  it("returns 0 when target month not in data", () => {
    const data: SeasonalDataPoint[] = [
      { month: 1, avgNightlyRate: 100, bookingCount: 10 },
      { month: 6, avgNightlyRate: 150, bookingCount: 10 },
    ];
    expect(calculateSeasonalFactor(3, data)).toBe(0);
  });

  it("ignores months with zero bookings", () => {
    const data: SeasonalDataPoint[] = [
      { month: 1, avgNightlyRate: 100, bookingCount: 10 },
      { month: 2, avgNightlyRate: 999, bookingCount: 0 }, // should be ignored
      { month: 6, avgNightlyRate: 100, bookingCount: 10 },
    ];
    expect(calculateSeasonalFactor(1, data)).toBe(0); // both equal → 0%
  });
});

// ---------------------------------------------------------------------------
// calculateDemandAdjustment
// ---------------------------------------------------------------------------

describe("calculateDemandAdjustment", () => {
  it("returns 0 for no demand signals", () => {
    expect(calculateDemandAdjustment({ pendingBidCount: 0, savedSearchCount: 0 })).toBe(0);
  });

  it("returns +3 for 1-2 pending bids", () => {
    expect(calculateDemandAdjustment({ pendingBidCount: 1, savedSearchCount: 0 })).toBe(3);
    expect(calculateDemandAdjustment({ pendingBidCount: 2, savedSearchCount: 0 })).toBe(3);
  });

  it("returns +3 for 3+ saved searches even with 0 bids", () => {
    expect(calculateDemandAdjustment({ pendingBidCount: 0, savedSearchCount: 3 })).toBe(3);
    expect(calculateDemandAdjustment({ pendingBidCount: 0, savedSearchCount: 10 })).toBe(3);
  });

  it("returns +5 for 3-4 pending bids", () => {
    expect(calculateDemandAdjustment({ pendingBidCount: 3, savedSearchCount: 0 })).toBe(5);
    expect(calculateDemandAdjustment({ pendingBidCount: 4, savedSearchCount: 0 })).toBe(5);
  });

  it("returns +8 for 5+ pending bids", () => {
    expect(calculateDemandAdjustment({ pendingBidCount: 5, savedSearchCount: 0 })).toBe(8);
    expect(calculateDemandAdjustment({ pendingBidCount: 20, savedSearchCount: 0 })).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// daysUntilDate
// ---------------------------------------------------------------------------

describe("daysUntilDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T00:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns positive days for future dates", () => {
    expect(daysUntilDate("2026-03-10")).toBe(5);
    expect(daysUntilDate("2026-04-05")).toBe(31);
  });

  it("returns 0 for today", () => {
    expect(daysUntilDate("2026-03-05")).toBe(0);
  });

  it("returns negative for past dates", () => {
    expect(daysUntilDate("2026-03-01")).toBe(-4);
  });
});

// ---------------------------------------------------------------------------
// suggestDynamicPrice
// ---------------------------------------------------------------------------

describe("suggestDynamicPrice", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T00:00:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns base rate when no factors apply", () => {
    // 90 days out, no seasonal data, no demand
    const result = suggestDynamicPrice(200, "2026-06-03", [], { pendingBidCount: 0, savedSearchCount: 0 }, 5);
    expect(result.suggestedRate).toBe(200);
    expect(result.factors.urgencyPct).toBe(0);
    expect(result.factors.seasonalPct).toBe(0);
    expect(result.factors.demandPct).toBe(0);
    expect(result.confidence).toBe("medium");
  });

  it("applies urgency discount for check-in in 10 days", () => {
    const result = suggestDynamicPrice(200, "2026-03-15", [], { pendingBidCount: 0, savedSearchCount: 0 }, 5);
    // 10 days out → -12%
    expect(result.factors.urgencyPct).toBe(-12);
    expect(result.suggestedRate).toBe(176); // 200 * 0.88
  });

  it("applies demand premium for high bid count", () => {
    const result = suggestDynamicPrice(200, "2026-06-03", [], { pendingBidCount: 5, savedSearchCount: 0 }, 5);
    // 90 days → 0% urgency, no seasonal, 5 bids → +8%
    expect(result.suggestedRate).toBe(216); // 200 * 1.08
    expect(result.factors.demandPct).toBe(8);
  });

  it("combines urgency and seasonal factors", () => {
    const seasonal: SeasonalDataPoint[] = [
      { month: 3, avgNightlyRate: 250, bookingCount: 10 },
      { month: 6, avgNightlyRate: 150, bookingCount: 10 },
    ];
    // Check-in March 20 = 15 days away → -10% urgency
    // March avg=250 vs weighted avg=(250*10+150*10)/20=200 → +25% seasonal
    const result = suggestDynamicPrice(200, "2026-03-20", seasonal, { pendingBidCount: 0, savedSearchCount: 0 }, 5);
    // 200 * 0.90 * 1.25 * 1.0 = 225
    expect(result.suggestedRate).toBe(225);
  });

  it("returns high confidence with 10+ comparables and 4+ months", () => {
    const seasonal: SeasonalDataPoint[] = [
      { month: 1, avgNightlyRate: 100, bookingCount: 5 },
      { month: 3, avgNightlyRate: 100, bookingCount: 5 },
      { month: 6, avgNightlyRate: 100, bookingCount: 5 },
      { month: 9, avgNightlyRate: 100, bookingCount: 5 },
    ];
    const result = suggestDynamicPrice(200, "2026-06-03", seasonal, { pendingBidCount: 0, savedSearchCount: 0 }, 15);
    expect(result.confidence).toBe("high");
  });

  it("returns low confidence with fewer than 3 comparables", () => {
    const result = suggestDynamicPrice(200, "2026-06-03", [], { pendingBidCount: 0, savedSearchCount: 0 }, 2);
    expect(result.confidence).toBe("low");
  });

  it("never suggests less than $1", () => {
    // Very aggressive discount scenario
    const result = suggestDynamicPrice(1, "2026-03-06", [], { pendingBidCount: 0, savedSearchCount: 0 }, 5);
    expect(result.suggestedRate).toBeGreaterThanOrEqual(1);
  });
});
