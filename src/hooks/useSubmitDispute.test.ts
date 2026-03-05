import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const mockInsert = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      insert: vi.fn().mockImplementation((data: unknown) => {
        mockInsert(data);
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'dispute-1', ...data as object },
              error: null,
            }),
          }),
        };
      }),
    })),
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

const { useSubmitDispute } = await import('./useSubmitDispute');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useSubmitDispute @p0', () => {
  it('submits a dispute with correct params', async () => {
    const { result } = renderHook(() => useSubmitDispute(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      bookingId: 'booking-1',
      category: 'cleanliness',
      description: 'Room was not clean',
      reportedUserId: 'owner-1',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInsert).toHaveBeenCalledWith({
      booking_id: 'booking-1',
      reporter_id: 'user-123',
      reported_user_id: 'owner-1',
      category: 'cleanliness',
      description: 'Room was not clean',
      evidence_urls: null,
    });
  });

  it('submits without reported user', async () => {
    const { result } = renderHook(() => useSubmitDispute(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      bookingId: 'booking-2',
      category: 'payment_dispute',
      description: 'Payment was double-charged',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        reported_user_id: null,
        category: 'payment_dispute',
      })
    );
  });

  it('handles insert error', async () => {
    vi.mocked(await import('@/lib/supabase')).supabase.from = vi.fn().mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' },
          }),
        }),
      }),
    }) as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useSubmitDispute(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      bookingId: 'booking-3',
      category: 'other',
      description: 'Some issue',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Insert failed');
  });

  it('requires authentication', async () => {
    // Override useAuth to return no user
    vi.mocked(await import('@/contexts/AuthContext')).useAuth = vi.fn().mockReturnValue({
      user: null,
    }) as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useSubmitDispute(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      bookingId: 'booking-4',
      category: 'safety_concerns',
      description: 'Safety issue',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toContain('logged in');
  });
});
