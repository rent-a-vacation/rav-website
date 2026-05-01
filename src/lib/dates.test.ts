import { describe, it, expect } from "vitest";
import { formatSafeDate } from "./dates";

describe("formatSafeDate", () => {
  it("formats a valid ISO date string", () => {
    expect(formatSafeDate("2026-05-15T12:00:00Z", "yyyy-MM-dd")).toBe("2026-05-15");
  });

  it("formats a Date object", () => {
    expect(formatSafeDate(new Date("2026-05-15T12:00:00Z"), "yyyy-MM-dd")).toBe("2026-05-15");
  });

  it("returns default fallback when value is null", () => {
    expect(formatSafeDate(null, "yyyy-MM-dd")).toBe("Date not available");
  });

  it("returns default fallback when value is undefined", () => {
    expect(formatSafeDate(undefined, "yyyy-MM-dd")).toBe("Date not available");
  });

  it("returns default fallback when value is empty string", () => {
    expect(formatSafeDate("", "yyyy-MM-dd")).toBe("Date not available");
  });

  it("returns default fallback when string is unparseable", () => {
    expect(formatSafeDate("not-a-date", "yyyy-MM-dd")).toBe("Date not available");
  });

  it("returns custom fallback when provided", () => {
    expect(formatSafeDate(null, "yyyy-MM-dd", "TBD")).toBe("TBD");
  });

  it("does not throw RangeError on invalid Date object", () => {
    expect(() => formatSafeDate(new Date("not-a-date"), "yyyy-MM-dd")).not.toThrow();
    expect(formatSafeDate(new Date("not-a-date"), "yyyy-MM-dd")).toBe("Date not available");
  });
});
