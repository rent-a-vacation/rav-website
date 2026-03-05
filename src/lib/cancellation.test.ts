import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculatePolicyRefund,
  getDaysUntilCheckin,
  getRefundDescription,
  estimatePayoutDate,
} from "./cancellation";

describe("calculatePolicyRefund @p0", () => {
  const amount = 1000;

  describe("flexible policy", () => {
    it("returns full refund when 1+ days before check-in", () => {
      expect(calculatePolicyRefund(amount, "flexible", 1)).toBe(1000);
    });

    it("returns full refund when far in advance", () => {
      expect(calculatePolicyRefund(amount, "flexible", 30)).toBe(1000);
    });

    it("returns 0 when less than 1 day before", () => {
      expect(calculatePolicyRefund(amount, "flexible", 0)).toBe(0);
    });

    it("returns 0 on check-in day", () => {
      expect(calculatePolicyRefund(amount, "flexible", -1)).toBe(0);
    });
  });

  describe("moderate policy", () => {
    it("returns full refund when 5+ days before", () => {
      expect(calculatePolicyRefund(amount, "moderate", 5)).toBe(1000);
    });

    it("returns full refund when far in advance", () => {
      expect(calculatePolicyRefund(amount, "moderate", 30)).toBe(1000);
    });

    it("returns 50% when 1-4 days before", () => {
      expect(calculatePolicyRefund(amount, "moderate", 4)).toBe(500);
      expect(calculatePolicyRefund(amount, "moderate", 1)).toBe(500);
    });

    it("returns 0 when less than 1 day", () => {
      expect(calculatePolicyRefund(amount, "moderate", 0)).toBe(0);
    });

    it("boundary: exactly 5 days is full refund", () => {
      expect(calculatePolicyRefund(amount, "moderate", 5)).toBe(1000);
    });
  });

  describe("strict policy", () => {
    it("returns 50% when 7+ days before", () => {
      expect(calculatePolicyRefund(amount, "strict", 7)).toBe(500);
    });

    it("returns 50% when far in advance", () => {
      expect(calculatePolicyRefund(amount, "strict", 30)).toBe(500);
    });

    it("returns 0 when less than 7 days", () => {
      expect(calculatePolicyRefund(amount, "strict", 6)).toBe(0);
      expect(calculatePolicyRefund(amount, "strict", 0)).toBe(0);
    });

    it("boundary: exactly 7 days is 50%", () => {
      expect(calculatePolicyRefund(amount, "strict", 7)).toBe(500);
    });
  });

  describe("super_strict policy", () => {
    it("always returns 0 regardless of timing", () => {
      expect(calculatePolicyRefund(amount, "super_strict", 30)).toBe(0);
      expect(calculatePolicyRefund(amount, "super_strict", 7)).toBe(0);
      expect(calculatePolicyRefund(amount, "super_strict", 0)).toBe(0);
    });
  });

  it("returns 0 for unknown policy", () => {
    expect(calculatePolicyRefund(amount, "unknown" as never, 30)).toBe(0);
  });
});

describe("getDaysUntilCheckin", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns positive days for future date", () => {
    // Use local-time string to avoid UTC midnight timezone shift
    expect(getDaysUntilCheckin("2026-03-10T12:00:00")).toBe(9);
  });

  it("returns 0 for today", () => {
    expect(getDaysUntilCheckin("2026-03-01T12:00:00")).toBe(0);
  });

  it("returns negative days for past date", () => {
    expect(getDaysUntilCheckin("2026-02-25T12:00:00")).toBe(-4);
  });

  it("handles Date objects", () => {
    const checkIn = new Date(2026, 2, 5, 12, 0, 0); // March 5, local time
    expect(getDaysUntilCheckin(checkIn)).toBe(4);
  });
});

describe("getRefundDescription", () => {
  describe("flexible policy", () => {
    it("describes full refund when 1+ days", () => {
      const result = getRefundDescription("flexible", 5);
      expect(result.percentage).toBe(100);
      expect(result.description).toContain("Full refund");
    });

    it("describes no refund when <1 day", () => {
      const result = getRefundDescription("flexible", 0);
      expect(result.percentage).toBe(0);
      expect(result.description).toContain("No refund");
    });
  });

  describe("moderate policy", () => {
    it("describes full refund when 5+ days", () => {
      const result = getRefundDescription("moderate", 10);
      expect(result.percentage).toBe(100);
    });

    it("describes 50% refund when 1-4 days", () => {
      const result = getRefundDescription("moderate", 3);
      expect(result.percentage).toBe(50);
      expect(result.description).toContain("50%");
    });

    it("describes no refund when <1 day", () => {
      const result = getRefundDescription("moderate", 0);
      expect(result.percentage).toBe(0);
    });
  });

  describe("strict policy", () => {
    it("describes 50% refund when 7+ days", () => {
      const result = getRefundDescription("strict", 10);
      expect(result.percentage).toBe(50);
    });

    it("describes no refund when <7 days", () => {
      const result = getRefundDescription("strict", 5);
      expect(result.percentage).toBe(0);
    });
  });

  describe("super_strict policy", () => {
    it("always describes non-refundable", () => {
      const result = getRefundDescription("super_strict", 30);
      expect(result.percentage).toBe(0);
      expect(result.description).toContain("non-refundable");
    });
  });

  it("handles unknown policy gracefully", () => {
    const result = getRefundDescription("unknown" as never, 30);
    expect(result.percentage).toBe(0);
  });
});

describe("estimatePayoutDate", () => {
  it("adds 5 days to checkout date string", () => {
    const result = estimatePayoutDate("2026-03-22T12:00:00");
    expect(result.getDate()).toBe(27);
    expect(result.getMonth()).toBe(2); // March = 2
  });

  it("adds 5 days to Date object", () => {
    const result = estimatePayoutDate(new Date(2026, 2, 22)); // March 22
    expect(result.getDate()).toBe(27);
  });

  it("handles month boundary", () => {
    const result = estimatePayoutDate("2026-01-28T12:00:00");
    expect(result.getMonth()).toBe(1); // February
    expect(result.getDate()).toBe(2);
  });
});
