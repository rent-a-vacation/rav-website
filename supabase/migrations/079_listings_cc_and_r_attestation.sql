-- 079_listings_cc_and_r_attestation.sql
--
-- CC&R / rental-restriction attestation (#481). Some timeshare programs
-- (notably points-based ones) restrict the owner's right to rent borrowed
-- or exchanged stays under the CC&Rs (covenants, conditions & restrictions)
-- of the resort or HOA. Without an explicit attestation from the owner,
-- RAV inherits exposure if a host lists a stay in violation of their
-- timeshare agreement.
--
-- Same workflow as Migration 052's terms-of-service audit log: owner clicks
-- a checkbox at listing-creation time, we record the timestamp. The
-- attestation says "yes, my CC&Rs permit this rental" — RAV doesn't verify
-- the CC&Rs themselves (that's the owner's responsibility, per the
-- BRAND-LOCK Don't-say lists).
--
-- Nullable for backward compatibility with existing listings; backfilled
-- below using the listing's approved_at (or created_at as fallback) so
-- pre-existing listings have a non-NULL audit value. A follow-up migration
-- can convert to NOT NULL once new-listing inserts are gated on the
-- checkbox (ListProperty.tsx already enforces this in the same PR).
--
-- GitHub issue #481; the 2026-05-04 brand+ops review identified this as
-- one of three pre-launch compliance gaps (the other two — trademark
-- disclaimer #479 and robots.txt #482 — are tracked separately).

BEGIN;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS cc_and_r_attested_at TIMESTAMPTZ;

COMMENT ON COLUMN public.listings.cc_and_r_attested_at IS
  'Timestamp when the owner attested that renting this stay complies with the resort/HOA CC&Rs (covenants, conditions & restrictions) governing their timeshare agreement. The owner is solely responsible for the truth of the attestation — RAV records it as an audit trail, does not verify CC&Rs. See GitHub issue #481.';

-- Backfill existing listings with their approved_at (or created_at) so the
-- audit trail is complete. This is a conservative defaulting choice:
-- existing listings were implicitly accepted under the prior agreement.
UPDATE public.listings
SET cc_and_r_attested_at = COALESCE(approved_at, created_at)
WHERE cc_and_r_attested_at IS NULL;

-- Index for "show me listings missing attestation" admin queries (rare,
-- mainly during the transition window).
CREATE INDEX IF NOT EXISTS idx_listings_missing_cc_and_r_attestation
  ON public.listings (id)
  WHERE cc_and_r_attested_at IS NULL;

COMMIT;
