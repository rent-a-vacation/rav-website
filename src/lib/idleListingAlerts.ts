/**
 * Pure utility functions for idle listing alert logic.
 * Used by both the edge function (server-side) and frontend (dashboard display).
 */

export interface IdleListingInfo {
  id: string;
  check_in_date: string;
  bid_count: number;
  status: string;
  idle_alert_60d_sent_at: string | null;
  idle_alert_30d_sent_at: string | null;
  idle_alert_opt_out: boolean;
  nightly_rate: number;
  resort_name?: string;
  owner_email?: string;
  owner_name?: string;
}

export type UrgencyLevel = '60d' | '30d';

export interface IdleAction {
  label: string;
  description: string;
  type: 'reduce_price' | 'enable_bidding' | 'promote' | 'extend';
}

/** Check if a listing is idle (no bids, within threshold days of check-in) */
export function isListingIdle(
  listing: { check_in_date: string; bid_count: number; status: string },
  thresholdDays: number,
  now: Date = new Date()
): boolean {
  if (listing.status !== 'active') return false;
  if (listing.bid_count > 0) return false;

  const checkIn = new Date(listing.check_in_date + 'T00:00:00');
  const diffMs = checkIn.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays > 0 && diffDays <= thresholdDays;
}

/** Determine urgency level based on days until check-in */
export function getUrgencyLevel(
  listing: { check_in_date: string },
  now: Date = new Date()
): UrgencyLevel {
  const checkIn = new Date(listing.check_in_date + 'T00:00:00');
  const diffMs = checkIn.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return diffDays <= 30 ? '30d' : '60d';
}

/** Check if a listing needs a 60-day alert */
export function needs60dAlert(listing: IdleListingInfo, now: Date = new Date()): boolean {
  if (listing.idle_alert_opt_out) return false;
  if (listing.idle_alert_60d_sent_at) return false;
  return isListingIdle(listing, 60, now);
}

/** Check if a listing needs a 30-day alert */
export function needs30dAlert(listing: IdleListingInfo, now: Date = new Date()): boolean {
  if (listing.idle_alert_opt_out) return false;
  if (listing.idle_alert_30d_sent_at) return false;
  return isListingIdle(listing, 30, now);
}

/** Get suggested actions for an idle listing */
export function getIdleListingActions(listing: {
  nightly_rate: number;
  bid_count: number;
}): IdleAction[] {
  const actions: IdleAction[] = [];

  actions.push({
    label: 'Reduce Price',
    description: `Current rate: $${listing.nightly_rate}/night. A 10-15% discount can dramatically increase interest.`,
    type: 'reduce_price',
  });

  actions.push({
    label: 'Enable Bidding',
    description: 'Let travelers name their price — you can always decline offers below your minimum.',
    type: 'enable_bidding',
  });

  actions.push({
    label: 'Share Your Listing',
    description: 'Share on social media or with friends and family to increase visibility.',
    type: 'promote',
  });

  return actions;
}

/** Format an idle alert email body */
export function formatIdleAlertEmail(
  listing: {
    resort_name?: string;
    check_in_date: string;
    nightly_rate: number;
    id: string;
  },
  urgencyLevel: UrgencyLevel,
  baseUrl = 'https://rent-a-vacation.com'
): { subject: string; html: string } {
  const checkInDate = new Date(listing.check_in_date + 'T00:00:00');
  const formattedDate = checkInDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const daysLabel = urgencyLevel === '30d' ? '30 days' : '60 days';
  const urgencyWord = urgencyLevel === '30d' ? 'urgent' : 'important';
  const name = listing.resort_name || 'Your listing';

  const subject = urgencyLevel === '30d'
    ? `⚠️ ${name} has no bookings — check-in is in ${daysLabel}`
    : `📋 ${name} needs attention — check-in is in ${daysLabel}`;

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1a1a2e;">Your listing needs attention</h2>
  <p>Your listing <strong>${name}</strong> (check-in: ${formattedDate}) has no bookings yet, and check-in is only <strong>${daysLabel} away</strong>.</p>
  <p>This is an ${urgencyWord} reminder to take action so your week doesn't go unused.</p>

  <h3 style="color: #1a1a2e;">Suggested actions:</h3>
  <ul>
    <li><strong>Lower your price</strong> — Currently $${listing.nightly_rate}/night. A modest reduction can attract more interest.</li>
    <li><strong>Enable bidding</strong> — Let travelers make offers you can accept or decline.</li>
    <li><strong>Share your listing</strong> — Spread the word to friends, family, or social media.</li>
  </ul>

  <div style="margin: 24px 0;">
    <a href="${baseUrl}/property/${listing.id}" style="background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your Listing</a>
  </div>

  <p style="color: #666; font-size: 12px;">
    You're receiving this because you have an active listing on Rent-A-Vacation.
    <a href="${baseUrl}/owner-dashboard?tab=my-listings">Manage alert preferences</a>
  </p>
</div>`.trim();

  return { subject, html };
}
