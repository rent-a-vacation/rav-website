-- Migration 047: Membership Stripe Prices + Admin Override
-- Part of Epic #263: Stripe Subscription System
--
-- Adds stripe_price_id to membership_tiers for Stripe subscription integration.
-- Adds admin_override and admin_notes to user_memberships for manual tier management.
-- Stripe Price IDs must be populated after creating Products/Prices in Stripe Dashboard.

-- 1. Add stripe_price_id to membership_tiers
ALTER TABLE membership_tiers ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- 2. Add admin override fields to user_memberships
ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS admin_override BOOLEAN DEFAULT FALSE;
ALTER TABLE user_memberships ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 3. Placeholder UPDATEs for Stripe Price IDs
-- These will be updated with real price_XXX IDs after creating Products in Stripe Dashboard.
-- For now, use placeholder values that indicate they need to be set.
--
-- To update after Stripe setup:
--   UPDATE membership_tiers SET stripe_price_id = 'price_XXXX' WHERE tier_key = 'traveler_plus';
--   UPDATE membership_tiers SET stripe_price_id = 'price_XXXX' WHERE tier_key = 'traveler_premium';
--   UPDATE membership_tiers SET stripe_price_id = 'price_XXXX' WHERE tier_key = 'owner_pro';
--   UPDATE membership_tiers SET stripe_price_id = 'price_XXXX' WHERE tier_key = 'owner_business';

-- 4. Index for stripe_price_id lookups (used in webhook handlers)
CREATE INDEX IF NOT EXISTS idx_membership_tiers_stripe_price
  ON membership_tiers(stripe_price_id)
  WHERE stripe_price_id IS NOT NULL;

-- 5. Index for admin override lookups (used in webhook to skip overridden memberships)
CREATE INDEX IF NOT EXISTS idx_user_memberships_admin_override
  ON user_memberships(admin_override)
  WHERE admin_override = TRUE;

-- 6. RPC: Look up tier by Stripe Price ID (used by webhook handlers)
CREATE OR REPLACE FUNCTION get_tier_by_stripe_price(_stripe_price_id TEXT)
RETURNS TABLE(
  id UUID,
  tier_key TEXT,
  role_category TEXT,
  tier_name TEXT,
  tier_level INTEGER,
  monthly_price_cents INTEGER,
  voice_quota_daily INTEGER,
  commission_discount_pct NUMERIC(5,2),
  max_active_listings INTEGER
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mt.id, mt.tier_key, mt.role_category, mt.tier_name, mt.tier_level,
    mt.monthly_price_cents, mt.voice_quota_daily, mt.commission_discount_pct,
    mt.max_active_listings
  FROM membership_tiers mt
  WHERE mt.stripe_price_id = _stripe_price_id
  LIMIT 1;
END;
$$;

-- 7. RPC: Check listing limit for a given owner
-- Returns TRUE if owner can create another listing, FALSE if at limit
CREATE OR REPLACE FUNCTION check_listing_limit(_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _max_listings INTEGER;
  _current_count INTEGER;
BEGIN
  -- Get max_active_listings from active membership tier
  SELECT mt.max_active_listings INTO _max_listings
  FROM user_memberships um
  JOIN membership_tiers mt ON mt.id = um.tier_id
  WHERE um.user_id = _owner_id AND um.status = 'active';

  -- NULL means unlimited
  IF _max_listings IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Count current active + pending listings
  SELECT COUNT(*) INTO _current_count
  FROM listings
  WHERE owner_id = _owner_id AND status IN ('active', 'pending_approval');

  RETURN _current_count < _max_listings;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_tier_by_stripe_price(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_listing_limit(UUID) TO authenticated;
