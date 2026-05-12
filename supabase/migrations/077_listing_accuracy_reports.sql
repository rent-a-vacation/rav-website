-- 077_listing_accuracy_reports.sql
--
-- Pre-booking listing-accuracy reporting (#491). Palmer v. FantaSea Resorts
-- (NJ App. Div. 2025) awarded trebled damages when sales representatives'
-- verbal promises contradicted written contracts. The compliance brief's
-- lesson for marketplace platforms: provide a pre-booking reporting
-- mechanism so guests can flag inaccurate listings before booking.
--
-- This is intentionally a SEPARATE table from disputes:
--   * disputes is post-booking (FK to bookings.id, RLS keyed on booking owner)
--   * listing_accuracy_reports is pre-booking (FK to listings.id only)
--   * anonymous reports are allowed (reporter_id NULL is valid)
-- Overloading disputes would require making booking_id nullable + reworking
-- the existing RLS chain. Separation is cleaner and lower-risk.
--
-- GitHub issue #491; compliance-gap-analysis item P-14.

BEGIN;

-- ── Table ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.listing_accuracy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email TEXT,
  reporter_name TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'photos', 'description', 'amenities', 'pricing', 'availability',
    'location', 'cancellation_policy', 'other'
  )),
  description TEXT NOT NULL CHECK (length(description) BETWEEN 10 AND 5000),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'investigating', 'resolved_confirmed', 'resolved_corrected', 'dismissed_no_issue', 'dismissed_spam')),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Anonymous reports must provide at least an email for follow-up
  CONSTRAINT listing_accuracy_reports_anon_contact CHECK (
    reporter_id IS NOT NULL OR reporter_email IS NOT NULL
  )
);

COMMENT ON TABLE public.listing_accuracy_reports IS
  'Pre-booking accuracy complaints filed by guests browsing a listing. Distinct from post-booking disputes — no booking_id, may be anonymous. Required by compliance brief § 3.6 to limit platform liability under Palmer v. FantaSea Resorts (2025). See GitHub issue #491.';

COMMENT ON COLUMN public.listing_accuracy_reports.status IS
  'pending → investigating → (resolved_confirmed | resolved_corrected | dismissed_no_issue | dismissed_spam). resolved_confirmed = inaccuracy proven, listing remediated. resolved_corrected = host fixed the listing. dismissed_no_issue = investigation found no problem. dismissed_spam = abusive / non-genuine report.';

-- ── updated_at trigger ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.touch_listing_accuracy_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS listing_accuracy_reports_updated_at ON public.listing_accuracy_reports;
CREATE TRIGGER listing_accuracy_reports_updated_at
  BEFORE UPDATE ON public.listing_accuracy_reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_listing_accuracy_reports_updated_at();

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.listing_accuracy_reports ENABLE ROW LEVEL SECURITY;

-- Anyone (authenticated or anonymous) can INSERT — pre-booking guests aren't
-- required to be signed in to flag a problem. Spam mitigation is via the
-- 'dismissed_spam' status + the description length CHECK.
DROP POLICY IF EXISTS "Anyone can submit an accuracy report" ON public.listing_accuracy_reports;
CREATE POLICY "Anyone can submit an accuracy report"
  ON public.listing_accuracy_reports FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Authenticated users: reporter_id must match auth.uid() (no spoofing)
    -- Anonymous users: reporter_id must be NULL
    (auth.uid() IS NOT NULL AND reporter_id = auth.uid())
    OR (auth.uid() IS NULL AND reporter_id IS NULL)
  );

-- Reporters can read their own reports (authenticated only — anon has no way
-- to authenticate to retrieve later).
DROP POLICY IF EXISTS "Reporters can read their own reports" ON public.listing_accuracy_reports;
CREATE POLICY "Reporters can read their own reports"
  ON public.listing_accuracy_reports FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

-- RAV team can read all reports for triage.
DROP POLICY IF EXISTS "RAV team can read all accuracy reports" ON public.listing_accuracy_reports;
CREATE POLICY "RAV team can read all accuracy reports"
  ON public.listing_accuracy_reports FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- Only RAV admins / staff can update status + resolution.
DROP POLICY IF EXISTS "RAV team can update accuracy reports" ON public.listing_accuracy_reports;
CREATE POLICY "RAV team can update accuracy reports"
  ON public.listing_accuracy_reports FOR UPDATE
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- DELETE is not exposed via RLS. Service-role only.

COMMENT ON POLICY "Anyone can submit an accuracy report" ON public.listing_accuracy_reports IS
  'Pre-booking accuracy reports are open to all visitors (authenticated or anonymous) per the Palmer v. FantaSea-driven compliance posture. Spam control via description length CHECK + dismissed_spam status.';

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_listing_accuracy_reports_listing_id
  ON public.listing_accuracy_reports (listing_id);

CREATE INDEX IF NOT EXISTS idx_listing_accuracy_reports_status
  ON public.listing_accuracy_reports (status);

CREATE INDEX IF NOT EXISTS idx_listing_accuracy_reports_created_at
  ON public.listing_accuracy_reports (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_accuracy_reports_pending
  ON public.listing_accuracy_reports (created_at DESC)
  WHERE status = 'pending';

COMMIT;
