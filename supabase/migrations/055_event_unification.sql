-- ============================================================
-- Migration 055: Event Unification (#338 / prep for #339)
-- ------------------------------------------------------------
-- Unifies the static `src/lib/events.ts` curated events with
-- the DB-backed seasonal_events / event_instances tables so
-- staff can manage events from admin UI without code changes.
--
-- Changes:
--   1. seasonal_events gains: slug (unique), icon, is_nationwide,
--      search_destinations (free-form text[] for renter search).
--   2. event_instances gains: end_date (nullable; NULL = single day).
--      destination becomes NULLABLE for events not tied to an SMS
--      destination_bucket. UNIQUE constraint is replaced with two
--      partial unique indexes to tolerate NULLs.
--   3. Backfill: 14 curated events + 2026 instances migrated from
--      src/lib/events.ts.
--   4. RPC get_curated_events(p_year) for renter-facing filter.
-- ============================================================

-- ============================================================
-- 1. EXTEND seasonal_events
-- ============================================================

ALTER TABLE public.seasonal_events
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS icon TEXT,
  ADD COLUMN IF NOT EXISTS is_nationwide BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS search_destinations TEXT[] NOT NULL DEFAULT '{}';

-- Unique slug (deferred to an index to allow NULL during backfill for
-- any legacy rows that pre-dated slugs).
CREATE UNIQUE INDEX IF NOT EXISTS idx_seasonal_events_slug
  ON public.seasonal_events(slug)
  WHERE slug IS NOT NULL;

-- ============================================================
-- 2. EXTEND event_instances
-- ============================================================

ALTER TABLE public.event_instances
  ADD COLUMN IF NOT EXISTS end_date DATE;

-- Make destination nullable (was NOT NULL). Search-only events (e.g.,
-- Park City / Sundance) have no SMS destination_bucket.
ALTER TABLE public.event_instances
  ALTER COLUMN destination DROP NOT NULL;

-- Replace the UNIQUE(event_id, destination, year) constraint with two
-- partial unique indexes that tolerate NULL destination.
DO $$
DECLARE
  con_name TEXT;
BEGIN
  SELECT conname INTO con_name
  FROM pg_constraint
  WHERE conrelid = 'public.event_instances'::regclass
    AND contype = 'u'
    AND pg_get_constraintdef(oid) LIKE '%(event_id, destination, year)%';
  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.event_instances DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_instances_event_dest_year
  ON public.event_instances(event_id, destination, year)
  WHERE destination IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_event_instances_event_year_nodest
  ON public.event_instances(event_id, year)
  WHERE destination IS NULL;

-- ============================================================
-- 3. BACKFILL — 14 curated events from src/lib/events.ts
-- ============================================================
-- Use slug as idempotency key. Only inserts if missing.

DO $$
DECLARE
  v_event_id UUID;
BEGIN
  -- Sundance Film Festival
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Sundance Film Festival', 'sundance-2026', 'Film', 'local_events', 'annual_fixed', false, true, ARRAY['Park City'], 1, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'sundance-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, NULL, 2026, '2026-01-22', '2026-02-01', 'medium', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Super Bowl LX
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Super Bowl LX', 'super-bowl-lx', 'Trophy', 'sports_events', 'annual_floating', false, false, ARRAY['Santa Clara', 'San Francisco', 'San Jose'], 2, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'super-bowl-lx';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, NULL, 2026, '2026-02-04', '2026-02-10', 'high', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Mardi Gras
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Mardi Gras', 'mardi-gras-2026', 'PartyPopper', 'local_events', 'annual_floating', false, true, ARRAY['New Orleans', 'Orlando', 'Miami'], 2, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'mardi-gras-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES
    (v_event_id, 'orlando', 2026, '2026-02-12', '2026-02-18', 'medium', 'active', true, 'Backfilled'),
    (v_event_id, 'miami',   2026, '2026-02-12', '2026-02-18', 'medium', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Spring Break East
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Spring Break (East Coast)', 'spring-break-east', 'Sun', 'school_breaks', 'annual_floating', false, false, ARRAY['Orlando', 'Miami', 'Tampa', 'Myrtle Beach', 'Daytona Beach'], 3, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'spring-break-east';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES
    (v_event_id, 'orlando',      2026, '2026-03-07', '2026-03-21', 'high', 'active', true, 'Backfilled'),
    (v_event_id, 'miami',        2026, '2026-03-07', '2026-03-21', 'high', 'active', true, 'Backfilled'),
    (v_event_id, 'myrtle_beach', 2026, '2026-03-07', '2026-03-21', 'high', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Spring Break West
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Spring Break (West Coast)', 'spring-break-west', 'Sun', 'school_breaks', 'annual_floating', false, false, ARRAY['Cancun', 'Cabo San Lucas', 'Maui', 'Oahu', 'San Diego'], 3, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'spring-break-west';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES
    (v_event_id, 'maui_hawaii', 2026, '2026-03-14', '2026-03-28', 'high', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- The Masters
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('The Masters', 'masters-golf-2026', 'Flag', 'sports_events', 'annual_fixed', false, true, ARRAY['Hilton Head', 'Myrtle Beach', 'Charleston'], 4, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'masters-golf-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, 'myrtle_beach', 2026, '2026-04-06', '2026-04-12', 'medium', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Memorial Day
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Memorial Day Weekend', 'memorial-day-2026', 'Flag', 'major_holidays', 'annual_floating', true, false, ARRAY[]::TEXT[], 5, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'memorial-day-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, NULL, 2026, '2026-05-22', '2026-05-26', 'high', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Summer Peak
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Summer Peak Season', 'summer-peak-2026', 'Sun', 'weather_peak_season', 'annual_fixed', true, false, ARRAY[]::TEXT[], 6, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'summer-peak-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, NULL, 2026, '2026-06-15', '2026-08-15', 'medium', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Fourth of July
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Fourth of July', 'fourth-of-july-2026', 'Sparkles', 'major_holidays', 'annual_fixed', true, false, ARRAY[]::TEXT[], 7, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'fourth-of-july-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, NULL, 2026, '2026-06-27', '2026-07-06', 'high', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Labor Day
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Labor Day Weekend', 'labor-day-2026', 'Palmtree', 'major_holidays', 'annual_floating', true, false, ARRAY[]::TEXT[], 9, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'labor-day-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, NULL, 2026, '2026-09-04', '2026-09-08', 'high', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Halloween at the Parks
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Halloween at the Parks', 'halloween-orlando-2026', 'Ghost', 'local_events', 'annual_fixed', false, true, ARRAY['Orlando'], 10, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'halloween-orlando-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, 'orlando', 2026, '2026-10-24', '2026-11-01', 'medium', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Thanksgiving Week
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Thanksgiving Week', 'thanksgiving-2026', 'UtensilsCrossed', 'major_holidays', 'annual_floating', true, false, ARRAY[]::TEXT[], 11, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'thanksgiving-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, NULL, 2026, '2026-11-21', '2026-11-29', 'urgent', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Ski Season (Dec 2026 – Mar 2027)
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Ski Season', 'ski-season-2026', 'Snowflake', 'weather_peak_season', 'annual_fixed', false, true, ARRAY['Vail', 'Breckenridge', 'Aspen', 'Steamboat Springs', 'Park City', 'Lake Tahoe'], 12, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'ski-season-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, 'colorado', 2026, '2026-12-01', '2027-03-31', 'high', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;

  -- Holiday Season
  INSERT INTO public.seasonal_events (name, slug, icon, category, recurrence_type, is_nationwide, is_location_fixed, search_destinations, typical_month, active, notes)
  VALUES ('Holiday Season', 'holiday-season-2026', 'Gift', 'major_holidays', 'annual_fixed', true, false, ARRAY[]::TEXT[], 12, true, 'Backfilled from events.ts')
  ON CONFLICT (slug) WHERE slug IS NOT NULL DO NOTHING;
  SELECT id INTO v_event_id FROM public.seasonal_events WHERE slug = 'holiday-season-2026';
  INSERT INTO public.event_instances (event_id, destination, year, event_date, end_date, priority, status, date_confirmed, notes)
  VALUES (v_event_id, NULL, 2026, '2026-12-19', '2027-01-03', 'urgent', 'active', true, 'Backfilled')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================
-- 4. RPC: get_curated_events(p_year)
-- ============================================================
-- Returns one row per seasonal_event for the given year, with the
-- earliest start_date and latest end_date across its instances.
-- Powers the renter-facing events filter on Rentals page.

CREATE OR REPLACE FUNCTION public.get_curated_events(p_year INT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  icon TEXT,
  category public.event_category,
  recurrence_type public.recurrence_type,
  is_nationwide BOOLEAN,
  search_destinations TEXT[],
  year INT,
  start_date DATE,
  end_date DATE
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH target AS (
    SELECT COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INT) AS y
  )
  SELECT
    se.id,
    se.slug,
    se.name,
    se.icon,
    se.category,
    se.recurrence_type,
    se.is_nationwide,
    se.search_destinations,
    t.y AS year,
    MIN(ei.event_date) AS start_date,
    MAX(COALESCE(ei.end_date, ei.event_date)) AS end_date
  FROM public.seasonal_events se
  JOIN public.event_instances ei ON ei.event_id = se.id
  CROSS JOIN target t
  WHERE se.active = true
    AND ei.status = 'active'
    AND ei.year = t.y
    AND se.slug IS NOT NULL
  GROUP BY se.id, t.y
  ORDER BY MIN(ei.event_date);
$$;

GRANT EXECUTE ON FUNCTION public.get_curated_events(INT) TO authenticated, anon;

-- ============================================================
-- Done.
-- ============================================================
