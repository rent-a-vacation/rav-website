/**
 * Full Notifications Page — /notifications
 * GitHub Issue: #221
 *
 * All authenticated users. Category/status filters, date grouping, pagination.
 */

import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useNotificationsHook, getNotificationLink } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Check,
  CheckCheck,
  Gavel,
  MessageSquare,
  CreditCard,
  Sparkles,
  Clock,
  UserCheck,
  Settings,
  Inbox,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";

type CategoryFilter = "all" | "bookings" | "bids" | "travel_requests" | "reminders" | "system";
type StatusFilter = "all" | "unread" | "read";

const NOTIFICATION_TYPE_CATEGORIES: Record<string, CategoryFilter> = {
  booking_confirmed: "bookings",
  payment_received: "bookings",
  new_bid_received: "bids",
  bid_accepted: "bids",
  bid_rejected: "bids",
  bid_expired: "bids",
  bidding_ending_soon: "bids",
  new_proposal_received: "travel_requests",
  proposal_accepted: "travel_requests",
  proposal_rejected: "travel_requests",
  new_travel_request_match: "travel_requests",
  request_expiring_soon: "travel_requests",
  travel_request_expiring_soon: "travel_requests",
  travel_request_matched: "travel_requests",
  message_received: "system",
  seasonal_sms_12wk: "reminders",
  seasonal_sms_6wk: "reminders",
  seasonal_sms_2wk: "reminders",
};

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  new_bid_received: <Gavel className="h-4 w-4 text-primary" />,
  bid_accepted: <Check className="h-4 w-4 text-green-600" />,
  bid_rejected: <Clock className="h-4 w-4 text-muted-foreground" />,
  bid_expired: <Clock className="h-4 w-4 text-muted-foreground" />,
  bidding_ending_soon: <Clock className="h-4 w-4 text-amber-500" />,
  new_travel_request_match: <Sparkles className="h-4 w-4 text-accent" />,
  new_proposal_received: <MessageSquare className="h-4 w-4 text-primary" />,
  proposal_accepted: <Check className="h-4 w-4 text-green-600" />,
  proposal_rejected: <Clock className="h-4 w-4 text-muted-foreground" />,
  request_expiring_soon: <Clock className="h-4 w-4 text-amber-500" />,
  booking_confirmed: <CreditCard className="h-4 w-4 text-green-600" />,
  payment_received: <CreditCard className="h-4 w-4 text-green-600" />,
  message_received: <MessageSquare className="h-4 w-4 text-primary" />,
  role_upgrade_approved: <UserCheck className="h-4 w-4 text-green-600" />,
  travel_request_expiring_soon: <Clock className="h-4 w-4 text-amber-500" />,
  travel_request_matched: <Sparkles className="h-4 w-4 text-accent" />,
};

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isThisWeek(date)) return "This Week";
  return "Older";
}

const DATE_GROUP_ORDER = ["Today", "Yesterday", "This Week", "Older"];

const Notifications = () => {
  usePageMeta({
    title: "Notifications",
    description: "View and manage your notifications",
    canonicalPath: "/notifications",
  });

  const navigate = useNavigate();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { notifications, unreadCount, markAsRead, markAllRead, loading } = useNotificationsHook(100);

  // Filter notifications
  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (categoryFilter !== "all") {
        const cat = NOTIFICATION_TYPE_CATEGORIES[n.type] || "system";
        if (cat !== categoryFilter) return false;
      }
      if (statusFilter === "unread" && n.read_at) return false;
      if (statusFilter === "read" && !n.read_at) return false;
      return true;
    });
  }, [notifications, categoryFilter, statusFilter]);

  // Paginate
  const paginated = filtered.slice(0, page * perPage);
  const hasMore = paginated.length < filtered.length;

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, typeof paginated> = {};
    for (const n of paginated) {
      const group = getDateGroup(n.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(n);
    }
    return groups;
  }, [paginated]);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
    const link = getNotificationLink(notification);
    if (link) {
      navigate(link);
    }
  };

  const categories: Array<{ value: CategoryFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "bookings", label: "Bookings" },
    { value: "bids", label: "Bids" },
    { value: "travel_requests", label: "RAV Wishes" },
    { value: "reminders", label: "Reminders" },
    { value: "system", label: "System" },
  ];

  const statuses: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "unread", label: "Unread" },
    { value: "read", label: "Read" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 pt-16 md:pt-20">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {unreadCount} unread
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllRead}>
                  <CheckCheck className="h-4 w-4 mr-1.5" />
                  Mark all read
                </Button>
              )}
              <Link to="/settings/notifications">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1.5" />
                  Preferences
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar filters */}
            <div className="md:w-48 flex-shrink-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Category</h3>
                  <div className="flex flex-wrap md:flex-col gap-1">
                    {categories.map((cat) => (
                      <Button
                        key={cat.value}
                        variant={categoryFilter === cat.value ? "default" : "ghost"}
                        size="sm"
                        className="justify-start"
                        onClick={() => { setCategoryFilter(cat.value); setPage(1); }}
                      >
                        {cat.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Status</h3>
                  <div className="flex flex-wrap md:flex-col gap-1">
                    {statuses.map((s) => (
                      <Button
                        key={s.value}
                        variant={statusFilter === s.value ? "default" : "ghost"}
                        size="sm"
                        className="justify-start"
                        onClick={() => { setStatusFilter(s.value); setPage(1); }}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Loading notifications...
                </div>
              ) : filtered.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium mb-1">You're all caught up</h3>
                    <p className="text-muted-foreground text-sm">
                      No notifications to show.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {DATE_GROUP_ORDER.filter((g) => grouped[g]).map((group) => (
                    <div key={group}>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {group}
                      </h3>
                      <div className="space-y-1">
                        {grouped[group].map((notification) => {
                          const link = getNotificationLink(notification);
                          return (
                            <button
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`w-full text-left p-4 rounded-lg border transition-colors hover:bg-muted/50 ${
                                !notification.read_at
                                  ? "bg-primary/5 border-primary/20"
                                  : "bg-card border-border"
                              }`}
                            >
                              <div className="flex gap-3">
                                <div className="flex-shrink-0 mt-0.5">
                                  {NOTIFICATION_ICONS[notification.type] || (
                                    <Bell className="h-4 w-4 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p
                                      className={`text-sm ${
                                        !notification.read_at ? "font-semibold" : "font-medium"
                                      }`}
                                    >
                                      {notification.title}
                                    </p>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {!notification.read_at && (
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                      )}
                                      {link && (
                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatDistanceToNow(new Date(notification.created_at), {
                                      addSuffix: true,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {hasMore && (
                    <div className="text-center pt-4">
                      <Button variant="outline" onClick={() => setPage((p) => p + 1)}>
                        Load more
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Notifications;
