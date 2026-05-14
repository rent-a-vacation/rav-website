import { describe, it, expect, vi } from 'vitest';
import { getCommissionRate, effectiveRate, DEFAULT_COMMISSION } from '../commission';

function mockSupabase(rpcReturn: { data: unknown; error: unknown }) {
  return {
    rpc: vi.fn(async () => rpcReturn),
  };
}

describe('getCommissionRate (issue #510) @p0', () => {
  it('returns DEFAULT_COMMISSION when RPC errors', async () => {
    const supabase = mockSupabase({ data: null, error: { message: 'boom' } });
    const result = await getCommissionRate(supabase);
    expect(result).toEqual({ ...DEFAULT_COMMISSION });
    expect(supabase.rpc).toHaveBeenCalledWith('get_platform_commission_rate');
  });

  it('returns DEFAULT_COMMISSION when RPC returns null', async () => {
    const supabase = mockSupabase({ data: null, error: null });
    expect(await getCommissionRate(supabase)).toEqual({ ...DEFAULT_COMMISSION });
  });

  it('converts JSONB row (percents) to decimal rates', async () => {
    const supabase = mockSupabase({
      data: { rate: 12, pro_discount: 2, business_discount: 4 },
      error: null,
    });
    expect(await getCommissionRate(supabase)).toEqual({
      base: 0.12,
      proDiscount: 0.02,
      businessDiscount: 0.04,
    });
  });

  it('falls back per-field when row has missing fields', async () => {
    const supabase = mockSupabase({ data: { rate: 10 }, error: null });
    const result = await getCommissionRate(supabase);
    expect(result.base).toBe(0.10);
    expect(result.proDiscount).toBe(DEFAULT_COMMISSION.proDiscount);
    expect(result.businessDiscount).toBe(DEFAULT_COMMISSION.businessDiscount);
  });

  it('handles RPC throwing', async () => {
    const supabase = {
      rpc: vi.fn(async () => {
        throw new Error('network down');
      }),
    };
    expect(await getCommissionRate(supabase)).toEqual({ ...DEFAULT_COMMISSION });
  });
});

describe('effectiveRate (edge) @p0', () => {
  const rate = { base: 0.12, proDiscount: 0.02, businessDiscount: 0.04 };

  it('returns base for free tier (default)', () => {
    expect(effectiveRate(rate)).toBe(0.12);
  });

  it('subtracts pro discount', () => {
    expect(effectiveRate(rate, 'pro')).toBeCloseTo(0.10, 10);
  });

  it('subtracts business discount', () => {
    expect(effectiveRate(rate, 'business')).toBeCloseTo(0.08, 10);
  });

  it('clamps at 0 when discount exceeds base', () => {
    const aggressive = { base: 0.05, proDiscount: 0.10, businessDiscount: 0.20 };
    expect(effectiveRate(aggressive, 'pro')).toBe(0);
  });
});
