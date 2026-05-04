-- Migration 070: Stripe chargeback ↔ internal disputes auto-mirror
-- #465 (PaySafe Gap H) — When a renter files a credit-card chargeback,
-- Stripe sends `charge.dispute.created`. Today RAV staff hand-mirrors
-- those into a disputes row, which loses time on chargeback evidence
-- windows (typically 7-21 days). Add the column the webhook handler
-- needs to make the mirror idempotent.

ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS stripe_dispute_id text;

-- Unique partial index (allows NULL for non-chargeback disputes)
CREATE UNIQUE INDEX IF NOT EXISTS idx_disputes_stripe_dispute_id_unique
  ON public.disputes (stripe_dispute_id)
  WHERE stripe_dispute_id IS NOT NULL;

COMMENT ON COLUMN public.disputes.stripe_dispute_id IS
  'Stripe charge.dispute id (dp_xxx). Set when the dispute was auto-mirrored from a Stripe chargeback. NULL for renter-/owner-filed marketplace disputes. Unique so re-firing the webhook does not create duplicate rows.';

-- ── Notification catalog entries ────────────────────────────────────────────
-- Both fire to RAV team only; mandatory transactional. No payload to renter/
-- owner — chargebacks are sensitive and need RAV-mediated communication.
INSERT INTO public.notification_catalog (
  type_key, display_name, description, category, opt_out_level,
  default_in_app, default_email, default_sms,
  channel_in_app_allowed, channel_email_allowed, channel_sms_allowed,
  sort_order
) VALUES
  (
    'stripe_chargeback_received',
    'Stripe Chargeback Received',
    'A Stripe chargeback fired and we automatically opened an internal dispute. Respond within the chargeback evidence window.',
    'transactional', 'mandatory',
    true, true, false,
    true, true, false,
    20
  ),
  (
    'stripe_chargeback_orphan',
    'Stripe Chargeback for Unknown Booking',
    'A Stripe chargeback fired but we could not match it to a booking. Manual investigation required.',
    'transactional', 'mandatory',
    true, true, false,
    true, true, false,
    21
  )
ON CONFLICT (type_key) DO NOTHING;
