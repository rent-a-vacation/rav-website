import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';
import { NOTIFICATION_CATEGORIES, type EmailPrefKey } from './useNotificationPreferences';

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: (...args: unknown[]) => mockSelect(...args),
        }),
      }),
      insert: vi.fn().mockImplementation((data: unknown) => {
        mockInsert(data);
        return {
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { user_id: 'user-123', ...data as object }, error: null }),
          }),
        };
      }),
      update: vi.fn().mockImplementation((data: unknown) => {
        mockUpdate(data);
        return {
          eq: vi.fn().mockResolvedValue({ error: null }),
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

const { useNotificationPreferences, useUpdateNotificationPreference } =
  await import('./useNotificationPreferences');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useNotificationPreferences', () => {
  it('fetches existing preferences', async () => {
    const prefs = {
      user_id: 'user-123',
      email_booking_confirmed: true,
      email_marketing: false,
    };
    mockSelect.mockResolvedValue({ data: prefs, error: null });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(prefs);
  });

  it('auto-creates default preferences when none exist', async () => {
    mockSelect.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInsert).toHaveBeenCalledWith({ user_id: 'user-123' });
  });

  it('throws on fetch error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'DB error' } });

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useUpdateNotificationPreference', () => {
  it('updates a single preference', async () => {
    const { result } = renderHook(() => useUpdateNotificationPreference(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({ key: 'email_marketing', value: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith({ email_marketing: false });
  });

  it('handles update error', async () => {
    // Override update to return error
    vi.mocked(await import('@/lib/supabase')).supabase.from = vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      }),
    }) as ReturnType<typeof vi.fn>;

    const { result } = renderHook(() => useUpdateNotificationPreference(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({ key: 'email_booking_confirmed', value: true });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('NOTIFICATION_CATEGORIES', () => {
  it('has 4 categories', () => {
    expect(NOTIFICATION_CATEGORIES).toHaveLength(4);
  });

  it('covers booking, bidding, travel, and marketing', () => {
    const labels = NOTIFICATION_CATEGORIES.map((c) => c.label);
    expect(labels).toContain('Booking Updates');
    expect(labels).toContain('Offers');
    expect(labels).toContain('Wishes');
    expect(labels).toContain('Marketing & Updates');
  });

  it('all pref keys are valid EmailPrefKey values', () => {
    const validKeys: EmailPrefKey[] = [
      'email_booking_confirmed', 'email_booking_cancelled', 'email_payout_sent',
      'email_new_bid', 'email_bid_accepted', 'email_bidding_ending',
      'email_new_proposal', 'email_proposal_accepted',
      'email_new_travel_request', 'email_request_expiring',
      'email_marketing', 'email_product_updates',
    ];

    const allKeys = NOTIFICATION_CATEGORIES.flatMap((c) => c.prefs.map((p) => p.key));
    for (const key of allKeys) {
      expect(validKeys).toContain(key);
    }
    // Also verify all valid keys are covered
    expect(allKeys).toHaveLength(validKeys.length);
  });
});
