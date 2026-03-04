import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const { mockFrom, mockRemoveChannel } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockRemoveChannel: vi.fn(),
}));

function createChainMock(resolved: { data: unknown; error: unknown; count?: number }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'eq', 'order', 'single', 'neq', 'not'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make it thenable (awaitable) without using Promise.resolve which overrides .then
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolve(resolved));
  return chain;
}

// Mock supabase
vi.mock('@/lib/supabase', () => {
  mockFrom.mockImplementation(() => createChainMock({ data: [], error: null }));

  return {
    supabase: {
      from: mockFrom,
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({ status: 'SUBSCRIBED' }),
      }),
      removeChannel: mockRemoveChannel,
    },
  };
});

// Mock auth context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

// Mock realtime subscription
vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: vi.fn(),
}));

describe('useListingInquiries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches inquiries for a listing', async () => {
    const mockInquiries = [
      { id: 'inq-1', listing_id: 'lst-1', subject: 'About the unit', created_at: '2026-03-01' },
    ];

    mockFrom.mockImplementation(() =>
      createChainMock({ data: mockInquiries, error: null })
    );

    const { useListingInquiries } = await import('./useListingInquiries');
    const { result } = renderHook(() => useListingInquiries('lst-1'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // The query returns data as-is from supabase (ListingInquiry[])
    expect(mockFrom).toHaveBeenCalledWith('listing_inquiries');
    expect(result.current.data).toBeDefined();
  });

  it('does not fetch when listingId is undefined', async () => {
    const { useListingInquiries } = await import('./useListingInquiries');
    const { result } = renderHook(() => useListingInquiries(undefined), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
  });

  it('fetches user inquiries', async () => {
    const mockInquiries = [
      { id: 'inq-2', asker_id: 'user-1', subject: 'Pricing' },
    ];

    mockFrom.mockImplementation(() =>
      createChainMock({ data: mockInquiries, error: null })
    );

    const { useMyInquiries } = await import('./useListingInquiries');
    const { result } = renderHook(() => useMyInquiries(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockInquiries);
  });

  it('creates inquiry with first message and notification', async () => {
    const mockInquiry = { id: 'new-inq', listing_id: 'lst-1' };

    mockFrom.mockImplementation(() =>
      createChainMock({ data: mockInquiry, error: null })
    );

    const { useCreateInquiry } = await import('./useListingInquiries');
    const { result } = renderHook(() => useCreateInquiry(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      listing_id: 'lst-1',
      owner_id: 'owner-1',
      subject: 'About the unit',
      message: 'Is there parking?',
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('listing_inquiries');
    });
  });

  it('sends a reply message', async () => {
    const mockMessage = { id: 'msg-1', inquiry_id: 'inq-1', body: 'Yes, parking is available.' };

    mockFrom.mockImplementation(() =>
      createChainMock({ data: mockMessage, error: null })
    );

    const { useSendInquiryMessage } = await import('./useListingInquiries');
    const { result } = renderHook(() => useSendInquiryMessage(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({ inquiry_id: 'inq-1', body: 'Yes, parking is available.' });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('inquiry_messages');
    });
  });

  it('fetches inquiry count for social proof', async () => {
    mockFrom.mockImplementation(() =>
      createChainMock({ data: null, error: null, count: 5 })
    );

    const { useInquiryCount } = await import('./useListingInquiries');
    const { result } = renderHook(() => useInquiryCount('lst-1'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(5);
  });
});
