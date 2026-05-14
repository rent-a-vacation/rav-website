import { describe, it, expect } from 'vitest';
import { __testing, effectiveRate } from './useCommissionRate';
import { DEFAULT_COMMISSION } from '@/config/commission';

const { rowToCommissionRate } = __testing;

describe('rowToCommissionRate (issue #510) @p0', () => {
  it('returns DEFAULT_COMMISSION when row is null', () => {
    expect(rowToCommissionRate(null)).toEqual({
      base: DEFAULT_COMMISSION.base,
      proDiscount: DEFAULT_COMMISSION.proDiscount,
      businessDiscount: DEFAULT_COMMISSION.businessDiscount,
    });
  });

  it('returns DEFAULT_COMMISSION when row is undefined', () => {
    expect(rowToCommissionRate(undefined)).toEqual({
      base: DEFAULT_COMMISSION.base,
      proDiscount: DEFAULT_COMMISSION.proDiscount,
      businessDiscount: DEFAULT_COMMISSION.businessDiscount,
    });
  });

  it('converts percent fields to decimals', () => {
    expect(rowToCommissionRate({ rate: 12, pro_discount: 2, business_discount: 4 })).toEqual({
      base: 0.12,
      proDiscount: 0.02,
      businessDiscount: 0.04,
    });
  });

  it('falls back per-field when individual fields are missing', () => {
    const result = rowToCommissionRate({ rate: 10 });
    expect(result.base).toBe(0.10);
    expect(result.proDiscount).toBe(DEFAULT_COMMISSION.proDiscount);
    expect(result.businessDiscount).toBe(DEFAULT_COMMISSION.businessDiscount);
  });

  it('treats string values as missing (defends against bad DB writes)', () => {
    const result = rowToCommissionRate({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rate: '12' as any,
      pro_discount: 2,
      business_discount: 4,
    });
    // string rate falls back; others convert
    expect(result.base).toBe(DEFAULT_COMMISSION.base);
    expect(result.proDiscount).toBe(0.02);
    expect(result.businessDiscount).toBe(0.04);
  });

  it('handles a 0 rate (zero-commission promo period)', () => {
    expect(rowToCommissionRate({ rate: 0, pro_discount: 0, business_discount: 0 })).toEqual({
      base: 0,
      proDiscount: 0,
      businessDiscount: 0,
    });
  });
});

describe('effectiveRate (issue #510) @p0', () => {
  const rate = { base: 0.12, proDiscount: 0.02, businessDiscount: 0.04 };

  it('returns base for free tier (default)', () => {
    expect(effectiveRate(rate)).toBe(0.12);
    expect(effectiveRate(rate, 'free')).toBe(0.12);
  });

  it('subtracts pro discount for pro tier', () => {
    expect(effectiveRate(rate, 'pro')).toBeCloseTo(0.10, 10);
  });

  it('subtracts business discount for business tier', () => {
    expect(effectiveRate(rate, 'business')).toBeCloseTo(0.08, 10);
  });

  it('clamps at 0 when discount exceeds base', () => {
    const aggressive = { base: 0.05, proDiscount: 0.10, businessDiscount: 0.20 };
    expect(effectiveRate(aggressive, 'pro')).toBe(0);
    expect(effectiveRate(aggressive, 'business')).toBe(0);
  });
});
