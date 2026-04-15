import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: (...args: unknown[]) => {
        mockSelect(...args);
        return {
          eq: (...eqArgs: unknown[]) => {
            mockEq(...eqArgs);
            return {
              order: (...orderArgs: unknown[]) => {
                mockOrder(...orderArgs);
                return {
                  limit: (...limitArgs: unknown[]) => mockLimit(...limitArgs),
                };
              },
            };
          },
        };
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

const { useOwnerBidActivity } = await import('../useOwnerBidActivity');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useOwnerBidActivity', () => {
  it('maps bid data correctly with all status types', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'bid-1',
          listing_id: 'listing-1',
          bid_amount: 500,
          status: 'accepted',
          created_at: '2026-02-20T00:00:00Z',
          listing: { property: { resort_name: 'Hilton Hawaiian Village' } },
          bidder: { full_name: 'Alice Smith' },
        },
        {
          id: 'bid-2',
          listing_id: 'listing-2',
          bid_amount: 300,
          status: 'rejected',
          created_at: '2026-02-19T00:00:00Z',
          listing: { property: { resort_name: 'Marriott Ko Olina' } },
          bidder: { full_name: 'Bob Jones' },
        },
        {
          id: 'bid-3',
          listing_id: 'listing-3',
          bid_amount: 450,
          status: 'counter',
          created_at: '2026-02-18T00:00:00Z',
          listing: { property: { resort_name: 'Disney Aulani' } },
          bidder: { full_name: 'Charlie Brown' },
        },
        {
          id: 'bid-4',
          listing_id: 'listing-4',
          bid_amount: 600,
          status: 'pending',
          created_at: '2026-02-17T00:00:00Z',
          listing: { property: { resort_name: 'Wyndham Bonnet Creek' } },
          bidder: { full_name: 'Diana Prince' },
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useOwnerBidActivity(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const bids = result.current.data!;
    expect(bids).toHaveLength(4);

    // Check status mapping
    expect(bids[0].event_type).toBe('accepted');
    expect(bids[1].event_type).toBe('rejected');
    expect(bids[2].event_type).toBe('counter_offer');
    expect(bids[3].event_type).toBe('new_bid');

    // Check data transformation
    expect(bids[0].property_name).toBe('Hilton Hawaiian Village');
    expect(bids[0].traveler_initial).toBe('A');
    expect(bids[0].amount).toBe(500);

    expect(bids[1].traveler_initial).toBe('B');
    expect(bids[3].traveler_initial).toBe('D');
  });

  it('handles missing property name gracefully', async () => {
    mockLimit.mockResolvedValue({
      data: [
        {
          id: 'bid-1',
          listing_id: 'listing-1',
          bid_amount: 200,
          status: 'pending',
          created_at: '2026-02-20T00:00:00Z',
          listing: { property: null },
          bidder: { full_name: null },
        },
      ],
      error: null,
    });

    const { result } = renderHook(() => useOwnerBidActivity(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data![0].property_name).toBe('Unknown');
    // When bidder has no name/email/id, fallback is the role label "Renter" → initial "R"
    expect(result.current.data![0].traveler_initial).toBe('R');
  });

  it('returns empty array when no bids', async () => {
    mockLimit.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useOwnerBidActivity(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('throws on query error', async () => {
    mockLimit.mockResolvedValue({ data: null, error: { message: 'Query failed' } });

    const { result } = renderHook(() => useOwnerBidActivity(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
