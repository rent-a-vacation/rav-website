import { describe, it, expect } from 'vitest';
import { calculateNights, computeListingPricing, computeFeeBreakdown } from './pricing';

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
    expect(result.ravMarkup).toBe(210);
    expect(result.finalPrice).toBe(1610);
  });

  it('computes correct pricing for $150/night x 3 nights', () => {
    const result = computeListingPricing(150, 3);
    expect(result.ownerPrice).toBe(450);
    expect(result.ravMarkup).toBe(68); // round(450 * 0.15) = round(67.5) = 68
    expect(result.finalPrice).toBe(518);
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
    expect(result.ravMarkup).toBe(74); // round(495 * 0.15) = round(74.25) = 74
    expect(result.finalPrice).toBe(569);
  });
});

describe('computeFeeBreakdown @p0', () => {
  it('computes correct breakdown for $200/night x 7 nights, no cleaning fee', () => {
    const result = computeFeeBreakdown(200, 7);
    expect(result.baseAmount).toBe(1400);
    expect(result.serviceFee).toBe(210); // round(1400 * 0.15)
    expect(result.cleaningFee).toBe(0);
    expect(result.subtotal).toBe(1610); // 1400 + 210 + 0
    expect(result.ownerPayout).toBe(1400); // 1400 + 0
  });

  it('includes cleaning fee in subtotal and owner payout', () => {
    const result = computeFeeBreakdown(200, 7, 150);
    expect(result.baseAmount).toBe(1400);
    expect(result.serviceFee).toBe(210);
    expect(result.cleaningFee).toBe(150);
    expect(result.subtotal).toBe(1760); // 1400 + 210 + 150
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
    expect(result.serviceFee).toBe(45); // round(297 * 0.15) = round(44.55) = 45
    expect(result.subtotal).toBe(342);
  });

  it('service fee is 15% of base (not base + cleaning)', () => {
    const result = computeFeeBreakdown(100, 1, 500);
    expect(result.baseAmount).toBe(100);
    expect(result.serviceFee).toBe(15); // 15% of 100, NOT 15% of 600
    expect(result.subtotal).toBe(615); // 100 + 15 + 500
    expect(result.ownerPayout).toBe(600); // 100 + 500
  });

  it('defaults cleaning fee to 0 when not provided', () => {
    const result = computeFeeBreakdown(100, 1);
    expect(result.cleaningFee).toBe(0);
  });
});
