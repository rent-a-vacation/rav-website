import { useEffect, useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type PostgresEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeSubscriptionOptions {
  /** Table to subscribe to */
  table: string;
  /** Supabase schema (default: 'public') */
  schema?: string;
  /** Postgres event type */
  event?: PostgresEvent;
  /** eq filter — e.g. `user_id=eq.abc123` */
  filter?: string;
  /** Callback when an event is received */
  onEvent?: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;
  /** Query keys to invalidate when event fires */
  invalidateKeys?: string[][];
  /** Whether the subscription is active (default: true) */
  enabled?: boolean;
}

interface UseRealtimeSubscriptionResult {
  isConnected: boolean;
  error: string | null;
}

/**
 * Generic Supabase Realtime subscription hook.
 * Subscribes to postgres_changes on a table and optionally invalidates
 * TanStack Query caches or invokes a custom callback.
 */
export function useRealtimeSubscription({
  table,
  schema = 'public',
  event = '*',
  filter,
  onEvent,
  invalidateKeys,
  enabled = true,
}: UseRealtimeSubscriptionOptions): UseRealtimeSubscriptionResult {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || !user) {
      setIsConnected(false);
      return;
    }

    const channelName = `${table}-${filter || 'all'}-${user.id}`;

    // Build the subscription config
    const channelConfig: {
      event: PostgresEvent;
      schema: string;
      table: string;
      filter?: string;
    } = { event, schema, table };

    if (filter) {
      channelConfig.filter = filter;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes' as never,
        channelConfig as never,
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          // Call custom handler
          onEvent?.(payload);

          // Invalidate specified query keys
          if (invalidateKeys) {
            for (const key of invalidateKeys) {
              queryClient.invalidateQueries({ queryKey: key });
            }
          }
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError('Failed to connect to realtime channel');
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, schema, event, filter, enabled, user?.id]);

  return { isConnected, error };
}
