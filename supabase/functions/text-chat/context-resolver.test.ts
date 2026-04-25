// Tests for resolveEffectiveContext (issue #371).
// Covers the matrix: route context × first-message × disableClassifier ×
// classifier verdict.

import { describe, it, expect, vi } from "vitest";
import { resolveEffectiveContext } from "./context-resolver";

describe("resolveEffectiveContext @p0", () => {
  it("returns the route context unchanged when not 'general'", async () => {
    const classify = vi.fn();
    const result = await resolveEffectiveContext({
      routeContext: "rentals",
      isFirstMessage: true,
      disableClassifier: false,
      message: "find me a condo",
      classify,
    });
    expect(result.effectiveContext).toBe("rentals");
    expect(result.classifiedContext).toBeNull();
    expect(classify).not.toHaveBeenCalled();
  });

  it("does NOT classify on follow-up messages even in general context", async () => {
    const classify = vi.fn();
    const result = await resolveEffectiveContext({
      routeContext: "general",
      isFirstMessage: false,
      disableClassifier: false,
      message: "and what about Hawaii?",
      classify,
    });
    expect(result.effectiveContext).toBe("general");
    expect(classify).not.toHaveBeenCalled();
  });

  it("does NOT classify when frontend has dismissed classification", async () => {
    const classify = vi.fn();
    const result = await resolveEffectiveContext({
      routeContext: "general",
      isFirstMessage: true,
      disableClassifier: true,
      message: "where's my refund",
      classify,
    });
    expect(result.effectiveContext).toBe("general");
    expect(classify).not.toHaveBeenCalled();
  });

  it("classifies on first general message and swaps to support when classifier says so", async () => {
    const classify = vi.fn().mockResolvedValue("support");
    const result = await resolveEffectiveContext({
      routeContext: "general",
      isFirstMessage: true,
      disableClassifier: false,
      message: "where is my refund",
      classify,
    });
    expect(result.effectiveContext).toBe("support");
    expect(result.classifiedContext).toBe("support");
    expect(result.classifierSwapped).toBe(true);
    expect(classify).toHaveBeenCalledWith("where is my refund");
  });

  it("falls back to general when classifier returns null", async () => {
    const classify = vi.fn().mockResolvedValue(null);
    const result = await resolveEffectiveContext({
      routeContext: "general",
      isFirstMessage: true,
      disableClassifier: false,
      message: "say hi",
      classify,
    });
    expect(result.effectiveContext).toBe("general");
    expect(result.classifierSwapped).toBe(false);
  });

  it("classifierSwapped=false when classifier returns the same value as routeContext", async () => {
    // (Not currently reachable in production since classifier doesn't return
    // 'general', but the contract should still hold.)
    const classify = vi.fn().mockResolvedValue("general" as never);
    const result = await resolveEffectiveContext({
      routeContext: "general",
      isFirstMessage: true,
      disableClassifier: false,
      message: "hi",
      classify,
    });
    expect(result.classifierSwapped).toBe(false);
  });
});
