-- Migration 052: Terms & Conditions Acceptance Audit Trail
-- Provides a permanent, queryable record of every T&C acceptance event.
-- Replaces the (unreliable) hardcoded auth metadata approach with a proper audit table.

-- ============================================================
-- PART 1: terms_acceptance_log table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.terms_acceptance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Which version they accepted
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,

  -- What they accepted
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_accepted BOOLEAN NOT NULL DEFAULT false,
  age_verified BOOLEAN NOT NULL DEFAULT false,

  -- When and how
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acceptance_method TEXT NOT NULL CHECK (acceptance_method IN (
    'signup_checkbox',      -- accepted at signup
    'post_approval_gate',   -- accepted at first login after approval
    'terms_update_prompt'   -- accepted after T&C version update (future)
  )),

  -- Audit context
  user_agent TEXT,
  ip_address INET,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terms_log_user ON public.terms_acceptance_log(user_id, accepted_at DESC);
CREATE INDEX IF NOT EXISTS idx_terms_log_version ON public.terms_acceptance_log(terms_version);

-- ============================================================
-- PART 2: New columns on profiles
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_terms_version TEXT DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS current_privacy_version TEXT DEFAULT '1.0';

-- ============================================================
-- PART 3: RLS policies
-- ============================================================

ALTER TABLE public.terms_acceptance_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'terms_log_select_own') THEN
    CREATE POLICY terms_log_select_own ON public.terms_acceptance_log
      FOR SELECT TO authenticated
      USING (user_id = auth.uid() OR public.is_rav_team(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'terms_log_insert_own') THEN
    CREATE POLICY terms_log_insert_own ON public.terms_acceptance_log
      FOR INSERT TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- PART 4: Backfill existing approved users
-- ============================================================

-- Create acceptance records for all existing approved users.
-- Use their signup timestamp as accepted_at (we don't have the exact moment).
INSERT INTO public.terms_acceptance_log (
  user_id, terms_version, privacy_version,
  terms_accepted, privacy_accepted, age_verified,
  accepted_at, acceptance_method
)
SELECT
  id,
  '1.0',
  '1.0',
  true,
  true,
  true,
  created_at,
  'signup_checkbox'
FROM public.profiles
WHERE approval_status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM public.terms_acceptance_log
    WHERE user_id = public.profiles.id
  );

-- Mark all existing approved users as onboarding complete.
-- They pre-date this system; don't force them through the onboarding gate.
UPDATE public.profiles
SET
  onboarding_completed_at = created_at,
  current_terms_version = '1.0',
  current_privacy_version = '1.0'
WHERE approval_status = 'approved'
  AND onboarding_completed_at IS NULL;
