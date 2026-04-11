/**
 * useNotifications — Standalone notification hook.
 * GitHub Issue: #220
 *
 * Wraps existing notification queries from useBidding.ts into a clean interface
 * with realtime subscription for live unread count updates.
 */

import { useAuth } from "@/contexts/AuthContext";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  useNotifications as useNotificationsQuery,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from "@/hooks/useBidding";

export interface UseNotificationsReturn {
  notifications: Array<{
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    created_at: string;
    read_at: string | null;
    listing_id: string | null;
    bid_id: string | null;
    booking_id: string | null;
    proposal_id: string | null;
    request_id: string | null;
  }>;
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  loading: boolean;
}

/** Map notification types to their navigation destinations */
export function getNotificationLink(notification: {
  type: string;
  listing_id?: string | null;
  bid_id?: string | null;
  booking_id?: string | null;
  proposal_id?: string | null;
  request_id?: string | null;
}): string | null {
  const { type, listing_id, booking_id } = notification;

  switch (type) {
    case "new_bid_received":
    case "bid_accepted":
    case "bid_rejected":
    case "bid_expired":
    case "bidding_ending_soon":
      return listing_id ? `/rentals/${listing_id}` : null;

    case "booking_confirmed":
    case "payment_received":
      return booking_id ? "/my-trips?tab=bookings" : "/my-trips";

    case "message_received":
      return "/messages";

    case "new_proposal_received":
    case "proposal_accepted":
    case "proposal_rejected":
      return "/my-trips?tab=offers";

    case "new_travel_request_match":
    case "request_expiring_soon":
    case "travel_request_expiring_soon":
    case "travel_request_matched":
      return "/my-trips?tab=overview";

    default:
      return null;
  }
}

export function useNotificationsHook(limit = 20): UseNotificationsReturn {
  const { user } = useAuth();
  const { data: notifications, isLoading: notifLoading } = useNotificationsQuery(limit);
  const { data: unreadCount, isLoading: countLoading } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Realtime subscription for live updates
  useRealtimeSubscription({
    table: "notifications",
    event: "INSERT",
    filter: user ? `user_id=eq.${user.id}` : undefined,
    invalidateKeys: [["notifications"], ["notifications", "unread-count"]],
    enabled: !!user,
  });

  return {
    notifications: (notifications as UseNotificationsReturn["notifications"]) || [],
    unreadCount: unreadCount || 0,
    markAsRead: async (id: string) => {
      markRead.mutate(id);
    },
    markAllRead: async () => {
      markAllRead.mutate();
    },
    loading: notifLoading || countLoading,
  };
}
