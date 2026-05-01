import { format } from "date-fns";

export function formatSafeDate(
  dateValue: string | Date | null | undefined,
  formatStr: string,
  fallback = "Date not available"
): string {
  if (!dateValue) return fallback;
  const d = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  if (isNaN(d.getTime())) return fallback;
  return format(d, formatStr);
}
