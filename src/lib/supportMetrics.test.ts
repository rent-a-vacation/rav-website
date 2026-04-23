import { describe, it, expect } from "vitest";
import {
  formatPercent,
  formatDurationMs,
  formatRating,
  summarizeTurn,
  isDeflected,
} from "./supportMetrics";

describe("formatPercent", () => {
  it.each([
    [12, "12.0%"],
    [12.34, "12.3%"],
    [0, "0.0%"],
    [100, "100.0%"],
  ])("formats %s as %s", (input, expected) => {
    expect(formatPercent(input)).toBe(expected);
  });

  it.each([null, undefined, NaN])("returns em dash for %s", (input) => {
    expect(formatPercent(input as unknown as number)).toBe("—");
  });
});

describe("formatDurationMs", () => {
  it.each([
    [0, "0ms"],
    [250, "250ms"],
    [999, "999ms"],
    [1000, "1.0s"],
    [3400, "3.4s"],
    [59900, "59.9s"],
    [60000, "1m 0s"],
    [134000, "2m 14s"],
  ])("formats %s ms as %s", (input, expected) => {
    expect(formatDurationMs(input)).toBe(expected);
  });

  it.each([null, undefined, NaN])("returns em dash for %s", (input) => {
    expect(formatDurationMs(input as unknown as number)).toBe("—");
  });
});

describe("formatRating", () => {
  it("labels thumbs up as Helpful", () => {
    expect(formatRating(1)).toBe("Helpful");
  });

  it("labels thumbs down as Not helpful", () => {
    expect(formatRating(-1)).toBe("Not helpful");
  });

  it.each([0, null, undefined])("labels %s as No rating", (v) => {
    expect(formatRating(v as 0 | null | undefined)).toBe("No rating");
  });
});

describe("summarizeTurn", () => {
  it("trims user content and returns it", () => {
    expect(summarizeTurn({ turn_type: "user", content: "  help " })).toBe("help");
  });

  it("falls back for empty user content", () => {
    expect(summarizeTurn({ turn_type: "user", content: "" })).toMatch(/empty user/);
  });

  it("names tool_call turns by tool", () => {
    expect(summarizeTurn({ turn_type: "tool_call", tool_name: "lookup_booking" }))
      .toBe("Called lookup_booking");
  });

  it("names tool_result turns by tool", () => {
    expect(summarizeTurn({ turn_type: "tool_result", tool_name: "check_refund_status" }))
      .toBe("Result from check_refund_status");
  });

  it("handles missing tool name", () => {
    expect(summarizeTurn({ turn_type: "tool_call" })).toBe("Called tool");
  });

  it("falls back for empty error", () => {
    expect(summarizeTurn({ turn_type: "error", content: null })).toBe("(error)");
  });
});

describe("isDeflected", () => {
  it("true when ended and not escalated", () => {
    expect(isDeflected({ ended_at: "2026-04-23T00:00:00Z", escalated_at: null })).toBe(true);
  });

  it("false when still in progress", () => {
    expect(isDeflected({ ended_at: null, escalated_at: null })).toBe(false);
  });

  it("false when escalated", () => {
    expect(isDeflected({
      ended_at: "2026-04-23T00:00:00Z",
      escalated_at: "2026-04-23T00:05:00Z",
    })).toBe(false);
  });
});
