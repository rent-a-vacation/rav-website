// Support conversation logger — persists RAVIO support turns for audit,
// escalation handoff, and #411 metrics.
//
// Phase 22 D1 (#410) — DEC-036.
//
// Pure-logic module (same shape as support-tools.ts) so it can be tested from
// Node/Vitest without a Deno runtime. All DB writes are best-effort: on any
// error the logger returns quietly and the main chat keeps working. Errors
// are surfaced via the returned result for the caller to log, not thrown.

export type ChatContext = "rentals" | "property-detail" | "bidding" | "support" | "general";
export type TurnType = "user" | "assistant" | "tool_call" | "tool_result" | "error";

type PgResult<T> = { data: T | null; error: { message: string; code?: string } | null };

// Minimal structural interface — same pattern as support-tools.ts.
// The real Supabase client + test mocks both satisfy this.
export interface SupabaseLike {
  from: (table: string) => unknown;
}

export interface OpenConversationArgs {
  userId: string;
  routeContext: ChatContext;
  classifiedContextDetected: ChatContext | null;
  classifierContextUsed: ChatContext;
  classifierDismissed: boolean;
}

export interface AppendTurnArgs {
  conversationId: string;
  turnIndex: number;
  turnType: TurnType;
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResultJson?: Record<string, unknown>;
  model?: string;
  tokensUsed?: number;
}

export interface LogResult<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Look up the next monotonic turn_index for a conversation so appends stay in
 * order across edge-fn invocations. Returns 0 if no turns exist yet.
 */
export async function getNextTurnIndex(
  supabase: SupabaseLike,
  conversationId: string,
): Promise<number> {
  try {
    const result = await (supabase.from("support_messages") as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          order: (col: string, opts: { ascending: boolean }) => {
            limit: (n: number) => {
              maybeSingle: () => Promise<PgResult<{ turn_index: number }>>;
            };
          };
        };
      };
    })
      .select("turn_index")
      .eq("conversation_id", conversationId)
      .order("turn_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error || !result.data) return 0;
    return result.data.turn_index + 1;
  } catch {
    return 0;
  }
}

/**
 * Create a new support_conversations row and return its id.
 * Best-effort: returns ok:false on error; caller should log and continue.
 */
export async function openConversation(
  supabase: SupabaseLike,
  args: OpenConversationArgs,
): Promise<LogResult<{ id: string }>> {
  try {
    const result = await (supabase.from("support_conversations") as {
      insert: (row: Record<string, unknown>) => {
        select: (cols: string) => {
          single: () => Promise<PgResult<{ id: string }>>;
        };
      };
    })
      .insert({
        user_id: args.userId,
        route_context: args.routeContext,
        classifier_context_detected: args.classifiedContextDetected,
        classifier_context_used: args.classifierContextUsed,
        classifier_dismissed: args.classifierDismissed,
      })
      .select("id")
      .single();

    if (result.error || !result.data) {
      return { ok: false, error: result.error?.message ?? "insert returned no row" };
    }
    return { ok: true, data: result.data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Append a single turn to an existing conversation. Best-effort.
 */
export async function appendTurn(
  supabase: SupabaseLike,
  args: AppendTurnArgs,
): Promise<LogResult> {
  try {
    const row: Record<string, unknown> = {
      conversation_id: args.conversationId,
      turn_index: args.turnIndex,
      turn_type: args.turnType,
    };
    if (args.content !== undefined) row.content = args.content;
    if (args.toolName !== undefined) row.tool_name = args.toolName;
    if (args.toolArgs !== undefined) row.tool_args = args.toolArgs;
    if (args.toolResultJson !== undefined) row.tool_result_json = args.toolResultJson;
    if (args.model !== undefined) row.model = args.model;
    if (args.tokensUsed !== undefined) row.tokens_used = args.tokensUsed;

    const result = await (supabase.from("support_messages") as {
      insert: (row: Record<string, unknown>) => Promise<PgResult<unknown>>;
    }).insert(row);

    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Increment the conversation's turn counters + last_turn_at timestamp. Called
 * after each append to keep listing queries fast (avoids scanning messages).
 */
export async function bumpConversationCounters(
  supabase: SupabaseLike,
  conversationId: string,
  delta: {
    user_message_count?: number;
    assistant_message_count?: number;
    tool_call_count?: number;
  },
): Promise<LogResult> {
  // PostgREST doesn't support column += N directly; use RPC in future if this
  // becomes hot. For now, issue a plain update — we're on a single active row
  // so there's no contention risk at expected volumes.
  try {
    // Read-modify-write is acceptable here: at most one turn-append per request
    // inside a single edge-fn invocation; no parallel invocations write to the
    // same conversation.
    const read = await (supabase.from("support_conversations") as {
      select: (cols: string) => {
        eq: (col: string, val: string) => {
          single: () => Promise<PgResult<{
            user_message_count: number;
            assistant_message_count: number;
            tool_call_count: number;
          }>>;
        };
      };
    })
      .select("user_message_count, assistant_message_count, tool_call_count")
      .eq("id", conversationId)
      .single();

    if (read.error || !read.data) {
      return { ok: false, error: read.error?.message ?? "no row" };
    }

    const updated = {
      user_message_count: read.data.user_message_count + (delta.user_message_count ?? 0),
      assistant_message_count: read.data.assistant_message_count + (delta.assistant_message_count ?? 0),
      tool_call_count: read.data.tool_call_count + (delta.tool_call_count ?? 0),
      last_turn_at: new Date().toISOString(),
    };

    const write = await (supabase.from("support_conversations") as {
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<PgResult<unknown>>;
      };
    })
      .update(updated)
      .eq("id", conversationId);

    if (write.error) return { ok: false, error: write.error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Stamp escalation metadata when the agent's open_dispute tool succeeds.
 */
export async function markEscalated(
  supabase: SupabaseLike,
  conversationId: string,
  disputeId: string,
): Promise<LogResult> {
  try {
    const result = await (supabase.from("support_conversations") as {
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<PgResult<unknown>>;
      };
    })
      .update({
        escalated_to_dispute_id: disputeId,
        escalated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Close a conversation — stamps ended_at. Called when history is cleared or
 * the user navigates away.
 */
export async function closeConversation(
  supabase: SupabaseLike,
  conversationId: string,
): Promise<LogResult> {
  try {
    const result = await (supabase.from("support_conversations") as {
      update: (row: Record<string, unknown>) => {
        eq: (col: string, val: string) => Promise<PgResult<unknown>>;
      };
    })
      .update({ ended_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (result.error) return { ok: false, error: result.error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
