---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Executive Dashboard — Feature README

**Route:** `/executive-dashboard`  
**Access:** `rav_owner` role only  
**Phase:** 14  
**Status:** ✅ Completed (Session 14)
**Created:** February 20, 2026
**Note:** Standalone page at `/executive-dashboard` per DEC-014 (not a tab in admin)

---

## What This Is

A premium, investor-grade strategic dashboard for the RAV Owner. Designed to impress VCs and provide real business intelligence. Completely separate from the Admin Command Center in design language and purpose.

**The story it tells:** "We've built infrastructure that can scale, in a market nobody has properly served."

---

## Quick Links

| Doc | Purpose |
|-----|---------|
| `00-PROJECT-BRIEF.md` | Full spec — read this first |
| `01-SESSION1-TASK.md` | Agent task: Foundation & Data Layer |
| `02-SESSION2-TASK.md` | Agent task: UI Sections 1–3 |
| `03-SESSION3-TASK.md` | Agent task: Market Intelligence + Polish |
| `handoffs/` | Session completion summaries |

---

## Dashboard Sections

| # | Section | Data Source | Status |
|---|---------|------------|--------|
| 1 | Headline Bar (5 KPI pills) | Tier 1 — Supabase | ⬜ Not built |
| 2 | Business Performance (4 charts) | Tier 1 — Supabase | ⬜ Not built |
| 3 | Marketplace Health (3 proprietary) | Tier 1 — Supabase | ⬜ Not built |
| 4 | Market Intelligence (BYOK) | Tier 3 — AirDNA/STR | ⬜ Not built |
| 5 | Industry Intelligence Feed | Tier 2 — NewsAPI/FRED | ⬜ Not built |
| 6 | Unit Economics | Tier 1 — Supabase | ⬜ Not built |

---

## Proprietary Metrics (RAV-specific)

These metrics exist ONLY because RAV has a bidding model. No competitor can show them.

- **RAV Marketplace Liquidity Score™** — composite health index (0–100)
- **RAV Bid Spread Index™** — price discovery health over time
- **Voice vs Traditional Conversion Funnel** — unique to RAV's voice AI adoption

---

## Data Tiers

- **Tier 1:** Always live from Supabase (no external APIs)
- **Tier 2:** Live from free APIs (NewsAPI, FRED — no cost)
- **Tier 3:** BYOK — Demo Mode by default, unlocked with user-supplied API key

---

## Key Decisions

| ID | Decision |
|----|---------|
| DEC-014 | Separate `/executive-dashboard` route (not a tab in admin) |
| DEC-015 | "Demo Mode / Connected" BYOK pattern |
| DEC-016 | NewsAPI free tier via Edge Function with 60-min cache |
| DEC-017 | Dark-first theme (not Tailwind dark: variants) |

---

## Running the Demo Seed

```bash
# Populate DEV database with coherent demo data
npx ts-node scripts/seed-executive-demo.ts

# Expected output: 47 users, 22 bookings, $102,600 GMV
```

---

## Edge Functions

| Function | Purpose | API Key Required |
|----------|---------|-----------------|
| `fetch-industry-news` | NewsAPI + Google News RSS | NEWSAPI_KEY secret |
| `fetch-macro-indicators` | FRED consumer confidence data | None (public) |
| `fetch-airdna-data` | Market comp data | BYOK — user supplied |
| `fetch-str-data` | STR benchmark data | BYOK — user supplied |

---

## Files Created (after all 3 sessions)

```
src/pages/ExecutiveDashboard.tsx
src/components/executive/
├── HeadlineBar.tsx
├── BusinessPerformance.tsx
├── MarketplaceHealth.tsx
├── LiquidityGauge.tsx
├── SupplyDemandMap.tsx
├── VoiceFunnel.tsx
├── MarketIntelligence.tsx
├── BYOKCard.tsx
├── IndustryFeed.tsx
├── UnitEconomics.tsx
├── IntegrationSettings.tsx
├── SectionDivider.tsx
├── SectionHeading.tsx
└── utils.ts
src/hooks/executive/
├── useBusinessMetrics.ts
├── useMarketplaceHealth.ts
├── useIndustryFeed.ts
└── useMarketIntelligence.ts
supabase/functions/
├── fetch-industry-news/index.ts
├── fetch-macro-indicators/index.ts
├── fetch-airdna-data/index.ts
└── fetch-str-data/index.ts
scripts/seed-executive-demo.ts
docs/supabase-migrations/013_executive_dashboard_settings.sql
```
