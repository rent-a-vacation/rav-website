/**
 * Central commission rate config — single source of truth.
 *
 * Issue #510: the commission rate used to be hardcoded in multiple places
 * (src/lib/pricing.ts, scripts/financial-model/data.ts, multiple docs).
 * Now it lives here, and every consumer imports from this file.
 *
 * To change the commission rate going forward, edit DEFAULT_COMMISSION below
 * and re-run the build. Live runtime should eventually read from
 * `system_settings.platform_commission_rate` (DB) — that's a follow-up to
 * this issue.
 *
 * The financial model uses these values as the DEFAULT for INPUTS Section A.
 * Users can still override in the .xlsx amber input cells without changing
 * code — those edits stay local to their saved scenarios.
 */

export const DEFAULT_COMMISSION = {
  /**
   * Base commission rate charged on the booking subtotal.
   * RAV keeps this % of every booking; the rest is owner payout.
   * 0.15 = 15%.
   */
  base: 0.15,

  /**
   * Discount applied to the base rate for Owner Pro tier subscribers.
   * Effective rate = base - proDiscount.
   * 0.02 = 2 percentage points off (e.g., 15% base → 13% effective).
   */
  proDiscount: 0.02,

  /**
   * Discount applied to the base rate for Owner Business tier subscribers.
   * Effective rate = base - businessDiscount.
   * 0.05 = 5 percentage points off (e.g., 15% base → 10% effective).
   */
  businessDiscount: 0.05,
} as const;

/**
 * Effective commission rate for each owner tier, derived from the defaults.
 * Useful for displays that show "your tier's rate is X%".
 */
export const EFFECTIVE_RATES = {
  free: DEFAULT_COMMISSION.base,
  pro: DEFAULT_COMMISSION.base - DEFAULT_COMMISSION.proDiscount,
  business: DEFAULT_COMMISSION.base - DEFAULT_COMMISSION.businessDiscount,
} as const;

/**
 * Format a rate as a percentage string for display.
 *   formatRate(0.15) -> "15%"
 *   formatRate(0.125) -> "12.5%"
 */
export function formatRate(rate: number): string {
  const pct = rate * 100;
  return Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
}
