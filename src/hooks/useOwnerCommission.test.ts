import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
  isSupabaseConfigured: () => true,
}));

// Mock useAuth to return a user
vi.mock('./useAuth', () => ({
  useAuth: () => ({
    user: { id: 'owner-123', email: 'owner@test.com' },
  }),
}));

// Mock useMembership to return tier data
const mockMembershipData = vi.hoisted(() => ({
  current: { tier: { tier_name: 'Free', commission_discount_pct: 0 } },
}));

vi.mock('./useMembership', () => ({
  useMyMembership: () => ({
    data: mockMembershipData.current,
  }),
}));

const { useOwnerCommission } = await import('./useOwnerCommission');

beforeEach(() => {
  vi.clearAllMocks();
  mockMembershipData.current = { tier: { tier_name: 'Free', commission_discount_pct: 0 } };
});

describe('useOwnerCommission', () => {
  it('returns default 15% rate when RPC returns 15', async () => {
    mockRpc.mockResolvedValue({ data: 15, error: null });

    const { result } = renderHook(() => useOwnerCommission(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.effectiveRate).toBe(15);
    expect(result.current.tierDiscount).toBe(0);
    expect(result.current.tierName).toBe('Free');
  });

  it('returns Pro tier rate with 2% discount', async () => {
    mockRpc.mockResolvedValue({ data: 13, error: null });
    mockMembershipData.current = { tier: { tier_name: 'Pro', commission_discount_pct: 2 } };

    const { result } = renderHook(() => useOwnerCommission(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.effectiveRate).toBe(13);
    expect(result.current.tierDiscount).toBe(2);
    expect(result.current.tierName).toBe('Pro');
  });

  it('returns Business tier rate with 5% discount', async () => {
    mockRpc.mockResolvedValue({ data: 10, error: null });
    mockMembershipData.current = { tier: { tier_name: 'Business', commission_discount_pct: 5 } };

    const { result } = renderHook(() => useOwnerCommission(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.effectiveRate).toBe(10);
    expect(result.current.tierDiscount).toBe(5);
    expect(result.current.tierName).toBe('Business');
  });

  it('falls back to DEFAULT_COMMISSION base on RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { result } = renderHook(() => useOwnerCommission(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    // After DEC-041 the base rate is 12% (was 15%). Drift-bug fix in #510.
    expect(result.current.effectiveRate).toBe(12);
  });

  it('falls back to DEFAULT_COMMISSION base when RPC returns null', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useOwnerCommission(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.effectiveRate).toBe(12);
  });

  it('returns 0 discount when membership has no tier', async () => {
    mockRpc.mockResolvedValue({ data: 15, error: null });
    mockMembershipData.current = { tier: null as unknown as { tier_name: string; commission_discount_pct: number } };

    const { result } = renderHook(() => useOwnerCommission(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tierDiscount).toBe(0);
    expect(result.current.tierName).toBe('Free');
  });
});
