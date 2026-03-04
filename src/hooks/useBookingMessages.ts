import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface BookingMessage {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: { full_name: string | null };
}

export function useBookingMessages(bookingId: string | undefined) {
  return useQuery({
    queryKey: ["booking-messages", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_messages")
        .select("*, sender:profiles!booking_messages_sender_id_fkey(full_name)")
        .eq("booking_id", bookingId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as BookingMessage[];
    },
    enabled: !!bookingId,
  });
}

export function useSendBookingMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { booking_id: string; sender_id: string; body: string }) => {
      const { data, error } = await supabase.from("booking_messages").insert(params).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["booking-messages", data.booking_id] });
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { error } = await supabase
        .from("booking_messages")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("booking_id", bookingId)
        .neq("sender_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ["booking-messages", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["unread-messages"] });
    },
  });
}

export function useUnreadMessageCounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_unread_message_counts", {
        p_user_id: user!.id,
      });
      if (error) throw error;
      return data as { booking_id: string; unread_count: number }[];
    },
    enabled: !!user?.id,
  });
}
