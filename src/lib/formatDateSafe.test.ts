// @p0
import { describe, it, expect } from "vitest";
import { formatDateSafe } from "./formatDateSafe";

describe("formatDateSafe", () => {
  it("formats a valid ISO string", () => {
    // Use explicit local-midnight parsing to avoid TZ shift on date-only inputs.
    expect(formatDateSafe("2026-04-15T12:00:00", "yyyy-MM-dd")).toBe("2026-04-15");
  });

  it("formats a Date instance", () => {
    expect(formatDateSafe(new Date(2026, 3, 15, 12, 0, 0), "yyyy")).toBe("2026");
  });

  it("returns fallback for null", () => {
    expect(formatDateSafe(null, "MMM d")).toBe("—");
  });

  it("returns fallback for undefined", () => {
    expect(formatDateSafe(undefined, "MMM d")).toBe("—");
  });

  it("returns fallback for empty string", () => {
    expect(formatDateSafe("", "MMM d")).toBe("—");
  });

  it("returns fallback for an unparseable string (does not throw)", () => {
    expect(formatDateSafe("not-a-date", "MMM d")).toBe("—");
  });

  it("uses a custom fallback when provided", () => {
    expect(formatDateSafe(null, "MMM d", "Dates TBD")).toBe("Dates TBD");
  });
});
