-- ============================================================
-- MDM Schema Hardening Migration
-- WS1: Resort Master Data governance fields + external ID table
-- 8 user stories — see docs/features/mdm-resort-data/WS1-SCHEMA-HARDENING.md
-- ============================================================

-- ============================================================
-- Story 1: Fix attraction_tags schema bug
-- TypeScript declares attraction_tags: string[] but the DB migration
-- never created the column. This adds it.
-- ============================================================
DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN attraction_tags TEXT[];
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- Story 2: is_active deprecation flag
-- Lets admins deactivate closed/rebranded resorts without
-- destroying historical booking data.
-- ============================================================
DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- Story 3: data_source provenance
-- Tracks where each resort record originated. All 117 existing
-- records default to 'web_scrape_2026' for the #257 legal audit.
-- ============================================================
DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN data_source VARCHAR(50) DEFAULT 'web_scrape_2026';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- Story 4: data_quality_score (stored, computed by function)
-- ============================================================
DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN data_quality_score NUMERIC(5,2) DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- Story 5: verified_by / verified_at golden-record attestation
-- ============================================================
DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN verified_by UUID REFERENCES profiles(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN verified_at TIMESTAMPTZ;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- Story 7: Geocoding — latitude, longitude, postal_code
-- ============================================================
DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN latitude NUMERIC(9,6);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN longitude NUMERIC(9,6);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN postal_code VARCHAR(20);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- Story 8: min_stay_nights + smoking_policy on unit types
-- ============================================================
DO $$ BEGIN
  ALTER TABLE resort_unit_types ADD COLUMN min_stay_nights INTEGER DEFAULT 1;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE resort_unit_types ADD COLUMN smoking_policy VARCHAR(20) DEFAULT 'non_smoking';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- ============================================================
-- Story 6: resort_external_ids cross-reference table
-- MDM pattern — maps RAV UUIDs to partner system IDs
-- ============================================================
CREATE TABLE IF NOT EXISTS resort_external_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resort_id UUID NOT NULL REFERENCES resorts(id) ON DELETE CASCADE,
  system_name VARCHAR(50) NOT NULL,
  external_id VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resort_id, system_name)
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_resort_external_ids_updated_at ON resort_external_ids;
CREATE TRIGGER update_resort_external_ids_updated_at
  BEFORE UPDATE ON resort_external_ids
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_resorts_is_active ON resorts(is_active);
CREATE INDEX IF NOT EXISTS idx_resorts_data_source ON resorts(data_source);
CREATE INDEX IF NOT EXISTS idx_resorts_lat_lng ON resorts(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resort_external_ids_resort ON resort_external_ids(resort_id);
CREATE INDEX IF NOT EXISTS idx_resort_external_ids_system ON resort_external_ids(system_name, external_id);

-- ============================================================
-- RLS for resort_external_ids
-- ============================================================
ALTER TABLE resort_external_ids ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "External IDs viewable by everyone"
    ON resort_external_ids FOR SELECT USING (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can manage external IDs"
    ON resort_external_ids FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- Story 4: Data quality scoring function
-- Calculates a 0-100 completeness score based on which key
-- fields are populated. Idempotent — safe to re-run.
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_resort_data_quality(p_resort_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 0;
  r resorts%ROWTYPE;
BEGIN
  SELECT * INTO r FROM resorts WHERE id = p_resort_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF r.resort_name IS NOT NULL AND r.resort_name != '' THEN score := score + 10; END IF;
  IF r.brand IS NOT NULL THEN score := score + 10; END IF;
  IF r.location IS NOT NULL THEN score := score + 5; END IF;
  IF r.latitude IS NOT NULL THEN score := score + 10; END IF;
  IF r.longitude IS NOT NULL THEN score := score + 10; END IF;
  IF r.postal_code IS NOT NULL THEN score := score + 5; END IF;
  IF r.description IS NOT NULL AND length(r.description) > 50 THEN score := score + 10; END IF;
  IF r.resort_amenities IS NOT NULL AND array_length(r.resort_amenities, 1) > 0 THEN score := score + 10; END IF;
  IF r.attraction_tags IS NOT NULL AND array_length(r.attraction_tags, 1) > 0 THEN score := score + 5; END IF;
  IF r.nearby_airports IS NOT NULL AND r.nearby_airports[1] != 'Local airport - contact resort for details' THEN score := score + 5; END IF;
  IF r.guest_rating IS NOT NULL THEN score := score + 5; END IF;
  IF r.policies IS NOT NULL THEN score := score + 5; END IF;
  IF r.verified_by IS NOT NULL THEN score := score + 10; END IF;

  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;
