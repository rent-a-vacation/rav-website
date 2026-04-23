import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { createHookWrapper } from "@/test/helpers/render";

// Mock supabase
const mockGetSession = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
  isSupabaseConfigured: () => true,
}));

// Must import after mock
const { useTextChat } = await import("./useTextChat");

function createMockSSEResponse(
  tokens: string[],
  searchResults?: unknown[],
  classifiedContext?: "support" | "rentals",
) {
  let sseData = "";
  if (classifiedContext) {
    sseData += `event: classified_context\ndata: ${JSON.stringify({ classified: classifiedContext })}\n\n`;
  }
  if (searchResults) {
    sseData += `event: search_results\ndata: ${JSON.stringify(searchResults)}\n\n`;
  }
  for (const token of tokens) {
    sseData += `event: token\ndata: ${JSON.stringify(token)}\n\n`;
  }
  sseData += `event: done\ndata: [DONE]\n\n`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(sseData));
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("useTextChat", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "test-token" } },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with idle status and empty messages", () => {
    const { result } = renderHook(() => useTextChat({ context: "rentals" }), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.messages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("adds user message and processes streaming response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createMockSSEResponse(["Hello", " there", "!"])
    );

    const { result } = renderHook(() => useTextChat({ context: "rentals" }), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.sendMessage("Find me a condo");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    // Should have user message + assistant message
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[0].content).toBe("Find me a condo");
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].content).toBe("Hello there!");
  });

  it("handles SSE with search results", async () => {
    const mockResults = [
      { listing_id: "1", property_name: "Test Property", location: "Orlando, FL", price: 1000 },
    ];

    vi.mocked(fetch).mockResolvedValueOnce(
      createMockSSEResponse(["Found ", "results"], mockResults)
    );

    const { result } = renderHook(() => useTextChat({ context: "rentals" }), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.sendMessage("Find condos in Orlando");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    const assistantMsg = result.current.messages[1];
    expect(assistantMsg.searchResults).toBeDefined();
    expect(assistantMsg.searchResults).toHaveLength(1);
    expect(assistantMsg.content).toBe("Found results");
  });

  it("handles API error response", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Chat service unavailable" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      })
    );

    const { result } = renderHook(() => useTextChat({ context: "rentals" }), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.sendMessage("test");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.error).toBe("Chat service unavailable");
  });

  it("handles missing auth session", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useTextChat({ context: "rentals" }), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.sendMessage("test");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("error");
    });

    expect(result.current.error).toBe("Please sign in to use chat");
  });

  it("ignores empty messages", async () => {
    const { result } = renderHook(() => useTextChat({ context: "rentals" }), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.sendMessage("   ");
    });

    expect(result.current.messages).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("clearHistory resets state", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createMockSSEResponse(["Hi"])
    );

    const { result } = renderHook(() => useTextChat({ context: "rentals" }), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.sendMessage("hello");
    });

    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("sends correct request body with context and history", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createMockSSEResponse(["Response 1"])
    );

    const { result } = renderHook(() => useTextChat({ context: "bidding" }), {
      wrapper: createHookWrapper(),
    });

    await act(async () => {
      result.current.sendMessage("How do I submit an Offer?");
    });

    await waitFor(() => {
      expect(result.current.status).toBe("idle");
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/functions/v1/text-chat"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "How do I submit an Offer?",
          conversationHistory: [],
          context: "bidding",
          disableClassifier: false,
        }),
      })
    );
  });

  describe("route-based auto-detection", () => {
    it("falls back to support context on /my-trips when no prop supplied", () => {
      const { result } = renderHook(() => useTextChat(), {
        wrapper: createHookWrapper({ initialEntries: ["/my-trips"] }),
      });
      expect(result.current.context).toBe("support");
    });

    it("falls back to rentals context on /property/:id", () => {
      const { result } = renderHook(() => useTextChat(), {
        wrapper: createHookWrapper({ initialEntries: ["/property/abc-123"] }),
      });
      expect(result.current.context).toBe("rentals");
    });

    it("explicit context prop always wins over route detection", () => {
      const { result } = renderHook(() => useTextChat({ context: "property-detail" }), {
        wrapper: createHookWrapper({ initialEntries: ["/my-trips"] }),
      });
      expect(result.current.context).toBe("property-detail");
    });
  });

  describe("intent classifier (#407)", () => {
    it("captures classified_context from SSE stream", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        createMockSSEResponse(["ok"], undefined, "support")
      );
      const { result } = renderHook(() => useTextChat({ context: "general" }), {
        wrapper: createHookWrapper(),
      });

      expect(result.current.classifiedContext).toBeNull();

      await act(async () => {
        result.current.sendMessage("Where is my refund?");
      });
      await waitFor(() => {
        expect(result.current.status).toBe("idle");
      });

      expect(result.current.classifiedContext).toBe("support");
    });

    it("starts with no classification and stays null when server doesn't emit", async () => {
      vi.mocked(fetch).mockResolvedValueOnce(createMockSSEResponse(["hi"]));
      const { result } = renderHook(() => useTextChat({ context: "general" }), {
        wrapper: createHookWrapper(),
      });

      await act(async () => {
        result.current.sendMessage("hello");
      });
      await waitFor(() => expect(result.current.status).toBe("idle"));

      expect(result.current.classifiedContext).toBeNull();
    });

    it("dismissClassification clears the chip and sets disableClassifier on next send", async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(createMockSSEResponse(["r1"], undefined, "support"))
        .mockResolvedValueOnce(createMockSSEResponse(["r2"]));

      const { result } = renderHook(() => useTextChat({ context: "general" }), {
        wrapper: createHookWrapper(),
      });

      await act(async () => {
        result.current.sendMessage("where's my refund");
      });
      await waitFor(() => expect(result.current.status).toBe("idle"));
      expect(result.current.classifiedContext).toBe("support");

      act(() => result.current.dismissClassification());
      expect(result.current.classifiedContext).toBeNull();

      await act(async () => {
        result.current.sendMessage("just saying hi");
      });
      await waitFor(() => expect(result.current.status).toBe("idle"));

      const secondCall = vi.mocked(fetch).mock.calls[1];
      const body = JSON.parse((secondCall[1] as RequestInit).body as string);
      expect(body.disableClassifier).toBe(true);
    });
  });
});
