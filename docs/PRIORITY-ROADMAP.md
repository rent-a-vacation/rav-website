---
last_updated: "2026-04-23T03:44:48"
change_ref: "683e4ad"
change_type: "session-58"
status: "active"
---
# PRIORITY ROADMAP — Rent-A-Vacation

> **Purpose:** Single source of truth for what to work on next. Updated every session that includes a prioritization discussion.
> **Rule:** Start every working session by reading this file + `gh issue list --state open`. This file captures the WHY and ORDER; GitHub Issues captures the WHAT and STATUS.
> **Excluded permanently:** #127 (LLC/EIN), #63 (Accounting — blocked on #127), #65 (Tax Filing — blocked on #127), #80 (Legal — needs LLC)

---

## Changelog since last tier assignment (Sessions 50–57)

- **Session 57 shipped — Phase 22 Tracks A, B, E (15 of 22 tickets, 8 PRs):** Documentation infrastructure end-to-end: 22 markdown files in `docs/support/` (20 content + README + GAP-ANALYSIS + CS-OVERVIEW + 5 diagrams). Migration 060 + `ingest-support-docs` edge function + GitHub Action `sync-support-docs.yml` all deployed to DEV. `scripts/docs-sync-check.ts` extended with frontmatter validation + legal-review gate. 6 legal-blocked drafts held at `status: draft` pending lawyer review (#80). PRs #418-#425. **Remaining (next session):** Track C #405-#409 (RAVIO agent code — `context: 'support'`, route detection, intent classifier, 5 agent tools, source tagging). Track D #410-#411 (conversation logging + admin metrics).


- **Session 50-53 shipped:** Event unification (#338, #339), MDM WS1/WS2/WS3 (DEC-032), Brand/terminology lock (DEC-031), Site-wide UI polish, 5 tier-gated features (#278-#282 — all Tier C items now **DONE**), Sentry guide, API docs audit.
- **Session 54 shipped:** Stripe Tax env-flag gate (`STRIPE_TAX_ENABLED`), edge function JWT config hardening, migration 057 catch-up to DEV + PROD, MDM script CI fix, and 3 QA-surfaced bug fixes (offers-tab crash, owner bid notification, owner booking notification). PRs #372-#374.
- **Session 55 shipped:** QA audit response (S-01..S-05 read; 7 new issues opened — #375-#381); Phase A UX wins: **#379 MyTrips booking detail view** (fee breakdown, cancellation policy, resort confirmation, check-in countdown — PR #382) and **#375 Path 3 hybrid dashboard naming** (role-descriptive eyebrows above brand H1, mobile nav fix — PR #383); `/sdlc` Phase 6 doc-update checklist expanded. PRs #382-#384.
- **Session 56 shipped — DEC-034 Marketplace Flow Distinction end-to-end (#380 CLOSED):** 5 incremental PRs (#385-#389). Schema: `listing_source_type` enum + `source_type` column on listings/bookings + `travel_proposal_id` FK (Migration 058). Edge functions branch per source_type: Pre-Booked auto-confirms; Wish-Matched keeps countdown. `ListingTypeBadge` visual system applied to MyBookings, PropertyDetail, OwnerListings, AdminEscrow. **Critical search-filter bug fixed** (wish-matched listings no longer leak to unrelated travelers). 3 new notification types: `wish_owner_confirming`, `wish_owner_confirmed`, `wish_owner_failed_to_confirm` (Migration 059). AdminEscrow filter by type + badge per row. `/sdlc` Phase 6 checklist promoted to root `CLAUDE.md` (PR #390) so doc-sync applies to every session regardless of entry point.

### Issues closed in Sessions 55-56
- ✅ **#375** — Dashboard terminology alignment (Session 55, PR #383)
- ✅ **#379** — MyTrips booking detail view (Session 55, PR #382)
- ✅ **#380** — Marketplace Flow Distinction / DEC-034 (Session 56, PRs #385-#389)

### New follow-up issues still open (need work or tier assignment)
- **#370** — Platform synthetic uptime monitoring (DEC-033 — Checkly SaaS). Post-launch → Tier E.
- **#371** — Edge function test harness (CLAUDE.md Tests-With-Features follow-up). Tier B (needs scope decision).
- **#376** — Pre-Booked listing verification proof workflow (unblocked by DEC-034). **Ready for Tier A.**
- **#377** — Cancel-listing cascade (bids + bookings + escrow + notifications). Standalone. **Ready for Tier A.**
- **#378** — "Open for Bidding" indicator across all surfaces (unblocked by DEC-034). **Ready for Tier A.**
- **#381** — Role-relevant landing-view ordering. **Ready for Tier A.**

---

## Current Priority Tiers (as of April 22, 2026 — Session 58)

### Tier A: Build Next (High Impact, Code-Ready)

All unblocked follow-ups from Sessions 54-58. Pick in any order; they're independent.

| Issue | Title | Est. | Why now |
|-------|-------|------|---------|
| **#411** | Phase 22 D2: Admin "Support Interactions" tab + metrics | 1d | Last Phase 22 ticket. Depends on #410 (shipped). Transcript browser, deflection/escalation/SLA metrics, thumbs up/down UI. |
| **#376** | Pre-Booked listing verification (resort reservation proof) | 1-2d | Unblocked by DEC-034 — proof-collection UX only meaningful after the flow distinction exists (which it now does). New schema fields + admin verify dialog + email templates. |
| **#378** | "Open for Bidding" indicator everywhere (create-time toggle + consistent badge) | 3-4h | Unblocked by DEC-034 — integrates with the ListingTypeBadge visual system. |
| **#381** | Role-relevant landing-view ordering | 6-8h | Surface most-time-sensitive items on each dashboard's Overview tab per "rooted in simplicity" principle. |
| **#377** | Cancel-listing cascade (bulk bid rejection + booking cancellation + notifications) | 1d | Standalone, coordinates with DEC-034 wish-matched handling. New edge function + atomic cascade. |
| **#371** | Edge function test harness | 1-2d (needs scoping) | Tech-debt follow-up from Tests-With-Features shortfalls. Enables future edge-fn work to be properly tested. |
| **#393** | PLATFORM-INVENTORY.md — one-page mental model of everything built | 2-3h | Session 56 meta-ask: a single doc cataloging product + platform + dev-tooling + governance layers so the user can explain what they've built to investors, new collaborators, and future sessions. |

> **Phase 22 epic (#395)** — Tracks A, B, C, E complete + D1 shipped. C1+C4+C2+C5+C3+D1 (#405+#408+#406+#409+#407+#410) shipped in Session 58 (5 PRs). Only **#411 D2** remains — admin transcript browser + metrics + thumbs UI.

### Tier B: Pre-Launch Important (Needs Human Input)

These require decisions, walkthroughs, or external dependencies before coding.

| Issue | Title | Blocker / Decision Needed |
|-------|-------|--------------------------|
| #187 | Pre-launch manual verification | Needs systematic walkthrough. Partially done. |
| #257 | Resort data compliance audit | Legal review of seed data sources. |
| #322 | RAV Wishes proposal enforcement | Deferred until 30+ days of real proposal data. Post-beta. |
| **#404** | Phase 22 B5: Legal-blocked public policy docs (privacy, booking-terms, payment-policy, trust-safety, insurance-liability, subscription-terms) | Blocked by #80 (legal consult — timeshare lawyer). 6 drafts production-ready, held with `status: 'draft'` pending lawyer sign-off. Not blocking launch of the support agent itself. |

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
| #370 | Checkly synthetic uptime monitoring (DEC-033) | Post-launch — complements Sentry, covers critical-path health |
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
| Apr 22, 2026 | 58 | **Phase 22 Tracks C complete + D1 shipped** — 5 PRs across the session. PR #428 (C1+C4): text-chat `context:'support'` + 5 agent tools; DB-first with live Stripe reconcile. PR #429 (C2): route-based context detection + `<RavioFloatingChat />` on /my-trips, /owner-dashboard, /account. PR #430 (C5): Migration 061 `dispute_source` enum; AdminDisputes "via RAVIO" badges. PR #431 (C3): `intent-classifier.ts` + SSE `classified_context` + "Switched to X — back" chip with session-scoped dismissal. PR #432 (D1): Migration 062 `support_conversations` + `support_messages` with tool-call first-class turn type; edge-fn logger wires full transcript capture + escalation stamping; frontend threads `conversation_id`. 113 new tests total this session. Phase 22 now 95% complete (21 of 22). Remaining: only **#411 D2** (admin metrics + transcript UI). |
| Apr 21, 2026 | 57 | **Phase 22 SHIPPED Tracks A + B + E (15 of 22 tickets, 8 PRs #418-#425).** Full documentation infrastructure end-to-end on DEV: 22 markdown files in `docs/support/`, migration 060 (support_docs), `ingest-support-docs` edge fn + GitHub Action, `docs-sync-check` extension, 6 legal-blocked drafts at status:draft pending #80. Issues closed: #396-#404, #412-#417. Remaining: Track C (#405-#409 RAVIO agent code) + Track D (#410, #411 observability) — next session. PROD deploys held per CLAUDE.md. |
| Apr 20, 2026 | 57 (planning) | Phase 22 Customer Support Foundation SCOPED. Milestone #37 + epic #395 + 22 child issues #396-#417. DEC-036 logged: reject CrewAI, extend RAVIO text chat with `context: 'support'` + tool use; voice stays discovery-only. 20 support docs planned. Markdown canonical → Supabase `support_docs` sync. PR #418. |
| Apr 20, 2026 | 56 | **DEC-034 Marketplace Flow Distinction SHIPPED end-to-end (#380 CLOSED)** via 5 incremental PRs (#385-#389). Migrations 058 + 059. `listing_source_type` enum + `ListingTypeBadge` everywhere. Critical search-filter fix. 3 new notification types. `/sdlc` doc-update checklist promoted to root `CLAUDE.md` (PR #390) so it applies to every session. 1146 tests. Issues unblocked: #376, #378, #381. |
| Apr 20, 2026 | 55 | QA audit response: read S-01..S-05 from scenario spreadsheet, opened 7 new issues (#375-#381) with full findings. Shipped Phase A UX wins: #379 MyTrips booking detail (PR #382), #375 Path 3 hybrid dashboard naming (PR #383). Expanded `/sdlc` Phase 6 into 13-item doc-update checklist. 1140 tests. DEC-035 (dashboard naming) logged. |
| Apr 18-19, 2026 | 54 | Stripe Tax env-flag gate (`STRIPE_TAX_ENABLED`) fixes dev + PROD checkout blocker. Edge function JWT regression fixed via `config.toml` + `--no-verify-jwt`. Migration 057 deployed. MDM script CI fix. 3 bug fixes surfaced by QA testing (offers crash, owner bid/booking notifications). PRs #372-#374. Opened #370, #371. DEC-033 (Checkly monitoring). 1133 tests. |
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
