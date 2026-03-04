import { describe, it, expect } from "vitest";
import {
  getCancellationPolicyRules,
  getCancellationDeadlines,
  getPolicyColor,
} from "./cancellationPolicy";

describe("getCancellationPolicyRules", () => {
  it("returns 2 rules for flexible policy", () => {
    const rules = getCancellationPolicyRules("flexible");
    expect(rules).toHaveLength(2);
    expect(rules[0].refundPercent).toBe(100);
    expect(rules[0].color).toBe("green");
    expect(rules[1].refundPercent).toBe(0);
    expect(rules[1].color).toBe("red");
  });

  it("returns 3 rules for moderate policy", () => {
    const rules = getCancellationPolicyRules("moderate");
    expect(rules).toHaveLength(3);
    expect(rules[0].refundPercent).toBe(100);
    expect(rules[1].refundPercent).toBe(50);
    expect(rules[1].color).toBe("yellow");
    expect(rules[2].refundPercent).toBe(0);
  });

  it("returns 2 rules for strict policy", () => {
    const rules = getCancellationPolicyRules("strict");
    expect(rules).toHaveLength(2);
    expect(rules[0].refundPercent).toBe(50);
    expect(rules[1].refundPercent).toBe(0);
  });

  it("returns 1 rule for super_strict policy", () => {
    const rules = getCancellationPolicyRules("super_strict");
    expect(rules).toHaveLength(1);
    expect(rules[0].refundPercent).toBe(0);
    expect(rules[0].color).toBe("red");
    expect(rules[0].label).toBe("Non-refundable");
  });
});

describe("getCancellationDeadlines", () => {
  it("returns concrete dates for flexible policy", () => {
    const deadlines = getCancellationDeadlines("flexible", "2026-04-15");
    expect(deadlines).toHaveLength(2);
    expect(deadlines[0].label).toContain("Apr 14, 2026");
    expect(deadlines[0].refundPercent).toBe(100);
  });

  it("returns concrete dates for moderate policy", () => {
    const deadlines = getCancellationDeadlines("moderate", "2026-04-15");
    expect(deadlines).toHaveLength(3);
    expect(deadlines[0].label).toContain("Apr 10, 2026"); // 5 days before
    expect(deadlines[1].label).toContain("Apr 14, 2026"); // 1 day before
  });

  it("returns concrete dates for strict policy", () => {
    const deadlines = getCancellationDeadlines("strict", "2026-04-15");
    expect(deadlines).toHaveLength(2);
    expect(deadlines[0].label).toContain("Apr 8, 2026"); // 7 days before
  });

  it("returns non-refundable for super_strict regardless of date", () => {
    const deadlines = getCancellationDeadlines("super_strict", "2026-04-15");
    expect(deadlines).toHaveLength(1);
    expect(deadlines[0].label).toBe("Non-refundable");
  });
});

describe("getPolicyColor", () => {
  it("returns emerald for flexible", () => {
    expect(getPolicyColor("flexible")).toContain("emerald");
  });

  it("returns amber for moderate", () => {
    expect(getPolicyColor("moderate")).toContain("amber");
  });

  it("returns orange for strict", () => {
    expect(getPolicyColor("strict")).toContain("orange");
  });

  it("returns red for super_strict", () => {
    expect(getPolicyColor("super_strict")).toContain("red");
  });
});
