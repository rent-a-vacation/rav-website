import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const mockFrom = vi.fn();
const mockRpc = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: (...args: unknown[]) => mockRpc(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  },
  isSupabaseConfigured: () => true,
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}));

const {
  useBookingMessages,
  useSendBookingMessage,
  useMarkMessagesRead,
  useUnreadMessageCounts,
} = await import('./useBookingMessages');

function createQueryChain(resolved: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ['select', 'insert', 'update', 'eq', 'neq', 'order', 'single', 'in'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make it thenable
  Object.assign(chain, Promise.resolve(resolved));
  chain.then = vi.fn().mockImplementation((resolve) => resolve(resolved));
  return chain;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useBookingMessages', () => {
  it('fetches messages for a booking', async () => {
    const messages = [
      { id: 'msg-1', booking_id: 'b-1', sender_id: 'user-123', body: 'Hello', is_read: false, read_at: null, created_at: '2026-02-28T10:00:00Z', sender: { full_name: 'Test User' } },
      { id: 'msg-2', booking_id: 'b-1', sender_id: 'owner-1', body: 'Hi there', is_read: false, read_at: null, created_at: '2026-02-28T10:01:00Z', sender: { full_name: 'Owner' } },
    ];

    mockFrom.mockReturnValue(createQueryChain({ data: messages, error: null }));

    const { result } = renderHook(() => useBookingMessages('b-1'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].body).toBe('Hello');
    expect(mockFrom).toHaveBeenCalledWith('booking_messages');
  });

  it('does not fetch when bookingId is undefined', () => {
    const { result } = renderHook(() => useBookingMessages(undefined), {
      wrapper: createHookWrapper(),
    });

    expect(result.current.isFetching).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('handles fetch error', async () => {
    mockFrom.mockReturnValue(
      createQueryChain({ data: null, error: { message: 'DB error' } })
    );

    const { result } = renderHook(() => useBookingMessages('b-err'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});

describe('useSendBookingMessage @p0', () => {
  it('inserts a message and returns data', async () => {
    const inserted = { id: 'msg-new', booking_id: 'b-1', sender_id: 'user-123', body: 'Test' };
    mockFrom.mockReturnValue(createQueryChain({ data: inserted, error: null }));

    const { result } = renderHook(() => useSendBookingMessage(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({ booking_id: 'b-1', sender_id: 'user-123', body: 'Test' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(inserted);
    expect(mockFrom).toHaveBeenCalledWith('booking_messages');
  });

  it('handles insert error', async () => {
    mockFrom.mockReturnValue(
      createQueryChain({ data: null, error: { message: 'Insert failed' } })
    );

    const { result } = renderHook(() => useSendBookingMessage(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({ booking_id: 'b-1', sender_id: 'user-123', body: 'Test' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Insert failed');
  });
});

describe('useMarkMessagesRead', () => {
  it('updates unread messages for a booking', async () => {
    mockFrom.mockReturnValue(createQueryChain({ data: null, error: null }));

    const { result } = renderHook(() => useMarkMessagesRead(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate('b-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('booking_messages');
  });

  it('handles update error', async () => {
    mockFrom.mockReturnValue(
      createQueryChain({ data: null, error: { message: 'Update failed' } })
    );

    const { result } = renderHook(() => useMarkMessagesRead(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate('b-err');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUnreadMessageCounts', () => {
  it('fetches unread counts via RPC', async () => {
    const counts = [
      { booking_id: 'b-1', unread_count: 3 },
      { booking_id: 'b-2', unread_count: 1 },
    ];
    mockRpc.mockResolvedValue({ data: counts, error: null });

    const { result } = renderHook(() => useUnreadMessageCounts(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data![0].unread_count).toBe(3);
    expect(mockRpc).toHaveBeenCalledWith('get_unread_message_counts', { p_user_id: 'user-123' });
  });

  it('handles RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const { result } = renderHook(() => useUnreadMessageCounts(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
