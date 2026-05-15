/**
 * Shared pricing utilities for Rent-A-Vacation.
 *
 * calculateNights — replaces the duplicated helper in Rentals, PropertyDetail,
 * Checkout, and FeaturedResorts.
 *
 * computeListingPricing — derives owner_price, rav_markup, and final_price
 * from a nightly rate and number of nights.
 *
 * Issue #510: the commission rate now lives in src/config/commission.ts.
 * RAV_MARKUP_RATE is re-exported for backwards compatibility with existing
 * consumers, but new code should import DEFAULT_COMMISSION from
 * @/config/commission. Future work: read from system_settings at runtime.
 */

import { DEFAULT_COMMISSION } from '@/config/commission';

export const RAV_MARKUP_RATE = DEFAULT_COMMISSION.base; // sourced from central config (issue #510)
const STRIPE_RATE = 0.029; // 2.9%
const STRIPE_FIXED = 0.30; // $0.30 per transaction

/**
 * Calculate the number of nights between check-in and check-out dates.
 * Returns at least 0.
 */
export function calculateNights(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 0);
}

export interface ListingPricing {
  ownerPrice: number;
  ravMarkup: number;
  finalPrice: number;
}

/**
 * Compute the full pricing breakdown from a nightly rate and number of nights.
 *
 * ownerPrice  = nightlyRate * nights
 * ravMarkup   = round(ownerPrice * rate)
 * finalPrice  = ownerPrice + ravMarkup
 *
 * `rate` is the commission rate as a decimal (0.12 = 12%). Defaults to
 * the central `DEFAULT_COMMISSION.base`. Callers that have access to the
 * live rate via `useCommissionRate()` should pass it explicitly so admin
 * rate changes are reflected without a deploy.
 */
export function computeListingPricing(
  nightlyRate: number,
  nights: number,
  rate: number = DEFAULT_COMMISSION.base,
): ListingPricing {
  const ownerPrice = Math.round(nightlyRate * nights);
  const ravMarkup = Math.round(ownerPrice * rate);
  const finalPrice = ownerPrice + ravMarkup;
  return { ownerPrice, ravMarkup, finalPrice };
}

export interface FeeBreakdown {
  baseAmount: number;
  serviceFee: number;
  cleaningFee: number;
  subtotal: number;
  ownerPayout: number;
}

/**
 * Compute itemized fee breakdown for display.
 * baseAmount   = nightlyRate * nights
 * serviceFee   = round(baseAmount * rate)
 * subtotal     = baseAmount + serviceFee + cleaningFee
 * ownerPayout  = baseAmount + cleaningFee
 *
 * `rate` defaults to `DEFAULT_COMMISSION.base`. Pass the live rate from
 * `useCommissionRate()` (or, in edge functions, `getCommissionRate`) to
 * reflect admin updates without a deploy.
 */
export function computeFeeBreakdown(
  nightlyRate: number,
  nights: number,
  cleaningFee = 0,
  rate: number = DEFAULT_COMMISSION.base,
): FeeBreakdown {
  const baseAmount = Math.round(nightlyRate * nights);
  const serviceFee = Math.round(baseAmount * rate);
  const subtotal = baseAmount + serviceFee + cleaningFee;
  const ownerPayout = baseAmount + cleaningFee;
  return { baseAmount, serviceFee, cleaningFee, subtotal, ownerPayout };
}

export interface OwnerPayoutBreakdown {
  baseAmount: number;
  cleaningFee: number;
  ownerPayout: number;
  ravCommission: number;
  stripeFee: number;
  ravNetRevenue: number;
  guestTotal: number;
  effectiveCommissionPct: number;
}

/**
 * Compute detailed owner payout breakdown with tier-aware commission and Stripe fees.
 *
 * Key insight for owners: Stripe fees come out of RAV's commission, NOT the owner's payout.
 * Owner always receives baseAmount + cleaningFee.
 */
export function computeOwnerPayoutBreakdown(
  nightlyRate: number,
  nights: number,
  commissionPct: number,
  cleaningFee = 0
): OwnerPayoutBreakdown {
  const baseAmount = Math.round(nightlyRate * nights);
  const ravCommission = Math.round(baseAmount * (commissionPct / 100));
  const ownerPayout = baseAmount + cleaningFee;
  const guestTotal = baseAmount + ravCommission + cleaningFee;
  const stripeFee = Math.round((guestTotal * STRIPE_RATE + STRIPE_FIXED) * 100) / 100;
  const ravNetRevenue = Math.round((ravCommission - stripeFee) * 100) / 100;

  return {
    baseAmount,
    cleaningFee,
    ownerPayout,
    ravCommission,
    stripeFee,
    ravNetRevenue,
    guestTotal,
    effectiveCommissionPct: commissionPct,
  };
}
