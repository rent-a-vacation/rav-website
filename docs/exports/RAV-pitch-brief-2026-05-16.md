---
last_updated: "2026-05-16T06:57:03"
change_ref: "e5fb9cf"
change_type: "snapshot-pitch-brief-2026-05-16"
status: "active"
doc_kind: "snapshot"
---

# Rent-A-Vacation (RAV) — Founder Pitch Brief — May 16, 2026

> One-page primer for advisor / mentor / warm-intro conversations. Designed to be read in 60-90 seconds. For the high-level financials, see the companion brief: `RAV-spend-brief-2026-05-16.md`.

---

## What RAV is

**Rent-A-Vacation (RAV) is a two-sided marketplace for vacation-club and timeshare week rentals.** Owners of unused timeshare weeks list them; travelers discover, negotiate, and book those weeks — with transparent per-night pricing, traveler-side bidding, and platform-held escrow that protects both sides until the traveler physically checks in.

## The business we're in

The U.S. vacation-ownership (timeshare) industry is **$10.5 billion**, with roughly **9.9 million households** owning timeshares (ARDA 2024). Owners frequently can't use every week they own, and existing rental options are fragmented: Facebook groups, classifieds, legacy resale sites. None offer pricing transparency, traveler trust, or owner-friendly negotiation. **Travelers** looking for vacation-club inventory have no efficient way to discover it. **RAV sits in that gap** — a purpose-built peer-to-peer marketplace with the trust infrastructure (escrow, identity verification, dispute resolution) that the existing channels lack.

## What makes RAV different

- **Name Your Price + RAV Wishes (reverse-auction).** Travelers don't just accept listed prices — they bid, propose alternative dates, or post a wish list that owners compete to fulfill. Owners see live demand signals while pricing their listings.
- **PaySafe escrow.** Stripe holds the funds through Stripe Connect; RAV releases to the owner 5 days after check-out, with the traveler confirming arrival. RAV is **not** a money services business — Stripe carries that compliance load.
- **TrustShield owner verification.** Identity + ownership proof flow built. Tiered verification.
- **AI-native discovery.** *Ask RAVIO* (voice search via VAPI) and *Chat with RAVIO* (text via OpenRouter) complement traditional search. Voice quota tiered by membership.
- **Marketplace facilitator.** RAV handles occupancy/sales tax via Stripe Tax (code ready, pending Delaware C-Corp formation).
- **Revenue model.** 12% commission per booking (10% Pro / 8% Business tier discounts) + four subscription tiers (Plus $5 / Premium $15 / Pro $10 / Business $25).

## Where we are right now

| What | Where we are |
|---|---|
| **Product Status** | Built and live at rent-a-vacation.com. Staff Only Mode enabled — not yet public. |
| **Tech Stack** | React 18 · TypeScript · Supabase (PostgreSQL) · Stripe · VAPI · Vercel |
| **Test Coverage** | 1,090 automated tests · 0 type errors · 0 lint errors · Clean build |
| **Database** | 46 SQL migrations deployed to production. 30 edge functions. |
| **Resort Directory** | 117 resorts · 351 unit types · 9 brands (Hilton, Marriott, Disney, Wyndham, and more) |
| **Marketplace** | Listings · Wishes · Offers — two-sided negotiation with Name Your Price + Offer mechanic |
| **AI Features** | Ask RAVIO (voice search via VAPI) · Chat with RAVIO (text AI via OpenRouter) |
| **Revenue Ready** | Stripe Connect · PaySafe escrow · cancellation policies · subscription billing built |
| **Verification** | TrustShield owner identity + ownership verification system built |
| **Key Blockers** | Delaware C-Corp (#127) · Legal review ToS/Privacy (#80) · A2P 10DLC SMS |
| **Savings Claim** | Save 20-40% vs resort-direct booking [ARDA industry data — BRAND-LOCK.md approved] |
| **Market Size** | $10.5B vacation ownership industry · 9.9M U.S. households own timeshares [ARDA 2024] |

_Live platform stats at this snapshot:_ **1,778 automated tests**, **74 database migrations**, **39 edge functions**, app version **0.9.0**. Verified facts (CLAUDE.md): 117 resorts, 12% commission rate, 4 co-founders.

## Funding-timeline milestones (from the financial model)

| When | Theme | What happens |
|---|---|---|
| Months 1-2 | **Legal** | Delaware C-Corp formed. IP Assignments signed (all 4 founders). OBA disclosures filed. Timeshare attorney consulted. |
| Months 2-3 | **Tech** | Stripe Tax activated. A2P 10DLC registered. Puzzle.io live. All production blockers cleared. |
| Month 4 | **Pre-Launch** | Beta owner recruitment (invite-only). TrustShield documented. ToS legally reviewed (#80). |
| Month 5 | **Launch** | Platform opens. First Listings and Wishes live. First Offers submitted. First Stripe payouts. |
| Month 6 | **Marketing** | First industry conference (ARDA). Exhibitor booth. Direct owner acquisition. First 50+ users. |
| Months 8-10 | **Growth** | 10+ active owners. 50+ completed transactions. First subscription revenue. Referral program active. |
| Month 12 | **Metrics** | First investor-ready deck: GMV, take rate, Offer acceptance rate, LTV/CAC. |
| Months 18-24 | **Profitability** | Break-even or Series A raise. Possible acquisition conversation with hospitality tech buyer. |

## Team posture

Four co-founders. **No payroll yet** — co-founder stipends activate post-funding. Built and operated AI-first: the platform was authored across ~68 documented sessions using Claude (Anthropic) as the primary development tool, with a structured SDLC, documentation framework, and per-PR doc-sync watchdog (see `/sdlc`, `/sdlc-docs`, `/generate-docs` skills in the repo). Capital efficient by design — see the spend brief for current run-rate.

## What's NOT in this brief

- **Financials** — see companion `RAV-spend-brief-<date>.md` (run `/generate-docs --spend-brief`)
- **Full platform inventory** — see `/generate-docs --operating-model` for the technical deep-dive
- **Compliance posture** — see `docs/payments/PAYSAFE-COMPLIANCE.md` for the legal model
- **Investor metrics / GMV / take rate** — that becomes meaningful post-launch (Month 12 milestone)

---

## Sources

| Source (canonical) | Path | Last commit |
|---|---|---|
| Platform facts + milestones | [`src/lib/financial-model/data.ts`](../../src/lib/financial-model/data.ts) | `ec5cb14` (2026-05-11) — feat(executive): Phase 2 Stage 2a — Financial Model dashboard at /executive-dashboard/financial-model |
| Pricing & accounting framework | [`docs/RAV-PRICING-TAXES-ACCOUNTING.md`](../../docs/RAV-PRICING-TAXES-ACCOUNTING.md) | `3a9993d` (2026-05-15) — docs: refresh accounting + add INDEX + features cleanup (Session 68 Part 4 PR1/4) |
| Brand & terminology | [`docs/brand-assets/BRAND-LOCK.md`](../../docs/brand-assets/BRAND-LOCK.md) | `74c4730` (2026-05-13) — feat(commission): #510 runtime architecture — DB-first read, admin UI, audit log, async edge helper |
| Test status | [`docs/testing/TESTING-STATUS.md`](../../docs/testing/TESTING-STATUS.md) | `74c4730` (2026-05-13) — feat(commission): #510 runtime architecture — DB-first read, admin UI, audit log, async edge helper |

## Verification trail

- **Generated by:** `docs/exports/generate_pitch_brief.py`
- **HEAD at snapshot time:** `e5fb9cf`
- **Snapshot date:** May 16, 2026
- **Facts dump timestamp:** 2026-05-16T10:57:02.954Z
- **No content duplication** — narrative is curated for this brief; facts/milestones quoted from canonical `src/lib/financial-model/data.ts`. Regenerate any time the model evolves.

---

_Founder-facing brief. Friendly-but-not-public. For the website-facing version, see the homepage at rent-a-vacation.com._
