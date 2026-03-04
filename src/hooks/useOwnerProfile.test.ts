import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const { mockRpc } = vi.hoisted(() => {
  const mockRpc = vi.fn();
  return { mockRpc };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: mockRpc,
    channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() })),
    removeChannel: vi.fn(),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'user-123' },
    profile: null,
    roles: [],
    isLoading: false,
    session: null,
  })),
}));

import { useOwnerProfile } from './useOwnerProfile';

describe('useOwnerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('returns owner profile from RPC', async () => {
    const mockProfile = {
      first_name: 'Jane',
      avatar_url: null,
      member_since: '2024-01-15T00:00:00Z',
      is_verified: true,
      listing_count: 3,
      review_count: 12,
      avg_rating: 4.5,
      response_time_hours: null,
    };
    mockRpc.mockResolvedValue({ data: mockProfile, error: null });

    const { result } = renderHook(() => useOwnerProfile('owner-456'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockProfile);
    });

    expect(mockRpc).toHaveBeenCalledWith('get_owner_profile_summary', {
      _owner_id: 'owner-456',
    });
  });

  it('does not fetch when ownerId is undefined', () => {
    renderHook(() => useOwnerProfile(undefined), {
      wrapper: createHookWrapper(),
    });

    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('handles RPC error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'Not found' } });

    const { result } = renderHook(() => useOwnerProfile('owner-999'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('returns null for empty result', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useOwnerProfile('owner-nonexistent'), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeNull();
    });
  });
});
