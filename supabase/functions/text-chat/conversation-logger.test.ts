import { describe, it, expect, vi } from "vitest";
import { createSupabaseMock } from "../../../src/test/helpers/supabase-mock";
import {
  openConversation,
  appendTurn,
  bumpConversationCounters,
  markEscalated,
  closeConversation,
} from "./conversation-logger";

describe("openConversation", () => {
  it("inserts a new row and returns the id", async () => {
    const supa = createSupabaseMock({
      support_conversations: { data: { id: "conv-1" }, error: null },
    });

    const result = await openConversation(supa, {
      userId: "u1",
      routeContext: "general",
      classifiedContextDetected: "support",
      classifierContextUsed: "support",
      classifierDismissed: false,
    });

    expect(result.ok).toBe(true);
    expect(result.data?.id).toBe("conv-1");
  });

  it("fails closed on DB error (no throw, returns ok:false)", async () => {
    const supa = createSupabaseMock({
      support_conversations: { data: null, error: { message: "unique violation" } },
    });

    const result = await openConversation(supa, {
      userId: "u1",
      routeContext: "general",
      classifiedContextDetected: null,
      classifierContextUsed: "general",
      classifierDismissed: false,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/unique violation/);
  });

  it("fails closed on thrown error", async () => {
    const supa = {
      from: () => {
        throw new Error("connection refused");
      },
    };

    const result = await openConversation(supa, {
      userId: "u1",
      routeContext: "general",
      classifiedContextDetected: null,
      classifierContextUsed: "general",
      classifierDismissed: false,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/connection refused/);
  });
});

describe("appendTurn", () => {
  it("inserts a user turn with content only", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    const supa = { from: () => ({ insert: insertSpy }) };

    const result = await appendTurn(supa, {
      conversationId: "conv-1",
      turnIndex: 0,
      turnType: "user",
      content: "Where's my refund?",
    });

    expect(result.ok).toBe(true);
    const payload = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.turn_type).toBe("user");
    expect(payload.content).toBe("Where's my refund?");
    expect(payload.tool_name).toBeUndefined();
  });

  it("inserts a tool_call turn with tool_name + tool_args", async () => {
    const insertSpy = vi.fn().mockResolvedValue({ data: null, error: null });
    const supa = { from: () => ({ insert: insertSpy }) };

    await appendTurn(supa, {
      conversationId: "conv-1",
      turnIndex: 2,
      turnType: "tool_call",
      toolName: "lookup_booking",
      toolArgs: { booking_id: "bk-1" },
    });

    const payload = insertSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.turn_type).toBe("tool_call");
    expect(payload.tool_name).toBe("lookup_booking");
    expect(payload.tool_args).toEqual({ booking_id: "bk-1" });
  });

  it("fails closed on DB error", async () => {
    const supa = createSupabaseMock({
      support_messages: { data: null, error: { message: "fk violation" } },
    });

    const result = await appendTurn(supa, {
      conversationId: "conv-1",
      turnIndex: 0,
      turnType: "user",
      content: "hi",
    });

    expect(result.ok).toBe(false);
  });
});

describe("bumpConversationCounters", () => {
  it("reads current counters, writes updated values", async () => {
    const selectChain = {
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: {
                user_message_count: 2,
                assistant_message_count: 2,
                tool_call_count: 1,
              },
              error: null,
            }),
        }),
      }),
    };
    const updateSpy = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    });
    const supa = {
      from: vi
        .fn()
        .mockReturnValueOnce(selectChain) // read
        .mockReturnValueOnce({ update: updateSpy }), // write
    };

    const result = await bumpConversationCounters(supa, "conv-1", {
      user_message_count: 1,
      tool_call_count: 2,
    });

    expect(result.ok).toBe(true);
    const writePayload = updateSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(writePayload.user_message_count).toBe(3);
    expect(writePayload.tool_call_count).toBe(3);
    expect(writePayload.assistant_message_count).toBe(2); // unchanged
    expect(writePayload.last_turn_at).toBeTruthy();
  });
});

describe("markEscalated", () => {
  it("stamps escalated_to_dispute_id + escalated_at", async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    });
    const supa = { from: () => ({ update: updateSpy }) };

    const result = await markEscalated(supa, "conv-1", "dp-1");

    expect(result.ok).toBe(true);
    const payload = updateSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.escalated_to_dispute_id).toBe("dp-1");
    expect(payload.escalated_at).toBeTruthy();
  });
});

describe("closeConversation", () => {
  it("stamps ended_at", async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: null }),
    });
    const supa = { from: () => ({ update: updateSpy }) };

    const result = await closeConversation(supa, "conv-1");

    expect(result.ok).toBe(true);
    const payload = updateSpy.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.ended_at).toBeTruthy();
  });

  it("returns ok:false on DB error (logger never throws)", async () => {
    const updateSpy = vi.fn().mockReturnValue({
      eq: () => Promise.resolve({ data: null, error: { message: "locked" } }),
    });
    const supa = { from: () => ({ update: updateSpy }) };

    const result = await closeConversation(supa, "conv-1");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/locked/);
  });
});
