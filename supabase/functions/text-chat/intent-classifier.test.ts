import { describe, it, expect, vi } from "vitest";
import {
  classifyByKeywords,
  classifyByModel,
  classifyIntent,
} from "./intent-classifier";

describe("classifyByKeywords @p0", () => {
  it.each([
    "Where's my refund?",
    "I need to cancel my booking",
    "I want to file a dispute",
    "I was charged twice",
    "My booking number is 123",
    "I can't log into my account",
    "When will my payout arrive?",
  ])("classifies support: %s", (msg) => {
    expect(classifyByKeywords(msg)).toBe("support");
  });

  it.each([
    "Find me a condo in Orlando",
    "Show me beach rentals under $1500",
    "Looking for ski resorts in Aspen",
    "What's available in Maui for spring break?",
    "Browse 2-bedroom stays",
  ])("classifies rentals: %s", (msg) => {
    expect(classifyByKeywords(msg)).toBe("rentals");
  });

  it.each([
    "Hi there",
    "How does this work?",
    "Thanks!",
    "Tell me more",
  ])("returns null for ambiguous: %s", (msg) => {
    expect(classifyByKeywords(msg)).toBeNull();
  });

  it("returns null when both sets match (user is ambiguous)", () => {
    // "cancel" hits support; "find" hits rentals → can't tell
    expect(classifyByKeywords("Find me a condo but I also need to cancel my booking"))
      .toBeNull();
  });

  it("is case-insensitive", () => {
    expect(classifyByKeywords("WHERE'S MY REFUND")).toBe("support");
  });
});

describe("classifyByModel", () => {
  function mockFetch(responseBody: unknown, ok = true) {
    return vi.fn().mockResolvedValue({
      ok,
      json: () => Promise.resolve(responseBody),
    }) as unknown as typeof fetch;
  }

  it("returns support when model says 'support'", async () => {
    const fetchImpl = mockFetch({
      choices: [{ message: { content: "support" } }],
    });

    const result = await classifyByModel("help me with something", "fake-key", {
      fetchImpl,
    });

    expect(result).toBe("support");
  });

  it("returns rentals when model says 'rentals'", async () => {
    const fetchImpl = mockFetch({
      choices: [{ message: { content: "rentals" } }],
    });

    const result = await classifyByModel("I need a place", "fake-key", { fetchImpl });

    expect(result).toBe("rentals");
  });

  it("returns null when model says 'unclear'", async () => {
    const fetchImpl = mockFetch({
      choices: [{ message: { content: "unclear" } }],
    });

    const result = await classifyByModel("hi", "fake-key", { fetchImpl });

    expect(result).toBeNull();
  });

  it("fails closed on HTTP error — returns null, never throws", async () => {
    const fetchImpl = mockFetch({}, false);
    const result = await classifyByModel("test", "fake-key", { fetchImpl });
    expect(result).toBeNull();
  });

  it("fails closed on network error — returns null, never throws", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network down"));
    const result = await classifyByModel("test", "fake-key", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toBeNull();
  });

  it("trims model response whitespace + case", async () => {
    const fetchImpl = mockFetch({
      choices: [{ message: { content: "  SUPPORT \n" } }],
    });
    const result = await classifyByModel("test", "fake-key", { fetchImpl });
    expect(result).toBe("support");
  });

  it("truncates overlong messages before sending", async () => {
    const longMessage = "refund ".repeat(200); // 1400 chars
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "support" } }] }),
    }) as unknown as typeof fetch;

    await classifyByModel(longMessage, "fake-key", { fetchImpl });

    const call = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body as string);
    const userMessage = body.messages[1].content as string;
    expect(userMessage.length).toBeLessThanOrEqual(500);
  });
});

describe("classifyIntent (keyword-first + model fallback)", () => {
  it("short-circuits to keyword classifier on clear signals, no model call", async () => {
    const fetchSpy = vi.fn();
    const result = await classifyIntent("Where's my refund?", "fake-key", {
      fetchImpl: fetchSpy as unknown as typeof fetch,
    });

    expect(result).toBe("support");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("falls through to model when keywords are ambiguous", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content: "rentals" } }] }),
    }) as unknown as typeof fetch;

    const result = await classifyIntent("Thinking about March", "fake-key", { fetchImpl });

    expect(result).toBe("rentals");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("returns null when no OpenRouter key and keywords ambiguous (no swap)", async () => {
    const result = await classifyIntent("Thinking about March", null);
    expect(result).toBeNull();
  });

  it("returns null for empty input", async () => {
    const result = await classifyIntent("   ", "fake-key");
    expect(result).toBeNull();
  });
});
