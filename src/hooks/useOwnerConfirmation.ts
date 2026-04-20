import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';

export type OwnerConfirmationStatus =
  | 'pending_owner'
  | 'owner_confirmed'
  | 'owner_timed_out'
  | 'owner_declined'
  | null;

export interface OwnerConfirmationData {
  id: string;
  booking_id: string;
  owner_id: string;
  owner_confirmation_status: OwnerConfirmationStatus;
  owner_confirmation_deadline: string | null;
  extensions_used: number;
  owner_extension_requested_at: string[] | null;
  owner_confirmed_at: string | null;
  owner_declined_at: string | null;
  escrow_amount: number;
  escrow_status: string;
  booking: {
    id: string;
    guest_count: number;
    listing: {
      check_in_date: string;
      check_out_date: string;
      final_price: number;
      property: {
        resort_name: string;
        location: string;
      };
    };
    renter: {
      full_name: string | null;
      email: string;
    };
  };
}

// Fetch owner confirmation status for a specific booking confirmation
export function useOwnerConfirmationStatus(bookingConfirmationId: string | undefined) {
  return useQuery({
    queryKey: ['owner-confirmation', bookingConfirmationId],
    queryFn: async () => {
      if (!bookingConfirmationId) return null;

      const { data, error } = await supabase
        .from('booking_confirmations')
        .select(`
          id, booking_id, owner_id,
          owner_confirmation_status, owner_confirmation_deadline,
          extensions_used, owner_extension_requested_at,
          owner_confirmed_at, owner_declined_at,
          escrow_amount, escrow_status,
          booking:bookings(
            id, guest_count,
            listing:listings(
              check_in_date, check_out_date, final_price,
              property:properties(resort_name, location)
            ),
            renter:profiles(full_name, email)
          )
        `)
        .eq('id', bookingConfirmationId)
        .single();

      if (error) throw error;
      return data as OwnerConfirmationData;
    },
    enabled: !!bookingConfirmationId,
    refetchInterval: 30000, // Refresh every 30 seconds for live countdown
  });
}

// Fetch all pending owner confirmations for the current owner
export function usePendingOwnerConfirmations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-confirmations', 'pending', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('booking_confirmations')
        .select(`
          id, booking_id, owner_id,
          owner_confirmation_status, owner_confirmation_deadline,
          extensions_used, owner_extension_requested_at,
          owner_confirmed_at, owner_declined_at,
          escrow_amount, escrow_status,
          booking:bookings(
            id, guest_count,
            listing:listings(
              check_in_date, check_out_date, final_price,
              property:properties(resort_name, location)
            ),
            renter:profiles(full_name, email)
          )
        `)
        .eq('owner_id', user.id)
        .eq('owner_confirmation_status', 'pending_owner')
        .order('owner_confirmation_deadline', { ascending: true });

      if (error) throw error;
      return (data || []) as OwnerConfirmationData[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

// Owner confirms the booking
export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingConfirmationId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('booking_confirmations')
        .update({
          owner_confirmation_status: 'owner_confirmed',
          owner_confirmed_at: new Date().toISOString(),
        })
        .eq('id', bookingConfirmationId);

      if (error) throw error;

      // DEC-034 Phase 4: for wish_matched bookings, dispatch the traveler
      // notification that their Wish-Matched booking is now confirmed.
      // Fire-and-forget — the confirmation already succeeded; the dispatch
      // is a follow-up UX win.
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: conf } = await (supabase as any)
          .from('booking_confirmations')
          .select('booking_id, booking:bookings(id, renter_id, source_type, listing_id, listing:listings(property:properties(resort_name)))')
          .eq('id', bookingConfirmationId)
          .single();

        const booking = conf?.booking;
        if (booking?.source_type === 'wish_matched' && booking?.renter_id) {
          const resortName = booking?.listing?.property?.resort_name;
          supabase.functions.invoke('notification-dispatcher', {
            body: {
              type_key: 'wish_owner_confirmed',
              user_id: booking.renter_id,
              payload: {
                title: 'Wish-Matched booking confirmed',
                message: resortName
                  ? `The owner has confirmed your stay at ${resortName}. You're all set.`
                  : "The owner has confirmed your stay. You're all set.",
                booking_id: booking.id,
                listing_id: booking.listing_id,
              },
            },
          }).catch(() => {
            // Best-effort; confirmation already succeeded
          });
        }
      } catch {
        // Non-blocking — do not fail the confirmation
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-confirmation'] });
      queryClient.invalidateQueries({ queryKey: ['owner-confirmations'] });
    },
  });
}

// Owner declines the booking
export function useDeclineBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingConfirmationId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('booking_confirmations')
        .update({
          owner_confirmation_status: 'owner_declined',
          owner_declined_at: new Date().toISOString(),
        })
        .eq('id', bookingConfirmationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-confirmation'] });
      queryClient.invalidateQueries({ queryKey: ['owner-confirmations'] });
    },
  });
}

// Owner requests a time extension via RPC
export function useRequestExtension() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (bookingConfirmationId: string) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase.rpc(
        'extend_owner_confirmation_deadline',
        {
          p_booking_confirmation_id: bookingConfirmationId,
          p_owner_id: user.id,
        }
      );

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Failed to extend deadline');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-confirmation'] });
      queryClient.invalidateQueries({ queryKey: ['owner-confirmations'] });
    },
  });
}

// System settings for confirmation timer
export function useConfirmationTimerSettings() {
  return useQuery({
    queryKey: ['system-settings', 'owner-confirmation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'owner_confirmation_window_minutes',
          'owner_confirmation_extension_minutes',
          'owner_confirmation_max_extensions',
        ]);

      if (error) throw error;

      const settings: Record<string, number> = {};
      for (const row of data || []) {
        const val = row.setting_value as { value: number };
        settings[row.setting_key] = val.value;
      }

      return {
        windowMinutes: settings.owner_confirmation_window_minutes ?? 60,
        extensionMinutes: settings.owner_confirmation_extension_minutes ?? 30,
        maxExtensions: settings.owner_confirmation_max_extensions ?? 2,
      };
    },
  });
}

// Countdown timer hook
export function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, expired: true });

  const calculate = useCallback(() => {
    if (!deadline) return { hours: 0, minutes: 0, seconds: 0, expired: true };

    const now = Date.now();
    const end = new Date(deadline).getTime();
    const diff = end - now;

    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };

    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      expired: false,
    };
  }, [deadline]);

  useEffect(() => {
    setTimeLeft(calculate());
    const interval = setInterval(() => {
      setTimeLeft(calculate());
    }, 1000);
    return () => clearInterval(interval);
  }, [calculate]);

  return timeLeft;
}
