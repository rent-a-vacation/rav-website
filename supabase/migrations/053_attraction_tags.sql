-- Migration 053: Attraction-Based Filtering (#328)
-- Adds attraction_tags TEXT[] to resorts table for activity-based discovery
-- Tags: Beach, Theme Park, Golf, Casino, Ski, Spa, Mountain, Lake

-- ============================================================
-- 1. Add attraction_tags column to resorts
-- ============================================================
DO $$ BEGIN
  ALTER TABLE resorts ADD COLUMN attraction_tags TEXT[] DEFAULT '{}';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- GIN index for array containment queries (e.g., attraction_tags && ARRAY['Beach'])
CREATE INDEX IF NOT EXISTS idx_resorts_attraction_tags ON resorts USING gin(attraction_tags);

-- ============================================================
-- 2. Backfill resorts with attraction tags based on name/location patterns
-- ============================================================

-- Beach resorts (coastal, oceanfront, island)
UPDATE resorts SET attraction_tags = array_cat(attraction_tags, ARRAY['Beach'])
WHERE (
  resort_name ILIKE '%beach%'
  OR resort_name ILIKE '%ocean%'
  OR resort_name ILIKE '%island%'
  OR resort_name ILIKE '%surf%'
  OR resort_name ILIKE '%bay%'
  OR resort_name ILIKE '%shore%'
  OR resort_name ILIKE '%coast%'
  OR resort_name ILIKE '%lagoon%'
  OR resort_name ILIKE '%palm%'
  OR resort_name ILIKE '%coral%'
  OR resort_name ILIKE '%ko olina%'
  OR resort_name ILIKE '%wailea%'
  OR resort_name ILIKE '%waikoloa%'
  OR resort_name ILIKE '%hawaiian village%'
  OR resort_name ILIKE '%flamingo%'
  OR resort_name ILIKE '%aruba%'
  OR resort_name ILIKE '%cancun%'
  OR resort_name ILIKE '%key west%'
  OR resort_name ILIKE '%myrtle%'
  OR resort_name ILIKE '%daytona%'
  OR resort_name ILIKE '%maui%'
  OR resort_name ILIKE '%kauai%'
  OR resort_name ILIKE '%hilton head%'
  OR resort_name ILIKE '%cabo%'
  OR resort_name ILIKE '%puerto%'
  OR resort_name ILIKE '%virgin%'
  OR resort_name ILIKE '%seaside%'
  OR resort_name ILIKE '%sandcastle%'
  OR (location->>'state' IN ('HI') AND NOT resort_name ILIKE '%mountain%')
)
AND NOT ('Beach' = ANY(attraction_tags));

-- Theme Park resorts (Disney, Orlando area near parks)
UPDATE resorts SET attraction_tags = array_cat(attraction_tags, ARRAY['Theme Park'])
WHERE (
  resort_name ILIKE '%disney%'
  OR resort_name ILIKE '%animal kingdom%'
  OR resort_name ILIKE '%epcot%'
  OR resort_name ILIKE '%bonnet creek%'
  OR resort_name ILIKE '%solterra%'
  OR (resort_name ILIKE '%orlando%' AND brand = 'disney_vacation_club')
  OR (brand = 'disney_vacation_club')
)
AND NOT ('Theme Park' = ANY(attraction_tags));

-- Golf resorts
UPDATE resorts SET attraction_tags = array_cat(attraction_tags, ARRAY['Golf'])
WHERE (
  resort_name ILIKE '%golf%'
  OR resort_name ILIKE '%grande vista%'
  OR resort_name ILIKE '%waikoloa%'
  OR resort_name ILIKE '%scottsdale%'
  OR resort_name ILIKE '%desert%'
  OR resort_name ILIKE '%plantation%'
  OR resort_name ILIKE '%hilton head%'
  OR resort_name ILIKE '%pinehurst%'
  OR resort_name ILIKE '%kiawah%'
)
AND NOT ('Golf' = ANY(attraction_tags));

-- Casino resorts (Las Vegas, Atlantic City, Reno)
UPDATE resorts SET attraction_tags = array_cat(attraction_tags, ARRAY['Casino'])
WHERE (
  resort_name ILIKE '%las vegas%'
  OR resort_name ILIKE '%elara%'
  OR resort_name ILIKE '%flamingo%'
  OR resort_name ILIKE '%atlantic city%'
  OR resort_name ILIKE '%reno%'
  OR resort_name ILIKE '%tahoe%'
  OR (location->>'city' ILIKE '%las vegas%')
  OR (location->>'city' ILIKE '%atlantic city%')
)
AND NOT ('Casino' = ANY(attraction_tags));

-- Ski resorts
UPDATE resorts SET attraction_tags = array_cat(attraction_tags, ARRAY['Ski'])
WHERE (
  resort_name ILIKE '%ski%'
  OR resort_name ILIKE '%park city%'
  OR resort_name ILIKE '%whistler%'
  OR resort_name ILIKE '%breckenridge%'
  OR resort_name ILIKE '%vail%'
  OR resort_name ILIKE '%aspen%'
  OR resort_name ILIKE '%mammoth%'
  OR resort_name ILIKE '%steamboat%'
  OR resort_name ILIKE '%telluride%'
  OR resort_name ILIKE '%tahoe%'
  OR resort_name ILIKE '%big sky%'
  OR resort_name ILIKE '%snowmass%'
)
AND NOT ('Ski' = ANY(attraction_tags));

-- Spa resorts
UPDATE resorts SET attraction_tags = array_cat(attraction_tags, ARRAY['Spa'])
WHERE (
  resort_name ILIKE '%spa%'
  OR resort_name ILIKE '%sedona%'
  OR resort_name ILIKE '%wailea%'
  OR resort_name ILIKE '%grand wailea%'
  OR resort_name ILIKE '%canyon%'
  OR resort_name ILIKE '%sanctuary%'
  OR resort_name ILIKE '%wellness%'
)
AND NOT ('Spa' = ANY(attraction_tags));

-- Mountain resorts
UPDATE resorts SET attraction_tags = array_cat(attraction_tags, ARRAY['Mountain'])
WHERE (
  resort_name ILIKE '%mountain%'
  OR resort_name ILIKE '%lodge%'
  OR resort_name ILIKE '%ridge%'
  OR resort_name ILIKE '%summit%'
  OR resort_name ILIKE '%highland%'
  OR resort_name ILIKE '%smoky%'
  OR resort_name ILIKE '%gatlinburg%'
  OR resort_name ILIKE '%pigeon forge%'
  OR resort_name ILIKE '%blue ridge%'
  OR resort_name ILIKE '%sedona%'
  OR (location->>'state' IN ('CO', 'UT', 'MT', 'WY') AND NOT resort_name ILIKE '%beach%')
)
AND NOT ('Mountain' = ANY(attraction_tags));

-- Lake resorts
UPDATE resorts SET attraction_tags = array_cat(attraction_tags, ARRAY['Lake'])
WHERE (
  resort_name ILIKE '%lake%'
  OR resort_name ILIKE '%lakeside%'
  OR resort_name ILIKE '%tahoe%'
  OR resort_name ILIKE '%ozark%'
  OR resort_name ILIKE '%waterfront%'
)
AND NOT ('Lake' = ANY(attraction_tags));
