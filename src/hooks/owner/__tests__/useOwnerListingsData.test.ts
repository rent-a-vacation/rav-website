import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const mockListingsQuery = vi.fn();
const mockBidsQuery = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'listings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockImplementation(() => mockListingsQuery()),
            }),
          }),
        };
      }
      if (table === 'listing_bids') {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              eq: vi.fn().mockImplementation(() => mockBidsQuery()),
            }),
          }),
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn() }) };
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

const { useOwnerListingsData } = await import('../useOwnerListingsData');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useOwnerListingsData @p0', () => {
  it('transforms listings with bid counts and days calculation', async () => {
    // Set a fixed "today" for deterministic test
    const today = new Date('2026-03-01T12:00:00Z');
    vi.setSystemTime(today);

    mockListingsQuery.mockResolvedValue({
      data: [
        {
          id: 'listing-1',
          check_in_date: '2026-03-15',
          check_out_date: '2026-03-22',
          status: 'active',
          final_price: 1610,
          owner_price: 1400,
          nightly_rate: 200,
          open_for_bidding: true,
          property: { resort_name: 'Hilton Hawaiian Village', location: 'Honolulu, HI' },
        },
        {
          id: 'listing-2',
          check_in_date: '2026-02-15',
          check_out_date: '2026-02-22',
          status: 'completed',
          final_price: 805,
          owner_price: 700,
          nightly_rate: 100,
          open_for_bidding: false,
          property: { resort_name: 'Marriott Ko Olina', location: 'Kapolei, HI' },
        },
      ],
      error: null,
    });

    mockBidsQuery.mockResolvedValue({
      data: [
        { listing_id: 'listing-1', bid_amount: 450, status: 'pending' },
        { listing_id: 'listing-1', bid_amount: 500, status: 'pending' },
        { listing_id: 'listing-1', bid_amount: 400, status: 'pending' },
      ],
      error: null,
    });

    const { result } = renderHook(() => useOwnerListingsData(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const listings = result.current.data!;
    expect(listings).toHaveLength(2);

    // First listing: 14 days until check-in (March 15 - March 1)
    expect(listings[0].resort_name).toBe('Hilton Hawaiian Village');
    expect(listings[0].days_until_checkin).toBe(14);
    expect(listings[0].bid_count).toBe(3);
    expect(listings[0].highest_bid).toBe(500);
    expect(listings[0].nightly_rate).toBe(200);

    // Second listing: in the past (-14 days)
    expect(listings[1].resort_name).toBe('Marriott Ko Olina');
    expect(listings[1].days_until_checkin).toBe(-14);
    expect(listings[1].bid_count).toBe(0);
    expect(listings[1].highest_bid).toBeNull();

    vi.useRealTimers();
  });

  it('handles empty listings', async () => {
    mockListingsQuery.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useOwnerListingsData(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('handles null listings response', async () => {
    mockListingsQuery.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useOwnerListingsData(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('handles listings query error', async () => {
    mockListingsQuery.mockResolvedValue({ data: null, error: { message: 'Query failed' } });

    const { result } = renderHook(() => useOwnerListingsData(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('handles missing property data gracefully', async () => {
    vi.setSystemTime(new Date('2026-03-01T12:00:00Z'));

    mockListingsQuery.mockResolvedValue({
      data: [
        {
          id: 'listing-1',
          check_in_date: '2026-03-10',
          check_out_date: '2026-03-17',
          status: 'active',
          final_price: 500,
          owner_price: 400,
          nightly_rate: null,
          open_for_bidding: null,
          property: null,
        },
      ],
      error: null,
    });

    mockBidsQuery.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useOwnerListingsData(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const listing = result.current.data![0];
    expect(listing.property_name).toBe('Unknown');
    expect(listing.resort_name).toBe('Unknown Resort');
    expect(listing.nightly_rate).toBe(0);
    expect(listing.open_for_bidding).toBe(false);

    vi.useRealTimers();
  });
});
