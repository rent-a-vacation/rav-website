import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const mockRpc = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: vi.fn().mockReturnValue({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: (...eqArgs: unknown[]) => mockEq(...eqArgs) };
      },
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  isSupabaseConfigured: () => true,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'owner-123' },
  }),
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

const { useOwnerDashboardStats, useUpdateMaintenanceFees } = await import('../useOwnerDashboardStats');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useOwnerDashboardStats @p0', () => {
  it('fetches dashboard stats via RPC', async () => {
    const stats = {
      total_earned_ytd: 5000,
      active_listings: 3,
      active_bids: 7,
      annual_maintenance_fees: 2400,
      fees_covered_percent: 80,
    };
    mockRpc.mockResolvedValue({ data: stats, error: null });

    const { result } = renderHook(() => useOwnerDashboardStats(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRpc).toHaveBeenCalledWith('get_owner_dashboard_stats', { p_owner_id: 'owner-123' });
    expect(result.current.data).toEqual(stats);
  });

  it('handles RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { result } = renderHook(() => useOwnerDashboardStats(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateMaintenanceFees', () => {
  it('updates maintenance fees and invalidates cache', async () => {
    mockEq.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useUpdateMaintenanceFees(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate(3600);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        annual_maintenance_fees: 3600,
        maintenance_fee_updated_at: expect.any(String),
      })
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['owner-dashboard-stats'] });
  });

  it('handles update error', async () => {
    mockEq.mockResolvedValue({ error: { message: 'Update failed' } });

    const { result } = renderHook(() => useUpdateMaintenanceFees(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate(2400);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
