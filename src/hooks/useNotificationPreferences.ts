import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

/** All toggle-able email preference keys (excludes id, user_id, timestamps, push_enabled) */
export type EmailPrefKey =
  | "email_booking_confirmed"
  | "email_booking_cancelled"
  | "email_payout_sent"
  | "email_new_bid"
  | "email_bid_accepted"
  | "email_bidding_ending"
  | "email_new_proposal"
  | "email_proposal_accepted"
  | "email_new_travel_request"
  | "email_request_expiring"
  | "email_marketing"
  | "email_product_updates";

export interface NotificationPreferenceCategory {
  label: string;
  description: string;
  prefs: { key: EmailPrefKey; label: string }[];
}

export const NOTIFICATION_CATEGORIES: NotificationPreferenceCategory[] = [
  {
    label: "Booking Updates",
    description: "Stay informed about your reservations",
    prefs: [
      { key: "email_booking_confirmed", label: "Booking confirmed" },
      { key: "email_booking_cancelled", label: "Booking cancelled" },
      { key: "email_payout_sent", label: "Payout sent (owners)" },
    ],
  },
  {
    label: "Offers",
    description: "Activity on your Listings and Offers",
    prefs: [
      { key: "email_new_bid", label: "New Offer received" },
      { key: "email_bid_accepted", label: "Offer accepted" },
      { key: "email_bidding_ending", label: "Offers closing soon" },
      { key: "email_new_proposal", label: "New Offer on your Wish" },
      { key: "email_proposal_accepted", label: "Your Offer was accepted" },
    ],
  },
  {
    label: "Wishes",
    description: "Matches and updates on your Wishes",
    prefs: [
      { key: "email_new_travel_request", label: "New matching Wish" },
      { key: "email_request_expiring", label: "Request expiring soon" },
    ],
  },
  {
    label: "Marketing & Updates",
    description: "Promotions, tips, and platform news",
    prefs: [
      { key: "email_marketing", label: "Promotional emails" },
      { key: "email_product_updates", label: "Product updates & tips" },
    ],
  },
];

export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["notification-preferences", user?.id],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      // Auto-create default row if none exists
      if (!data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newRow, error: insertError } = await (supabase as any)
          .from("notification_preferences")
          .insert({ user_id: user!.id })
          .select()
          .single();

        if (insertError) throw insertError;
        return newRow as Record<string, unknown>;
      }

      return data as Record<string, unknown>;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateNotificationPreference() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: EmailPrefKey; value: boolean }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("notification_preferences")
        .update({ [key]: value })
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onMutate: async ({ key, value }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["notification-preferences", user?.id] });
      const previous = queryClient.getQueryData(["notification-preferences", user?.id]);

      queryClient.setQueryData(
        ["notification-preferences", user?.id],
        (old: Record<string, unknown> | undefined) => (old ? { ...old, [key]: value } : old)
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["notification-preferences", user?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", user?.id] });
    },
  });
}
