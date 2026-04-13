-- Migration 054: Price Drop Alert Infrastructure (#283)
-- 1. Trigger to auto-track nightly_rate changes on listings
-- 2. Notification catalog entry for price_drop_alert

-- ============================================================
-- 1. Trigger function to track nightly rate changes
-- ============================================================
CREATE OR REPLACE FUNCTION track_nightly_rate_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when nightly_rate actually changed and decreased (price drop)
  IF OLD.nightly_rate IS DISTINCT FROM NEW.nightly_rate THEN
    NEW.previous_nightly_rate := OLD.nightly_rate;
    NEW.price_changed_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to listings table
DROP TRIGGER IF EXISTS track_listing_price_change ON listings;
CREATE TRIGGER track_listing_price_change
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION track_nightly_rate_change();

-- ============================================================
-- 2. Add price_drop_alert to notification catalog
-- ============================================================
INSERT INTO notification_catalog (
  type_key, display_name, description, category, opt_out_level,
  default_in_app, default_email, default_sms,
  channel_in_app_allowed, channel_email_allowed, channel_sms_allowed,
  sort_order
) VALUES (
  'price_drop_alert',
  'Price Drop Alert',
  'Notification when a listing matching your saved search drops in price',
  'marketing',
  'fully_optional',
  true, true, false,
  true, true, false,
  53
) ON CONFLICT (type_key) DO NOTHING;
