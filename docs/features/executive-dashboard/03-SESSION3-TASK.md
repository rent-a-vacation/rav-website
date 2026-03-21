---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 3: Market Intelligence, Unit Economics & Polish

**Feature:** Executive Dashboard  
**Session:** 3 of 3  
**Agent Role:** Frontend Engineer + QA  
**Duration:** ~3 hours  
**Prerequisites:**
- Read `00-PROJECT-BRIEF.md` fully
- Read `handoffs/session1-handoff.md`
- Read `handoffs/session2-handoff.md` — understand what exists before adding to it

---

## Mission

Complete the Executive Dashboard:
- Section 4: Market Intelligence (BYOK cards)
- Section 5: Industry Intelligence Feed (live news)
- Section 6: Unit Economics Panel
- Integration Settings drawer (API key management)
- Wire everything into `ExecutiveDashboard.tsx`
- Responsive polish (1280px+ optimized for VC demo screen)
- Tests (minimum 15 total new tests across all 3 sessions)
- Update PROJECT-HUB.md

---

## Tooltip Copy for Sections 4–6

`TooltipIcon` was built in Session 2 (`src/components/executive/TooltipIcon.tsx`). Apply it to **every** metric title in this session. Copy-paste exact strings — do not paraphrase.

**Section 4 — Market Intelligence:**

| Metric | term | definition | whyItMatters |
|--------|------|------------|--------------|
| AirDNA card | "Vacation Rental Market Index (AirDNA)" | "Average nightly rates and occupancy for comparable vacation properties in RAV's top destinations, sourced from AirDNA's market database." | "Shows how RAV listing prices compare to the broader market. Demo Mode displays representative sample data — connect AirDNA for live figures." |
| STR Benchmarks | "STR Market Benchmarks (STR Global)" | "Industry-standard hospitality metrics: occupancy rate, average daily rate (ADR), and revenue per available unit (RevPAR) for the timeshare and vacation club segment." | "Benchmarks RAV's performance against the broader vacation ownership industry. RevPAR above market average signals strong platform value." |
| Pricing Position | "RAV Pricing Position" | "How RAV listing prices compare to estimated market rates for comparable properties and dates in the same destinations." | "Value pricing relative to competitors drives the 46% bid acceptance rate. Shows the platform delivers genuine savings for travelers." |
| Demo Mode badge | "Demo Mode" | "This card is displaying representative sample data based on published industry benchmarks." | "Toggle to 'Connected' by adding your API key in Integrations settings to see live market data for your specific destinations." |

**Section 5 — Industry Intelligence:**

| Metric | term | definition | whyItMatters |
|--------|------|------------|--------------|
| Industry News | "Industry News Feed" | "Latest headlines from vacation rental, timeshare, and travel industry publications. Refreshed hourly via NewsAPI." | "Staying ahead of market trends and competitor moves is critical for a marketplace operator. Key developments surface here first." |
| Regulatory Radar | "Regulatory Radar" | "Tracker for short-term rental legislation, HOA rental restrictions, and municipal STR regulations across the US." | "Regulatory risk is the #1 threat to vacation rental platforms. This feed gives early warning of changes that could affect owner supply." |
| Consumer Sentiment | "Consumer Sentiment Index" | "University of Michigan monthly survey measuring consumer confidence in current economic conditions. Scale: 0–100." | "Higher sentiment = people willing to spend on discretionary travel. A leading indicator for vacation rental booking demand." |
| Travel Demand | "Travel Demand Indicator" | "Index measuring consumer travel spending and intent, derived from Federal Reserve Economic Data (FRED)." | "Rising travel demand directly expands RAV's addressable market. Tracked as a macro tailwind for the business." |

**Section 6 — Unit Economics:**

| Metric | term | definition | whyItMatters |
|--------|------|------------|--------------|
| CAC | "Customer Acquisition Cost (CAC)" | "Average cost to acquire one new user. Calculated as: monthly marketing spend ÷ new users acquired that month." | "The lower the CAC, the more capital-efficient RAV's growth is. VCs compare this directly against LTV to assess profitability." |
| LTV | "Lifetime Value (LTV)" | "Total revenue RAV expects to earn from one customer over their entire relationship with the platform. Calculated as: avg booking value × avg bookings per user × take rate." | "High LTV relative to CAC means each customer acquired generates compounding returns. The foundation of a capital-efficient marketplace." |
| LTV:CAC | "LTV:CAC Ratio" | "Lifetime value divided by customer acquisition cost. 1:1 = break even. 3:1 = acceptable early stage. 7:1+ = excellent." | "The single most important unit economics metric for marketplace investors. It answers: 'Is this business worth growing?'" |
| Payback Period | "CAC Payback Period" | "How many months of revenue from a customer it takes to recover the cost of acquiring them." | "Under 18 months is considered healthy for marketplace businesses. Shorter payback = faster reinvestment into growth." |
| Avg Booking Value | "Average Booking Value" | "Mean total transaction value per confirmed booking. Calculated as: total GMV ÷ number of confirmed bookings." | "Higher average booking values increase platform revenue without increasing transaction volume. A key lever for take rate efficiency." |
| Take Rate | "Platform Take Rate" | "Percentage of each booking's total value that RAV retains as its fee. Calculated as: total platform revenue ÷ total GMV." | "Airbnb's take rate is ~14%. VRBO's is ~8–12%. RAV's 10% is positioned as owner-friendly while remaining sustainable." |
| MoM Growth | "Month-over-Month GMV Growth" | "Percentage change in gross merchandise value compared to the previous calendar month." | "Consistent MoM growth is the most credible signal of marketplace momentum for early-stage investors." |

---

## Task 1: Section 4 — Market Intelligence

Create `src/components/executive/MarketIntelligence.tsx`

This section has three cards.

### Reusable Component: BYOKCard

Create `src/components/executive/BYOKCard.tsx` first — this is the wrapper used by AirDNA and STR cards.

```tsx
interface BYOKCardProps {
  title: string
  provider: string           // "AirDNA" | "STR Global"
  mode: 'demo' | 'live'
  onConnect: () => void      // Opens settings drawer
  children: React.ReactNode  // The chart/content inside
}

// Card structure:
// Header row: title (left) + mode badge (right)
//   Demo Mode badge: amber background, "Demo Mode" text, small lock icon
//   Live badge: green dot + "Live" text
// Content area: children (the actual chart)
// Footer: 
//   Demo mode: "Sample data — Connect {provider} for live insights"
//              [Connect {provider} →] button (text-blue-400, hover:text-blue-300)
//   Live mode: "Connected to {provider} · Last updated X min ago"
```

### Card 4a: Vacation Rental Market Index (AirDNA)

Inside `MarketIntelligence.tsx`:

```tsx
// Wrapped in BYOKCard provider="AirDNA"
// Recharts GroupedBarChart
// X axis: 5 destinations
// Two bars per destination:
//   Bar 1: "Market Avg Rate" (slate-500) — from AirDNA data
//   Bar 2: "RAV Listing Price" (blue-500) — from your listings data
// Y axis: dollar format
// Tooltip: shows both values + "RAV is X% below/above market"
// Demo mode data: use DEMO_AIRDNA_DATA from fetch-airdna-data function
```

### Card 4b: STR Market Benchmarks

```tsx
// Wrapped in BYOKCard provider="STR Global"
// Three metric rows (no chart — clean stat display):
//   Occupancy Rate: RAV XX% vs Market YY%
//   Avg Daily Rate: RAV $XXX vs Market $YYY
//   RevPAR: RAV $XXX vs Market $YYY
// Each row: label, RAV value in emerald, Market value in slate, delta in amber
// Demo mode: use DEMO_STR_DATA
```

### Card 4c: Competitor Pricing Pulse

```tsx
// No BYOK needed — calculated from your own listing data
// Title: "Pricing Position"
// Shows: "RAV listings average X% below comparable market rates"
// Recharts scatter or simple bar showing RAV price distribution vs market estimates
// Pull listing prices from useBusinessMetrics hook
// Market estimate: use AirDNA demo data avg as the "market" benchmark
// Add callout: "Value pricing drives 46% bid acceptance rate"
```

**Grid layout for Section 4:**
```tsx
<div className="grid grid-cols-3 gap-4">
  <div>{/* AirDNA */}</div>
  <div>{/* STR Benchmarks */}</div>
  <div>{/* Competitor Pricing */}</div>
</div>
```

---

## Task 2: Integration Settings Drawer

Create `src/components/executive/IntegrationSettings.tsx`

This is a slide-out drawer (use shadcn Sheet component — already installed).

```tsx
// Triggered by "Connect AirDNA →" or "Connect STR →" buttons in BYOKCards
// Also accessible via a settings gear icon in the page header

// Drawer contents:
// 1. AirDNA Integration section:
//    Input field: "AirDNA API Key"
//    Hint text: "Get your key at airdna.co/api"
//    [Save & Connect] button
//    Current status: "Not connected" | "Connected ✓"

// 2. STR Global Integration section:
//    Input field: "STR Global API Key"  
//    Hint text: "Contact STR Global for API access"
//    [Save & Connect] button
//    Current status: "Not connected" | "Connected ✓"

// 3. NewsAPI section:
//    Status: "Connected via Supabase secrets" (read-only, auto-configured)
//    Last refresh timestamp

// 4. Refresh Settings:
//    "News feed refresh interval" — select: 30min / 60min / 2hrs

// On save: calls saveAirDNAKey() or saveSTRKey() from useMarketIntelligence hook
// On success: toast "Connected to AirDNA — fetching live data..."
// Drawer closes automatically after successful save
```

Add settings gear icon button to the top-right of `ExecutiveDashboard.tsx` page header.

---

## Task 3: Section 5 — Industry Intelligence Feed

Create `src/components/executive/IndustryFeed.tsx`

Three panels in a grid.

### Panel 5a: Industry News

```tsx
// Title: "Industry News" + small "Live" green dot
// Uses useIndustryFeed().newsItems
// Shows 7 items, each:
//   - Source name (slate-400, small)
//   - Headline (white, clickable link — opens in new tab)
//   - Published X hours/days ago (slate-500, smallest)
// Loading: 7 skeleton rows with animate-pulse
// Error/empty: "No recent news available" message
// "Load More" text button below (loads next 7)
```

### Panel 5b: Regulatory Radar

```tsx
// Title: "Regulatory Radar" with amber warning icon
// Subtitle: "Short-term rental legislation tracker"
// Uses useIndustryFeed().regulatoryItems
// Timeline format:
//   Each item: colored dot (red=negative/ban, green=positive/favorable, slate=neutral) 
//              + state abbreviation badge + headline + date
// Empty state: "No recent regulatory changes — market stable ✓" in emerald
```

### Panel 5c: Macro Indicators

```tsx
// Title: "Macro Indicators"
// Three stat cards from useIndustryFeed().macroIndicators:
//
// Card 1: Consumer Sentiment
//   Large number (e.g., 74.0)
//   Trend arrow (↑ green / ↓ red)
//   "vs 71.8 last month"
//   FRED source attribution (small, slate-500)
//
// Card 2: Travel Demand
// Card 3: Disposable Income Index
//
// Each has a small sparkline (use Recharts LineChart, tiny, no axes)
```

**Grid layout for Section 5:**
```tsx
<div className="grid grid-cols-3 gap-4">
  <div>{/* Industry News */}</div>
  <div>{/* Regulatory Radar */}</div>
  <div>{/* Macro Indicators */}</div>
</div>
```

---

## Task 4: Section 6 — Unit Economics Panel

Create `src/components/executive/UnitEconomics.tsx`

**This is pure investor language. Design it to look like a term sheet.**

Seven metrics in a horizontal row of stat cards.

```tsx
// Layout: 7 equal-width cards in a row
// Each card: metric name (top, slate-400 small) + value (center, large white bold) + context (bottom, small)

// Card 1: CAC — Customer Acquisition Cost
//   Value: requires manual input (marketing spend)
//   Show input field inline: "Monthly marketing spend: $[____]"
//   Calculate: spend / new_users_this_month
//   Default if no input: show "Enter spend →" prompt
//   Store in component state (not DB — session only)

// Card 2: LTV — Lifetime Value
//   = avg_booking_value × avg_bookings_per_user × (1 - platform_cost_rate)
//   Context: "Based on {N} completed bookings"

// Card 3: LTV:CAC Ratio
//   = LTV / CAC
//   Color coded:
//     <1x: red (unhealthy)
//     1-3x: amber (early stage)
//     3-7x: blue (good)
//     7x+: emerald (excellent — show ✅)
//   Context: "7x+ is excellent for marketplaces"
//   If no CAC entered: show "--"

// Card 4: Payback Period
//   = CAC / (monthly_revenue_per_user)
//   Display in months
//   Context: "<18 months is healthy"

// Card 5: Avg Booking Value
//   = total_GMV / total_bookings
//   Context: "Per confirmed booking"

// Card 6: Take Rate
//   = total_commission / total_GMV
//   Display as percentage
//   Context: "Platform fee as % of GMV"

// Card 7: MoM GMV Growth
//   = (this_month_GMV - last_month_GMV) / last_month_GMV
//   Display as % with arrow
//   Color: green if positive, red if negative
//   Context: "{this_month} vs {last_month}"
```

Below the 7 cards, add a small "Assumptions" expandable section:
```
▾ Calculation methodology
LTV assumes avg 2.1 bookings per user lifetime. Take rate = gross commission / GMV. 
CAC requires manual marketing spend input above. Data from confirmed bookings only.
```

---

## Task 5: Wire Everything into ExecutiveDashboard.tsx

Update `src/pages/ExecutiveDashboard.tsx` to include all sections:

```tsx
export default function ExecutiveDashboard() {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <HeadlineBar />

      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-10">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Rent-A-Vacation · Strategic Business View</p>
          </div>
          <button onClick={() => setSettingsOpen(true)} className="...settings gear button...">
            ⚙ Integrations
          </button>
        </div>

        <SectionDivider title="Business Performance" subtitle="Revenue and growth trends from platform data" />
        <BusinessPerformance />

        <SectionDivider title="Marketplace Health" subtitle="Proprietary metrics unique to the RAV bidding model" />
        <MarketplaceHealth />

        <SectionDivider title="Market Intelligence" subtitle="External market context · Toggle Demo/Live per integration" />
        <MarketIntelligence onOpenSettings={() => setSettingsOpen(true)} />

        <SectionDivider title="Industry Intelligence" subtitle="Live feeds · Refreshed hourly" />
        <IndustryFeed />

        <SectionDivider title="Unit Economics" subtitle="Investor-grade business metrics" />
        <UnitEconomics />
      </main>

      <IntegrationSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
```

Create `SectionDivider` component in `src/components/executive/SectionDivider.tsx`:
```tsx
// Horizontal divider with section title and subtitle
// Left: white title + slate-400 subtitle
// Right: optional slot
// Full-width border-t border-slate-700/50 above
```

---

## Task 6: Tests

Write tests in `src/components/executive/__tests__/` and `src/hooks/executive/__tests__/`.

**Minimum 15 new tests total across all 3 sessions. Prioritize:**

```typescript
// Hook tests (useMarketplaceHealth):
test('calculates liquidity score correctly from component values')
test('liquidity score clamps between 0 and 100')
test('bid acceptance rate calculation')
test('voice adoption rate calculation')

// Component tests:
test('HeadlineBar renders 5 KPI pills')
test('HeadlineBar shows loading skeleton when data loading')
test('LiquidityGauge renders correct color zone for score 62 (amber)')
test('LiquidityGauge renders green for score > 70')
test('LiquidityGauge renders red for score < 40')
test('BYOKCard shows Demo Mode badge when mode is demo')
test('BYOKCard shows Live badge when mode is live')
test('BYOKCard Connect button calls onConnect handler')
test('UnitEconomics renders all 7 metric cards')
test('UnitEconomics LTV:CAC shows correct color class for ratio > 7')
test('ExecutiveDashboard redirects non-rav_owner users')
test('IndustryFeed renders fallback when no news items')
```

---

## Task 7: Responsive Polish

The dashboard is optimized for **1280px+ screens** (VC demo on laptop/external monitor).

At 1280px, ensure:
- Headline Bar KPI pills don't overflow (use `overflow-x-auto` if needed)
- Grid layouts don't break (4-col and 3-col grids)
- Charts have minimum height of 200px
- Text is readable (no font size below 11px)

Do NOT optimize for mobile — this is an internal tool. If viewport < 1024px, show a banner:
```
"Executive Dashboard is optimized for desktop viewing."
```

---

## Task 8: Update PROJECT-HUB.md

At the end of this session, update `docs/PROJECT-HUB.md`:

1. Move "Phase 14: Executive Dashboard" from PRIORITY QUEUE to COMPLETED PHASES
2. Update CURRENT FOCUS to next priority
3. Add decision log entries DEC-014 through DEC-017 (from 00-PROJECT-BRIEF.md)
4. Update "Last Updated" date

---

## Deliverables Checklist

- [ ] `BYOKCard.tsx` — Demo/Live toggle renders correctly
- [ ] **AirDNA card: `TooltipIcon` on card title with correct copy**
- [ ] **STR card: `TooltipIcon` on card title with correct copy**
- [ ] **Demo Mode badge: `TooltipIcon` explaining what Demo Mode means**
- [ ] `MarketIntelligence.tsx` — all 3 cards render
- [ ] `IntegrationSettings.tsx` — drawer opens, saves API keys
- [ ] `IndustryFeed.tsx` — news + regulatory + macro render
- [ ] **IndustryFeed: `TooltipIcon` on all 3 panel titles**
- [ ] `UnitEconomics.tsx` — all 7 metric cards + methodology expander
- [ ] **UnitEconomics: every metric card has `TooltipIcon` with correct copy**
- [ ] **LTV:CAC card: tooltip explains the 1x/3x/7x color thresholds**
- [ ] `SectionDivider.tsx` — consistent section headers
- [ ] `ExecutiveDashboard.tsx` — all 6 sections wired together
- [ ] Settings gear button in page header
- [ ] BYOK cards connect to `IntegrationSettings` drawer
- [ ] Dark theme consistent throughout — spot check every section
- [ ] Below-1024px viewport: "optimized for desktop" banner
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] `npm run build` passes
- [ ] Total new tests: 15+ passing (including `TooltipIcon` render test)
- [ ] All original 142 tests still passing
- [ ] `PROJECT-HUB.md` updated
- [ ] Final handoff doc created: `handoffs/session3-handoff.md`

---

## Final Handoff

Create `docs/features/executive-dashboard/handoffs/session3-handoff.md` with:
- Complete file list of all created/modified files
- Final test count
- Known issues or deferred items
- Screenshots or descriptions of each section
- Any API keys that need to be configured for production
- Deployment steps for Edge Functions to PROD when ready
- `npm run build` output (confirm clean)
