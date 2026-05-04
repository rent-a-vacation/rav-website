-- Migration 066: Confirm-checkin server action infrastructure
-- #461 (PaySafe Gap A) — closes the renter check-in confirmation loop.
--
-- Adds:
--   1. notification_catalog entries for arrival-confirmed (owner-facing) +
--      checkin-issue-reported (RAV-team-facing)
--   2. checkin-photos private storage bucket + RLS policies for the optional
--      verification photo on the issue path
--   3. confirmed_at_source column on checkin_confirmations to distinguish
--      renter-confirmed vs auto-confirmed (deadline-elapsed cron from #462)
--
-- The checkin_confirmations table itself was created in
-- docs/supabase-migrations/006_owner_verification.sql (lines 190-221) and
-- already has verification_photo_path + photo_uploaded_at. No new columns
-- on that table here beyond the source enum.

-- ── Source enum ─────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'checkin_confirmation_source') THEN
    CREATE TYPE public.checkin_confirmation_source AS ENUM (
      'renter',     -- renter actively tapped Confirm Arrival
      'auto',       -- deadline elapsed; cron auto-confirmed (#462)
      'rav_admin'   -- RAV team manually marked confirmed (escape hatch)
    );
  END IF;
END $$;

ALTER TABLE public.checkin_confirmations
  ADD COLUMN IF NOT EXISTS confirmed_at_source public.checkin_confirmation_source;

COMMENT ON COLUMN public.checkin_confirmations.confirmed_at_source IS
  'How confirmed_arrival became true: renter (active tap), auto (cron after deadline, #462), or rav_admin (manual override). NULL until first confirmation.';

-- ── Storage bucket: checkin-photos ──────────────────────────────────────────
-- Private bucket. 10 MB per file. Accepts JPEG, PNG, HEIC. Renter-uploaded
-- evidence photos when reporting a check-in issue (e.g., wrong unit, locked
-- door, property in disrepair).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'checkin-photos',
  'checkin-photos',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Storage RLS ─────────────────────────────────────────────────────────────
-- Path layout: checkin-photos/{traveler_id}/{booking_id}/{filename}
-- The folder-prefix check aligns ownership with auth.uid().

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Travelers upload checkin photos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Travelers upload checkin photos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'checkin-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Travelers read own checkin photos' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Travelers read own checkin photos"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'checkin-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'RAV team reads all checkin photos' AND tablename = 'objects'
  ) THEN
    -- RAV team needs read access to investigate issues + attach to disputes.
    CREATE POLICY "RAV team reads all checkin photos"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'checkin-photos'
        AND public.is_rav_team(auth.uid())
      );
  END IF;
END $$;

-- ── Notification catalog entries ────────────────────────────────────────────
-- traveler_arrival_confirmed → owner gets the "your renter is on-site" signal.
-- traveler_reported_checkin_issue → RAV team gets a head start before any
-- formal dispute is filed (Gap C will pre-fill the dispute form from this).
INSERT INTO public.notification_catalog (
  type_key, display_name, description, category, opt_out_level,
  default_in_app, default_email, default_sms,
  channel_in_app_allowed, channel_email_allowed, channel_sms_allowed,
  sort_order
) VALUES
  (
    'traveler_arrival_confirmed',
    'Traveler Confirmed Arrival',
    'Your traveler confirmed they''ve arrived at the property — escrow timing is now on track.',
    'transactional', 'mandatory',
    true, true, false,
    true, true, false,
    18
  ),
  (
    'traveler_reported_checkin_issue',
    'Traveler Reported a Check-in Issue',
    'A traveler reported an issue at check-in. Review the details before they file a formal dispute.',
    'transactional', 'mandatory',
    true, true, false,
    true, true, false,
    19
  )
ON CONFLICT (type_key) DO NOTHING;
