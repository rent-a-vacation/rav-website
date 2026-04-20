-- Migration 059: Notification catalog entries for Wish-Matched Stay lifecycle
-- DEC-034 Phase 4 — adds three notification type_keys so wish-matched travelers
-- get visibility into the owner-confirmation process after they accept an Offer.

INSERT INTO public.notification_catalog (
  type_key, display_name, description, category, opt_out_level,
  default_in_app, default_email, default_sms,
  channel_in_app_allowed, channel_email_allowed, channel_sms_allowed,
  sort_order
) VALUES
  (
    'wish_owner_confirming',
    'Owner Confirming Your Booking',
    'Your Wish-Matched booking is awaiting the owner''s resort confirmation. Sent right after payment.',
    'transactional', 'mandatory',
    true, true, false,
    true, true, false,
    14
  ),
  (
    'wish_owner_confirmed',
    'Wish-Matched Booking Confirmed',
    'The owner has confirmed their resort reservation — your stay is locked in.',
    'transactional', 'mandatory',
    true, true, false,
    true, true, false,
    15
  ),
  (
    'wish_owner_failed_to_confirm',
    'Wish-Matched Booking Could Not Be Confirmed',
    'The owner could not confirm the resort reservation in time. Your booking is cancelled and your payment is being refunded.',
    'transactional', 'mandatory',
    true, true, false,
    true, true, false,
    16
  )
ON CONFLICT (type_key) DO NOTHING;
