-- Migration 057: Tier Features (#278-#282)
-- Adds schema support for 5 tier-gated features:
--   #278: Early Access (no schema change — uses listings.created_at)
--   #279: Exclusive Deals — is_exclusive_deal on listings
--   #280: Priority Placement (no schema change — uses owner tier join)
--   #281: Concierge Support — concierge_requests table
--   #282: Account Manager — account_manager_id on profiles

-- ============================================================
-- #279: Exclusive Deals flag on listings
-- ============================================================
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_exclusive_deal BOOLEAN DEFAULT false;

-- ============================================================
-- #281: Concierge Support for Premium Travelers
-- ============================================================
CREATE TABLE IF NOT EXISTS concierge_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  traveler_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'booking_help', 'complaint', 'recommendation')),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES profiles(id),
  resolution_notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_concierge_requests_traveler ON concierge_requests(traveler_id);
CREATE INDEX IF NOT EXISTS idx_concierge_requests_status ON concierge_requests(status);
CREATE INDEX IF NOT EXISTS idx_concierge_requests_assigned ON concierge_requests(assigned_to);

-- RLS
ALTER TABLE concierge_requests ENABLE ROW LEVEL SECURITY;

-- Travelers can read and create their own requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'concierge_requests_select_own') THEN
    CREATE POLICY concierge_requests_select_own ON concierge_requests
      FOR SELECT USING (auth.uid() = traveler_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'concierge_requests_insert_own') THEN
    CREATE POLICY concierge_requests_insert_own ON concierge_requests
      FOR INSERT WITH CHECK (auth.uid() = traveler_id);
  END IF;
END $$;

-- RAV staff/admin can do everything
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'concierge_requests_staff_all') THEN
    CREATE POLICY concierge_requests_staff_all ON concierge_requests
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM user_roles
          WHERE user_id = auth.uid()
          AND role IN ('rav_admin', 'rav_staff', 'rav_owner')
        )
      );
  END IF;
END $$;

-- Updated_at trigger
CREATE TRIGGER set_concierge_requests_updated_at
  BEFORE UPDATE ON concierge_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- #282: Account Manager on profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS account_manager_id UUID REFERENCES profiles(id);
