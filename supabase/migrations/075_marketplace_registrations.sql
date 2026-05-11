-- 075_marketplace_registrations.sql
--
-- Marketplace-facilitator tax registration tracker per US jurisdiction.
-- Compliance Brief § 3.4 requires a state-by-state registration status field
-- in the admin dashboard so RAV staff (and eventually counsel + tax pros) can
-- coordinate the 40+ state registrations required by post-Wayfair marketplace-
-- facilitator statutes. Counsel question C7 fills in the actual status values
-- per state — this migration creates the table + UI surface only.
--
-- GitHub issue #488; compliance gap analysis item P-5.

BEGIN;

-- ── Table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_registrations (
  state TEXT PRIMARY KEY CHECK (state ~ '^[A-Z]{2}$'),
  registration_status TEXT NOT NULL DEFAULT 'not_required'
    CHECK (registration_status IN ('not_required', 'pending', 'registered', 'exempt')),
  registered_date TIMESTAMPTZ,
  first_return_due TIMESTAMPTZ,
  last_return_filed TIMESTAMPTZ,
  next_return_due TIMESTAMPTZ,
  registration_id TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.marketplace_registrations IS
  'Marketplace-facilitator tax registration status per US jurisdiction. Required by Compliance Brief § 3.4. Updated only by RAV admins via the admin dashboard. See GitHub issue #488.';

COMMENT ON COLUMN public.marketplace_registrations.registration_status IS
  'not_required (default, until counsel directs), pending (registration in flight), registered (active, returns filing), exempt (counsel-confirmed no obligation).';

-- ── Seed 50 states + DC (51 jurisdictions) ─────────────────────────────────
INSERT INTO public.marketplace_registrations (state) VALUES
  ('AL'), ('AK'), ('AZ'), ('AR'), ('CA'), ('CO'), ('CT'), ('DE'), ('FL'),
  ('GA'), ('HI'), ('ID'), ('IL'), ('IN'), ('IA'), ('KS'), ('KY'), ('LA'),
  ('ME'), ('MD'), ('MA'), ('MI'), ('MN'), ('MS'), ('MO'), ('MT'), ('NE'),
  ('NV'), ('NH'), ('NJ'), ('NM'), ('NY'), ('NC'), ('ND'), ('OH'), ('OK'),
  ('OR'), ('PA'), ('RI'), ('SC'), ('SD'), ('TN'), ('TX'), ('UT'), ('VT'),
  ('VA'), ('WA'), ('WV'), ('WI'), ('WY'), ('DC')
ON CONFLICT (state) DO NOTHING;

-- ── updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_marketplace_registrations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS marketplace_registrations_updated_at ON public.marketplace_registrations;
CREATE TRIGGER marketplace_registrations_updated_at
  BEFORE UPDATE ON public.marketplace_registrations
  FOR EACH ROW EXECUTE FUNCTION public.touch_marketplace_registrations_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.marketplace_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "RAV team can read marketplace registrations" ON public.marketplace_registrations;
CREATE POLICY "RAV team can read marketplace registrations"
  ON public.marketplace_registrations FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

DROP POLICY IF EXISTS "RAV admins can update marketplace registrations" ON public.marketplace_registrations;
CREATE POLICY "RAV admins can update marketplace registrations"
  ON public.marketplace_registrations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('rav_admin', 'rav_owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('rav_admin', 'rav_owner')
    )
  );

COMMENT ON POLICY "RAV admins can update marketplace registrations" ON public.marketplace_registrations IS
  'Only rav_admin / rav_owner can update registration status. Read access is wider (any RAV team member). INSERT/DELETE are not exposed via RLS — the table is fixed-membership (51 rows seeded by Migration 075); structural changes require service-role access.';

-- ── Index ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_marketplace_registrations_status
  ON public.marketplace_registrations (registration_status);

CREATE INDEX IF NOT EXISTS idx_marketplace_registrations_next_return_due
  ON public.marketplace_registrations (next_return_due)
  WHERE next_return_due IS NOT NULL;

COMMIT;
