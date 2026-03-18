/**
 * Notification utility functions.
 * Extracted for testability.
 */

/** Normalize a US phone number to E.164 format (+1XXXXXXXXXX) */
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (phone.startsWith("+") && /^\+[1-9]\d{1,14}$/.test(phone)) return phone;
  return null;
}

/** Format a destination_bucket enum value to a human-readable label */
export const DESTINATION_LABELS: Record<string, string> = {
  orlando: "Orlando",
  miami: "Miami",
  las_vegas: "Las Vegas",
  maui_hawaii: "Maui / Hawaii",
  myrtle_beach: "Myrtle Beach",
  colorado: "Colorado",
  new_york: "New York",
  nashville: "Nashville",
};

export function formatDestination(dest: string): string {
  return (
    DESTINATION_LABELS[dest] ||
    dest.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

/** Group notifications by date category */
export function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This Week";
  return "Older";
}

/** Map notification type to category filter key */
export const NOTIFICATION_TYPE_CATEGORIES: Record<string, string> = {
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
