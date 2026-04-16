---
last_updated: "2026-04-16T01:58:25"
change_ref: "9945546"
change_type: "manual-edit"
status: "active"
---

# WS1 — Resort Master Data: Schema Hardening
## Agent Task Prompt for Claude Code

---

## Your Role
You are a senior backend engineer working on the Rent-A-Vacation (RAV) platform. Your job in this session is to harden the resort master data schema to support MDM (Master Data Management) governance and future third-party API integrations (e.g. XPD and OTA-compatible partners).

**Complete Phase 1 (user stories) before writing any code. Present the stories, wait for approval, then implement.**

---

## Context You Must Read First

Before doing anything else, read these files in order:

1. `docs/PROJECT-HUB.md` — current platform status and key decisions
2. `supabase/migrations/20260211_resort_master_data.sql` — the existing resort schema you are extending
3. `src/types/database.ts` — the TypeScript type definitions (look at the `Resort` and `ResortUnitType` interfaces)
4. `docs/features/resort-master-data/sample-data/complete-resort-data.json` — first 5 records only, to understand current data shape
5. `src/lib/resortImportUtils.ts` — the existing import validation logic you must update

---

## Background: Why This Work Exists

RAV scraped resort data from public brand websites (Hilton, Marriott, Disney) to seed its ResortIQ database. The schema was built for MVP listing functionality. We are now preparing for:
- Third-party API integrations (partners need clean, versioned resort data)
- Long-term data governance (who owns the golden record, how do changes get tracked)
- OTA (OpenTravel Alliance) standard alignment (industry interoperability)

An OTA mapping audit identified the following gaps that this workstream must close.

---

## Phase 1: Write User Stories (DO THIS FIRST — do not write code yet)

Write user stories in this format for each item below. Present all stories to the user before proceeding.

```
AS A [role]
I WANT [capability]
SO THAT [business outcome]

Acceptance Criteria:
- [ ] criterion 1
- [ ] criterion 2
```

Write stories for these 8 changes:

**Story 1** — `attraction_tags` schema bug fix
The TypeScript `Resort` interface has `attraction_tags: string[]` but the DB migration does not have this column. This causes silent runtime failures.

**Story 2** — `is_active` flag
Resorts close, rebrand, or merge. We need to deprecate them without deleting historical booking data.

**Story 3** — `data_source` field
Each resort record should know where its data came from (web scrape, admin entry, owner submission, partner feed) for audit and triage purposes.

**Story 4** — `data_quality_score` computed field
A completeness score (0–100) showing what percentage of key fields are populated. Drives admin prioritisation of data cleanup work.

**Story 5** — `verified_by` and `verified_at` fields
Links each golden record to the admin who reviewed and vouched for its accuracy. Required for acquisition due diligence.

**Story 6** — `resort_external_ids` cross-reference table
A separate table mapping RAV resort UUIDs to IDs in partner systems (XPD, OTA aggregators, etc.). This is the MDM pattern for external ID management — do NOT add partner IDs to the resorts table itself.

**Story 7** — `lat/lng` and `postal_code`
Required for map display, proximity search, and tax jurisdiction calculation.

**Story 8** — `min_stay_nights`, `smoking_policy` on resort_unit_types
OTA standard fields required for bookable property listings.

---

## Phase 2: Implementation (after user story approval)

### Migration file
Create: `supabase/migrations/20260415_mdm_schema_hardening.sql`

Follow the exact pattern of `20260211_resort_master_data.sql`:
- Use `DO $$ BEGIN ... EXCEPTION WHEN ... THEN NULL; END $$;` blocks for safe column additions
- Add indexes for columns used in WHERE clauses
- Add RLS policies for new tables
- Add `updated_at` trigger on any new table
- Never drop or rename existing columns — additive only

**SQL changes required:**

```sql
-- 1. Fix attraction_tags bug
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS attraction_tags TEXT[];

-- 2. MDM governance columns
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS data_source VARCHAR(50) DEFAULT 'web_scrape_2026';
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS data_quality_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- 3. Location enrichment
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
ALTER TABLE resorts ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- 4. Unit type policy fields
ALTER TABLE resort_unit_types ADD COLUMN IF NOT EXISTS min_stay_nights INTEGER DEFAULT 1;
ALTER TABLE resort_unit_types ADD COLUMN IF NOT EXISTS smoking_policy VARCHAR(20) DEFAULT 'non_smoking';

-- 5. External ID cross-reference table
CREATE TABLE IF NOT EXISTS resort_external_ids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resort_id UUID NOT NULL REFERENCES resorts(id) ON DELETE CASCADE,
  system_name VARCHAR(50) NOT NULL,
  external_id VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resort_id, system_name)
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_resorts_is_active ON resorts(is_active);
CREATE INDEX IF NOT EXISTS idx_resorts_data_source ON resorts(data_source);
CREATE INDEX IF NOT EXISTS idx_resorts_lat_lng ON resorts(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resort_external_ids_resort ON resort_external_ids(resort_id);
CREATE INDEX IF NOT EXISTS idx_resort_external_ids_system ON resort_external_ids(system_name, external_id);

-- 7. RLS for resort_external_ids
ALTER TABLE resort_external_ids ENABLE ROW LEVEL SECURITY;
CREATE POLICY "External IDs viewable by everyone" ON resort_external_ids FOR SELECT USING (true);
CREATE POLICY "Only admins can manage external IDs" ON resort_external_ids FOR ALL WITH CHECK (auth.role() = 'service_role');

-- 8. Data quality scoring function
CREATE OR REPLACE FUNCTION calculate_resort_data_quality(resort_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 0;
  r resorts%ROWTYPE;
BEGIN
  SELECT * INTO r FROM resorts WHERE id = resort_id;
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
```

### TypeScript type updates
Update `src/types/database.ts`:
1. Add `resort_external_ids` table to `Database` type (Row, Insert, Update, Relationships)
2. Update the `Resort` interface — add: `is_active`, `data_source`, `data_quality_score`, `verified_by`, `verified_at`, `latitude`, `longitude`, `postal_code`
3. Add `ResortExternalId` interface
4. Update `resort_summary` view type to include `is_active`

### Import validation update
Update `src/lib/resortImportUtils.ts`:
1. Add optional fields to `ResortImportRow`: `latitude`, `longitude`, `postal_code`, `data_source`
2. Add validation: latitude must be -90 to 90, longitude must be -180 to 180
3. Add `data_source` to template JSON in `generateTemplateJson()`

---

## Phase 3: Testing

Write tests in `src/lib/resortImportUtils.test.ts`:
- `validateResortJson` accepts records with new optional fields
- `validateResortJson` rejects out-of-range lat/lng values
- `validateResortJson` still accepts records without new fields (backward compat)

Run: `npm run test -- resortImportUtils`
Then: `npm run test` (full suite)
Then: `npm run build`

---

## Phase 4: SDLC Completion

1. Commit: `feat(mdm): add schema hardening migration for MDM governance fields`
2. Create GitHub issue:
   ```bash
   gh issue create --repo tektekgo/rentavacation \
     --title "WS1 complete: MDM schema hardening — 8 user stories implemented" \
     --label "enhancement,database" \
     --body "[list migration file, columns added, tables created]"
   ```
3. Update `docs/PROJECT-HUB.md` KEY DECISIONS LOG:
   ```
   [DATE] — MDM schema hardening: Added is_active, data_source, data_quality_score,
   verified_by/at, lat/lng, postal_code to resorts. Added resort_external_ids table.
   Fixed attraction_tags schema bug. Migration: 20260415_mdm_schema_hardening.sql
   ```

---

## Success Criteria

- [ ] Migration applies cleanly with no errors
- [ ] All 8 user stories written, approved, and implemented
- [ ] `attraction_tags` column exists in DB (bug fixed)
- [ ] `resort_external_ids` table created with correct RLS
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] `resortImportUtils.ts` updated with new validation
- [ ] All existing tests still pass; new tests written
- [ ] PROJECT-HUB.md updated

---

## Constraints

- Do NOT modify existing column names or types — additive only
- Do NOT modify `20260211_resort_master_data.sql` — create a NEW migration
- Do NOT populate data — WS2 handles data quality
- Do NOT touch `public-api.yaml` or API gateway — WS3 handles that
- All new columns must have safe defaults (existing 117 records must not break)
