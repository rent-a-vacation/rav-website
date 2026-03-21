---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 2: Dashboard UI — Sections 1–3

**Feature:** Executive Dashboard  
**Session:** 2 of 3  
**Agent Role:** Frontend Engineer  
**Duration:** ~3 hours  
**Prerequisites:**
- Read `00-PROJECT-BRIEF.md` fully
- Read `handoffs/session1-handoff.md` — understand hook return shapes before writing any JSX

---

## Mission

Build the Executive Dashboard page with Sections 1–3:
- The dark-theme page shell and routing
- Section 1: Headline Bar (sticky KPI pills)
- Section 2: Business Performance (4 charts)
- Section 3: Marketplace Health (3 proprietary metric components)

Sections 4–6 come in Session 3. Do NOT build them here — focus on quality over coverage.

---

## Critical Design Rules

Read these before writing a single line of code:

1. **Dark first, always.** Page root is `bg-slate-900`. All cards are `bg-slate-800`. Borders are `border-slate-700`. Text is `text-slate-100` (headings), `text-slate-300` (body), `text-slate-500` (labels). Never use white backgrounds.

2. **No Tailwind `dark:` variants.** This page is always dark. Just use dark color classes directly.

3. **Recharts is already installed.** Do not install any new charting library. Use Recharts with custom colors matching the dark theme.

4. **Recharts dark theme config:** All charts need `background: transparent`. Use `stroke="#334155"` for grid lines. Tooltip background: `#1e293b`. Axis text: `#94a3b8`.

5. **Proprietary metrics get special treatment.** The Liquidity Score™ and Bid Spread Index™ must be visually distinct — add a subtle badge or label that reads "RAV Proprietary" in a small amber pill.

6. **Numbers format consistently:**
   - Dollar values: `$94,200` (no decimals for whole values, 2 decimals for <$100)
   - Percentages: `46.3%`
   - Large numbers: `1,247` with comma separators
   - Use a shared `formatCurrency(n)` and `formatPercent(n)` utility in the component

---

## Task 0: TooltipIcon — Build This First

**Every metric, chart title, and KPI in this dashboard must have an explanation tooltip.** A confused investor is a distracted investor. This component gets built once here and used everywhere.

Create `src/components/executive/TooltipIcon.tsx`

```tsx
import { HelpCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'  // shadcn Tooltip — already installed

interface TooltipIconProps {
  definition: string    // Plain English: "What this metric is"
  whyItMatters: string  // RAV context: "Why this matters for RAV"
  term?: string         // Optional: metric name shown as bold heading in tooltip
}

export function TooltipIcon({ definition, whyItMatters, term }: TooltipIconProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="ml-1.5 inline-flex items-center text-slate-500 hover:text-slate-300 transition-colors focus:outline-none">
            <HelpCircle size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-[280px] bg-slate-700 border border-slate-600 text-slate-100 p-3 rounded-lg shadow-xl"
        >
          {term && (
            <p className="font-semibold text-white text-xs mb-1">{term}</p>
          )}
          <p className="text-slate-200 text-xs leading-relaxed">{definition}</p>
          <p className="text-slate-400 text-xs leading-relaxed mt-1.5 pt-1.5 border-t border-slate-600">
            💡 {whyItMatters}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
```

### Usage pattern — apply to EVERY metric title:

```tsx
// Chart/card title with tooltip:
<h3 className="text-slate-300 text-sm font-medium flex items-center">
  GMV
  <TooltipIcon
    term="Gross Merchandise Value (GMV)"
    definition="Total dollar value of all bookings processed through the platform, before fees are deducted."
    whyItMatters="Shows the scale of economic activity RAV enables. VCs use GMV to measure marketplace size."
  />
</h3>

// KPI pill with tooltip:
<span className="text-slate-400 text-xs uppercase tracking-wider flex items-center">
  Liquidity Score™
  <TooltipIcon
    term="RAV Marketplace Liquidity Score™"
    definition="Composite health index (0–100) measuring how efficiently buyers and sellers connect. Combines bid acceptance rate (40%), speed to booking (30%), and repeat owner rate (30%)."
    whyItMatters="A score above 70 means the marketplace is self-sustaining. Narrowing toward that signals strong product-market fit."
  />
</span>
```

### Tooltip copy for every metric in Sessions 2 and 3:

Use this reference table. Copy-paste exact strings into each component — do not paraphrase.

**Section 1 — Headline Bar:**

| Metric | term | definition | whyItMatters |
|--------|------|------------|--------------|
| GMV | "Gross Merchandise Value (GMV)" | "Total dollar value of all bookings processed through RAV, before any fees are deducted." | "The primary measure of marketplace scale. VCs use GMV to assess the size of economic activity the platform enables." |
| Platform Revenue | "Platform Revenue" | "The portion of GMV that RAV keeps as its fee — currently 10% of each booking total." | "This is RAV's actual earned revenue. Growing faster than GMV signals improving take rate efficiency." |
| Active Listings | "Active Listings" | "Vacation weeks currently listed and available for booking or bidding on the platform." | "Supply-side health indicator. More listings = more choice for travelers = higher conversion." |
| Liquidity Score™ | "RAV Marketplace Liquidity Score™" | "Proprietary composite index (0–100) measuring how efficiently buyers and sellers connect. Combines bid acceptance rate (40%), days to book (30%), and repeat owner rate (30%)." | "No competitor can show this metric — it only exists because RAV has a bidding model. Above 70 = healthy self-sustaining marketplace." |
| Voice Adoption | "Voice Search Adoption Rate" | "Percentage of all property searches conducted using RAV's voice AI feature, powered by VAPI." | "RAV's 33% voice adoption is an industry first. Voice users convert to bookings at 4x the rate of traditional search users." |

**Section 2 — Business Performance:**

| Metric | term | definition | whyItMatters |
|--------|------|------------|--------------|
| GMV Trend | "GMV Trend" | "Monthly gross merchandise value over time, showing both total booking value and RAV's revenue share." | "The upward slope shows marketplace momentum. The gap between GMV and platform revenue lines shows take rate consistency." |
| Bid Activity | "Bid Activity" | "Number of bids placed by travelers vs bids accepted by owners each month. The gap between the two lines is marketplace friction." | "A narrowing gap means owners and travelers are aligning on price faster — a sign of a maturing marketplace." |
| Bid Spread Index™ | "RAV Bid Spread Index™" | "Average percentage gap between a traveler's opening offer and the owner's asking price, tracked over time." | "Unique to RAV's bidding model. A shrinking spread means price discovery is working — the market is finding its natural clearing price." |
| Revenue Waterfall | "Revenue Breakdown" | "How each booking's total value splits between the owner payout and RAV's platform commission." | "Shows take rate visually. Investors use this to assess margin sustainability and owner economics." |

**Section 3 — Marketplace Health:**

| Metric | term | definition | whyItMatters |
|--------|------|------------|--------------|
| Liquidity Gauge | "RAV Marketplace Liquidity Score™" | "Composite score calculated as: (Bid Acceptance Rate × 0.4) + (Days to Book, normalized × 0.3) + (Repeat Owner Rate × 0.3). Multiplied by a 1.2x platform maturity factor." | "62/100 is 'promising with room to grow' — the right place for an early-stage marketplace. Signals strong fundamentals without overpromising." |
| Supply/Demand | "Destination Supply vs Demand" | "Ratio of traveler searches to active listings per destination. High ratio = high demand, low supply = undersupplied market." | "Red destinations are growth opportunities — demand exists but supply is constrained. Shows where owner acquisition should focus." |
| Voice Funnel | "Voice vs Traditional Search Conversion" | "Side-by-side funnel showing how voice search users and traditional search users progress from search to booking." | "Voice search users convert at 4x the rate of traditional users. This is RAV's core product differentiation made measurable." |

---

## Task 1: Route and Page Shell

### 1a: Add route to `App.tsx`

```tsx
import ExecutiveDashboard from '@/pages/ExecutiveDashboard'

// Add inside your router, protected:
<Route
  path="/executive-dashboard"
  element={
    <ProtectedRoute requiredRole="rav_owner">
      <ExecutiveDashboard />
    </ProtectedRoute>
  }
/>
```

Check how `ProtectedRoute` works in the existing codebase — follow the same pattern used in Phase 4 Track A.

### 1b: Add nav link to Header

In `src/components/Header.tsx`, add a nav link visible only to `rav_owner` role:

```tsx
// Only show to rav_owner
{hasRole('rav_owner') && (
  <NavLink to="/executive-dashboard">
    Executive Dashboard
  </NavLink>
)}
```

Follow the existing `hasRole` / role-check pattern already in the Header.

### 1c: Create page file `src/pages/ExecutiveDashboard.tsx`

```tsx
export default function ExecutiveDashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Sticky headline bar */}
      <HeadlineBar />
      
      {/* Main content - scrollable */}
      <main className="max-w-[1600px] mx-auto px-6 py-8 space-y-8">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Executive Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Rent-A-Vacation · Strategic View</p>
          </div>
          <div className="text-slate-500 text-xs">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        {/* Section 2: Business Performance */}
        <BusinessPerformance />
        
        {/* Section 3: Marketplace Health */}
        <MarketplaceHealth />

        {/* Sections 4-6 come in Session 3 */}
      </main>
    </div>
  )
}
```

---

## Task 2: Section 1 — Headline Bar

Create `src/components/executive/HeadlineBar.tsx`

**Design:** Sticky bar at top, full width, `bg-slate-900/95 backdrop-blur border-b border-slate-800`.

Five KPI pills in a row:

```
[GMV All Time]  [Platform Revenue]  [Active Listings]  [Liquidity Score™]  [Voice Adoption]
  $102,600          $10,260              23               62 / 100              31%
  +42% YoY          +45% YoY           +3 this mo      ↑ Improving          Industry first
```

Each pill structure:
```tsx
<div className="flex flex-col items-center px-6 py-3 border-r border-slate-700 last:border-0">
  <span className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</span>
  <span className="text-white text-xl font-bold">{value}</span>
  <span className={`text-xs mt-0.5 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
    {trend > 0 ? '↑' : '↓'} {trendLabel}
  </span>
</div>
```

**Data:** Pull from `useBusinessMetrics()` and `useMarketplaceHealth()` hooks.

**Loading state:** Show skeleton pills while data loads (use `animate-pulse` with `bg-slate-700` placeholders).

---

## Task 3: Section 2 — Business Performance

Create `src/components/executive/BusinessPerformance.tsx`

Section heading:
```tsx
<SectionHeading title="Business Performance" subtitle="Revenue and growth trends" />
```

Create a shared `SectionHeading` component in `src/components/executive/SectionHeading.tsx`:
```tsx
// Consistent section headers across the dashboard
// Left-aligned title in text-white, subtitle in text-slate-400
// Optional right slot for period toggles
```

### Chart 2a: GMV Trend

```tsx
// 2-column grid item (spans 2 of 4 columns)
// Title: "GMV Trend" | Period toggle: [Weekly / Monthly / Quarterly]
// Recharts AreaChart
// Two areas: GMV (blue-500, 20% opacity fill) + Platform Revenue (emerald-500, 20% opacity fill)
// X axis: formatted month labels
// Y axis: dollar formatted ($94K style)
// Tooltip: shows both values for that period
```

### Chart 2b: Bid Activity

```tsx
// 1-column grid item
// Title: "Bid Activity"
// Recharts LineChart — two lines
// Line 1: "Bids Placed" — blue-400, strokeWidth 2
// Line 2: "Bids Accepted" — emerald-400, strokeWidth 2
// The GAP between lines is the key story — add annotation text: "Gap = Marketplace Friction"
// Tooltip: shows both values
```

### Chart 2c: Bid Spread Index™

```tsx
// 1-column grid item
// Title: "Bid Spread Index™" with amber "RAV Proprietary" badge
// Recharts BarChart — single bar per month
// Color: bars transition from amber (wide spread) to green (narrow spread) based on value
// Y axis: percentage format (showing avg % gap between offer and ask)
// Add subtitle: "Narrowing spread = healthier price discovery"
```

### Chart 2d: Revenue Waterfall

```tsx
// 2-column grid item (spans 2 of 4 columns — bottom row)
// Title: "Revenue Breakdown"
// Recharts BarChart — stacked bars per month
// Stack 1: Owner Payout (slate-500)
// Stack 2: RAV Commission (emerald-500)
// Shows take rate visually — add callout: "10% Platform Fee"
```

**Grid layout for Section 2:**
```tsx
<div className="grid grid-cols-4 gap-4">
  <div className="col-span-2">{/* GMV Trend */}</div>
  <div className="col-span-1">{/* Bid Activity */}</div>
  <div className="col-span-1">{/* Bid Spread Index */}</div>
  <div className="col-span-2">{/* Revenue Waterfall */}</div>
</div>
```

Each chart card: `bg-slate-800 rounded-xl p-6 border border-slate-700`

---

## Task 4: Section 3 — Marketplace Health

Create `src/components/executive/MarketplaceHealth.tsx`

This section has three distinct components.

### Component 3a: Liquidity Gauge

Create `src/components/executive/LiquidityGauge.tsx`

**This is the hero component — make it beautiful.**

```tsx
// Displays the RAV Marketplace Liquidity Score™ as a semicircular gauge

// Score: 62 out of 100
// Color zones:
//   0-40:  red-500 (Critical)
//   41-70: amber-500 (Building)
//   71-85: emerald-400 (Healthy)
//   86-100: emerald-300 (Thriving)

// Build with SVG arc paths (do NOT use a third-party gauge library)
// Center text: large "62" in white, below it "/ 100" in slate-400
// Below center: "Marketplace Liquidity Score™" label
// Amber "RAV Proprietary" badge top-right of card

// Below gauge: three component pills showing the breakdown:
//   Bid Acceptance 46% (weight 40%)
//   Days to Book  4.2d (weight 30%)
//   Repeat Owners 38% (weight 30%)

// Tooltip on hover of gauge: "Score = (Bid Acceptance × 0.4) + (Days to Book × 0.3) + (Repeat Owner Rate × 0.3)"
```

### Component 3b: Supply/Demand Heatmap

Create `src/components/executive/SupplyDemandMap.tsx`

**Simplified approach — do NOT use a heavy mapping library like Leaflet or MapBox.**

Use a visual card-based approach instead:
- Display 5 destination cards in a row
- Each card shows destination name, a color-coded intensity bar, and "X searches / Y listings"
- Color: red = undersupplied (high searches, few listings), green = balanced
- Title: "Demand vs Supply by Destination"
- Subtitle: "Red = growth opportunity"

```tsx
// Destinations from seed data:
// Orlando: 8 listings, ~35 searches → ratio 4.4 → amber (building)
// Maui: 5 listings, ~28 searches → ratio 5.6 → red (undersupplied)
// Cancun: 4 listings, ~22 searches → ratio 5.5 → red
// Park City: 3 listings, ~12 searches → ratio 4.0 → amber
// Myrtle Beach: 3 listings, ~8 searches → ratio 2.7 → green (balanced)

// Data comes from useMarketplaceHealth().supplyDemandByDest
```

### Component 3c: Voice Funnel

Create `src/components/executive/VoiceFunnel.tsx`

```tsx
// Side-by-side funnel comparison
// Left: "Voice Search" — blue accent
// Right: "Traditional Search" — slate accent

// Four steps each:
// Searches → Property Views → Bids Placed → Bookings

// Voice data (from hooks):
// Searches: 89, Views: 71 (80%), Bids: 31 (35%), Bookings: 14 (16%)

// Traditional (calculated: total - voice):
// Searches: 197, Views: 141 (72%), Bids: 36 (18%), Bookings: 8 (4%)

// Implementation: Simple horizontal bar chart per step, bars shrink per funnel
// Add callout card below: "Voice search users are 4x more likely to book"
// (16% vs 4% conversion — this is calculated from the data)
// Large amber badge: "33% Voice Adoption — Industry First"
```

**Grid layout for Section 3:**
```tsx
<div className="grid grid-cols-3 gap-4">
  <div className="col-span-1">{/* Liquidity Gauge */}</div>
  <div className="col-span-1">{/* Supply/Demand Map */}</div>
  <div className="col-span-1">{/* Voice Funnel */}</div>
</div>
```

---

## Task 5: Shared Utilities

Create `src/components/executive/utils.ts`:

```typescript
export function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

export function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export const CHART_COLORS = {
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  slate: '#64748b',
  grid: '#334155',
  tooltip: '#1e293b',
  axisText: '#94a3b8',
}
```

---

## Deliverables Checklist

- [ ] `TooltipIcon.tsx` — renders correctly, tooltip appears on hover with definition + whyItMatters
- [ ] Route `/executive-dashboard` renders without errors
- [ ] Page is dark theme throughout — no white backgrounds
- [ ] Redirects non-`rav_owner` users (test by logging in as renter)
- [ ] Nav link appears in Header for `rav_owner`
- [ ] Headline Bar: all 5 KPIs show real data from hooks
- [ ] **Headline Bar: every KPI has a `TooltipIcon` with correct copy from the table above**
- [ ] Headline Bar: loading skeleton shows while data loads
- [ ] GMV Trend chart: renders with monthly data, period toggle works
- [ ] **GMV Trend: chart title has `TooltipIcon`**
- [ ] Bid Activity chart: two lines render correctly
- [ ] **Bid Activity: chart title has `TooltipIcon`**
- [ ] Bid Spread Index™: amber "RAV Proprietary" badge visible
- [ ] **Bid Spread Index™: chart title has `TooltipIcon`**
- [ ] Revenue Waterfall: stacked bars render
- [ ] **Revenue Waterfall: chart title has `TooltipIcon`**
- [ ] Liquidity Gauge: SVG gauge renders at 62/100, correct color zone
- [ ] Liquidity Gauge: component breakdown pills below gauge
- [ ] **Liquidity Gauge: metric title has `TooltipIcon`**
- [ ] Supply/Demand: 5 destination cards with color coding
- [ ] **Supply/Demand: section title has `TooltipIcon`**
- [ ] Voice Funnel: side-by-side comparison renders
- [ ] Voice Funnel: "33% Voice Adoption — Industry First" callout visible
- [ ] **Voice Funnel: section title has `TooltipIcon`**
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] `npm run build` passes
- [ ] All 142+ existing tests still passing
- [ ] New tests: minimum 8 (hook calculations + component renders + TooltipIcon renders)

---

## Handoff to Session 3

Create `docs/features/executive-dashboard/handoffs/session2-handoff.md` with:
- Screenshot or description of each section rendered
- Any hook data shape differences from Session 1 spec
- Component file list with exact paths
- Any Recharts gotchas discovered
- Test count after this session
- Open items / known issues for Session 3 to address
