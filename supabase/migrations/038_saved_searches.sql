-- Migration 038: Saved Searches & Price Drop Alerts
-- Allows users to save search criteria and get notified of matching listings

-- Saved searches table
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  name TEXT,
  criteria JSONB NOT NULL,
  notify_email BOOLEAN DEFAULT true,
  last_notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);

-- RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved searches
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'saved_searches_select_own') THEN
    CREATE POLICY saved_searches_select_own ON saved_searches
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'saved_searches_insert_own') THEN
    CREATE POLICY saved_searches_insert_own ON saved_searches
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'saved_searches_delete_own') THEN
    CREATE POLICY saved_searches_delete_own ON saved_searches
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Price tracking columns on listings (for price drop alerts)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS previous_nightly_rate NUMERIC(10,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS price_changed_at TIMESTAMPTZ;
