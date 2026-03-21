---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Backend (Edge Function) - Handoff Package

**Agent:** Backend Engineer (Agent Session 2 of 4)
**Completed:** 2026-02-11
**Handoff To:** Frontend Agent (Agent Session 3)

---

## Edge Function Details

**Function Name:** `voice-search`

**Deployed URL (DEV):**
`https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search`

**Deployed URL (PROD):**
`https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/voice-search` (deploy later)

**File Location:** `supabase/functions/voice-search/index.ts`

**JWT Verification:** Disabled (public search endpoint, no auth required)

---

## IMPORTANT: Schema Differences from Project Brief

The actual database schema differs from the `00-PROJECT-BRIEF.md`. The Edge Function was built against the **actual** database, not the brief. Key differences:

| Project Brief Column | Actual DB Column | Notes |
|---------------------|------------------|-------|
| `properties.name` | `properties.resort_name` | Property name field |
| `properties.city` / `properties.state` | `properties.location` | Single location string |
| `properties.max_guests` | `properties.sleeps` | Max occupancy |
| `properties.property_type` (enum) | `properties.brand` (VacationClubBrand) | Brand enum, not property type |
| `listings.open_for_bidding` | *Does not exist* | Bidding feature not built |
| `properties.images` (JSONB objects) | `properties.images` (text[]) | Simple URL array |

The VAPI function calling schema from Agent 1 still works — the Edge Function accepts the same request parameters but maps them to the correct DB columns internally.

---

## API Documentation

### Endpoint
```
POST /functions/v1/voice-search
```

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY>  (optional — JWT verification is disabled)
```

### Request Body
```typescript
{
  destination?: string;       // Searched against properties.location and properties.resort_name
  check_in_date?: string;     // YYYY-MM-DD
  check_out_date?: string;    // YYYY-MM-DD
  min_price?: number;
  max_price?: number;
  bedrooms?: number;          // Minimum bedrooms
  property_type?: string;     // Mapped to brand filter (partial match)
  amenities?: string[];       // Must all be present in property amenities
  max_guests?: number;        // Mapped to sleeps column
  open_for_bidding?: boolean; // Accepted but ignored (column doesn't exist)
  flexible_dates?: boolean;   // If true, date filters are skipped
}
```

### VAPI Webhook Format (Also Supported)
The function also handles VAPI's server-side function call format:
```json
{
  "message": {
    "type": "function-call",
    "functionCall": {
      "name": "search_properties",
      "parameters": {
        "destination": "Maui",
        "max_price": 2000
      }
    }
  }
}
```

### Response (Success)
```json
{
  "success": true,
  "results": [
    {
      "listing_id": "uuid",
      "property_name": "Resort Name",
      "location": "Lahaina, HI",
      "check_in": "2026-03-10",
      "check_out": "2026-03-17",
      "price": 2760.00,
      "bedrooms": 2,
      "bathrooms": 2.0,
      "sleeps": 6,
      "brand": "hilton_grand_vacations",
      "amenities": ["beachfront", "pool", "wifi"],
      "image_url": "https://..."
    }
  ],
  "total_count": 1,
  "search_params": {
    "destination": "Maui",
    "max_price": 2000
  }
}
```

### Response (Error)
```json
{
  "success": false,
  "error": "Error message",
  "results": [],
  "total_count": 0
}
```

---

## Test Results

### Test 1: Basic Search (Destination Only)

**Request:**
```bash
curl -s -X POST \
  "https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91a2J4cW5seG5rYWlubmxpZ2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njg5ODgsImV4cCI6MjA4NjE0NDk4OH0.VmvlkYQgUS3w_TjDjBRL4lI_iCe2_DT-j0_L3G_ONPs" \
  -d '{"destination": "Maui"}'
```

**Response:**
```json
{"success":true,"results":[],"total_count":0,"search_params":{"destination":"Maui"}}
```

**Status:** PASS (empty results expected — database has no data)

### Test 2: Full Search (All Filters)

**Request:**
```bash
curl -s -X POST \
  "https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91a2J4cW5seG5rYWlubmxpZ2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njg5ODgsImV4cCI6MjA4NjE0NDk4OH0.VmvlkYQgUS3w_TjDjBRL4lI_iCe2_DT-j0_L3G_ONPs" \
  -d '{"destination":"Maui, HI","max_price":3000,"bedrooms":2,"amenities":["beachfront","pool"]}'
```

**Response:**
```json
{"success":true,"results":[],"total_count":0,"search_params":{"destination":"Maui, HI","max_price":3000,"bedrooms":2,"amenities":["beachfront","pool"]}}
```

**Status:** PASS

### Test 3: Search with Dates

**Request:**
```bash
curl -s -X POST \
  "https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91a2J4cW5seG5rYWlubmxpZ2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njg5ODgsImV4cCI6MjA4NjE0NDk4OH0.VmvlkYQgUS3w_TjDjBRL4lI_iCe2_DT-j0_L3G_ONPs" \
  -d '{"destination":"Orlando","check_in_date":"2026-04-05","check_out_date":"2026-04-12","max_price":2000}'
```

**Response:**
```json
{"success":true,"results":[],"total_count":0,"search_params":{"destination":"Orlando","check_in_date":"2026-04-05","check_out_date":"2026-04-12","max_price":2000}}
```

**Status:** PASS

### Test 4: CORS Preflight

**Request:**
```bash
curl -s -X OPTIONS \
  "https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search" \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" -I
```

**Response:** `200 OK` with `Access-Control-Allow-Origin: *`

**Status:** PASS

### Test 5: Error Handling (Invalid JSON)

**Request:**
```bash
curl -s -X POST \
  "https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d 'invalid json'
```

**Response:**
```json
{"success":false,"error":"Unexpected token 'i', \"invalid json\" is not valid JSON","results":[],"total_count":0}
```

**Status:** PASS

### Test 6: Empty Body (No Filters)

**Request:**
```bash
curl -s -X POST \
  "https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{}'
```

**Response:**
```json
{"success":true,"results":[],"total_count":0,"search_params":{}}
```

**Status:** PASS

---

## Deployment Logs

```
Bundling Function: voice-search
Deploying Function: voice-search (script size: 881.1kB)
Deployed Functions on project oukbxqnlxnkainnligfz: voice-search
```

**Function Status:** ACTIVE
**Version:** 3 (v1 initial, v2 schema fix, v3 actual DB schema)
**Dashboard:** https://supabase.com/dashboard/project/oukbxqnlxnkainnligfz/functions

---

## Implementation Details

### Query Strategy
- **Database-level filters:** status, price range, dates (efficient SQL filtering)
- **Application-level filters:** destination, bedrooms, brand, sleeps, amenities (post-query filtering for reliability with PostgREST joins)
- **Join:** `listings` LEFT JOIN `properties` via `property_id` → `properties.id`
- **Auth:** Uses `SUPABASE_SERVICE_ROLE_KEY` server-side to bypass RLS

### Dual Input Format
The function detects and handles two request formats:
1. **Direct API** (curl, frontend): `{ "destination": "Maui" }`
2. **VAPI webhook**: `{ "message": { "type": "function-call", "functionCall": { "parameters": {...} } } }`

### Logging
All steps are logged with `[VOICE-SEARCH]` prefix for debugging via Supabase Dashboard > Edge Functions > Logs.

---

## Frontend Integration Notes

1. **No Auth Required:** The endpoint works without JWT. Pass the anon key in the `Authorization` header or `apikey` header for Supabase routing.
2. **CORS:** Configured to allow all origins (`*`). Tighten in production.
3. **Response Shape:** The `results` array contains flattened listing+property data. Use `property_name`, `location`, `brand`, `sleeps` (not the brief's `city`, `state`, `property_type`, `max_guests`).
4. **Error Handling:** Always check `success` field. Errors return HTTP 400 with `success: false`.
5. **Empty Results:** When `success: true` but `total_count: 0`, show "No listings found" UI.

### Supabase Anon Key (DEV)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im91a2J4cW5seG5rYWlubmxpZ2Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njg5ODgsImV4cCI6MjA4NjE0NDk4OH0.VmvlkYQgUS3w_TjDjBRL4lI_iCe2_DT-j0_L3G_ONPs
```

---

## Known Issues

1. **Empty database:** No listings or properties data exists. All searches return 0 results. This is expected for beta.
2. **`open_for_bidding` not in DB:** The VAPI schema includes this parameter but the DB doesn't have it. It's accepted but silently ignored.
3. **`property_type` → `brand` mapping:** VAPI sends `property_type` ("condo", "villa"). The function does a partial string match against `brand` (e.g., "hilton_grand_vacations"). This may need refinement once real data flows.
4. **Destination search is case-insensitive substring match:** Works for "Maui", "Orlando", etc. but won't handle fuzzy/misspelled destinations. Consider adding full-text search in a future iteration.
5. **No pagination:** Returns max 20 results. Sufficient for voice search but may need pagination for frontend browse.

---

## Config Changes Made

Added to `supabase/config.toml`:
```toml
[functions.voice-search]
verify_jwt = false
```

---

## Next Steps for Frontend Agent (Session 3)

1. Install `@vapi-ai/web` npm package
2. Create `VoiceSearchButton` component on `/rentals` page
3. Use VAPI Web SDK to initiate voice sessions
4. **VAPI Assistant ID:** `af9159c9-d480-42c4-ad20-9b38431531e7`
5. Listen for `function-call` client messages to get search results
6. Display results using the response shape documented above
7. Handle loading/error states
8. Note: Use `property_name`, `location`, `brand`, `sleeps` fields (not the brief's `city`/`state`/`property_type`/`max_guests`)

---

## Files Created/Modified

| File | Action | Purpose |
|------|--------|---------|
| `supabase/functions/voice-search/index.ts` | Created | Edge Function implementation |
| `supabase/config.toml` | Modified | Added `[functions.voice-search]` with `verify_jwt = false` |
| `docs/features/voice-search/handoffs/backend-handoff.md` | Created | This handoff document |
