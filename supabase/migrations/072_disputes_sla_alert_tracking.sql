-- Migration 072: SLA alert tracking on disputes
-- #464 (PaySafe Gap G) — alongside the sla_targets table (071), each
-- disputes row needs columns for the SLA monitor to track which alerts
-- have already fired (idempotency for the cron) and the snapshotted
-- target at insert time (so historical target changes don't retroactively
-- shift the SLA tick on older disputes).

ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS triage_alerted_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolution_alerted_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_triage_minutes integer,
  ADD COLUMN IF NOT EXISTS sla_resolution_minutes integer;

COMMENT ON COLUMN public.disputes.triage_alerted_at IS
  'Timestamp when the SLA monitor fired a triage-breach alert for this dispute. NULL until first breach. Idempotency guard — sla-monitor will not double-alert.';
COMMENT ON COLUMN public.disputes.resolution_alerted_at IS
  'Timestamp when the SLA monitor fired a resolution-breach alert for this dispute.';
COMMENT ON COLUMN public.disputes.sla_triage_minutes IS
  'Snapshot of the triage SLA target (in minutes) when this dispute was created. Frozen so updates to sla_targets do not retroactively shift the deadline.';
COMMENT ON COLUMN public.disputes.sla_resolution_minutes IS
  'Snapshot of the resolution SLA target (in minutes) at dispute creation.';

-- Backfill: existing open disputes get current targets from sla_targets.
UPDATE public.disputes d
SET
  sla_triage_minutes = t.triage_minutes,
  sla_resolution_minutes = t.resolution_minutes
FROM public.sla_targets t
WHERE d.category = t.category
  AND d.sla_triage_minutes IS NULL;

-- ── Trigger: snapshot SLA targets on insert ─────────────────────────────────
-- New disputes inherit the current sla_targets row at creation. Once stamped,
-- subsequent sla_targets edits won't shift this dispute's SLA tick.
CREATE OR REPLACE FUNCTION public.snapshot_dispute_sla_targets()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.sla_triage_minutes IS NULL OR NEW.sla_resolution_minutes IS NULL THEN
    SELECT triage_minutes, resolution_minutes
      INTO NEW.sla_triage_minutes, NEW.sla_resolution_minutes
      FROM public.sla_targets
      WHERE category = NEW.category;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_snapshot_dispute_sla_targets ON public.disputes;
CREATE TRIGGER trg_snapshot_dispute_sla_targets
  BEFORE INSERT ON public.disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.snapshot_dispute_sla_targets();

-- ── Notification catalog entry for SLA breach alerts ────────────────────────
INSERT INTO public.notification_catalog (
  type_key, display_name, description, category, opt_out_level,
  default_in_app, default_email, default_sms,
  channel_in_app_allowed, channel_email_allowed, channel_sms_allowed,
  sort_order
) VALUES (
  'dispute_sla_breach',
  'Dispute SLA Breach',
  'A dispute is past its triage or resolution SLA target. Action required.',
  'transactional', 'mandatory',
  true, true, false,
  true, true, false,
  22
)
ON CONFLICT (type_key) DO NOTHING;
