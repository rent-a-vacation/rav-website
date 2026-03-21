---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 1: Foundation & Data Layer

**Feature:** Executive Dashboard  
**Session:** 1 of 3  
**Agent Role:** Full-Stack Engineer  
**Duration:** ~3 hours  
**Prerequisites:** Read `00-PROJECT-BRIEF.md` fully before starting

---

## Mission

Build the complete data foundation for the Executive Dashboard:
1. Database migration for settings
2. Demo seed script with coherent, investor-believable data
3. Four Supabase Edge Functions for external data feeds
4. All data hooks (Tier 1 + Tier 2 + Tier 3)

The UI comes in Sessions 2 and 3. Your job is to make all data available and testable.

---

## Task 1: Database Migration

Create `docs/supabase-migrations/013_executive_dashboard_settings.sql`

Add these keys to the existing `system_settings` table (do NOT recreate the table):

```sql
-- Executive Dashboard API key settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('executive_dashboard_newsapi_key', '""', 'NewsAPI key for industry feed - set via Supabase secrets'),
  ('executive_dashboard_airdna_api_key', '""', 'AirDNA API key - provided by RAV owner (BYOK)'),
  ('executive_dashboard_str_api_key', '""', 'STR Global API key - provided by RAV owner (BYOK)'),
  ('executive_dashboard_refresh_interval', '60', 'News feed refresh interval in minutes')
ON CONFLICT (key) DO NOTHING;
```

**Verify migration works:**
```sql
SELECT key, description FROM system_settings WHERE key LIKE 'executive_dashboard%';
```

---

## Task 2: Demo Seed Script

Create `scripts/seed-executive-demo.ts`

This script populates DEV Supabase (`oukbxqnlxnkainnligfz`) with coherent demo data.

**CRITICAL:** All numbers must cross-validate. See the data spec below.

### Seed Data Spec

**Users to create (12 property owners + 35 renters = 47 total):**
- Create via Supabase admin API (bypass auth for seeding)
- Spread creation dates: Sep 2025 through Feb 2026
- Assign appropriate roles via `user_roles` table

**Properties (23 total):**
Distribute across these destinations:
- Orlando, FL: 8 properties (HGV, Marriott, Disney brands)
- Maui, HI: 5 properties (HGV, Marriott)
- Cancun, Mexico: 4 properties (various)
- Park City, UT: 3 properties (HGV)
- Myrtle Beach, SC: 3 properties (Wyndham, Holiday Inn Club)

**Listings (23 active, matching properties):**
- Price range: $2,800 – $8,500 per week
- All status: 'active'

**Bookings — monthly breakdown:**
```
Sep 2025: 2 bookings, total $8,400
Oct 2025: 4 bookings, total $18,200
Nov 2025: 5 bookings, total $23,100
Dec 2025: 3 bookings, total $14,800  ← holiday dip, realistic
Jan 2026: 6 bookings, total $29,700
Feb 2026 (partial): 2 bookings, total $8,400
```
Total: 22 bookings, $102,600 GMV (18 confirmed, 4 pending)
Each booking: `rav_commission` = 10% of `total_amount`

**Bids:**
- 67 total bids across listings
- 31 accepted (46.3% acceptance rate)
- 36 rejected/expired
- Spread creation dates across the 6-month period
- Bid amounts: 5-15% below listing price (realistic negotiation)

**Voice search usage:**
- 89 total voice searches
- Spread across 28 unique users
- `voice_search_usage` table entries

### Script Structure:
```typescript
// scripts/seed-executive-demo.ts
// Usage: npx ts-node scripts/seed-executive-demo.ts
// Requires: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local

async function main() {
  // 1. Check if already seeded (count profiles > 5 → skip with message)
  // 2. Create users + profiles + roles
  // 3. Create properties
  // 4. Create listings
  // 5. Create bookings (with correct commission calculations)
  // 6. Create bids
  // 7. Create voice search usage records
  // 8. Verify: print summary table of what was created
  // 9. Print cross-validation: GMV sum, commission sum, bid acceptance rate
}
```

The verification step at the end should print:
```
✅ Seed Complete
──────────────────────────────
Users created:     47
Properties:        23
Active listings:   23
Bookings:          22 (18 confirmed, 4 pending)
Total GMV:         $102,600
Platform revenue:  $10,260 (10%)
Bids placed:       67
Bids accepted:     31 (46.3%)
Voice searches:    89
──────────────────────────────
Cross-validation:
  GMV sum matches booking totals:     ✅
  Commission = 10% of GMV:            ✅
  Bid acceptance rate = 31/67:        ✅
```

---

## Task 3: Edge Functions

Create four Edge Functions. Each follows the existing pattern from `supabase/functions/send-email/index.ts`.

### 3a: `fetch-industry-news/index.ts`

Calls NewsAPI + Google News RSS. Returns combined, deduplicated news items.

```typescript
// Endpoint: POST /functions/v1/fetch-industry-news
// Body: { category: 'news' | 'regulatory' | 'all' }
// Returns: { items: NewsItem[], cached_at: string }

interface NewsItem {
  title: string
  source: string
  url: string
  published_at: string
  summary: string  // first 150 chars of description
  category: 'news' | 'regulatory'
}
```

**NewsAPI query:** `q=(timeshare OR "vacation rental" OR "vacation club")&language=en&sortBy=publishedAt`
**API key:** Read from `Deno.env.get('NEWSAPI_KEY')`
**Cache:** Store last result in a module-level variable with timestamp. Return cached if < 60 min old.
**Fallback:** If NewsAPI fails or key missing, return 5 hardcoded realistic news items (so dashboard never shows empty).

**Fallback items (hardcoded):**
```typescript
const FALLBACK_NEWS = [
  {
    title: "Vacation rental market reaches $87B globally in 2025",
    source: "Travel Weekly",
    published_at: "2026-01-15T10:00:00Z",
    summary: "The global vacation rental market continues strong growth trajectory heading into 2026.",
    category: 'news'
  },
  // ... 4 more realistic items
]
```

### 3b: `fetch-macro-indicators/index.ts`

Calls FRED API for consumer confidence data (no key required for public series).

```typescript
// Endpoint: GET /functions/v1/fetch-macro-indicators
// Returns: { indicators: MacroIndicator[] }

interface MacroIndicator {
  name: string
  value: number
  previous_value: number
  trend: 'up' | 'down' | 'flat'
  unit: string
  description: string
}
```

**FRED series to fetch:**
- `UMCSENT` — University of Michigan Consumer Sentiment
- `DSPIC96` — Real Disposable Personal Income

**FRED API base:** `https://api.stlouisfed.org/fred/series/observations?series_id={ID}&api_key=&file_type=json&limit=2&sort_order=desc`

**Fallback:** If FRED unreachable, return static realistic values:
```typescript
{ name: "Consumer Sentiment", value: 74.0, previous: 71.8, trend: 'up', unit: 'index', description: "Consumer confidence in current economic conditions" }
```

### 3c: `fetch-airdna-data/index.ts`

BYOK function. Returns sample data if no key provided.

```typescript
// Endpoint: POST /functions/v1/fetch-airdna-data
// Body: { api_key?: string, destinations: string[] }
// Returns: { data: AirDNAData[], mode: 'demo' | 'live' }

interface AirDNAData {
  destination: string
  avg_nightly_rate: number
  occupancy_rate: number
  revenue_per_available_night: number
  period: string
}
```

**If no api_key in body:** Return `mode: 'demo'` with hardcoded realistic sample data.
**If api_key provided:** Attempt real AirDNA API call. On failure, return demo data with `mode: 'demo'` and error message.

**Sample data for demo mode:**
```typescript
const DEMO_AIRDNA_DATA = [
  { destination: "Orlando, FL", avg_nightly_rate: 285, occupancy_rate: 0.71, revenue_per_available_night: 202, period: "Jan 2026" },
  { destination: "Maui, HI", avg_nightly_rate: 520, occupancy_rate: 0.78, revenue_per_available_night: 406, period: "Jan 2026" },
  { destination: "Cancun, Mexico", avg_nightly_rate: 195, occupancy_rate: 0.82, revenue_per_available_night: 160, period: "Jan 2026" },
  { destination: "Park City, UT", avg_nightly_rate: 445, occupancy_rate: 0.68, revenue_per_available_night: 302, period: "Jan 2026" },
  { destination: "Myrtle Beach, SC", avg_nightly_rate: 165, occupancy_rate: 0.64, revenue_per_available_night: 106, period: "Jan 2026" },
]
```

### 3d: `fetch-str-data/index.ts`

Same BYOK pattern as AirDNA.

```typescript
// Endpoint: POST /functions/v1/fetch-str-data
// Body: { api_key?: string }
// Returns: { data: STRData, mode: 'demo' | 'live' }

interface STRData {
  segment: string  // "Timeshare & Vacation Club"
  avg_occupancy: number
  avg_adr: number  // Average Daily Rate
  revpar: number   // Revenue Per Available Room
  market_avg_occupancy: number
  market_avg_adr: number
  market_revpar: number
  period: string
}
```

---

## Task 4: Data Hooks

Create hooks in `src/hooks/executive/`.

### 4a: `useBusinessMetrics.ts`

```typescript
// Returns all Tier 1 metrics from Supabase

export function useBusinessMetrics() {
  // Query 1: GMV and revenue totals
  // SELECT SUM(total_amount) as gmv, SUM(rav_commission) as revenue, COUNT(*) as booking_count
  // FROM bookings WHERE status = 'confirmed'

  // Query 2: Monthly GMV breakdown (last 6 months)
  // SELECT DATE_TRUNC('month', created_at) as month, SUM(total_amount) as gmv, SUM(rav_commission) as revenue
  // FROM bookings WHERE status = 'confirmed' GROUP BY month ORDER BY month

  // Query 3: Active listings count
  // SELECT COUNT(*) FROM listings WHERE status = 'active'

  // Query 4: Active owners (have at least one active listing)
  // SELECT COUNT(DISTINCT owner_id) FROM listings WHERE status = 'active'

  // Query 5: Total users
  // SELECT COUNT(*) FROM profiles

  // Query 6: New signups by month (last 6 months)
  // SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as count FROM profiles GROUP BY month

  return {
    gmv, revenue, bookingCount,
    monthlyGMV, // array for chart
    activeListings, activeOwners, totalUsers,
    monthlySignups, // array for chart
    isLoading, error
  }
}
```

### 4b: `useMarketplaceHealth.ts`

```typescript
// Calculates proprietary Marketplace Liquidity Score™

export function useMarketplaceHealth() {
  // Query 1: Bid acceptance rate
  // SELECT 
  //   COUNT(*) FILTER (WHERE status = 'accepted') as accepted,
  //   COUNT(*) as total
  // FROM listing_bids

  // Query 2: Average days from listing created to first booking
  // (joins bookings with listings, calculates date diff)

  // Query 3: Repeat owner rate (owners with 2+ completed bookings)

  // Query 4: Bid spread - avg (listing.final_price - bid.bid_amount) / listing.final_price
  // GROUP BY DATE_TRUNC('month', bid.created_at) for chart

  // Query 5: Voice search stats
  // SELECT COUNT(*) as voice_searches FROM voice_search_usage
  // Compare to estimated total searches

  // Calculate Liquidity Score:
  // score = (bidAcceptanceRate * 0.4) + (daysToBookNormalized * 0.3) + (repeatOwnerRate * 0.3)
  // Apply 1.2x platform maturity multiplier
  // Clamp to 0-100

  // Supply/demand by destination:
  // searches per destination vs listings per destination

  return {
    liquidityScore,        // 0-100 number
    liquidityComponents,   // breakdown for tooltip
    bidAcceptanceRate,
    bidSpreadByMonth,      // array for chart
    bidActivity,           // { placed, accepted } by month
    voiceAdoptionRate,     // percentage
    voiceFunnelData,       // { searches, views, bids, bookings } for voice vs traditional
    supplyDemandByDest,    // array for map
    isLoading, error
  }
}
```

### 4c: `useIndustryFeed.ts`

```typescript
// Fetches Tier 2 data from Edge Functions

export function useIndustryFeed() {
  // Call fetch-industry-news Edge Function
  // Refetch every 60 minutes (staleTime: 60 * 60 * 1000 in React Query)
  // Call fetch-macro-indicators Edge Function
  // Refetch every 24 hours

  return {
    newsItems,        // NewsItem[]
    regulatoryItems,  // NewsItem[] (filtered)
    macroIndicators,  // MacroIndicator[]
    isLoading, error
  }
}
```

### 4d: `useMarketIntelligence.ts`

```typescript
// Handles Tier 3 BYOK data + integration settings

export function useMarketIntelligence() {
  // Read API keys from system_settings
  // Call fetch-airdna-data (pass key if exists, else empty)
  // Call fetch-str-data (pass key if exists, else empty)
  // Expose saveApiKey(type, key) mutation

  return {
    airDNAData,        // AirDNAData[]
    airDNAMode,        // 'demo' | 'live'
    strData,           // STRData
    strMode,           // 'demo' | 'live'
    saveAirDNAKey,     // (key: string) => void
    saveSTRKey,        // (key: string) => void
    isLoading, error
  }
}
```

---

## Task 5: Update TypeScript Types

Add to `src/types/database.ts`:

```typescript
// Add to the Database interface tables section:
executive_dashboard_metrics: {
  // No new table — this is a virtual type for hook return values
}
```

Add standalone interfaces (not in Database):
```typescript
export interface NewsItem {
  title: string
  source: string
  url: string
  published_at: string
  summary: string
  category: 'news' | 'regulatory'
}

export interface MacroIndicator {
  name: string
  value: number
  previous_value: number
  trend: 'up' | 'down' | 'flat'
  unit: string
  description: string
}

export interface AirDNAData {
  destination: string
  avg_nightly_rate: number
  occupancy_rate: number
  revenue_per_available_night: number
  period: string
}

export interface MarketplaceHealthMetrics {
  liquidityScore: number
  bidAcceptanceRate: number
  voiceAdoptionRate: number
}
```

---

## Task 6: Deploy Edge Functions to DEV

```bash
# Link to DEV project
npx supabase link --project-ref oukbxqnlxnkainnligfz

# Deploy all new functions
npx supabase functions deploy fetch-industry-news
npx supabase functions deploy fetch-macro-indicators
npx supabase functions deploy fetch-airdna-data
npx supabase functions deploy fetch-str-data

# Set NewsAPI key secret (get free key from newsapi.org)
npx supabase secrets set NEWSAPI_KEY=your_key_here --project-ref oukbxqnlxnkainnligfz
```

**Test each function:**
```bash
# Test news feed
curl -X POST https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/fetch-industry-news \
  -H "Authorization: Bearer $DEV_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"category": "all"}'

# Test macro indicators
curl https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/fetch-macro-indicators \
  -H "Authorization: Bearer $DEV_ANON_KEY"

# Test AirDNA demo mode (no key)
curl -X POST https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/fetch-airdna-data \
  -H "Authorization: Bearer $DEV_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"destinations": ["Orlando, FL", "Maui, HI"]}'
```

---

## Task 7: Run Seed Script

```bash
# Run demo seed on DEV
npx ts-node scripts/seed-executive-demo.ts

# Verify via Supabase dashboard or SQL:
SELECT COUNT(*) FROM profiles;        -- expect 47
SELECT COUNT(*) FROM bookings;        -- expect 22
SELECT SUM(total_amount) FROM bookings WHERE status='confirmed';  -- expect ~$94,200
```

---

## Deliverables Checklist

- [ ] `docs/supabase-migrations/013_executive_dashboard_settings.sql` — created and applied to DEV
- [ ] `scripts/seed-executive-demo.ts` — runs without errors, prints cross-validation ✅
- [ ] `supabase/functions/fetch-industry-news/index.ts` — deployed, curl test passes
- [ ] `supabase/functions/fetch-macro-indicators/index.ts` — deployed, curl test passes
- [ ] `supabase/functions/fetch-airdna-data/index.ts` — deployed, demo mode returns data
- [ ] `supabase/functions/fetch-str-data/index.ts` — deployed, demo mode returns data
- [ ] `src/hooks/executive/useBusinessMetrics.ts` — created, no TypeScript errors
- [ ] `src/hooks/executive/useMarketplaceHealth.ts` — created, no TypeScript errors
- [ ] `src/hooks/executive/useIndustryFeed.ts` — created, no TypeScript errors
- [ ] `src/hooks/executive/useMarketIntelligence.ts` — created, no TypeScript errors
- [ ] `src/types/database.ts` — new interfaces added
- [ ] `npm run build` — passes with no errors
- [ ] `npm run test` — all 142 existing tests still passing

---

## Handoff to Session 2

Create `docs/features/executive-dashboard/handoffs/session1-handoff.md` with:
- Which Edge Functions deployed and their exact URLs
- Seed script output (paste the cross-validation table)
- Hook return shapes (exact TypeScript interfaces)
- Any deviations from this spec and why
- `npm run build` output (confirm clean)
- Test count (should still be 142+)
