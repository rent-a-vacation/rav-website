---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Voice Search Integration — Master Project Brief

> **Feature:** Voice-powered property search for travelers  
> **Timeline:** 2-3 days (4 sequential agent sessions)  
> **Target:** Beta launch with unlimited free voice usage  
> **Tech Stack:** VAPI.ai + Supabase Edge Functions + React + TypeScript

---

## Executive Summary

We're adding voice search to Rent-A-Vacation's marketplace, allowing travelers to speak naturally instead of using filters. A traveler says "Find me a beachfront condo in Maui for Spring Break under $2000" and instantly sees matching results.

**Business Goal:** Create a "wow factor" feature that differentiates us from VRBO/Airbnb while collecting data on voice usage patterns before launching paid tiers.

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    VOICE SEARCH FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. USER SPEAKS                                                  │
│     "Find me a 2-bedroom beachfront in Maui under $2000"        │
│                                                                  │
│  2. VAPI.AI (Cloud Service)                                      │
│     ├─ Deepgram: Transcribes speech → text                      │
│     ├─ GPT-4o-mini: Extracts structured intent                  │
│     │   Output: {                                                │
│     │     destination: "Maui, HI",                               │
│     │     property_type: "condo",                                │
│     │     bedrooms: 2,                                           │
│     │     amenities: ["beachfront"],                             │
│     │     max_price: 2000,                                       │
│     │     flexible_dates: true                                   │
│     │   }                                                        │
│     └─ Function Call: search_properties(...)                    │
│                                                                  │
│  3. SUPABASE EDGE FUNCTION                                       │
│     POST /functions/v1/voice-search                              │
│     ├─ Receives: Structured search parameters                   │
│     ├─ Validates: User authentication (optional for search)     │
│     ├─ Queries: listings table with filters                     │
│     │   WHERE status = 'active'                                 │
│     │   AND location ILIKE '%Maui%'                             │
│     │   AND bedrooms >= 2                                       │
│     │   AND final_price <= 2000                                 │
│     │   AND amenities @> ARRAY['beachfront']                    │
│     └─ Returns: { results: [...], total_count: 5 }              │
│                                                                  │
│  4. VAPI.AI (Response Generation)                                │
│     ├─ Receives: Search results from Edge Function              │
│     ├─ LLM Formats: "I found 5 beachfront condos in Maui.       │
│     │              The top option is Hilton Grand Vacations      │
│     │              for $1,725 per week..."                       │
│     └─ ElevenLabs: Converts text → speech                       │
│                                                                  │
│  5. REACT FRONTEND                                               │
│     ├─ Displays: Search results in listing cards                │
│     ├─ Updates: URL params (?destination=Maui&bedrooms=2)       │
│     └─ Shows: Voice status indicator during processing          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Reference

### **listings table** (Primary search target)

```sql
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Status & Approval
  status listing_status DEFAULT 'draft',  -- draft | pending | active | sold | cancelled
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Dates & Pricing
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  owner_price NUMERIC(10,2) NOT NULL,
  rav_markup NUMERIC(10,2) DEFAULT 0,
  final_price NUMERIC(10,2) NOT NULL,  -- What travelers pay
  
  -- Bidding (optional)
  open_for_bidding BOOLEAN DEFAULT false,
  bidding_ends_at TIMESTAMPTZ,
  min_bid_amount NUMERIC(10,2),
  reserve_price NUMERIC(10,2),
  allow_counter_offers BOOLEAN DEFAULT true,
  
  -- Policies
  cancellation_policy cancellation_policy DEFAULT 'moderate',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT valid_prices CHECK (final_price >= owner_price)
);

-- Indexes optimized for voice search
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_dates ON listings(check_in_date, check_out_date);
CREATE INDEX idx_listings_open_bidding ON listings(open_for_bidding, bidding_ends_at) 
  WHERE open_for_bidding = true;
```

### **properties table** (Joined for location/amenities)

```sql
CREATE TABLE public.properties (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL,
  
  -- Property Details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  property_type property_type,  -- condo | villa | cabin | studio
  
  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  country VARCHAR(50),
  zip_code VARCHAR(20),
  
  -- Capacity
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  max_guests INTEGER,
  
  -- Amenities (JSONB array)
  amenities JSONB,  -- ["beachfront", "pool", "wifi", "kitchen", "parking"]
  
  -- Images
  images JSONB,  -- [{ url, is_primary }]
  
  -- Verification
  verification_status verification_status DEFAULT 'pending',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_properties_location ON properties(city, state);
CREATE INDEX idx_properties_amenities ON properties USING gin(amenities);
```

---

## Mock Sample Data

### **Sample Listing 1: Hilton Grand Vacations - Maui**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "property_id": "660e8400-e29b-41d4-a716-446655440001",
  "owner_id": "770e8400-e29b-41d4-a716-446655440001",
  "status": "active",
  "check_in_date": "2026-03-10",
  "check_out_date": "2026-03-17",
  "owner_price": 2400.00,
  "rav_markup": 360.00,
  "final_price": 2760.00,
  "open_for_bidding": false,
  "cancellation_policy": "moderate",
  "notes": "Ocean view, recently renovated",
  "property": {
    "name": "Hilton Grand Vacations - Maui Bay",
    "property_type": "condo",
    "city": "Lahaina",
    "state": "HI",
    "bedrooms": 2,
    "bathrooms": 2.0,
    "max_guests": 6,
    "amenities": ["beachfront", "pool", "wifi", "full_kitchen", "parking", "oceanview"]
  }
}
```

### **Sample Listing 2: Marriott Vacation Club - Orlando**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440002",
  "property_id": "660e8400-e29b-41d4-a716-446655440002",
  "owner_id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "active",
  "check_in_date": "2026-04-05",
  "check_out_date": "2026-04-12",
  "owner_price": 1500.00,
  "rav_markup": 225.00,
  "final_price": 1725.00,
  "open_for_bidding": false,
  "cancellation_policy": "flexible",
  "notes": "Walking distance to Disney World",
  "property": {
    "name": "Marriott's Grande Vista",
    "property_type": "condo",
    "city": "Orlando",
    "state": "FL",
    "bedrooms": 1,
    "bathrooms": 1.0,
    "max_guests": 4,
    "amenities": ["pool", "wifi", "full_kitchen", "parking", "gym", "golf"]
  }
}
```

### **Sample Listing 3: Wyndham Grand Desert - Las Vegas**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "property_id": "660e8400-e29b-41d4-a716-446655440003",
  "owner_id": "770e8400-e29b-41d4-a716-446655440003",
  "status": "active",
  "check_in_date": "2026-05-20",
  "check_out_date": "2026-05-27",
  "owner_price": 900.00,
  "rav_markup": 135.00,
  "final_price": 1035.00,
  "open_for_bidding": false,
  "cancellation_policy": "moderate",
  "notes": "Strip view, close to casinos",
  "property": {
    "name": "Wyndham Grand Desert",
    "property_type": "studio",
    "city": "Las Vegas",
    "state": "NV",
    "bedrooms": 0,
    "bathrooms": 1.0,
    "max_guests": 2,
    "amenities": ["pool", "wifi", "kitchenette", "parking", "casino_nearby"]
  }
}
```

### **Sample Listing 4: Welk Resorts - San Diego**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "property_id": "660e8400-e29b-41d4-a716-446655440004",
  "owner_id": "770e8400-e29b-41d4-a716-446655440004",
  "status": "active",
  "check_in_date": "2026-06-15",
  "check_out_date": "2026-06-22",
  "owner_price": 3200.00,
  "rav_markup": 480.00,
  "final_price": 3680.00,
  "open_for_bidding": false,
  "cancellation_policy": "strict",
  "notes": "Perfect for families, summer rates",
  "property": {
    "name": "Welk San Diego Resort",
    "property_type": "villa",
    "city": "Escondido",
    "state": "CA",
    "bedrooms": 3,
    "bathrooms": 2.0,
    "max_guests": 8,
    "amenities": ["pool", "wifi", "full_kitchen", "parking", "playground", "bbq"]
  }
}
```

### **Sample Listing 5: Bluegreen Vacations - Smoky Mountains (Bidding Active)**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440005",
  "property_id": "660e8400-e29b-41d4-a716-446655440005",
  "owner_id": "770e8400-e29b-41d4-a716-446655440005",
  "status": "active",
  "check_in_date": "2026-02-28",
  "check_out_date": "2026-03-07",
  "owner_price": 1100.00,
  "rav_markup": 165.00,
  "final_price": 1265.00,
  "open_for_bidding": true,
  "bidding_ends_at": "2026-02-25T23:59:59Z",
  "min_bid_amount": 1000.00,
  "reserve_price": 1200.00,
  "allow_counter_offers": true,
  "cancellation_policy": "moderate",
  "notes": "Open for bidding, owner flexible on dates",
  "property": {
    "name": "Bluegreen Vacations MountainLoft",
    "property_type": "cabin",
    "city": "Gatlinburg",
    "state": "TN",
    "bedrooms": 2,
    "bathrooms": 2.0,
    "max_guests": 6,
    "amenities": ["mountain_view", "wifi", "full_kitchen", "parking", "fireplace", "hot_tub"]
  }
}
```

---

## VAPI Function Calling Schema

This is the contract between VAPI and our Edge Function.

```json
{
  "name": "search_properties",
  "description": "Search vacation rental listings based on traveler preferences. Extract location, dates, price range, property type, and amenities from natural language queries.",
  "parameters": {
    "type": "object",
    "properties": {
      "destination": {
        "type": "string",
        "description": "City, state, or region (e.g., 'Maui, HI', 'Orlando', 'Smoky Mountains')"
      },
      "check_in_date": {
        "type": "string",
        "format": "date",
        "description": "YYYY-MM-DD format. If user says 'Spring Break', infer approximate dates."
      },
      "check_out_date": {
        "type": "string",
        "format": "date",
        "description": "YYYY-MM-DD format. If duration given ('1 week'), calculate from check_in_date."
      },
      "min_price": {
        "type": "number",
        "description": "Minimum price in USD"
      },
      "max_price": {
        "type": "number",
        "description": "Maximum price in USD"
      },
      "bedrooms": {
        "type": "integer",
        "description": "Minimum number of bedrooms. If user says '2-bedroom', this is 2."
      },
      "property_type": {
        "type": "string",
        "enum": ["condo", "villa", "cabin", "studio", "any"],
        "description": "Type of property"
      },
      "amenities": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["beachfront", "pool", "wifi", "full_kitchen", "parking", "oceanview", "mountain_view", "hot_tub", "fireplace", "gym", "golf", "casino_nearby", "playground", "bbq"]
        },
        "description": "Required amenities. Extract from phrases like 'beachfront', 'with pool', 'near golf'."
      },
      "max_guests": {
        "type": "integer",
        "description": "Maximum occupancy needed"
      },
      "open_for_bidding": {
        "type": "boolean",
        "description": "Only show listings open for bidding. Set true if user says 'open to bidding' or 'make an offer'."
      },
      "flexible_dates": {
        "type": "boolean",
        "description": "User is flexible on dates. Affects search logic."
      }
    },
    "required": ["destination"]
  }
}
```

---

## Edge Function API Contract

### **Endpoint**
```
POST https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/voice-search
```

### **Request Headers**
```
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY>  (optional for public search)
```

### **Request Body**
```json
{
  "destination": "Maui, HI",
  "check_in_date": "2026-03-10",
  "check_out_date": "2026-03-17",
  "max_price": 2000,
  "bedrooms": 2,
  "property_type": "condo",
  "amenities": ["beachfront", "pool"],
  "flexible_dates": false
}
```

### **Response (Success)**
```json
{
  "success": true,
  "results": [
    {
      "listing_id": "550e8400-e29b-41d4-a716-446655440001",
      "property_name": "Hilton Grand Vacations - Maui Bay",
      "city": "Lahaina",
      "state": "HI",
      "check_in": "2026-03-10",
      "check_out": "2026-03-17",
      "price": 2760.00,
      "bedrooms": 2,
      "bathrooms": 2.0,
      "property_type": "condo",
      "amenities": ["beachfront", "pool", "wifi", "full_kitchen"],
      "image_url": "https://...",
      "open_for_bidding": false
    }
  ],
  "total_count": 5,
  "search_params": {
    "destination": "Maui, HI",
    "price_range": [0, 2000],
    "dates": ["2026-03-10", "2026-03-17"]
  }
}
```

### **Response (Error)**
```json
{
  "success": false,
  "error": "No listings found matching criteria",
  "search_params": { ... }
}
```

---

## Frontend Integration Points

### **Existing Components to Modify**

1. **`src/pages/Rentals.tsx`**
   - Add VoiceSearchButton component
   - Update search results display to handle voice-triggered queries

2. **`src/components/Header.tsx`** (optional)
   - Global voice search button in nav bar

### **New Components to Create**

1. **`src/components/VoiceSearchButton.tsx`**
   - Mic icon button
   - Recording state indicator (pulsing animation)
   - VAPI Web SDK integration

2. **`src/hooks/useVoiceSearch.ts`**
   - VAPI session management
   - Function call handling
   - Search results state

3. **`src/components/VoiceStatusIndicator.tsx`**
   - "Listening...", "Processing...", "Found 5 results"
   - Visual feedback during conversation

---

## Environment Variables Needed

### **Frontend (`.env.local`)**
```bash
VITE_VAPI_PUBLIC_KEY=your_vapi_public_key
VITE_SUPABASE_URL=https://oukbxqnlxnkainnligfz.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### **Supabase Edge Function Secrets**
```bash
# Set via: npx supabase secrets set KEY=value --project-ref oukbxqnlxnkainnligfz
VAPI_PRIVATE_KEY=your_vapi_private_key  # For server-side VAPI calls (future)
```

---

## Success Criteria

### **Agent 1 (VAPI) Complete When:**
- ✅ VAPI assistant created and configured
- ✅ Function calling schema defined
- ✅ Test conversation works (manual VAPI dashboard test)
- ✅ Handoff package delivered with assistant ID and config

### **Agent 2 (Backend) Complete When:**
- ✅ Edge Function deployed to Supabase DEV
- ✅ Test curl request returns mock search results
- ✅ Function logs show no errors
- ✅ Handoff package delivered with API endpoint and test scripts

### **Agent 3 (Frontend) Complete When:**
- ✅ Voice button appears on `/rentals` page
- ✅ Clicking mic triggers VAPI session
- ✅ Speaking search query displays results
- ✅ UI updates with search results from Edge Function
- ✅ Handoff package delivered with component docs

### **Agent 4 (QA) Complete When:**
- ✅ E2E test script passes (voice search → results display)
- ✅ Edge cases documented (no results, unclear query, timeout)
- ✅ Production checklist filled out
- ✅ No critical bugs found

---

## Deployment Checklist (Pre-Production)

- [ ] VAPI assistant tested with 10+ voice queries
- [ ] Edge Function deployed to PROD: `npx supabase functions deploy voice-search --project-ref xzfllqndrlmhclqfybew`
- [ ] Environment variables set in Vercel production
- [ ] VAPI public key added to frontend `.env`
- [ ] Feature flag enabled (if using phased rollout)
- [ ] Analytics tracking added (voice usage metrics)
- [ ] Error logging configured (Sentry/similar)
- [ ] User feedback mechanism in place

---

## Known Limitations & Future Enhancements

### **Beta Launch Limitations**
- Voice search only (no voice listing creation yet)
- English language only
- Desktop + mobile web (no native app integration yet)
- Unlimited free usage (no metering/billing)

### **Post-Beta Enhancements (Phase 2)**
1. Voice listing creation for owners
2. Voice bid placement
3. Multi-language support (Spanish, French)
4. Voice booking modification
5. Usage analytics dashboard

---

## Contact & Support

- **Project Lead:** Sujit
- **Repo:** https://github.com/rent-a-vacation/rav-website.git
- **Supabase DEV:** `oukbxqnlxnkainnligfz`
- **Supabase PROD:** `xzfllqndrlmhclqfybew`
- **VAPI Account:** gsujit@gmail.com's Org

---

**Last Updated:** February 9, 2026  
**Version:** 1.0 (Initial voice search implementation)
