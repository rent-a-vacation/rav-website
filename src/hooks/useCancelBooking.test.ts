import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';

const mockInvoke = vi.fn();
const mockInvalidateQueries = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
}));

vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: mockInvalidateQueries,
    }),
  };
});

const { useCancelBooking } = await import('./useCancelBooking');

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCancelBooking @p0', () => {
  it('calls process-cancellation edge function with correct params', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        refund_amount: 500,
        refund_reference: 'ref_123',
        policy: 'flexible',
        days_until_checkin: 14,
        cancelled_by: 'renter',
      },
      error: null,
    });

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      bookingId: 'booking-1',
      reason: 'Change of plans',
      cancelledBy: 'renter',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockInvoke).toHaveBeenCalledWith('process-cancellation', {
      body: {
        bookingId: 'booking-1',
        reason: 'Change of plans',
        cancelledBy: 'renter',
      },
    });

    expect(result.current.data).toEqual({
      success: true,
      refund_amount: 500,
      refund_reference: 'ref_123',
      policy: 'flexible',
      days_until_checkin: 14,
      cancelled_by: 'renter',
    });
  });

  it('throws on edge function error', async () => {
    mockInvoke.mockResolvedValue({
      data: null,
      error: { message: 'Function invocation failed' },
    });

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      bookingId: 'booking-1',
      reason: 'Test',
      cancelledBy: 'renter',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Function invocation failed');
  });

  it('throws on data-level error response', async () => {
    mockInvoke.mockResolvedValue({
      data: { error: 'Booking not found' },
      error: null,
    });

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      bookingId: 'nonexistent',
      reason: 'Test',
      cancelledBy: 'owner',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Booking not found');
  });

  it('invalidates payouts query on success', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        refund_amount: 0,
        refund_reference: null,
        policy: 'strict',
        days_until_checkin: 2,
        cancelled_by: 'renter',
      },
      error: null,
    });

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      bookingId: 'booking-2',
      reason: 'Emergency',
      cancelledBy: 'renter',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['payouts'] });
  });

  it('supports owner cancellation', async () => {
    mockInvoke.mockResolvedValue({
      data: {
        success: true,
        refund_amount: 1200,
        refund_reference: 'ref_456',
        policy: 'owner_cancel',
        days_until_checkin: 30,
        cancelled_by: 'owner',
      },
      error: null,
    });

    const { result } = renderHook(() => useCancelBooking(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      bookingId: 'booking-3',
      reason: 'Unit no longer available',
      cancelledBy: 'owner',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockInvoke).toHaveBeenCalledWith('process-cancellation', {
      body: {
        bookingId: 'booking-3',
        reason: 'Unit no longer available',
        cancelledBy: 'owner',
      },
    });

    expect(result.current.data?.cancelled_by).toBe('owner');
    expect(result.current.data?.refund_amount).toBe(1200);
  });
});
