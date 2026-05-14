-- ============================================================
-- Migration 080: Commission Rate — Runtime Source of Truth
-- Issue #510 (full scope)
--
-- Goals:
--   1. Generic admin_audit_log table — reusable for any
--      admin-edit auditing (not just commission changes).
--   2. Persist commission_rate_applied on each booking so a
--      future admin rate change does not retroactively
--      distort historical accounting.
--   3. Idempotent UPSERT of platform_commission_rate row to
--      {12, 2, 4} (DEC-041) — corrects any stale 15/2/5 value
--      previously seeded in migration 011.
--   4. Public read of commission rate via SECURITY DEFINER
--      function so anonymous browsers can compute prices that
--      reflect the live rate (not the build-time default).
-- ============================================================

-- 1. admin_audit_log -----------------------------------------

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES auth.users(id),
  action        TEXT NOT NULL,              -- e.g. 'update', 'create', 'delete'
  entity_type   TEXT NOT NULL,              -- e.g. 'system_setting', 'listing', 'promo_rule'
  entity_key    TEXT NOT NULL,              -- domain-specific identifier (setting_key, listing_id::text, ...)
  before_value  JSONB,
  after_value   JSONB,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_entity
  ON admin_audit_log(entity_type, entity_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_log_actor
  ON admin_audit_log(actor_user_id, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only RAV team can read or insert audit entries.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_audit_log' AND policyname = 'RAV team can read admin_audit_log'
  ) THEN
    CREATE POLICY "RAV team can read admin_audit_log"
      ON admin_audit_log FOR SELECT
      TO authenticated
      USING (public.is_rav_team(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_audit_log' AND policyname = 'RAV team can write admin_audit_log'
  ) THEN
    CREATE POLICY "RAV team can write admin_audit_log"
      ON admin_audit_log FOR INSERT
      TO authenticated
      WITH CHECK (public.is_rav_team(auth.uid()) AND actor_user_id = auth.uid());
  END IF;
END $$;

-- 2. bookings.commission_rate_applied ------------------------

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS commission_rate_applied NUMERIC(5, 4);

COMMENT ON COLUMN bookings.commission_rate_applied IS
  'The commission rate (as a decimal, e.g. 0.12 for 12%) that was in effect when this booking was created. Used so future rate changes do not retroactively distort historical accounting. Nullable for legacy bookings created before this column existed.';

-- 3. UPSERT platform_commission_rate to DEC-041 values --------
--    Corrects any stale {15, 2, 5} row left by migration 011.

INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'platform_commission_rate',
  '{"rate": 12, "pro_discount": 2, "business_discount": 4}'::jsonb,
  'Platform commission rate and tier-based discounts for owners (DEC-041). Values are percentages, not decimals.'
)
ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = EXCLUDED.setting_value,
      description   = EXCLUDED.description,
      updated_at    = NOW()
  WHERE system_settings.setting_value <> EXCLUDED.setting_value;

-- 4. Public commission-rate accessor -------------------------

CREATE OR REPLACE FUNCTION public.get_platform_commission_rate()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  _result JSONB;
BEGIN
  SELECT setting_value INTO _result
    FROM system_settings
   WHERE setting_key = 'platform_commission_rate'
   LIMIT 1;

  -- Fallback matches src/config/commission.ts DEFAULT_COMMISSION.
  RETURN COALESCE(_result, '{"rate": 12, "pro_discount": 2, "business_discount": 4}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_commission_rate() TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_platform_commission_rate() IS
  'Public accessor for the live commission rate. SECURITY DEFINER so anonymous browsers can fetch the current rate to compute prices. Returns the system_settings row or the central DEFAULT_COMMISSION fallback.';
