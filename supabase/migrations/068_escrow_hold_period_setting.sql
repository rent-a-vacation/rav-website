-- Migration 068: HOLD_PERIOD_DAYS to system_settings
-- #468 (PaySafe Gap D) — escrow auto-release hold period was hardcoded as
-- `const HOLD_PERIOD_DAYS = 5;` in process-escrow-release/index.ts. That meant
-- ops could not tune it without a code change + redeploy. Move it to
-- system_settings so it's visible to admin and changeable at runtime.
--
-- Default value preserved at 5 days (matches the prior code constant; matches
-- PAYSAFE-FLOW-SPEC §4.1).

INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES (
  'escrow_hold_period_days',
  '{"days": 5}'::jsonb,
  'Number of days after a booking check-out date before escrow funds auto-release to the owner. Default: 5. Changes apply on the next process-escrow-release run.'
)
ON CONFLICT (setting_key) DO NOTHING;
