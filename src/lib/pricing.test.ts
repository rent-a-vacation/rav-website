import { describe, it, expect } from 'vitest';
import { calculateNights, computeListingPricing, computeFeeBreakdown, computeOwnerPayoutBreakdown } from './pricing';

describe('calculateNights @p0', () => {
  it('returns correct nights for a standard week', () => {
    expect(calculateNights('2026-03-15', '2026-03-22')).toBe(7);
  });

  it('returns 1 for a single night stay', () => {
    expect(calculateNights('2026-06-01', '2026-06-02')).toBe(1);
  });

  it('returns 0 when check-in equals check-out', () => {
    expect(calculateNights('2026-06-01', '2026-06-01')).toBe(0);
  });

  it('returns 0 when check-out is before check-in', () => {
    expect(calculateNights('2026-06-05', '2026-06-01')).toBe(0);
  });

  it('handles month boundaries correctly', () => {
    expect(calculateNights('2026-01-29', '2026-02-05')).toBe(7);
  });

  it('handles year boundaries correctly', () => {
    expect(calculateNights('2025-12-28', '2026-01-04')).toBe(7);
  });
});

describe('computeListingPricing @p0', () => {
  it('computes correct pricing for $200/night x 7 nights', () => {
    const result = computeListingPricing(200, 7);
    expect(result.ownerPrice).toBe(1400);
    expect(result.ravMarkup).toBe(168); // round(1400 * 0.12) = 168
    expect(result.finalPrice).toBe(1568);
  });

  it('computes correct pricing for $150/night x 3 nights', () => {
    const result = computeListingPricing(150, 3);
    expect(result.ownerPrice).toBe(450);
    expect(result.ravMarkup).toBe(54); // round(450 * 0.12) = 54
    expect(result.finalPrice).toBe(504);
  });

  it('returns zeros for 0 nights', () => {
    const result = computeListingPricing(200, 0);
    expect(result.ownerPrice).toBe(0);
    expect(result.ravMarkup).toBe(0);
    expect(result.finalPrice).toBe(0);
  });

  it('returns zeros for $0/night', () => {
    const result = computeListingPricing(0, 7);
    expect(result.ownerPrice).toBe(0);
    expect(result.ravMarkup).toBe(0);
    expect(result.finalPrice).toBe(0);
  });

  it('rounds to whole dollars', () => {
    const result = computeListingPricing(99, 5);
    expect(result.ownerPrice).toBe(495);
    expect(result.ravMarkup).toBe(59); // round(495 * 0.12) = round(59.4) = 59
    expect(result.finalPrice).toBe(554);
  });
});

describe('computeFeeBreakdown @p0', () => {
  it('computes correct breakdown for $200/night x 7 nights, no cleaning fee', () => {
    const result = computeFeeBreakdown(200, 7);
    expect(result.baseAmount).toBe(1400);
    expect(result.serviceFee).toBe(168); // round(1400 * 0.12)
    expect(result.cleaningFee).toBe(0);
    expect(result.subtotal).toBe(1568); // 1400 + 168 + 0
    expect(result.ownerPayout).toBe(1400); // 1400 + 0
  });

  it('includes cleaning fee in subtotal and owner payout', () => {
    const result = computeFeeBreakdown(200, 7, 150);
    expect(result.baseAmount).toBe(1400);
    expect(result.serviceFee).toBe(168);
    expect(result.cleaningFee).toBe(150);
    expect(result.subtotal).toBe(1718); // 1400 + 168 + 150
    expect(result.ownerPayout).toBe(1550); // 1400 + 150
  });

  it('returns zeros for 0 nights', () => {
    const result = computeFeeBreakdown(200, 0);
    expect(result.baseAmount).toBe(0);
    expect(result.serviceFee).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.ownerPayout).toBe(0);
  });

  it('returns zeros for $0/night', () => {
    const result = computeFeeBreakdown(0, 7);
    expect(result.baseAmount).toBe(0);
    expect(result.serviceFee).toBe(0);
    expect(result.subtotal).toBe(0);
    expect(result.ownerPayout).toBe(0);
  });

  it('handles cleaning fee with zero base', () => {
    const result = computeFeeBreakdown(0, 0, 100);
    expect(result.baseAmount).toBe(0);
    expect(result.serviceFee).toBe(0);
    expect(result.cleaningFee).toBe(100);
    expect(result.subtotal).toBe(100);
    expect(result.ownerPayout).toBe(100);
  });

  it('rounds base amount to whole dollars', () => {
    const result = computeFeeBreakdown(99, 3);
    expect(result.baseAmount).toBe(297);
    expect(result.serviceFee).toBe(36); // round(297 * 0.12) = round(35.64) = 36
    expect(result.subtotal).toBe(333);
  });

  it('service fee is 12% of base (not base + cleaning)', () => {
    const result = computeFeeBreakdown(100, 1, 500);
    expect(result.baseAmount).toBe(100);
    expect(result.serviceFee).toBe(12); // 12% of 100, NOT 12% of 600
    expect(result.subtotal).toBe(612); // 100 + 12 + 500
    expect(result.ownerPayout).toBe(600); // 100 + 500
  });

  it('defaults cleaning fee to 0 when not provided', () => {
    const result = computeFeeBreakdown(100, 1);
    expect(result.cleaningFee).toBe(0);
  });

  it('accepts an explicit commission rate (issue #510)', () => {
    // Pro effective rate = 10%
    const result = computeFeeBreakdown(200, 7, 0, 0.10);
    expect(result.baseAmount).toBe(1400);
    expect(result.serviceFee).toBe(140); // round(1400 * 0.10)
    expect(result.subtotal).toBe(1540);
  });

  it('accepts a 0 commission rate (promo override)', () => {
    const result = computeFeeBreakdown(200, 7, 0, 0);
    expect(result.serviceFee).toBe(0);
    expect(result.subtotal).toBe(1400);
  });
});

describe('computeListingPricing with explicit rate (issue #510)', () => {
  it('uses the passed rate instead of default', () => {
    // Business effective = 8%
    const result = computeListingPricing(200, 7, 0.08);
    expect(result.ownerPrice).toBe(1400);
    expect(result.ravMarkup).toBe(112); // round(1400 * 0.08)
    expect(result.finalPrice).toBe(1512);
  });

  it('defaults to DEFAULT_COMMISSION.base when rate is omitted', () => {
    const withDefault = computeListingPricing(200, 7);
    const explicit = computeListingPricing(200, 7, 0.12);
    expect(withDefault).toEqual(explicit);
  });

  it('handles a 0 rate (zero-commission promo)', () => {
    const result = computeListingPricing(200, 7, 0);
    expect(result.ravMarkup).toBe(0);
    expect(result.finalPrice).toBe(result.ownerPrice);
  });
});

describe('computeOwnerPayoutBreakdown', () => {
  it('calculates standard 15% commission breakdown', () => {
    // $200/night × 5 nights = $1000 base, 15% commission
    const result = computeOwnerPayoutBreakdown(200, 5, 15, 100);
    expect(result.baseAmount).toBe(1000);
    expect(result.cleaningFee).toBe(100);
    expect(result.ownerPayout).toBe(1100); // base + cleaning
    expect(result.ravCommission).toBe(150); // 15% of 1000
    expect(result.guestTotal).toBe(1250); // 1000 + 150 + 100
    expect(result.effectiveCommissionPct).toBe(15);
  });

  it('owner payout is always base + cleaning (Stripe comes from RAV)', () => {
    const result = computeOwnerPayoutBreakdown(200, 5, 15, 100);
    expect(result.ownerPayout).toBe(result.baseAmount + result.cleaningFee);
    expect(result.ravNetRevenue).toBeLessThan(result.ravCommission);
  });

  it('calculates Stripe fee correctly (2.9% + $0.30)', () => {
    const result = computeOwnerPayoutBreakdown(200, 5, 15, 100);
    // Stripe fee on $1250 total: 1250 × 0.029 + 0.30 = 36.25 + 0.30 = 36.55
    expect(result.stripeFee).toBe(36.55);
    expect(result.ravNetRevenue).toBe(113.45); // 150 - 36.55
  });

  it('applies Pro tier discount (13%)', () => {
    const result = computeOwnerPayoutBreakdown(200, 5, 13, 0);
    expect(result.ravCommission).toBe(130); // 13% of 1000
    expect(result.ownerPayout).toBe(1000); // unchanged — owner always gets base
    expect(result.guestTotal).toBe(1130);
    expect(result.effectiveCommissionPct).toBe(13);
  });

  it('applies Business tier discount (10%)', () => {
    const result = computeOwnerPayoutBreakdown(200, 5, 10, 0);
    expect(result.ravCommission).toBe(100);
    expect(result.guestTotal).toBe(1100);
  });

  it('handles zero commission', () => {
    const result = computeOwnerPayoutBreakdown(200, 5, 0, 0);
    expect(result.ravCommission).toBe(0);
    expect(result.ownerPayout).toBe(1000);
    expect(result.guestTotal).toBe(1000);
    expect(result.ravNetRevenue).toBeLessThan(0); // RAV absorbs Stripe fee
  });

  it('handles zero-night edge case', () => {
    const result = computeOwnerPayoutBreakdown(200, 0, 15, 0);
    expect(result.baseAmount).toBe(0);
    expect(result.ravCommission).toBe(0);
    expect(result.ownerPayout).toBe(0);
  });

  it('cleaning fee passes through to owner payout untouched', () => {
    const withCleaning = computeOwnerPayoutBreakdown(100, 1, 15, 500);
    expect(withCleaning.ownerPayout).toBe(600); // 100 + 500
    expect(withCleaning.ravCommission).toBe(15); // 15% of 100 only
  });
});
