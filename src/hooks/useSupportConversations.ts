// React Query hooks for the admin Support Interactions tab + user rating
// widget. Phase 22 D2 (#411) — DEC-036.
//
// All reads are RLS-gated: authenticated users see their own conversations,
// RAV team sees all (migration 062). Rating updates are scoped to the
// conversation owner via migration 062's support_conversations_rate_own
// policy.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Conversation = Database["public"]["Tables"]["support_conversations"]["Row"];
type Message = Database["public"]["Tables"]["support_messages"]["Row"];

export interface ConversationListFilters {
  searchEmail?: string;
  dateFrom?: string; // ISO
  dateTo?: string;   // ISO
  escalated?: "all" | "yes" | "no";
  rating?: "all" | "up" | "down" | "unrated";
  limit?: number;
}

export interface ConversationWithUser extends Conversation {
  user?: { full_name: string | null; email: string | null } | null;
}

/**
 * Admin transcript list. RLS returns everything to RAV team, only-own to users.
 * For admin use the filter bar; for "my conversations" future UX, defaults
 * are sensible too.
 */
export function useSupportConversations(filters: ConversationListFilters = {}) {
  return useQuery({
    queryKey: ["support-conversations", filters],
    queryFn: async (): Promise<ConversationWithUser[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase as any).from("support_conversations")
        .select(`
          *,
          user:profiles!support_conversations_user_id_fkey(full_name, email)
        `)
        .order("started_at", { ascending: false })
        .limit(filters.limit ?? 100);

      if (filters.dateFrom) query = query.gte("started_at", filters.dateFrom);
      if (filters.dateTo) query = query.lt("started_at", filters.dateTo);

      if (filters.escalated === "yes") query = query.not("escalated_at", "is", null);
      if (filters.escalated === "no") query = query.is("escalated_at", null);

      if (filters.rating === "up") query = query.eq("user_rating", 1);
      else if (filters.rating === "down") query = query.eq("user_rating", -1);
      else if (filters.rating === "unrated") query = query.is("user_rating", null);

      const { data, error } = await query;
      if (error) throw error;

      // Client-side email filter — PostgREST can't join-filter without an RPC.
      let rows = (data ?? []) as ConversationWithUser[];
      if (filters.searchEmail?.trim()) {
        const needle = filters.searchEmail.trim().toLowerCase();
        rows = rows.filter((r) => r.user?.email?.toLowerCase().includes(needle));
      }

      return rows;
    },
    staleTime: 30_000,
  });
}

/**
 * Full transcript for a single conversation — messages ordered by turn_index.
 */
export function useSupportConversation(conversationId: string | null) {
  return useQuery({
    queryKey: ["support-conversation", conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<{
      conversation: ConversationWithUser;
      messages: Message[];
    }> => {
      if (!conversationId) throw new Error("conversationId required");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conversationResult = await (supabase as any)
        .from("support_conversations")
        .select(`
          *,
          user:profiles!support_conversations_user_id_fkey(full_name, email)
        `)
        .eq("id", conversationId)
        .single();

      if (conversationResult.error) throw conversationResult.error;

      const messagesResult = await supabase
        .from("support_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("turn_index", { ascending: true });

      if (messagesResult.error) throw messagesResult.error;

      return {
        conversation: conversationResult.data as ConversationWithUser,
        messages: (messagesResult.data ?? []) as Message[],
      };
    },
    staleTime: 60_000,
  });
}

export interface SupportMetricsRow {
  total_conversations: number;
  ended_conversations: number;
  deflected_count: number;
  escalated_count: number;
  deflection_pct: number | null;
  escalation_pct: number | null;
  median_response_ms: number | null;
  rated_count: number;
  positive_rating_count: number;
  negative_rating_count: number;
}

/**
 * Pull aggregate metrics for a date window via the migration-063 RPC.
 */
export function useSupportMetrics(params: { dateFrom: string; dateTo: string }) {
  return useQuery({
    queryKey: ["support-metrics", params],
    queryFn: async (): Promise<SupportMetricsRow | null> => {
      const { data, error } = await supabase.rpc("get_support_metrics", {
        date_from: params.dateFrom,
        date_to: params.dateTo,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as SupportMetricsRow | null) ?? null;
    },
    staleTime: 60_000,
  });
}

/**
 * User-facing: post a thumbs-up/down on your own conversation.
 * RLS allows only the conversation owner; malformed updates rejected.
 */
export function useRateSupportConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      rating,
    }: {
      conversationId: string;
      rating: 1 | -1;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("support_conversations")
        .update({
          user_rating: rating,
          rating_submitted_at: new Date().toISOString(),
        })
        .eq("id", conversationId);
      if (error) throw error;
      return { conversationId, rating };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["support-conversation", result.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["support-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["support-metrics"] });
    },
  });
}
