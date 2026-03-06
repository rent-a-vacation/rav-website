/**
 * Dynamic pricing utilities for Rent-A-Vacation.
 *
 * Provides urgency-based discounts, seasonal multipliers, and demand-aware
 * price suggestions to help owners optimise nightly rates.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SeasonalDataPoint {
  month: number; // 1-12
  avgNightlyRate: number;
  bookingCount: number;
}

export interface DemandSignals {
  pendingBidCount: number;
  savedSearchCount: number;
}

export interface DynamicPricingFactors {
  urgencyPct: number; // negative = discount (e.g. -10 means 10% off)
  seasonalPct: number; // relative to annual average (e.g. +12 means 12% above avg)
  demandPct: number; // positive = demand premium
}

export interface DynamicPriceSuggestion {
  suggestedRate: number;
  factors: DynamicPricingFactors;
  confidence: "high" | "medium" | "low";
  baseMarketRate: number;
}

// ---------------------------------------------------------------------------
// Urgency discount
// ---------------------------------------------------------------------------

/**
 * Calculate urgency discount based on days until check-in.
 *
 * Graduated scale:
 *   60+ days  →  0%
 *   30-59     → -5%
 *   14-29     → -10%
 *   7-13      → -12%
 *   0-6       → -15%
 *
 * Returns a negative number (discount percentage).
 */
export function calculateUrgencyDiscount(daysUntilCheckIn: number): number {
  if (daysUntilCheckIn < 0) return 0; // past check-in, no discount
  if (daysUntilCheckIn >= 60) return 0;
  if (daysUntilCheckIn >= 30) return -5;
  if (daysUntilCheckIn >= 14) return -10;
  if (daysUntilCheckIn >= 7) return -12;
  return -15;
}

// ---------------------------------------------------------------------------
// Seasonality
// ---------------------------------------------------------------------------

/**
 * Calculate seasonal price adjustment relative to the annual average.
 *
 * Returns a percentage delta: +12 means the target month is 12% above annual
 * average, -8 means 8% below.  Returns 0 when data is insufficient.
 */
export function calculateSeasonalFactor(
  checkInMonth: number,
  seasonalData: SeasonalDataPoint[]
): number {
  if (seasonalData.length === 0) return 0;

  // Only use months with at least one booking
  const withBookings = seasonalData.filter((d) => d.bookingCount > 0);
  if (withBookings.length < 2) return 0; // not enough months to compare

  // Weighted average (by booking count) across all months
  const totalWeight = withBookings.reduce((s, d) => s + d.bookingCount, 0);
  const weightedAvg =
    withBookings.reduce((s, d) => s + d.avgNightlyRate * d.bookingCount, 0) / totalWeight;

  if (weightedAvg <= 0) return 0;

  // Find target month
  const target = withBookings.find((d) => d.month === checkInMonth);
  if (!target) return 0;

  return Math.round(((target.avgNightlyRate - weightedAvg) / weightedAvg) * 100);
}

// ---------------------------------------------------------------------------
// Demand adjustment
// ---------------------------------------------------------------------------

/**
 * Calculate demand-based price adjustment.
 *
 * More pending bids / saved searches = higher demand → raise price.
 *   0 bids, 0 searches → 0%
 *   1-2 bids OR 3+ searches → +3%
 *   3-4 bids → +5%
 *   5+ bids → +8%
 */
export function calculateDemandAdjustment(signals: DemandSignals): number {
  const { pendingBidCount, savedSearchCount } = signals;
  if (pendingBidCount >= 5) return 8;
  if (pendingBidCount >= 3) return 5;
  if (pendingBidCount >= 1 || savedSearchCount >= 3) return 3;
  return 0;
}

// ---------------------------------------------------------------------------
// Days until check-in helper
// ---------------------------------------------------------------------------

/**
 * Calculate the number of days from today to check-in date.
 * Negative means check-in is in the past.
 */
export function daysUntilDate(checkInDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(checkInDate + "T00:00:00");
  return Math.round((checkIn.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Composite suggestion
// ---------------------------------------------------------------------------

/**
 * Combine all pricing factors into a single suggested nightly rate.
 *
 * @param baseMarketRate - average market rate from comparables
 * @param checkInDate    - ISO date string (YYYY-MM-DD)
 * @param seasonalData   - monthly averages from historical data
 * @param demandSignals  - pending bids + saved searches for comparable listings
 * @param comparableCount - number of comparable data points used
 */
export function suggestDynamicPrice(
  baseMarketRate: number,
  checkInDate: string,
  seasonalData: SeasonalDataPoint[],
  demandSignals: DemandSignals,
  comparableCount: number
): DynamicPriceSuggestion {
  const days = daysUntilDate(checkInDate);
  const checkInMonth = new Date(checkInDate + "T00:00:00").getMonth() + 1;

  const urgencyPct = calculateUrgencyDiscount(days);
  const seasonalPct = calculateSeasonalFactor(checkInMonth, seasonalData);
  const demandPct = calculateDemandAdjustment(demandSignals);

  // Apply factors multiplicatively
  const multiplier = (1 + urgencyPct / 100) * (1 + seasonalPct / 100) * (1 + demandPct / 100);
  const suggestedRate = Math.round(baseMarketRate * multiplier);

  // Confidence based on data quality
  let confidence: "high" | "medium" | "low";
  if (comparableCount >= 10 && seasonalData.filter((d) => d.bookingCount > 0).length >= 4) {
    confidence = "high";
  } else if (comparableCount >= 3) {
    confidence = "medium";
  } else {
    confidence = "low";
  }

  return {
    suggestedRate: Math.max(suggestedRate, 1), // never suggest $0
    factors: { urgencyPct, seasonalPct, demandPct },
    confidence,
    baseMarketRate,
  };
}
