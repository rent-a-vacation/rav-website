---
last_updated: "2026-04-02T00:03:48"
change_ref: "73ad192"
change_type: "manual-edit"
status: "active"
---

# Rent-A-Vacation — Boardroom Business Context
> Read by every boardroom advisor at the start of each session.
> Keep current. Update after major milestones, pivots, or structural changes.
> Last updated: March 2026

---

## What RAV Is

Rent-A-Vacation (RAV) is a dual-sided bidding marketplace for timeshare and vacation club rental. Timeshare owners list their unused weeks; travelers bid using a "Name Your Price" mechanic. The platform's core differentiator is price discovery through bidding — not just listing and booking.

**Tagline:** "Name Your Price. Book Your Paradise."
**Live URL:** https://rent-a-vacation.com
**Stage:** Fully built, pre-launch. Staff Only Mode enabled. No real customers yet.

---

## The Problem RAV Solves

**For owners:** Timeshare owners pay $1,480/year average in maintenance fees (2024 ARDA data). If they don't use their week, that money is gone. There is no easy, trusted marketplace to rent out unused weeks.

**For travelers:** Vacation club properties run at 80% occupancy but the remaining 20% represents millions of high-quality resort nights invisible to the market. Travelers who want resort-quality stays at below-retail prices have no clean channel.

**The gap:** Existing options (RedWeek, VRBO, Facebook groups) are fragmented, unverified, and offer no price discovery. RAV's bidding engine creates genuine market pricing.

---

## Business Model

- **Take rate:** 15% service fee on each booking (charged to traveler)
- **Owner commission:** Variable 0–15% depending on tier and owner agreement
- **Escrow:** PaySafe holds funds until resort confirmation is verified
- **Payouts:** Stripe Connect — owner paid after checkout + 5 days

---

## Platform Status (March 2026)

| Layer | Status |
|-------|--------|
| Frontend (React 18, TypeScript, Vite, Tailwind) | ✅ Built, deployed to Vercel |
| Backend (Supabase PostgreSQL + 27 Edge Functions on Deno) | ✅ Built, deployed |
| Payments (Stripe Checkout + Connect) | ✅ Integrated — test keys DEV, live keys PROD |
| Voice AI — RAVIO (VAPI + Deepgram + ElevenLabs) | ✅ Built, tier-gated |
| Text Chat — RAVIO (OpenRouter / Gemini Flash + SSE) | ✅ Built |
| Owner verification — TrustShield | ✅ Built (deed, certificate, ID upload) |
| Escrow — PaySafe | ✅ Built |
| Bidding engine — Name Your Price | ✅ Built |
| Reverse auction — Vacation Wishes | ✅ Built |
| ResortIQ database (117 resorts, 351 unit types, 9 brands) | ✅ Built |
| RAV Smart Suite (5 free SEO tools) | ✅ Built |
| Executive Dashboard (investor-grade) | ✅ Built |
| Public API (read-only v1, 5 endpoints) | ✅ Built |
| Automated tests | ✅ 825 passing, 104 test files |
| Staff Only Mode (pre-launch lock) | ✅ ON — no public access |
| LLC / legal entity | ❌ Blocked — OBA disclosures pending for 2 co-founders |
| Stripe Tax | ❌ Blocked — requires EIN (blocked on LLC) |
| Public beta | ❌ Not yet open |

---

## Founding Team

| Person | Role | OBA Status |
|--------|------|-----------|
| Sujit G | CTO / Co-founder — all development | Disclosed at VyStar Credit Union |
| Ajumon Zacharia | COO / Co-founder — product direction | Pending |
| Sandhya Sujit | CPO / Executive team | Clear |
| Celin Sunny | CFO / Executive team | Pending |

**Critical blocker:** Ajumon and Celin work at regulated financial institutions. LLC cannot be formed until their Outside Business Activity (OBA) disclosures are cleared by their employers. Tracked as GitHub Issue #127.

---

## Key Named Features

| Feature Name | What It Does |
|-------------|-------------|
| **RAVIO** | AI voice + text concierge (voice via VAPI, text via OpenRouter) |
| **Name Your Price** | Bidding engine — travelers set a price, owners accept or counter |
| **Vacation Wishes** | Reverse auction — travelers post requests, owners submit proposals |
| **TrustShield** | Owner verification (deed, membership certificate, government ID) |
| **PaySafe** | Escrow — holds funds until resort confirmation number verified |
| **Owner's Edge** | Analytics for owners (pricing intelligence, fair value score, dynamic pricing) |
| **RAV Command** | Admin dashboard (14 tabs) |
| **ResortIQ** | Resort database — 117 resorts, 9 vacation club brands, auto-populates listings |
| **RAV Smart Suite** | 5 free tools: SmartEarn, SmartPrice, SmartCompare, SmartMatch, SmartBudget |

---

## Tech Stack (for technical debates)

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Supabase (PostgreSQL + Edge Functions on Deno)
- **Auth:** Supabase Auth
- **Payments:** Stripe Checkout + Stripe Connect
- **Voice:** VAPI (orchestration), Deepgram Nova-3 (STT), GPT-4o-mini (LLM), ElevenLabs (TTS)
- **Text Chat:** OpenRouter (Gemini 3 Flash), SSE streaming, tool calling
- **AI API:** Anthropic Claude (rav-dev-v1 key, $5 credits loaded)
- **Email:** Resend (domain: updates.rent-a-vacation.com)
- **Deployment:** Vercel (auto-deploy on push to main)
- **Monitoring:** Sentry.io, PostHog, GA4

---

## Strategic Context

**Exit strategy:** Acquisition by a larger hospitality or travel technology company.
**Target acquirers:** Marriott Vacations Worldwide, Hilton Grand Vacations, Wyndham, Expedia Group, Booking Holdings.
**Investment philosophy:** Managed services over premature infrastructure optimization — demonstrate technical superiority as an acquisition target.

**Market data:**
- US timeshare rental revenue: $3.2B in 2024 (up from $3.0B in 2023)
- Total vacation ownership market: $17.9B in 2024, projected $26.1B by 2029
- US timeshare resort occupancy: 80% in 2024 (vs 63% for hotels)
- Average maintenance fee: $1,480/year per interval (2024)

**Key competitive signal:** KOALA (timeshare rental marketplace) partnered with Expedia Group in May 2024 — validates the market and confirms Expedia is actively interested in this category. RAV must be the better version of what KOALA built.

---

## Open Strategic Questions

Active decisions the boardroom should be equipped to address:

1. **Beta launch timing** — when to lift Staff Only Mode; LLC formation is still blocked
2. **Go-to-market sequence** — recruit owners first or travelers first?
3. **RAVIO positioning** — is voice AI the headline differentiator or a supporting feature for the bidding marketplace?
4. **Mobile app** — before beta or after? Capacitor (cross-platform) is the planned approach
5. **Take rate** — current 15% service fee; is this right for the market?
6. **Investor/acquirer outreach** — pipeline not yet started; Apollo.io identified as first tool
7. **Public API expansion** — Phase B (write endpoints) timing post-launch

---

## Boardroom Sessions Output

Save all session output folders to:
```
C:\Repos\personal_gsujit\github_jisujit_tektekgo\rentavacation\docs\boardroom\sessions\
```

Name each session folder with a date prefix and decision slug:
```
YYYY-MM-DD-[decision-slug]
```

Example: `2026-03-23-beta-launch-before-llc`
