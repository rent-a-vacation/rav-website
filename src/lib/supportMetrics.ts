// Pure formatters for the admin Support Interactions tab (#411).
// Kept separate from the component so they can be unit-tested without
// a Testing Library render.

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Number(value).toFixed(1)}%`;
}

/**
 * Format a millisecond duration as a short admin-dashboard string.
 * < 1s  → "842ms"
 * < 60s → "3.4s"
 * ≥ 60s → "2m 14s"
 */
export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null || Number.isNaN(ms)) return "—";
  const total = Math.round(Number(ms));
  if (total < 1000) return `${total}ms`;
  const seconds = total / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds - minutes * 60);
  return `${minutes}m ${remainder}s`;
}

export type RatingValue = 1 | 0 | -1 | null | undefined;

export function formatRating(rating: RatingValue): string {
  if (rating === 1) return "Helpful";
  if (rating === -1) return "Not helpful";
  return "No rating";
}

export type SupportTurnType = "user" | "assistant" | "tool_call" | "tool_result" | "error";

/**
 * Produce a short human-readable label for a transcript row. Used by the
 * detail dialog + transcript search.
 */
export function summarizeTurn(
  turn: { turn_type: SupportTurnType; content?: string | null; tool_name?: string | null },
): string {
  switch (turn.turn_type) {
    case "user":
      return turn.content?.trim() || "(empty user message)";
    case "assistant":
      return turn.content?.trim() || "(empty assistant reply)";
    case "tool_call":
      return `Called ${turn.tool_name ?? "tool"}`;
    case "tool_result":
      return `Result from ${turn.tool_name ?? "tool"}`;
    case "error":
      return turn.content?.trim() || "(error)";
  }
}

/**
 * True if a conversation should count as "in the deflected bucket" for admin
 * filtering. Mirrors the RPC's server-side definition: ended AND not escalated.
 */
export function isDeflected(
  conversation: { ended_at: string | null; escalated_at: string | null },
): boolean {
  return conversation.ended_at !== null && conversation.escalated_at === null;
}
