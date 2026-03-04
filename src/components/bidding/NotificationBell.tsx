// Notification Bell - Shows unread count and recent notifications
// Uses Supabase Realtime instead of polling for instant updates

import { useState } from 'react';
import { useNotifications, useUnreadNotificationCount, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useBidding';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  Bell, 
  Check, 
  CheckCheck,
  Gavel, 
  MessageSquare, 
  CreditCard,
  Sparkles,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { NotificationType } from '@/types/bidding';

const NOTIFICATION_ICONS: Record<NotificationType, React.ReactNode> = {
  new_bid_received: <Gavel className="h-4 w-4 text-primary" />,
  bid_accepted: <Check className="h-4 w-4 text-success" />,
  bid_rejected: <Clock className="h-4 w-4 text-muted-foreground" />,
  bid_expired: <Clock className="h-4 w-4 text-muted-foreground" />,
  bidding_ending_soon: <Clock className="h-4 w-4 text-warning" />,
  new_travel_request_match: <Sparkles className="h-4 w-4 text-accent" />,
  new_proposal_received: <MessageSquare className="h-4 w-4 text-primary" />,
  proposal_accepted: <Check className="h-4 w-4 text-success" />,
  proposal_rejected: <Clock className="h-4 w-4 text-muted-foreground" />,
  request_expiring_soon: <Clock className="h-4 w-4 text-warning" />,
  booking_confirmed: <CreditCard className="h-4 w-4 text-success" />,
  payment_received: <CreditCard className="h-4 w-4 text-success" />,
  message_received: <MessageSquare className="h-4 w-4 text-primary" />,
};

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { data: notifications, isLoading } = useNotifications(10);
  const { data: unreadCount } = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  // Realtime: instant notification updates via Supabase Realtime
  useRealtimeSubscription({
    table: 'notifications',
    event: 'INSERT',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    invalidateKeys: [['notifications'], ['notifications', 'unread-count']],
    enabled: !!user,
  });

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markRead.mutate(notificationId);
    }
    // TODO: Navigate to relevant page based on notification type
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={unreadCount && unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}>
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount && unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading...
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, !!notification.read_at)}
                  className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${
                    !notification.read_at ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {NOTIFICATION_ICONS[notification.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.read_at ? 'font-medium' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!notification.read_at && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
            </div>
          )}
        </ScrollArea>

        {notifications && notifications.length > 0 && (
          <div className="p-2 border-t">
            <Button variant="ghost" size="sm" className="w-full">
              View all notifications
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
