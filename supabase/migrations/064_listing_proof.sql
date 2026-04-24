-- Migration 064: Pre-Booked listing reservation proof workflow
-- #376 (Audit #2) — DEC-034 follow-up. Owner uploads resort-reservation
-- proof at list-creation time for Pre-Booked Stays; admin verifies before
-- listing becomes active/visible. Wish-Matched Stays are out of scope —
-- their proof path runs post-acceptance via booking_confirmations.
--
-- Anti-scam layers in v1:
--   A. confirmation number + file upload
--   B. owner attestation checkbox with legal language (stored as timestamp)
--   C. file-hash dedup — unique index rejects reuse of the same proof file
--      across owners' listings
--   D. admin manual review via AdminListings verify/reject dialog
--   G. admin phone-verification checklist (stored as admin_phone_verification_notes)
--
-- CHECK constraint is intentionally NOT enforced at the DB layer — the
-- workflow (pending_approval → verified → active) is enforced by app logic
-- + admin UI. A mixed status/source_type/proof_status CHECK would block
-- legitimate admin rework paths.

-- ── Enum ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_proof_status') THEN
    CREATE TYPE public.listing_proof_status AS ENUM (
      'not_required',  -- wish_matched listings; proof collected post-acceptance
      'required',      -- pre_booked listing submitted, owner has not uploaded yet
      'submitted',     -- owner uploaded proof, awaiting admin review
      'verified',      -- admin approved proof; listing can go active
      'rejected'       -- admin rejected; owner must re-upload. proof_rejected_reason populated.
    );
  END IF;
END $$;

-- ── Columns on listings ─────────────────────────────────────────────────────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS proof_status public.listing_proof_status
    NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS resort_confirmation_number       text,
  ADD COLUMN IF NOT EXISTS confirmation_proof_path          text,
  ADD COLUMN IF NOT EXISTS confirmation_proof_hash          text,
  ADD COLUMN IF NOT EXISTS proof_rejected_reason            text,
  ADD COLUMN IF NOT EXISTS confirmation_verified_at         timestamptz,
  ADD COLUMN IF NOT EXISTS confirmation_verified_by         uuid REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS owner_attestation_accepted_at    timestamptz,
  ADD COLUMN IF NOT EXISTS admin_phone_verification_notes   text;

COMMENT ON COLUMN public.listings.proof_status IS
  'Proof-of-reservation lifecycle for Pre-Booked listings. not_required for wish_matched (proof is post-acceptance via booking_confirmations).';
COMMENT ON COLUMN public.listings.resort_confirmation_number IS
  'Reservation confirmation number the owner received from the resort (e.g. HLT-8472291).';
COMMENT ON COLUMN public.listings.confirmation_proof_path IS
  'Supabase Storage object path within listing-proofs bucket. Private; RAV team + owner read only.';
COMMENT ON COLUMN public.listings.confirmation_proof_hash IS
  'SHA-256 of the uploaded proof file. Unique across the table so the same PDF cannot be reused on multiple owners listings.';
COMMENT ON COLUMN public.listings.owner_attestation_accepted_at IS
  'Set when owner checks the legal attestation box confirming the reservation is genuine.';
COMMENT ON COLUMN public.listings.admin_phone_verification_notes IS
  'Free text record of admin calling the resort to verify. Supports the documented verification process (#376 anti-scam layer G).';

-- ── Indexes ─────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_proof_hash_unique
  ON public.listings (confirmation_proof_hash)
  WHERE confirmation_proof_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_proof_status
  ON public.listings (proof_status)
  WHERE proof_status IN ('required', 'submitted', 'rejected');

-- ── Backfill: grandfather existing Pre-Booked listings ──────────────────────
-- Any Pre-Booked listing that is already active/booked/completed at migration
-- time predates this workflow. Mark them verified using approved_at so the
-- admin queue only surfaces genuinely new work.
UPDATE public.listings
SET
  proof_status              = 'verified',
  confirmation_verified_at  = COALESCE(approved_at, created_at),
  confirmation_verified_by  = approved_by
WHERE source_type = 'pre_booked'
  AND status IN ('active', 'booked', 'completed')
  AND proof_status = 'not_required';

-- ── Storage bucket: listing-proofs ──────────────────────────────────────────
-- Private bucket. 10 MB per file (Supabase free-tier guardrail).
-- Accepts PDF / JPEG / PNG only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-proofs',
  'listing-proofs',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Storage RLS ─────────────────────────────────────────────────────────────
-- Owners upload to listing-proofs/{owner_id}/** so the folder-prefix check
-- aligns path ownership with auth.uid().

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Owners upload listing proofs' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Owners upload listing proofs"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'listing-proofs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Owners read own listing proofs' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Owners read own listing proofs"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'listing-proofs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Owners delete own listing proofs' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Owners delete own listing proofs"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'listing-proofs'
        AND (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'RAV team reads all listing proofs' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "RAV team reads all listing proofs"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'listing-proofs'
        AND public.is_rav_team(auth.uid())
      );
  END IF;
END $$;

-- ── Notification catalog entries ────────────────────────────────────────────
-- #376 lifecycle surfaces for owners — mandatory transactional (cannot be
-- turned off) because the alternative is the owner's listing silently
-- getting stuck in "rejected" limbo.
INSERT INTO public.notification_catalog (
  type_key, display_name, description, category, opt_out_level,
  default_in_app, default_email, default_sms,
  channel_in_app_allowed, channel_email_allowed, channel_sms_allowed,
  sort_order
) VALUES
  (
    'listing_proof_rejected',
    'Reservation Proof Rejected',
    'Your uploaded reservation proof was rejected by the RAV team — please re-upload.',
    'transactional', 'mandatory',
    true, true, false,
    true, true, false,
    16
  ),
  (
    'listing_proof_verified',
    'Reservation Proof Verified',
    'The RAV team confirmed your reservation — your Listing is one step closer to going live.',
    'transactional', 'mandatory',
    true, true, false,
    true, true, false,
    17
  )
ON CONFLICT (type_key) DO NOTHING;
