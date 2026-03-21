---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# AGENT 2: Backend Engineer

**Role:** Supabase Edge Function Specialist  
**Mission:** Build voice search API endpoint  
**Deliverables:** Deployed Edge Function, API docs, test results  
**Estimated Time:** 2-3 hours

---

## Your Responsibilities

You are the **Backend Engineer** on this project. Your job is to:

1. ✅ Create Supabase Edge Function: `voice-search`
2. ✅ Implement search logic (query listings + properties tables)
3. ✅ Handle VAPI function calling requests
4. ✅ Deploy to Supabase DEV environment
5. ✅ Test with curl/Postman
6. ✅ Deliver handoff package with API documentation

---

## Context You Need

**Read these documents:**
1. **Project Brief** (`00-PROJECT-BRIEF.md`) - Architecture and database schema
2. **VAPI Handoff** (from Agent 1) - Function calling contract and test queries

**Key Information:**
- **Supabase DEV:** `oukbxqnlxnkainnligfz`
- **Supabase PROD:** `xzfllqndrlmhclqfybew` (deploy later)
- **Database:** PostgreSQL with RLS (Row Level Security)
- **Primary Tables:** `listings` (search target), `properties` (joined for details)
- **Deployment:** Use `npx supabase functions deploy voice-search --project-ref oukbxqnlxnkainnligfz`

---

## What This Edge Function Does

```
┌─────────────────────────────────────────────────────────┐
│              EDGE FUNCTION FLOW                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Receive POST Request from VAPI                       │
│     Body: {                                              │
│       destination: "Maui, HI",                           │
│       max_price: 2000,                                   │
│       bedrooms: 2,                                       │
│       amenities: ["beachfront"]                          │
│     }                                                    │
│                                                          │
│  2. Build SQL Query                                      │
│     SELECT listings.*, properties.*                      │
│     FROM listings                                        │
│     JOIN properties ON listings.property_id = properties.id│
│     WHERE status = 'active'                              │
│       AND properties.city ILIKE '%Maui%'                 │
│       AND final_price <= 2000                            │
│       AND bedrooms >= 2                                  │
│       AND amenities @> '["beachfront"]'::jsonb          │
│                                                          │
│  3. Execute Query (Supabase Client)                      │
│                                                          │
│  4. Format Results                                       │
│     {                                                    │
│       success: true,                                     │
│       results: [5 listings],                             │
│       total_count: 5                                     │
│     }                                                    │
│                                                          │
│  5. Return JSON Response to VAPI                         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Database Schema Reference

### **listings table**
```sql
- id: UUID (primary key)
- property_id: UUID (foreign key → properties)
- status: enum (draft | pending | active | sold | cancelled)
- check_in_date: DATE
- check_out_date: DATE
- final_price: NUMERIC(10,2)  -- What travelers pay
- open_for_bidding: BOOLEAN
- cancellation_policy: enum
```

### **properties table**
```sql
- id: UUID (primary key)
- name: VARCHAR(255)
- city: VARCHAR(100)
- state: VARCHAR(50)
- bedrooms: INTEGER
- bathrooms: NUMERIC(3,1)
- max_guests: INTEGER
- property_type: enum (condo | villa | cabin | studio)
- amenities: JSONB  -- Array: ["beachfront", "pool", "wifi"]
- images: JSONB
```

---

## Technical Requirements

### **File Location**
```
supabase/functions/voice-search/index.ts
```

### **Expected Request**
```typescript
interface VoiceSearchRequest {
  destination?: string;           // "Maui, HI"
  check_in_date?: string;         // "2026-03-10"
  check_out_date?: string;        // "2026-03-17"
  min_price?: number;             // 500
  max_price?: number;             // 2000
  bedrooms?: number;              // 2
  property_type?: "condo" | "villa" | "cabin" | "studio" | "any";
  amenities?: string[];           // ["beachfront", "pool"]
  max_guests?: number;            // 6
  open_for_bidding?: boolean;     // true
  flexible_dates?: boolean;       // false
}
```

### **Expected Response**
```typescript
interface VoiceSearchResponse {
  success: boolean;
  results: Array<{
    listing_id: string;
    property_name: string;
    city: string;
    state: string;
    check_in: string;
    check_out: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    property_type: string;
    amenities: string[];
    image_url: string | null;
    open_for_bidding: boolean;
  }>;
  total_count: number;
  search_params: VoiceSearchRequest;
  error?: string;  // Only if success = false
}
```

---

## Implementation Guide

### **Step 1: Create Edge Function File**

```bash
# In project root
npx supabase functions new voice-search
```

This creates: `supabase/functions/voice-search/index.ts`

### **Step 2: Implement Search Logic**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VoiceSearchRequest {
  destination?: string;
  check_in_date?: string;
  check_out_date?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  property_type?: string;
  amenities?: string[];
  max_guests?: number;
  open_for_bidding?: boolean;
  flexible_dates?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: VoiceSearchRequest = await req.json();
    const {
      destination,
      check_in_date,
      check_out_date,
      min_price,
      max_price,
      bedrooms,
      property_type,
      amenities,
      max_guests,
      open_for_bidding,
      flexible_dates,
    } = body;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
    let query = supabase
      .from("listings")
      .select(`
        id,
        check_in_date,
        check_out_date,
        final_price,
        open_for_bidding,
        cancellation_policy,
        property:properties (
          id,
          name,
          city,
          state,
          bedrooms,
          bathrooms,
          max_guests,
          property_type,
          amenities,
          images
        )
      `)
      .eq("status", "active");

    // Apply filters
    if (destination) {
      // Search in city or state
      query = query.or(
        `property.city.ilike.%${destination}%,property.state.ilike.%${destination}%`
      );
    }

    if (min_price) {
      query = query.gte("final_price", min_price);
    }

    if (max_price) {
      query = query.lte("final_price", max_price);
    }

    if (bedrooms) {
      query = query.gte("property.bedrooms", bedrooms);
    }

    if (property_type && property_type !== "any") {
      query = query.eq("property.property_type", property_type);
    }

    if (max_guests) {
      query = query.gte("property.max_guests", max_guests);
    }

    if (open_for_bidding !== undefined) {
      query = query.eq("open_for_bidding", open_for_bidding);
    }

    // Amenities filter (JSONB array contains)
    if (amenities && amenities.length > 0) {
      // This requires the property amenities to contain all specified amenities
      query = query.contains("property.amenities", amenities);
    }

    // Date filtering (if dates provided and not flexible)
    if (check_in_date && check_out_date && !flexible_dates) {
      query = query
        .lte("check_in_date", check_in_date)
        .gte("check_out_date", check_out_date);
    }

    // Execute query
    const { data: listings, error } = await query;

    if (error) {
      throw error;
    }

    // Format results
    const results = listings?.map((listing) => ({
      listing_id: listing.id,
      property_name: listing.property.name,
      city: listing.property.city,
      state: listing.property.state,
      check_in: listing.check_in_date,
      check_out: listing.check_out_date,
      price: listing.final_price,
      bedrooms: listing.property.bedrooms,
      bathrooms: listing.property.bathrooms,
      property_type: listing.property.property_type,
      amenities: listing.property.amenities || [],
      image_url: listing.property.images?.[0]?.url || null,
      open_for_bidding: listing.open_for_bidding,
    })) || [];

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        results,
        total_count: results.length,
        search_params: body,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Voice search error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        results: [],
        total_count: 0,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
```

### **Step 3: Deploy to Supabase DEV**

**Important:** The user must have Docker Desktop running.

```bash
# From project root
npx supabase functions deploy voice-search --project-ref oukbxqnlxnkainnligfz
```

If deployment fails with Docker error, tell the user:
- Start Docker Desktop
- Wait for it to fully initialize
- Retry deployment command

### **Step 4: Test the Edge Function**

**Test with curl:**

```bash
# Basic search (destination only)
curl -X POST \
  https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "destination": "Maui"
  }'

# Full search (all filters)
curl -X POST \
  https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "destination": "Maui, HI",
    "max_price": 3000,
    "bedrooms": 2,
    "amenities": ["beachfront", "pool"]
  }'

# Search with dates
curl -X POST \
  https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "destination": "Orlando",
    "check_in_date": "2026-04-05",
    "check_out_date": "2026-04-12",
    "max_price": 2000
  }'
```

**Note:** Since the database is empty, results will be empty `[]`. That's OK - the structure should work.

**Optional:** Insert mock data to test queries properly.

---

## Mock Data Insertion (Optional but Recommended)

To properly test the Edge Function, insert the 5 sample listings from Project Brief:

```sql
-- Insert sample properties first
INSERT INTO properties (id, owner_id, name, city, state, bedrooms, bathrooms, max_guests, property_type, amenities)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', 'YOUR_USER_ID', 'Hilton Grand Vacations - Maui Bay', 'Lahaina', 'HI', 2, 2.0, 6, 'condo', '["beachfront","pool","wifi","full_kitchen","parking","oceanview"]'::jsonb),
  ('660e8400-e29b-41d4-a716-446655440002', 'YOUR_USER_ID', 'Marriott Grande Vista', 'Orlando', 'FL', 1, 1.0, 4, 'condo', '["pool","wifi","full_kitchen","parking","gym","golf"]'::jsonb);

-- Insert sample listings
INSERT INTO listings (id, property_id, owner_id, status, check_in_date, check_out_date, owner_price, rav_markup, final_price)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'YOUR_USER_ID', 'active', '2026-03-10', '2026-03-17', 2400.00, 360.00, 2760.00),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'YOUR_USER_ID', 'active', '2026-04-05', '2026-04-12', 1500.00, 225.00, 1725.00);
```

Run these via Supabase SQL Editor to get test data.

---

## Deliverables (Handoff Package)

Create a file called `backend-handoff.md` with:

```markdown
# Backend (Edge Function) - Handoff Package

**Agent:** Backend Engineer  
**Completed:** [Date]  
**Handoff To:** Frontend Agent

---

## Edge Function Details

**Function Name:** `voice-search`

**Deployed URL (DEV):**  
`https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search`

**Deployed URL (PROD):**  
`https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/voice-search` (deploy later)

**File Location:** `supabase/functions/voice-search/index.ts`

---

## API Documentation

### **Endpoint**
\`\`\`
POST /functions/v1/voice-search
\`\`\`

### **Request Headers**
\`\`\`
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY> (optional for public search)
\`\`\`

### **Request Body**
\`\`\`typescript
{
  destination?: string;
  check_in_date?: string;  // YYYY-MM-DD
  check_out_date?: string; // YYYY-MM-DD
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  property_type?: "condo" | "villa" | "cabin" | "studio" | "any";
  amenities?: string[];
  max_guests?: number;
  open_for_bidding?: boolean;
  flexible_dates?: boolean;
}
\`\`\`

### **Response (Success)**
\`\`\`typescript
{
  success: true,
  results: [{
    listing_id: "uuid",
    property_name: "string",
    city: "string",
    state: "string",
    check_in: "YYYY-MM-DD",
    check_out: "YYYY-MM-DD",
    price: number,
    bedrooms: number,
    bathrooms: number,
    property_type: "string",
    amenities: ["array"],
    image_url: "string | null",
    open_for_bidding: boolean
  }],
  total_count: number,
  search_params: { ... }
}
\`\`\`

### **Response (Error)**
\`\`\`typescript
{
  success: false,
  error: "Error message",
  results: [],
  total_count: 0
}
\`\`\`

---

## Test Results

### **Test 1: Basic Search (Destination Only)**

**Request:**
\`\`\`json
{
  "destination": "Maui"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "results": [ ... ],
  "total_count": 1
}
\`\`\`

**Status:** ✅ Passed

### **Test 2: Full Search (All Filters)**
[Add 2-3 more test cases with curl commands and results]

---

## Deployment Logs

\`\`\`
[Paste npx supabase functions deploy output]
\`\`\`

---

## Frontend Integration Notes

1. **VAPI Function URL:** Update VAPI assistant config with this Edge Function URL
2. **CORS:** Already configured to allow all origins (adjust in production if needed)
3. **Authentication:** Currently allows public access; add RLS if needed for user-specific searches
4. **Error Handling:** Frontend should handle `success: false` responses

---

## Known Issues

- [List any issues]
- Database is currently empty; mock data insertion optional

---

## Next Steps for Frontend Agent

1. Install `@vapi-ai/web` npm package
2. Create VoiceSearchButton component
3. Use VAPI Web SDK to initiate sessions
4. Display results from Edge Function response
5. Handle loading/error states
```

---

## Success Criteria

Before marking complete, verify:

- ✅ Edge Function deployed to Supabase DEV
- ✅ curl tests return valid JSON (even if results empty)
- ✅ CORS headers configured correctly
- ✅ Error handling works (try invalid params)
- ✅ Handoff package created (`backend-handoff.md`)
- ✅ Deployment logs saved
- ✅ API documentation complete

---

## Troubleshooting

### **Deployment Fails (Docker Error)**
```
Error: failed to inspect container health: error during connect
```
**Solution:** Ensure Docker Desktop is running, then retry.

### **Query Returns Empty Results**
**Cause:** Database has no data yet.  
**Solution:** Either insert mock data (see SQL above) or just verify the response structure is correct.

### **CORS Errors**
**Cause:** Missing CORS headers.  
**Solution:** Ensure `corsHeaders` object is in response.

---

## Resources

- **Supabase Edge Functions Docs:** https://supabase.com/docs/guides/functions
- **Deno Deploy Docs:** https://deno.land/manual/getting_started/installation
- **Project Brief:** See `00-PROJECT-BRIEF.md`
- **VAPI Handoff:** See `vapi-handoff.md` from Agent 1

---

**Ready to start? Ask the user to confirm you've received both the Project Brief and VAPI Handoff, then begin Task 1.**
