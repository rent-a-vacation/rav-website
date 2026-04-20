---
last_updated: "2026-04-20T02:55:17"
change_ref: "f82a427"
change_type: "session-54"
status: "active"
---
# PRIORITY ROADMAP — Rent-A-Vacation

> **Purpose:** Single source of truth for what to work on next. Updated every session that includes a prioritization discussion.
> **Rule:** Start every working session by reading this file + `gh issue list --state open`. This file captures the WHY and ORDER; GitHub Issues captures the WHAT and STATUS.
> **Excluded permanently:** #127 (LLC/EIN), #63 (Accounting — blocked on #127), #65 (Tax Filing — blocked on #127), #80 (Legal — needs LLC)

---

## Changelog since last tier assignment (Sessions 50–54)

- **Session 50-53 shipped:** Event unification (#338, #339), MDM WS1/WS2/WS3 (DEC-032), Brand/terminology lock (DEC-031), Site-wide UI polish, 5 tier-gated features (#278-#282 — all Tier C items now **DONE**), Sentry guide, API docs audit.
- **Session 54 shipped:** Stripe Tax env-flag gate (`STRIPE_TAX_ENABLED`), edge function JWT config hardening, migration 057 catch-up to DEV + PROD, MDM script CI fix, and 3 QA-surfaced bug fixes (offers-tab crash, owner bid notification, owner booking notification).
- **New follow-up issues opened in Session 54:**
  - **#370** — Platform synthetic uptime monitoring (DEC-033 — Checkly SaaS). Post-launch, not Tier A.
  - **#371** — Add edge function test harness (CLAUDE.md Tests-With-Features follow-up). Needs tier assignment.
- **QA audit items surfaced from testing (need issues + tier assignment):** terminology sync, listing verification UX, cancel listing flow, "Open for bidding" indicator, MyTrips post-booking detail view, Track 1 vs Track 2 user mental model.

---

## Current Priority Tiers (as of April 13, 2026 — Session 49)

### Tier A: Build Next (High Impact, Code-Ready)

**Tier A is EMPTY** — all items completed in Session 49. Promote from Tier B/C as needed.

### Tier B: Pre-Launch Important (Needs Human Input)

These require decisions, walkthroughs, or external dependencies before coding.

| Issue | Title | Blocker / Decision Needed |
|-------|-------|--------------------------|
| #187 | Pre-launch manual verification | Needs systematic walkthrough. Partially done. |
| #257 | Resort data compliance audit | Legal review of seed data sources. |
| #322 | RAV Wishes proposal enforcement | Deferred until 30+ days of real proposal data. Post-beta. |

### Tier C: Tier Feature Differentiation — ✅ COMPLETED IN SESSION 53 (PR #367)

All 5 items shipped. Migration 057. Shared `tierGating.ts` utility with 26 tests.

| Issue | Title | Status |
|-------|-------|--------|
| #278 | Early access to new listings (Traveler Plus) | ✅ Done |
| #279 | Exclusive deals for Premium travelers | ✅ Done |
| #280 | Priority listing placement for Owner Pro | ✅ Done |
| #281 | Concierge support for Premium travelers | ✅ Done |
| #282 | Dedicated account manager for Owner Business | ✅ Done |

### Tier D: Marketing & Social (Non-Code, Human-Driven)

These are marketing setup tasks. Can be done in parallel with code work.

| Issue | Title |
|-------|-------|
| #230 | Facebook Business Page |
| #231 | Instagram Business Account |
| #232 | LinkedIn Company Page |
| #234 | Google Business Profile |
| #213 | Social media presence setup (umbrella) |
| #214 | Content strategy & campaign planning |
| #256 | Pitch deck & investor materials |
| #250-255 | Market Research epic (6 issues) |

### Tier E: Post-Launch / Deferred

Park these until after launch or until specific triggers.

| Issue | Title | Trigger |
|-------|-------|---------|
| #240-248 | Mobile App epic (8 issues) | After PWA validates demand (DEC-011) |
| #188-192 | API enhancements (5 issues) | After first partner integration |
| #100 | Apple/Facebook OAuth | After launch, based on user demand |
| #106 | Email drip campaigns | After launch, when we have users |
| #107 | Blog / content marketing | After launch, for SEO |
| #225 | Slack workspace for partners | After first partner |
| #226-228 | Sentry enhancements (3 issues) | Post-launch monitoring needs |
| #224 | One-Time Events support | Future — after event search ships |
| #165 | Owner Volume Discount | Needs decision — post-launch |
| #166 | Membership tier value prop | Needs decision — post-launch |
| #71 | Percy GitHub integration | Low priority — private repo limitation |

---

## Blocked Chain (DO NOT WORK ON)

```
#127 (LLC/EIN formation) ─┬─→ #63 (Accounting / Puzzle.io)
                          ├─→ #65 (Automated Tax Filing)
                          ├─→ Stripe Tax activation
                          ├─→ Bank account setup
                          └─→ #80 (Legal — Terms of Service)
```

These unblock when the LLC is formed. Not code-dependent.

---

## Revision History

| Date | Session | Changes |
|------|---------|---------|
| Apr 15-16, 2026 | 52 | Terminology lock (Listing/Wish/Offer, DEC-031). UI polish (30 pages). Bug fixes #353+#354. MDM Resort Data complete (DEC-032): WS1 schema hardening, WS2 data quality + normalisation + descriptions, WS3 API enhancement. All deployed to DEV + PROD. Brand docs scrubbed. 1090 tests. PRs #352-#365. |
| Apr 14, 2026 | 51 | #349 UI polish audit completed. New `Section` + `SectionHeader` layout primitives. Tightened vertical rhythm, headings, and section demarcation across Homepage, PropertyDetail, Rentals, BiddingMarketplace, OwnerDashboard, MyBookings, ListProperty. Build clean, P0 tests passing. |
| Apr 14, 2026 | 50 | #338 + #339 completed. Events unified into DB (migration 055) + multi-year generator RPC (migration 056). Admin Templates tab + Add/Edit Instance dialogs + "Generate {next year}" button. `useCuratedEvents` hook. docs-audit CI permissions fix. ARCHITECTURE + COMPLETED-PHASES refreshed. PRs #350, #351. 1046 tests. |
| Apr 13, 2026 | 49 | Tier A cleared: #259, #283, #285, #286, #327, #328, #337. Logos. Discovery bar. Tax form. Social proof. 1047 tests. PRs #334-#348. |
| Apr 13, 2026 | 48 | #326 RAV Deals completed + closed. #273 Homepage completed (Session 47). Header nav consistency fix. Renumbered Tier A. |
| Apr 12, 2026 | 47 | Initial creation. Brand rebrand completed. Search & Discovery epic created (#325-#328). Full 5-tier prioritization. |

---

## How to Use This File

1. **At session start:** Read this file. Check `gh issue list --state open` for any new issues since last session.
2. **Pick work:** Start from Tier A, top to bottom. Skip if blocked or needs decision.
3. **After completing items:** Move them out of the tier, update the revision history.
4. **After any priority discussion:** Update the tiers, add a revision history entry with date + session + what changed.
5. **Cross-reference:** `docs/PROJECT-HUB.md` for architectural decisions, `docs/COMPLETED-PHASES.md` for technical history.
