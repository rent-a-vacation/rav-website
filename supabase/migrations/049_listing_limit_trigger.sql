-- Migration 049: Server-side listing limit enforcement trigger
-- Safety net: prevents owners from exceeding their tier's max_active_listings
-- even if frontend validation is bypassed via direct API calls.

CREATE OR REPLACE FUNCTION enforce_listing_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Only enforce on new listings with countable statuses
  IF NEW.status IN ('active', 'pending_approval') THEN
    IF NOT check_listing_limit(NEW.owner_id) THEN
      RAISE EXCEPTION 'Listing limit reached for this membership tier. Please upgrade your plan.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger fires before INSERT only (not UPDATE, to avoid blocking status changes)
CREATE TRIGGER trg_enforce_listing_limit
BEFORE INSERT ON listings
FOR EACH ROW EXECUTE FUNCTION enforce_listing_limit();
