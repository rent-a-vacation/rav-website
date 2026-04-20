-- Migration 058: Marketplace Flow Distinction (Pre-Booked Stay vs Wish-Matched Stay)
-- DEC-034 — explicit model for the two flows
--
-- Flow 1 (pre_booked): owner has the resort reservation already. Listing goes
--   live after RAV staff verifies proof. Booking confirmed instantly on payment.
-- Flow 2 (wish_matched): listing auto-created from an accepted travel_proposal.
--   Owner has a deadline to confirm the resort reservation post-acceptance;
--   RAV staff verifies that confirmation before booking is truly active.

-- ============================================================
-- 1. source_type enum + columns
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.listing_source_type AS ENUM ('pre_booked', 'wish_matched');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS source_type listing_source_type NOT NULL DEFAULT 'pre_booked';

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS source_type listing_source_type NOT NULL DEFAULT 'pre_booked',
  ADD COLUMN IF NOT EXISTS travel_proposal_id UUID REFERENCES travel_proposals(id) ON DELETE SET NULL;

-- Index for admin queue + reporting queries
CREATE INDEX IF NOT EXISTS idx_listings_source_type ON listings(source_type);
CREATE INDEX IF NOT EXISTS idx_bookings_source_type ON bookings(source_type);
CREATE INDEX IF NOT EXISTS idx_bookings_travel_proposal_id ON bookings(travel_proposal_id)
  WHERE travel_proposal_id IS NOT NULL;

-- ============================================================
-- 2. Backfill existing auto-created wish-matched listings
-- ============================================================
-- Any listing whose notes field marks it as auto-created from a travel proposal
-- should be flagged as wish_matched for historical accuracy. The check is narrow
-- (matches the exact phrase used by useBidding.ts:559) so we don't mis-classify
-- genuine pre-booked listings.
UPDATE listings
SET source_type = 'wish_matched'
WHERE source_type = 'pre_booked'
  AND notes = 'Auto-created from accepted travel request proposal';

-- Link historical wish-matched bookings back to their originating proposals
-- (best-effort: joins on listing_id since that's the only bridge we have for
-- rows created before travel_proposal_id existed).
UPDATE bookings b
SET
  source_type = 'wish_matched',
  travel_proposal_id = tp.id
FROM travel_proposals tp
WHERE tp.listing_id = b.listing_id
  AND tp.status = 'accepted'
  AND b.source_type = 'pre_booked';

-- ============================================================
-- 3. Note on owner_confirmation_status
-- ============================================================
-- Flow 1 (pre_booked) bookings skip the owner-confirmation countdown entirely.
-- In Phase 2 (edge function branching), verify-booking-payment will set
-- booking.status = 'confirmed' directly and either (a) skip creating a
-- booking_confirmations row, or (b) create one with owner_confirmation_status
-- already set to 'owner_confirmed' and owner_confirmed_at set to now().
-- Either approach avoids adding a new enum value (ALTER TYPE ADD VALUE
-- cannot run inside a migration's implicit transaction).

-- ============================================================
-- 4. Helper RPC: is_wish_matched_booking
-- ============================================================
-- Convenience for the admin queue + reports. Returns true if a booking
-- originated from an accepted travel proposal.
CREATE OR REPLACE FUNCTION is_wish_matched_booking(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT source_type = 'wish_matched'
  FROM bookings
  WHERE id = p_booking_id;
$$;

COMMENT ON TYPE listing_source_type IS 'DEC-034: pre_booked = owner had resort reservation at list time; wish_matched = listing auto-created from accepted travel_proposal';
COMMENT ON COLUMN listings.source_type IS 'How this listing came to be. pre_booked (owner-initiated with reservation) or wish_matched (auto-created from accepted travel proposal).';
COMMENT ON COLUMN bookings.source_type IS 'Which marketplace flow produced this booking. Determines whether owner-confirmation countdown applies.';
COMMENT ON COLUMN bookings.travel_proposal_id IS 'FK to travel_proposals for wish_matched bookings; NULL for pre_booked.';
