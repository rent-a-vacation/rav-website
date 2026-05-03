// Pure-logic SLA helpers used by both the AdminDisputes UI (countdown +
// color tier) and the sla-monitor edge function (breach detection).
//
// Math model:
//   - Each dispute has a sla_triage_minutes + sla_resolution_minutes
//     snapshot (migration 072).
//   - For business_hours_only categories, the elapsed clock counts only
//     business-hours minutes (09:00–18:00 ET, M–F, ex-federal-holidays —
//     overridable in business_hours_config).
//   - For on-site categories (safety / owner_no_show / access_issues /
//     property_not_as_described per spec §6), elapsed is wall-clock.

export interface BusinessHoursConfig {
  startHour: number;
  endHour: number;
  timezone: string;
  federalHolidays: string[]; // ISO date strings (YYYY-MM-DD)
  weekendDays: number[]; // 0 = Sunday, 6 = Saturday
}

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  startHour: 9,
  endHour: 18,
  timezone: "America/New_York",
  federalHolidays: [],
  weekendDays: [0, 6],
};

/**
 * Format minutes as a human-friendly countdown string.
 * Negative values are shown as "X overdue".
 */
export function formatSlaCountdown(minutes: number): string {
  const abs = Math.abs(minutes);
  let label: string;
  if (abs < 60) {
    label = `${Math.round(abs)}m`;
  } else if (abs < 60 * 24) {
    const h = Math.floor(abs / 60);
    const m = Math.round(abs % 60);
    label = m === 0 ? `${h}h` : `${h}h ${m}m`;
  } else {
    const d = Math.floor(abs / (60 * 24));
    const h = Math.floor((abs % (60 * 24)) / 60);
    label = h === 0 ? `${d}d` : `${d}d ${h}h`;
  }
  return minutes < 0 ? `${label} overdue` : label;
}

/**
 * Color tier for a remaining-time countdown:
 *   - red    → breached (negative remaining)
 *   - amber  → less than 25% of the original SLA window left
 *   - green  → comfortable
 */
export function slaColorTier(
  remainingMinutes: number,
  totalMinutes: number,
): "red" | "amber" | "green" {
  if (remainingMinutes < 0) return "red";
  const ratio = remainingMinutes / Math.max(totalMinutes, 1);
  if (ratio < 0.25) return "amber";
  return "green";
}

/**
 * Returns true if `date` falls on a weekend or federal holiday per the
 * provided business-hours config.
 */
export function isOffDay(date: Date, config: BusinessHoursConfig): boolean {
  const dayOfWeek = date.getUTCDay();
  if (config.weekendDays.includes(dayOfWeek)) return true;
  const isoDate = date.toISOString().slice(0, 10);
  return config.federalHolidays.includes(isoDate);
}

/**
 * Compute elapsed business-hours minutes between `start` and `end`. Used by
 * sla-monitor for `business_hours_only=true` categories. Naive but correct
 * for our purposes (the slot-by-slot iteration handles weekends + holidays
 * + partial business days at the edges).
 */
export function elapsedBusinessMinutes(
  start: Date,
  end: Date,
  config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS,
): number {
  if (end <= start) return 0;

  let total = 0;
  const cursor = new Date(start);

  while (cursor < end) {
    if (!isOffDay(cursor, config)) {
      const dayStart = new Date(cursor);
      dayStart.setUTCHours(config.startHour, 0, 0, 0);
      const dayEnd = new Date(cursor);
      dayEnd.setUTCHours(config.endHour, 0, 0, 0);

      const slotStart = cursor > dayStart ? cursor : dayStart;
      const slotEnd = end < dayEnd ? end : dayEnd;
      if (slotEnd > slotStart) {
        total += (slotEnd.getTime() - slotStart.getTime()) / 60000;
      }
    }
    // Advance to the next day at 00:00 UTC
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    cursor.setUTCHours(0, 0, 0, 0);
  }

  return Math.floor(total);
}

/**
 * Wall-clock elapsed minutes between two timestamps. Used for on-site
 * categories where SLAs run regardless of business hours.
 */
export function elapsedWallClockMinutes(start: Date, end: Date): number {
  if (end <= start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / 60000);
}

/**
 * For a given dispute snapshot, decide whether the triage SLA has breached
 * given the current time and the elapsed counter.
 */
export function isTriageBreached(args: {
  elapsedMinutes: number;
  slaTriageMinutes: number;
  triageAlertedAt: string | null;
  assignedTo: string | null;
}): boolean {
  if (args.triageAlertedAt) return false; // Already alerted — idempotency
  if (args.assignedTo) return false; // Triaged (assigned) — no breach
  return args.elapsedMinutes >= args.slaTriageMinutes;
}

export function isResolutionBreached(args: {
  elapsedMinutes: number;
  slaResolutionMinutes: number;
  resolutionAlertedAt: string | null;
  status: string;
}): boolean {
  if (args.resolutionAlertedAt) return false;
  // Only breach if the dispute is still active. Resolved/closed states are
  // terminal and should never trigger another alert.
  const isActive = !["resolved_full_refund", "resolved_partial_refund", "resolved_no_refund", "closed"].includes(
    args.status,
  );
  if (!isActive) return false;
  return args.elapsedMinutes >= args.slaResolutionMinutes;
}
