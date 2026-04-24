-- Migration 065: Listing cancellation audit + notification type
-- #377 — turn the existing "flip status to cancelled" button into a real
-- cascade: bids rejected, bookings refunded, escrow released, notifications
-- fired. Edge fn `cancel-listing` orchestrates; this migration adds the
-- audit fields + the bidder notification type_key it dispatches.

-- ── Audit columns on listings ───────────────────────────────────────────────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS cancelled_at          timestamptz,
  ADD COLUMN IF NOT EXISTS cancellation_reason   text,
  ADD COLUMN IF NOT EXISTS cancelled_by          uuid REFERENCES public.profiles(id);

COMMENT ON COLUMN public.listings.cancelled_at IS
  'Set by cancel-listing edge fn when the owner cancels. Distinct from status=cancelled which could also come from admin moderation.';
COMMENT ON COLUMN public.listings.cancellation_reason IS
  'Free text reason the owner provided at cancel time. Surfaced to affected bidders + renters in the notification.';
COMMENT ON COLUMN public.listings.cancelled_by IS
  'User id of whoever triggered the cancellation. For owner-initiated this equals owner_id; future admin-moderation would differ.';

-- ── Index for admin filtering of recently-cancelled listings ─────────────────
CREATE INDEX IF NOT EXISTS idx_listings_cancelled_at
  ON public.listings (cancelled_at DESC NULLS LAST)
  WHERE cancelled_at IS NOT NULL;

-- ── Notification catalog: bidder receives this when a cancelled listing
-- auto-rejects their pending bid ────────────────────────────────────────────
INSERT INTO public.notification_catalog (
  type_key, display_name, description, category, opt_out_level,
  default_in_app, default_email, default_sms,
  channel_in_app_allowed, channel_email_allowed, channel_sms_allowed,
  sort_order
) VALUES (
  'listing_cancelled_by_owner',
  'Listing Cancelled by Owner',
  'A listing you had an open Offer on was cancelled by the owner. Your Offer has been rejected automatically.',
  'transactional', 'mandatory',
  true, true, false,
  true, true, false,
  18
)
ON CONFLICT (type_key) DO NOTHING;
