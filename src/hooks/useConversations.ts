// Unified Conversation Layer — React Query hooks
// Session 2: All queries, mutations, and realtime subscriptions

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import type { ThreadItem } from '@/lib/conversations';

// ============================================================
// Query key factory
// ============================================================

export const conversationKeys = {
  all: ['conversations'] as const,
  lists: () => [...conversationKeys.all, 'list'] as const,
  list: (userId: string | undefined, status?: string) =>
    [...conversationKeys.lists(), userId, status] as const,
  details: () => [...conversationKeys.all, 'detail'] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
  threads: () => [...conversationKeys.all, 'thread'] as const,
  thread: (id: string) => [...conversationKeys.threads(), id] as const,
  unreadCount: (userId: string | undefined) =>
    [...conversationKeys.all, 'unread-count', userId] as const,
};

// ============================================================
// Select strings (PostgREST joins)
// ============================================================

const CONVERSATION_SELECT = `
  *,
  owner:profiles!conversations_owner_id_fkey(id, full_name, avatar_url),
  traveler:profiles!conversations_traveler_id_fkey(id, full_name, avatar_url),
  property:properties!conversations_property_id_fkey(id, resort_name, location)
`;

// ============================================================
// Queries
// ============================================================

/**
 * All conversations for the current user, sorted by last activity.
 * Subscribes to realtime updates on the conversations table.
 */
export function useMyConversations(options?: { status?: 'active' | 'archived' }) {
  const { user } = useAuth();
  const status = options?.status ?? 'active';

  // Realtime: auto-invalidate when any conversation changes
  useRealtimeSubscription({
    table: 'conversations',
    event: '*',
    filter: user ? `owner_id=eq.${user.id}` : undefined,
    invalidateKeys: [
      conversationKeys.lists() as string[],
      conversationKeys.unreadCount(user?.id) as string[],
    ],
    enabled: !!user,
  });

  // Second subscription for traveler side
  useRealtimeSubscription({
    table: 'conversations',
    event: '*',
    filter: user ? `traveler_id=eq.${user.id}` : undefined,
    invalidateKeys: [
      conversationKeys.lists() as string[],
      conversationKeys.unreadCount(user?.id) as string[],
    ],
    enabled: !!user,
  });

  return useQuery({
    queryKey: conversationKeys.list(user?.id, status),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(CONVERSATION_SELECT)
        .eq('status', status)
        .or(`owner_id.eq.${user!.id},traveler_id.eq.${user!.id}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

/**
 * Single conversation with full participant details.
 */
export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: conversationKeys.detail(conversationId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(CONVERSATION_SELECT)
        .eq('id', conversationId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });
}

/**
 * Combined messages + events thread via RPC, sorted by created_at ASC.
 * Subscribes to realtime for new messages in this conversation.
 */
export function useConversationThread(conversationId: string | undefined) {
  // Realtime: new messages auto-refresh the thread
  useRealtimeSubscription({
    table: 'conversation_messages',
    event: 'INSERT',
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    invalidateKeys: [
      conversationKeys.thread(conversationId ?? '') as string[],
      conversationKeys.lists() as string[],
      conversationKeys.unreadCount(undefined) as string[],
    ],
    enabled: !!conversationId,
  });

  // Realtime: new events auto-refresh the thread
  useRealtimeSubscription({
    table: 'conversation_events',
    event: 'INSERT',
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    invalidateKeys: [
      conversationKeys.thread(conversationId ?? '') as string[],
    ],
    enabled: !!conversationId,
  });

  return useQuery({
    queryKey: conversationKeys.thread(conversationId ?? ''),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_conversation_thread', {
        p_conversation_id: conversationId!,
      });

      if (error) throw error;
      return (data ?? []) as ThreadItem[];
    },
    enabled: !!conversationId,
  });
}

/**
 * Total unread conversation count for the current user (for inbox badge).
 */
export function useUnreadConversationCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: conversationKeys.unreadCount(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('owner_id, owner_unread_count, traveler_unread_count')
        .eq('status', 'active')
        .or(`owner_id.eq.${user!.id},traveler_id.eq.${user!.id}`);

      if (error) throw error;

      return (data ?? []).reduce((total, conv) => {
        const count = conv.owner_id === user!.id
          ? conv.owner_unread_count
          : conv.traveler_unread_count;
        return total + count;
      }, 0);
    },
    enabled: !!user,
  });
}

// ============================================================
// Mutations
// ============================================================

/**
 * Send a message in a conversation.
 * Optimistic update: message appears instantly in the thread.
 */
export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      conversationId,
      body,
    }: {
      conversationId: string;
      body: string;
    }) => {
      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          body,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ conversationId, body }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.thread(conversationId),
      });

      // Snapshot previous thread
      const previousThread = queryClient.getQueryData<ThreadItem[]>(
        conversationKeys.thread(conversationId)
      );

      // Optimistically add the message
      if (previousThread) {
        const optimisticMessage: ThreadItem = {
          id: crypto.randomUUID(),
          item_type: 'message',
          sender_id: user!.id,
          body,
          event_type: null,
          event_data: null,
          read_at: null,
          created_at: new Date().toISOString(),
        };
        queryClient.setQueryData<ThreadItem[]>(
          conversationKeys.thread(conversationId),
          [...previousThread, optimisticMessage]
        );
      }

      return { previousThread };
    },
    onError: (_err, { conversationId }, context) => {
      // Rollback on error
      if (context?.previousThread) {
        queryClient.setQueryData(
          conversationKeys.thread(conversationId),
          context.previousThread
        );
      }
    },
    onSettled: (_data, _error, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.thread(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conversationKeys.unreadCount(user?.id) });
    },
  });
}

/**
 * Mark a conversation as read — resets unread count for current user.
 */
export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase.rpc('mark_conversation_read', {
        p_conversation_id: conversationId,
      });
      if (error) throw error;
    },
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conversationKeys.unreadCount(user?.id) });
    },
  });
}

/**
 * Archive a conversation (only changes status for the initiating user's view).
 */
export function useArchiveConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', conversationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: conversationKeys.unreadCount(user?.id) });
    },
  });
}

/**
 * Idempotent conversation creation — returns existing or creates new.
 */
export function useGetOrCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ownerId,
      travelerId,
      propertyId,
      listingId,
      contextType,
      contextId,
    }: {
      ownerId: string;
      travelerId: string;
      propertyId: string;
      listingId?: string;
      contextType?: string;
      contextId?: string;
    }) => {
      const { data, error } = await supabase.rpc('get_or_create_conversation', {
        p_owner_id: ownerId,
        p_traveler_id: travelerId,
        p_property_id: propertyId,
        p_listing_id: listingId ?? null,
        p_context_type: contextType ?? 'inquiry',
        p_context_id: contextId ?? null,
      });
      if (error) throw error;
      return data as string; // Returns UUID
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}

/**
 * Insert a conversation event via SECURITY DEFINER RPC.
 * Clients MUST use this — never direct INSERT into conversation_events.
 */
export function useInsertConversationEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      eventType,
      eventData,
    }: {
      conversationId: string;
      eventType: string;
      eventData?: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.rpc('insert_conversation_event', {
        p_conversation_id: conversationId,
        p_event_type: eventType,
        p_event_data: eventData ?? {},
      });
      if (error) throw error;
      return data as string; // Returns UUID
    },
    onSuccess: (_data, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.thread(conversationId) });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });
}
