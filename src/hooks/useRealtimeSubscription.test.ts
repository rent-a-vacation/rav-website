import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, cleanup, act } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

// --- Hoisted mocks (must use vi.hoisted to avoid ReferenceError) ---
const { mockSubscribe, mockRemoveChannel, mockChannel, mockChannelFn, mockUseAuth } = vi.hoisted(() => {
  const mockSubscribe = vi.fn();
  const mockRemoveChannel = vi.fn();
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: mockSubscribe,
  };
  const mockChannelFn = vi.fn(() => mockChannel);
  const mockUseAuth = vi.fn(() => ({
    user: { id: 'user-123', email: 'test@example.com' },
    profile: null,
    roles: [],
    isLoading: false,
    session: null,
  }));
  return { mockSubscribe, mockRemoveChannel, mockChannel, mockChannelFn, mockUseAuth };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    channel: mockChannelFn,
    removeChannel: mockRemoveChannel,
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: mockUseAuth,
}));

// Import after mocks are set up
import { useRealtimeSubscription } from './useRealtimeSubscription';

describe('useRealtimeSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChannel.on.mockReturnThis();
    mockSubscribe.mockImplementation((cb) => {
      cb('SUBSCRIBED');
      return mockChannel;
    });
    mockUseAuth.mockReturnValue({
      user: { id: 'user-123', email: 'test@example.com' },
      profile: null,
      roles: [],
      isLoading: false,
      session: null,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('subscribes to channel on mount', () => {
    renderHook(
      () =>
        useRealtimeSubscription({
          table: 'notifications',
          event: 'INSERT',
        }),
      { wrapper: createHookWrapper() },
    );

    expect(mockChannelFn).toHaveBeenCalledWith(
      expect.stringContaining('notifications'),
    );
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('unsubscribes on unmount', () => {
    const { unmount } = renderHook(
      () =>
        useRealtimeSubscription({
          table: 'notifications',
          event: 'INSERT',
        }),
      { wrapper: createHookWrapper() },
    );

    unmount();
    expect(mockRemoveChannel).toHaveBeenCalledWith(mockChannel);
  });

  it('calls onEvent callback when event received', () => {
    const onEvent = vi.fn();

    // Capture the postgres_changes handler
    mockChannel.on.mockImplementation((_type: string, _config: unknown, handler: (payload: unknown) => void) => {
      (mockChannel as unknown as Record<string, unknown>)._handler = handler;
      return mockChannel;
    });

    renderHook(
      () =>
        useRealtimeSubscription({
          table: 'notifications',
          event: 'INSERT',
          onEvent,
        }),
      { wrapper: createHookWrapper() },
    );

    // Simulate an event
    const handler = (mockChannel as unknown as Record<string, (payload: unknown) => void>)._handler;
    if (handler) {
      act(() => {
        handler({ eventType: 'INSERT', new: { id: '1' }, old: {} });
      });
    }

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'INSERT' }),
    );
  });

  it('handles filter parameter correctly', () => {
    renderHook(
      () =>
        useRealtimeSubscription({
          table: 'notifications',
          event: 'INSERT',
          filter: 'user_id=eq.user-123',
        }),
      { wrapper: createHookWrapper() },
    );

    expect(mockChannelFn).toHaveBeenCalledWith(
      expect.stringContaining('user_id=eq.user-123'),
    );
    expect(mockChannel.on).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ filter: 'user_id=eq.user-123' }),
      expect.any(Function),
    );
  });

  it('returns connected state after subscribing', () => {
    const { result } = renderHook(
      () =>
        useRealtimeSubscription({
          table: 'notifications',
          event: 'INSERT',
        }),
      { wrapper: createHookWrapper() },
    );

    expect(result.current.isConnected).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('does not subscribe when enabled is false', () => {
    renderHook(
      () =>
        useRealtimeSubscription({
          table: 'notifications',
          event: 'INSERT',
          enabled: false,
        }),
      { wrapper: createHookWrapper() },
    );

    expect(mockChannelFn).not.toHaveBeenCalled();
  });

  it('does not subscribe when user is null', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      profile: null,
      roles: [],
      isLoading: false,
      session: null,
    });

    renderHook(
      () =>
        useRealtimeSubscription({
          table: 'notifications',
          event: 'INSERT',
        }),
      { wrapper: createHookWrapper() },
    );

    expect(mockChannelFn).not.toHaveBeenCalled();
  });
});
