import { format, formatDistanceToNow, isValid } from "date-fns";

/**
 * Safely format a date-like input. If the value is null/undefined, empty,
 * or fails to parse into a valid Date, returns the provided fallback
 * (default: `"—"`) instead of throwing.
 *
 * Use this anywhere a database column may be null or a relation may be
 * missing (e.g., a bid whose parent listing has no dates set yet, a
 * proposal with an unset `valid_until`).
 */
export function formatDateSafe(
  value: string | Date | null | undefined,
  pattern: string,
  fallback = "—",
): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (!isValid(date)) return fallback;
  return format(date, pattern);
}

/**
 * Safely format a relative time (e.g. "3 hours ago"). Same guarantees as
 * `formatDateSafe` — returns `fallback` instead of throwing "Invalid time
 * value" when the input is null, undefined, empty, or unparseable.
 */
export function formatDistanceToNowSafe(
  value: string | Date | null | undefined,
  options?: Parameters<typeof formatDistanceToNow>[1],
  fallback = "—",
): string {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (!isValid(date)) return fallback;
  return formatDistanceToNow(date, options);
}
