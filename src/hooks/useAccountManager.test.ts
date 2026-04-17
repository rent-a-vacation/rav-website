import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({ supabase: mockSupabase }));

const mockUser = vi.hoisted(() => ({ id: 'owner-1', email: 'owner@example.com' }));
vi.mock('./useAuth', () => ({
  useAuth: () => ({ user: mockUser, hasRole: () => false, isRavTeam: () => false }),
}));

import { useMyAccountManager } from './useAccountManager';

describe('useMyAccountManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when no account_manager_id is set', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { account_manager_id: null },
            error: null,
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useMyAccountManager(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('fetches manager profile when account_manager_id is set', async () => {
    let callCount = 0;
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              return Promise.resolve({
                data: { account_manager_id: 'staff-1' },
                error: null,
              });
            }
            return Promise.resolve({
              data: { id: 'staff-1', full_name: 'Jane Staff', email: 'jane@rav.com', phone: '+1234', avatar_url: null },
              error: null,
            });
          }),
        }),
      }),
    });

    const { result } = renderHook(() => useMyAccountManager(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.full_name).toBe('Jane Staff');
    expect(result.current.data?.email).toBe('jane@rav.com');
  });
});
