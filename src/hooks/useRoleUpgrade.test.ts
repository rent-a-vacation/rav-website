import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, cleanup } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

// --- Hoisted mocks ---
const { mockRpc, mockInsert, mockInvoke, mockFrom, mockChannel, mockRemoveChannel } = vi.hoisted(() => {
  const mockRpc = vi.fn().mockResolvedValue({ data: true, error: null });
  const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: mockInsert,
  }));
  const mockInvoke = vi.fn().mockResolvedValue({ data: null, error: null });
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn((cb) => { cb('SUBSCRIBED'); return mockChannel; }),
  };
  const mockRemoveChannel = vi.fn();
  return { mockRpc, mockInsert, mockInvoke, mockFrom, mockChannel, mockRemoveChannel };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: mockRpc,
    from: mockFrom,
    functions: { invoke: mockInvoke },
    channel: vi.fn(() => mockChannel),
    removeChannel: mockRemoveChannel,
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'admin-123', email: 'admin@test.com' },
    profile: null,
    roles: ['rav_admin'],
    isLoading: false,
    session: null,
  })),
}));

import { useApproveRoleUpgrade } from './useRoleUpgrade';

describe('useApproveRoleUpgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: true, error: null });
    mockInsert.mockResolvedValue({ data: null, error: null });
    mockChannel.on.mockReturnThis();
  });

  afterEach(() => {
    cleanup();
  });

  it('inserts notification on approval', async () => {
    const { result } = renderHook(() => useApproveRoleUpgrade(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      id: 'req-1',
      user_id: 'user-456',
      user_email: 'owner@test.com',
      user_name: 'Test Owner',
      requested_role: 'property_owner',
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith(
        'approve_role_upgrade',
        expect.objectContaining({ _request_id: 'req-1' }),
      );
    });

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-456',
          type: 'role_upgrade_approved',
          title: 'Role Upgrade Approved',
        }),
      );
    });
  });

  it('calls send-email on approval', async () => {
    const { result } = renderHook(() => useApproveRoleUpgrade(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      id: 'req-1',
      user_id: 'user-456',
      user_email: 'owner@test.com',
      user_name: 'Test Owner',
      requested_role: 'property_owner',
    });

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          body: expect.objectContaining({
            to: 'owner@test.com',
            subject: expect.stringContaining('Approved'),
          }),
        }),
      );
    });
  });

  it('does not send email when no user_email', async () => {
    const { result } = renderHook(() => useApproveRoleUpgrade(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      id: 'req-1',
      user_id: 'user-456',
      requested_role: 'property_owner',
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalled();
    });

    // Small delay to ensure no email is sent
    await new Promise((r) => setTimeout(r, 50));
    expect(mockInvoke).not.toHaveBeenCalled();
  });

  it('still succeeds if notification insert fails', async () => {
    mockInsert.mockResolvedValueOnce({ data: null, error: { message: 'insert error' } });

    const { result } = renderHook(() => useApproveRoleUpgrade(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      id: 'req-1',
      user_id: 'user-456',
      user_email: 'owner@test.com',
      requested_role: 'property_owner',
    });

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalled();
    });
  });
});
