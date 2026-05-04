-- Migration 071: SLA targets + business hours config
-- #464 (PaySafe Gap G) — SLA targets per dispute category were documented in
-- PAYSAFE-FLOW-SPEC §6 but never enforced in code. This migration creates
-- the data tables; migration 072 + sla-monitor edge fn enforce them.
--
-- Two design choices worth noting:
--   1. SLA targets are stored as minutes (integer) so business hours / holiday
--      math can layer on top without timezone confusion.
--   2. business_hours_config is a single-row "current config" — federal
--      holidays for 2026 seeded inline. Future years can be appended.

-- ── sla_targets ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sla_targets (
  category public.dispute_category PRIMARY KEY,
  triage_minutes integer NOT NULL CHECK (triage_minutes > 0),
  first_response_minutes integer NOT NULL CHECK (first_response_minutes > 0),
  resolution_minutes integer NOT NULL CHECK (resolution_minutes > 0),
  business_hours_only boolean NOT NULL DEFAULT true,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sla_targets IS
  'Per-category SLA targets for dispute lifecycle (triage / first response / resolution). All values in minutes. business_hours_only=false means the SLA tick continues even off-hours (used for on-site categories that cannot wait until Monday).';

ALTER TABLE public.sla_targets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "RAV team reads sla_targets" ON public.sla_targets
    FOR SELECT TO authenticated USING (public.is_rav_team(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin updates sla_targets" ON public.sla_targets
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'rav_admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed with PAYSAFE-FLOW-SPEC §6 matrix
INSERT INTO public.sla_targets (
  category, triage_minutes, first_response_minutes, resolution_minutes, business_hours_only, description
) VALUES
  ('safety_concerns',          120,  240,   1440, false, 'On-site safety. 2h triage / 4h first response / 24h resolution. Off-hours override.'),
  ('owner_no_show',            120,  240,   1440, false, 'Renter on-site, owner unreachable. Same urgency as safety.'),
  ('access_issues',            120,  240,   1440, false, 'Renter on-site, cannot access. Same urgency as safety.'),
  ('property_not_as_described', 240,  720,   2880, false, 'Renter on-site, listing mismatch. 4h / 12h / 48h.'),
  ('cleanliness',              480, 1440,   7200, true,  '8h business / 24h business / 5 days.'),
  ('renter_damage',            480, 1440,  14400, true,  'Owner-filed; allow long evidence window. 8h / 24h / 10 days.'),
  ('cancellation_dispute',     480, 1440,   7200, true,  '8h / 24h / 5 days business hours.'),
  ('payment_dispute',          480, 1440,   7200, true,  'Sync with Stripe chargeback timeline if applicable.'),
  ('unauthorized_guests',     1440, 2880,  10080, true,  '24h / 48h / 7 days business hours.'),
  ('rule_violation',          1440, 2880,  10080, true,  '24h / 48h / 7 days business hours.'),
  ('late_checkout',           1440, 2880,  10080, true,  '24h / 48h / 7 days business hours.'),
  ('renter_no_show',          1440, 2880,  10080, true,  'Owner-filed; less time-critical. 24h / 48h / 7 days.'),
  ('other',                   1440, 2880,  14400, true,  '24h / 48h / 10 days catch-all.')
ON CONFLICT (category) DO NOTHING;

-- ── business_hours_config ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.business_hours_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- single-row pattern
  start_hour smallint NOT NULL DEFAULT 9 CHECK (start_hour BETWEEN 0 AND 23),
  end_hour smallint NOT NULL DEFAULT 18 CHECK (end_hour BETWEEN 0 AND 23),
  timezone text NOT NULL DEFAULT 'America/New_York',
  -- ISO 8601 dates; one entry per holiday. Re-seed annually.
  federal_holidays date[] NOT NULL DEFAULT ARRAY[]::date[],
  weekend_days smallint[] NOT NULL DEFAULT ARRAY[0, 6]::smallint[],  -- 0=Sun, 6=Sat
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.business_hours_config IS
  'Single-row config: defines the "business hours" window the SLA monitor uses for business_hours_only categories. Federal holidays must be reseeded annually.';

ALTER TABLE public.business_hours_config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "RAV team reads business_hours_config" ON public.business_hours_config
    FOR SELECT TO authenticated USING (public.is_rav_team(auth.uid()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admin updates business_hours_config" ON public.business_hours_config
    FOR UPDATE TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'rav_admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seed with the 11 stock US federal holidays for 2026
INSERT INTO public.business_hours_config (id, start_hour, end_hour, timezone, federal_holidays)
VALUES (
  1, 9, 18, 'America/New_York',
  ARRAY[
    '2026-01-01'::date,   -- New Year's Day
    '2026-01-19'::date,   -- MLK Jr. Day
    '2026-02-16'::date,   -- Presidents Day
    '2026-05-25'::date,   -- Memorial Day
    '2026-06-19'::date,   -- Juneteenth
    '2026-07-03'::date,   -- Independence Day (observed)
    '2026-09-07'::date,   -- Labor Day
    '2026-10-12'::date,   -- Columbus Day
    '2026-11-11'::date,   -- Veterans Day
    '2026-11-26'::date,   -- Thanksgiving
    '2026-12-25'::date    -- Christmas Day
  ]
)
ON CONFLICT (id) DO NOTHING;
