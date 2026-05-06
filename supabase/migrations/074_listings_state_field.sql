-- 074_listings_state_field.sql
--
-- Add a denormalized `state` column to `listings` so geo-targeted disclosures
-- (Legal Dossier § 8.7 Florida-Specific; future California per counsel question
-- C10) can be rendered without joining through properties → resorts.location
-- on every page render. Backfills from the resort.location->>'state' chain so
-- existing listings get values; new listings populate the column at insert
-- time via the ListProperty.tsx submit path.
--
-- The column is nullable in this migration; a follow-up migration will
-- convert to NOT NULL once backfill verification confirms zero NULLs in PROD.
--
-- Compliance brief item P-1; GitHub issue #486.

BEGIN;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS state TEXT;

-- Backfill from the joined resort row. listings.property_id → properties.resort_id → resorts.location->>'state'.
UPDATE public.listings AS l
SET state = upper(r.location->>'state')
FROM public.properties AS p
JOIN public.resorts AS r ON p.resort_id = r.id
WHERE l.property_id = p.id
  AND l.state IS NULL
  AND r.location->>'state' IS NOT NULL;

-- 2-letter US state code uppercase, or NULL for off-resort / pre-backfill listings.
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_state_format;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_state_format
  CHECK (state IS NULL OR state ~ '^[A-Z]{2}$');

-- Partial index — supports geo-targeted disclosure queries; skip NULL rows.
CREATE INDEX IF NOT EXISTS idx_listings_state
  ON public.listings (state)
  WHERE state IS NOT NULL;

COMMENT ON COLUMN public.listings.state IS
  '2-letter US state code (uppercase). Backfilled from resort.location->>"state" by Migration 074. Used for geo-targeted state-specific disclosures (FL § 8.7 today, CA pending counsel question C10). Nullable until backfill verification — see GitHub issue #486 for the NOT NULL follow-up.';

COMMIT;
