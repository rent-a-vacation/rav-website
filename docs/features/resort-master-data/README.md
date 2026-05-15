---
last_updated: "2026-05-15T00:00:00"
change_ref: "manual-edit"
change_type: "session-68-resort-master-data-readme"
status: "active"
---

# Resort Master Data — Feature README

> Catalog of **117 vacation-club resorts** (62 Hilton, 40 Marriott, 15 Disney) and 351 unit-type configurations that anchor every listing in the marketplace.

**Status:** ✅ Phase 2 complete (MVP shipped). Active follow-up workstreams under [`../mdm-resort-data/`](../mdm-resort-data/) (governance + data quality + API enhancement — see [Relationship](#relationship-with-mdm-resort-data) below).

**Planning briefs:** [`00-PROJECT-BRIEF.md`](00-PROJECT-BRIEF.md) (original spec, pre-117-jump), [`UPDATED-SESSION1-WITH-REAL-DATA.md`](UPDATED-SESSION1-WITH-REAL-DATA.md) (12× scope expansion), [`README-UPDATED.md`](README-UPDATED.md) (early structural draft — superseded by this README).

---

## What this is

A normalized catalog of vacation-club inventory that:

- Owners pick from when listing a property (cascading brand → resort → unit-type selector).
- Travelers browse and discover (`/rentals`, `/destinations/...`, featured resorts on the landing page).
- The system uses to drive the [`Fair Value Score`](../fair-value-score/), [`Maintenance Fee Calculator`](../maintenance-fee-calculator/), and resort-quiz match algorithm.

Verified facts (per [CLAUDE.md content-accuracy](../../../CLAUDE.md#content-accuracy-mandatory)):
- **117 total resorts** = 62 Hilton + 40 Marriott + 15 Disney.
- **351 unit-type configurations** across the catalog.

## Relationship with `mdm-resort-data/`

These are **the same workstream in different phases** — keep both folders, they cover different concerns:

| Folder | Phase | Concerns |
|---|---|---|
| `resort-master-data/` (this one) | Phase 2 — MVP delivery | Schema, UI, data import, listing flow |
| `mdm-resort-data/` | Post-MVP — governance | Schema hardening (WS1), data quality (WS2), API enhancement for partners (WS3) |

They reference each other correctly. Recommendation as of 2026-05-15: **do not merge** — the separation reflects two different audiences (engineers building features vs. operators governing data).

## Components & pages

| Surface | Path |
|---|---|
| Cascading resort picker (brand → resort → unit type) | `src/components/resort/ResortSelector.tsx` (uses Command for searchable list — required for 117 resorts) |
| Resort preview modal | `src/components/resort/ResortPreview.tsx` |
| Full resort details | `src/components/resort/ResortInfoCard.tsx` |
| Resort amenities grid | `src/components/resort/ResortAmenities.tsx` |
| Featured resorts on landing | `src/components/FeaturedResorts.tsx` |
| Resort quiz (interactive finder) | `src/pages/ResortQuiz.tsx` |
| Admin bulk import | `src/components/admin/AdminResortImport.tsx` |
| Admin tag/attraction editor | `src/components/admin/AdminResortTagEditor.tsx` |

## Backend

| Layer | Path | Purpose |
|---|---|---|
| Lib | `src/lib/resortImportUtils.ts` | JSON validation + bulk import orchestration |
| Lib | `src/lib/resortDataQuality.ts` | Data-quality scoring fn |
| Lib | `src/lib/resortQuiz.ts` | Resort match algorithm (quiz feature) |
| Edge fn | `supabase/functions/api-gateway/` | Public API gateway (will expose `/v1/resorts` per WS3) |
| Edge fn (shared) | `supabase/functions/_shared/api-auth.ts`, `_shared/api-response.ts` | API auth + response formatting |
| Script | `scripts/import-resort-data.ts` | Bulk import (one-shot, idempotent) |
| Script | `scripts/generate-resort-descriptions.ts` | WS2: RAV-branded description generator |
| Script | `scripts/normalise-resort-data.ts` | WS2: Country/state/time normalization |
| Script | `scripts/audit-resort-data-quality.ts` | WS2: Quality audit report |
| Script | `scripts/apply-resort-descriptions.ts` | WS2: Apply descriptions after preview |

## Database schema

| Migration | Tables | Notes |
|---|---|---|
| `20260211_resort_master_data.sql` | `resorts`, `resort_unit_types` + FKs from `properties` | MVP schema — 117 resorts + 351 unit types |
| `20260415_mdm_schema_hardening.sql` | `resort_external_ids` + governance columns added | WS1 (mdm-resort-data workstream) |

**`resorts` table** — core: `id`, `brand`, `resort_name`, `location` (JSONB), `description`, `contact` (JSONB), `resort_amenities` (array), `policies` (JSONB), `nearby_airports` (array), `guest_rating`, `main_image_url`, `additional_images`. MDM additions: `is_active`, `data_source`, `data_quality_score`, `verified_by`, `verified_at`, `latitude`, `longitude`, `postal_code`, `attraction_tags`.

**`resort_unit_types` table** — core: `id`, `resort_id`, `unit_type_name`, `bedrooms`, `bathrooms`, `max_occupancy`, `square_footage`, `kitchen_type`, `bedding_config`, `features` (JSONB), `unit_amenities`. MDM additions: `min_stay_nights`, `smoking_policy`.

**`resort_external_ids`** — partner-ID cross-reference (XPD, OTA aggregators).

**`properties` table** — has nullable `resort_id` + `unit_type_id` FKs.

## Data assets

- **`sample-data/complete-resort-data.json`** — full 117-resort dataset (62 Hilton, 40 Marriott, 15 Disney) with all 351 unit types. Used by `scripts/import-resort-data.ts`.
- **`../mdm-resort-data/data-quality-report.md`** — WS2 quality audit
- **`../mdm-resort-data/generated-descriptions-preview.json`** — WS2 description preview (large file)
- **`../mdm-resort-data/normalisation-log.md`** — WS2 normalization log

## Tests

- `src/lib/resortImportUtils.test.ts` — JSON validation, import logic
- `src/lib/resortDataQuality.test.ts` — quality scoring
- `src/lib/resortQuiz.test.ts` — match algorithm

## Related docs

- [`../mdm-resort-data/WS1-SCHEMA-HARDENING.md`](../mdm-resort-data/WS1-SCHEMA-HARDENING.md) — governance schema additions
- [`../mdm-resort-data/WS2-DATA-QUALITY.md`](../mdm-resort-data/WS2-DATA-QUALITY.md) — data quality program
- [`../mdm-resort-data/WS3-API-ENHANCEMENT.md`](../mdm-resort-data/WS3-API-ENHANCEMENT.md) — partner API enhancement
- [`../fair-value-score/README.md`](../fair-value-score/README.md) — depends on resort baseline data
- [`../../api/README.md`](../../api/README.md) — public API (will include `/v1/resorts`)
