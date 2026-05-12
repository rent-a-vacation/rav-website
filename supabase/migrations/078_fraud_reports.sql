-- 078_fraud_reports.sql
--
-- Fraud reporting intake (#492). FTC v. Carroll et al. (Fed. Dist. Ct. 2026)
-- entered a $140M judgment against a timeshare exit-scheme operator and made
-- clear that the FTC is actively enforcing in the timeshare space. The
-- compliance brief § 3.6 requires a fraud-reporting mechanism with a
-- documented response protocol — this migration creates the intake table
-- and a senior-admin-only triage path.
--
-- Architectural mirror of 077 (listing_accuracy_reports): separate table
-- because fraud reports may be:
--   * filed by anonymous users (not yet signed in)
--   * filed against a listing OR against a host OR generic platform fraud
--     (so listing_id is nullable)
--   * higher-severity than accuracy complaints — alerts senior admins
--
-- GitHub issue #492; compliance-gap-analysis item P-15.

BEGIN;

-- ── Table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.fraud_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- All three context FKs are nullable: a fraud report may be against a
  -- listing, against an owner profile, against a booking — or generic.
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  reported_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT,
  reporter_name TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'payment_fraud',
    'identity_fraud',
    'fake_listing',
    'phishing',
    'scam_pattern',
    'unauthorized_access',
    'timeshare_exit_scheme',
    'other'
  )),
  severity TEXT NOT NULL DEFAULT 'high'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 20 AND 10000),
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending',
      'investigating',
      'escalated_to_legal',
      'escalated_to_law_enforcement',
      'resolved_action_taken',
      'resolved_no_fraud_found',
      'dismissed_spam',
      'dismissed_duplicate'
    )),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Anonymous reports must provide at least an email for follow-up
  CONSTRAINT fraud_reports_anon_contact CHECK (
    reporter_id IS NOT NULL OR reporter_email IS NOT NULL
  )
);

COMMENT ON TABLE public.fraud_reports IS
  'Fraud-reporting intake. Required by compliance brief § 3.6 + FTC v. Carroll (2026) enforcement context. Separate from disputes because fraud may be pre-booking, anonymous, and tied to a host/listing/booking or none of the above. Senior-admin-only triage. See GitHub issue #492.';

COMMENT ON COLUMN public.fraud_reports.severity IS
  'Initial severity guess from the reporter — admin may adjust during triage. critical = active fraud in progress (e.g. payment being processed now); high = default; medium/low = circumstantial / pattern-based reports.';

COMMENT ON COLUMN public.fraud_reports.status IS
  'pending → investigating → (escalated_to_legal | escalated_to_law_enforcement | resolved_action_taken | resolved_no_fraud_found | dismissed_spam | dismissed_duplicate). Escalation paths are separate so an audit shows when RAV moved a matter outside the platform.';

COMMENT ON COLUMN public.fraud_reports.internal_notes IS
  'Admin-only notes (not shown to reporter). For tracking pattern matches across reports, coordination with law enforcement, etc.';

-- ── updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_fraud_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS fraud_reports_updated_at ON public.fraud_reports;
CREATE TRIGGER fraud_reports_updated_at
  BEFORE UPDATE ON public.fraud_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_fraud_reports_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.fraud_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated or anonymous) can INSERT — fraud reports must be
-- openly accepted to be useful. Spam mitigation via description length CHECK
-- + dismissed_spam status + admin email alerting (out of scope here).
DROP POLICY IF EXISTS "Anyone can submit a fraud report" ON public.fraud_reports;
CREATE POLICY "Anyone can submit a fraud report"
  ON public.fraud_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NOT NULL AND reporter_id = auth.uid())
    OR (auth.uid() IS NULL AND reporter_id IS NULL)
  );

-- Authenticated reporters can read their own reports — useful for "what
-- happened to my report?" UX. Anonymous reporters lose this ability (by
-- design — no way to authenticate later).
DROP POLICY IF EXISTS "Reporters can read their own fraud reports" ON public.fraud_reports;
CREATE POLICY "Reporters can read their own fraud reports"
  ON public.fraud_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- RAV admin / owner can read all reports. Note this is STRICTER than the
-- accuracy-reports policy (rav_staff can read those) because fraud reports
-- often contain sensitive third-party allegations.
DROP POLICY IF EXISTS "RAV admins can read all fraud reports" ON public.fraud_reports;
CREATE POLICY "RAV admins can read all fraud reports"
  ON public.fraud_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('rav_admin', 'rav_owner')
    )
  );

-- Only RAV admin / owner can update — investigation, escalation, resolution.
DROP POLICY IF EXISTS "RAV admins can update fraud reports" ON public.fraud_reports;
CREATE POLICY "RAV admins can update fraud reports"
  ON public.fraud_reports FOR UPDATE
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

COMMENT ON POLICY "RAV admins can read all fraud reports" ON public.fraud_reports IS
  'Senior-admin-only read. Stricter than the accuracy-reports analogue because fraud reports contain sensitive allegations about third parties.';

-- DELETE not exposed. Service-role only.

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fraud_reports_listing_id
  ON public.fraud_reports (listing_id)
  WHERE listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fraud_reports_reported_user_id
  ON public.fraud_reports (reported_user_id)
  WHERE reported_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_fraud_reports_status
  ON public.fraud_reports (status);

CREATE INDEX IF NOT EXISTS idx_fraud_reports_severity
  ON public.fraud_reports (severity);

CREATE INDEX IF NOT EXISTS idx_fraud_reports_created_at
  ON public.fraud_reports (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fraud_reports_critical_open
  ON public.fraud_reports (created_at DESC)
  WHERE severity = 'critical' AND status IN ('pending', 'investigating');

COMMIT;
