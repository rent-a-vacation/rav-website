---
last_updated: "2026-04-27T19:34:52"
change_ref: "611f7c5"
change_type: "manual-edit"
status: "active"
---

# WS3 — Resort Master Data: Public API Enhancement
## Agent Task Prompt for Claude Code

---

## Your Role
You are a senior API engineer working on the Rent-A-Vacation (RAV) platform. Your job in this session is to extend the public resort API to expose the full MDM-enriched resort data, add partner-friendly features (delta sync, external ID lookup), and ensure the API specification is OTA-aligned and ready for third-party integrations like XPD.

**Complete Phase 1 (user stories) before writing any code. Present the stories, wait for approval, then implement.**

---

## Prerequisites
WS1 and WS2 must be complete. Verify:
- Migration `20260415_mdm_schema_hardening.sql` has been applied
- `resort_external_ids` table exists
- `data_quality_score`, `is_active`, `data_source` columns exist on `resorts`

---

## Context You Must Read First

Before doing anything else, read these files in order:

1. `docs/PROJECT-HUB.md` — current platform status and key decisions
2. `docs/api/public-api.yaml` — the existing public API spec you are extending
3. `supabase/functions/api-gateway/index.ts` — the Edge Function you are modifying
4. `supabase/functions/_shared/api-auth.ts` — shared auth middleware pattern
5. `supabase/functions/_shared/api-response.ts` — shared response formatting pattern
6. `docs/brand-assets/BRAND-LOCK.md` — ensure API documentation uses correct RAV terminology

---

## Background: Why This Work Exists

RAV has a working public API (`/v1/resorts`) returning a thin resort listing. We need to:
1. Expose the full MDM-enriched resort record (all new fields from WS1)
2. Add `?updated_since=` for partner delta sync
3. Add brand and active-only filtering
4. Create a new endpoint for external ID lookup (how XPD maps their resort IDs to RAV)
5. Update the OpenAPI spec with OTA field cross-references

The primary consumer is third-party integration partners. Secondary consumer is the RAV frontend (ResortSelector and property listing flow).

---

## Phase 1: Write User Stories (DO THIS FIRST — do not write code yet)

Write user stories in this format. Present all stories before proceeding.

```
AS A [role]
I WANT [capability]
SO THAT [business outcome]

Acceptance Criteria:
- [ ] criterion 1
- [ ] criterion 2
```

Write stories for these 6 deliverables:

**Story 1** — Full resort record in GET /v1/resorts
As an integration partner, I want the resort endpoint to return all enriched fields (description, amenities, policies, lat/lng, postal_code, attraction_tags, data_quality_score) — so I have everything I need without a second API call.

**Story 2** — Active-only filter (default on)
As an integration partner, I want GET /v1/resorts to return only active resorts by default, with optional `?include_inactive=true` — so I don't accidentally surface deprecated resorts.

**Story 3** — Brand filter
As an integration partner, I want to filter by `?brand=hilton_grand_vacations` — so I can retrieve only relevant resorts for my use case.

**Story 4** — Delta sync via `?updated_since`
As an integration partner, I want `GET /v1/resorts?updated_since=2026-01-01T00:00:00Z` to return only resorts modified after that timestamp — so I can sync efficiently without pulling the full dataset on every poll.

**Story 5** — External ID lookup endpoint
As an integration partner, I want `GET /v1/resorts/by-external-id?system=xpd&id=XPD-12345` to return the matching RAV resort — so I can map my internal resort IDs to RAV golden records without maintaining a local lookup table.

**Story 6** — OTA-aligned OpenAPI documentation
As a developer integrating with RAV, I want the API spec to include OTA field name cross-references in field descriptions — so I know how each RAV field maps to industry standards.

---

## Phase 2: Implementation (after user story approval)

### Deliverable 1–4: Extend GET /v1/resorts

Modify `supabase/functions/api-gateway/index.ts`, updating the `/v1/resorts` handler.

**This is a Supabase Edge Function running on Deno. Route handling is done with if/else on `pathname` and `method`. Follow existing patterns exactly.**

**Updated query:**
```typescript
const url = new URL(req.url);
const page = parseInt(url.searchParams.get('page') || '1');
const perPage = Math.min(parseInt(url.searchParams.get('per_page') || '20'), 50);
const brand = url.searchParams.get('brand');
const updatedSince = url.searchParams.get('updated_since');
const includeInactive = url.searchParams.get('include_inactive') === 'true';

let query = supabase
  .from('resorts')
  .select(`
    id, resort_name, brand, description, location,
    latitude, longitude, postal_code,
    resort_amenities, attraction_tags, policies, nearby_airports,
    guest_rating, data_quality_score, is_active, updated_at,
    resort_unit_types (
      id, unit_type_name, bedrooms, bathrooms, max_occupancy,
      square_footage, kitchen_type, unit_amenities, min_stay_nights, smoking_policy
    )
  `, { count: 'exact' });

if (!includeInactive) query = query.eq('is_active', true);
if (brand) query = query.eq('brand', brand);
if (updatedSince) query = query.gte('updated_at', updatedSince);

const from = (page - 1) * perPage;
query = query.range(from, from + perPage - 1).order('resort_name');
```

**Response transform — flatten location JSONB with OTA field comments:**
```typescript
const transformed = resorts.map(r => ({
  id: r.id,
  name: r.resort_name,                        // OTA: HotelName
  brand: r.brand,                              // OTA: ChainCode
  description: r.description,                  // OTA: HotelDescriptiveText
  is_active: r.is_active,
  location: {
    address: r.location?.full_address || null, // OTA: AddressLine
    city: r.location?.city,                    // OTA: CityName
    state: r.location?.state,                  // OTA: StateProv
    country: r.location?.country,              // OTA: CountryName (ISO 3166-1 alpha-2)
    postal_code: r.postal_code,                // OTA: PostalCode
    latitude: r.latitude,                      // OTA: Latitude
    longitude: r.longitude,                    // OTA: Longitude
  },
  amenities: r.resort_amenities || [],          // OTA: HotelAmenity
  attraction_tags: r.attraction_tags || [],
  policies: {
    check_in: r.policies?.check_in || null,    // OTA: CheckInTime
    check_out: r.policies?.check_out || null,  // OTA: CheckOutTime
    pets: r.policies?.pets || null,            // OTA: PetPolicy
    parking: r.policies?.parking || null,      // OTA: ParkingPolicy
  },
  nearby_airports: r.nearby_airports || [],
  guest_rating: r.guest_rating,
  data_quality_score: r.data_quality_score,
  updated_at: r.updated_at,
  unit_types: (r.resort_unit_types || []).map(ut => ({
    id: ut.id,
    name: ut.unit_type_name,                   // OTA: RoomType
    bedrooms: ut.bedrooms,                     // OTA: Bedrooms
    bathrooms: ut.bathrooms,
    max_occupancy: ut.max_occupancy,           // OTA: MaxOccupancy
    square_footage: ut.square_footage,         // OTA: Size
    kitchen_type: ut.kitchen_type,             // OTA: KitchenType
    amenities: ut.unit_amenities || [],
    min_stay_nights: ut.min_stay_nights,       // OTA: MinimumStay
    smoking_policy: ut.smoking_policy,         // OTA: SmokingPolicy
  })),
}));
```

### Deliverable 5: New endpoint GET /v1/resorts/by-external-id

Add a new route handler in `api-gateway/index.ts`:

```typescript
if (pathname === '/v1/resorts/by-external-id' && method === 'GET') {
  const system = url.searchParams.get('system');
  const externalId = url.searchParams.get('id');

  if (!system || !externalId) {
    return errorResponse(400, 'invalid_request', 'Both system and id query parameters are required');
  }

  const { data: mapping } = await supabase
    .from('resort_external_ids')
    .select('resort_id')
    .eq('system_name', system)
    .eq('external_id', externalId)
    .single();

  if (!mapping) {
    return errorResponse(404, 'not_found', `No resort found for ${system}:${externalId}`);
  }

  // Fetch full resort record using mapped resort_id
  // Use same select shape as /v1/resorts, filtered to single record
  // Return as { data: transformedResort, api_version: 'v1' }
}
```

### Deliverable 6: Update public-api.yaml

Update **both** copies: `docs/api/public-api.yaml` AND `public/api/public-api.yaml` (they must be identical).

**Add to GET /v1/resorts parameters:**
```yaml
- name: brand
  in: query
  schema:
    type: string
    enum:
      - hilton_grand_vacations
      - marriott_vacation_club
      - disney_vacation_club
      - wyndham_destinations
      - hyatt_residence_club
      - bluegreen_vacations
      - holiday_inn_club
      - worldmark
      - other
  description: Filter by vacation club brand (OTA ChainCode equivalent)

- name: updated_since
  in: query
  schema:
    type: string
    format: date-time
  description: |
    Return only resorts updated after this ISO 8601 timestamp.
    Use for delta sync — store the `updated_at` from your last sync
    and pass it here on subsequent calls.
  example: "2026-01-01T00:00:00Z"

- name: include_inactive
  in: query
  schema:
    type: boolean
    default: false
  description: Include inactive/deprecated resorts (default false)
```

**Update ResortsResponse schema** to include all new fields with OTA field name cross-references in `description` fields.

**Add new path entry:**
```yaml
/v1/resorts/by-external-id:
  get:
    operationId: getResortByExternalId
    tags: [Destinations]
    summary: Look up a RAV resort by partner system ID
    description: |
      Maps an external system's resort identifier to the RAV golden record.
      Use this to integrate external resort IDs without maintaining a local
      cross-reference table.
    parameters:
      - name: system
        in: query
        required: true
        schema:
          type: string
        description: Partner system name (e.g. 'xpd', 'expedia')
        example: "xpd"
      - name: id
        in: query
        required: true
        schema:
          type: string
        description: The partner's resort ID
        example: "XPD-12345"
    responses:
      '200':
        description: Matching resort record
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SingleResortResponse'
      '400':
        description: Missing system or id parameter
      '404':
        description: No resort found for this external ID
      '401':
        $ref: '#/components/responses/Unauthorized'
```

---

## Phase 3: Testing

Write or update tests for the api-gateway:

- GET /v1/resorts returns `is_active`, `data_quality_score`, `latitude`, `longitude` fields
- GET /v1/resorts?brand=hilton_grand_vacations returns only HGV resorts
- GET /v1/resorts?updated_since=2020-01-01 returns all records
- GET /v1/resorts (default) excludes inactive resorts
- GET /v1/resorts/by-external-id?system=xpd&id=UNKNOWN returns 404
- GET /v1/resorts/by-external-id with missing params returns 400
- All responses include `api_version: "v1"`

Run: `npm run test` then `npm run build`

---

## Phase 4: SDLC Completion

1. Commit: `feat(api): extend /v1/resorts with MDM fields, delta sync, external ID lookup`
2. Create GitHub issue:
   ```bash
   gh issue create --repo tektekgo/rentavacation \
     --title "WS3 complete: Public API enhanced with MDM fields and partner integration features" \
     --label "enhancement,api" \
     --body "[new params: brand, updated_since, include_inactive. New endpoint: by-external-id. Spec updated with OTA field references.]"
   ```
3. Update `docs/PROJECT-HUB.md` KEY DECISIONS LOG:
   ```
   [DATE] — MDM API: /v1/resorts now returns full MDM-enriched record including lat/lng,
   quality score, all policies, unit type details. Added ?brand, ?updated_since,
   ?include_inactive filters. New endpoint /v1/resorts/by-external-id for partner ID lookup.
   public-api.yaml updated with OTA field cross-references.
   ```
4. Update `docs/api/README.md` to document the new endpoints

---

## Success Criteria

- [ ] All 6 user stories written, approved, and implemented
- [ ] GET /v1/resorts returns full MDM-enriched record (lat/lng, quality score, all policies, unit type details)
- [ ] `?brand=` filter works correctly
- [ ] `?updated_since=` returns only modified records
- [ ] `?include_inactive=false` (default) excludes inactive resorts
- [ ] GET /v1/resorts/by-external-id returns correct resort or 404
- [ ] `public-api.yaml` updated in BOTH `docs/api/` and `public/api/` (must be identical)
- [ ] OTA field cross-references documented in API spec
- [ ] All tests pass
- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] PROJECT-HUB.md updated

---

## Constraints

- Do NOT modify `openapi.yaml` (internal edge functions spec) — only `public-api.yaml`
- Do NOT break existing response shape — all new fields are additive
- Do NOT expose `verified_by` (user UUID) in public API — internal governance field only
- Do NOT expose `data_source` in public API — internal governance field only
- Do NOT touch `/v1/listings` or `/v1/search` endpoints
- Rate limiting on existing endpoints must not change
- All changes must be backward compatible — existing API clients must not break
- The Edge Function runs on Deno — use Deno-compatible imports and patterns from existing code
