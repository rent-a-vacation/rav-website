---
last_updated: "2026-04-28T10:04:52"
change_ref: "dfba76b"
change_type: "session-61"
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

## Next-Session Pickup (confirmed with user end of Session 59)

When `/sdlc pickup` runs next, the user has explicitly scoped the next session around four items. Work them in this order; they are independent.

1. **#371** — Edge function test harness. Tech-debt; unblocks proper Tests-With-Features coverage for all future edge-fn work. 1-2d (needs scoping).
2. **#438** — Incorporation documentation starter kit. Draft `docs/incorporation/` folder from Stripe Atlas samples + enhance. Pairs with #80 lawyer-review pass on existing platform ToS drafts. 2-4h.
3. **#230–#234** — Marketing social setup (Facebook, Instagram, LinkedIn, Google Business, X). Mostly non-code; some admin + content drafting. Sequence in whatever order makes sense per user availability.
4. **#256** — Pitch deck & investor materials. Brand-aligned + uses PLATFORM-INVENTORY.md from Session 59 as source-of-truth for capability claims.

**Also consider after those:** A controlled PROD deploy window for the accumulated Phase 22 + Session 59 changes (migrations 060–065, text-chat updates with support context + 5 tools + classifier, ingest-support-docs + cancel-listing edge fns, support_conversations + listing-proofs + dispute_source schemas). All currently sit on DEV per CLAUDE.md human-confirmation rule.

## Current Priority Tiers (as of April 28, 2026 — Session 61)

### Tier A: Build Next (High Impact, Code-Ready)

_Empty after Session 60. #371 + #442 + #445 all shipped (PRs #441, #446). All edge-fn harness work either complete or properly deferred (see Tier E for #443/#444)._

> **Phase 22 epic (#395) — COMPLETE (22/22 tickets).** Session 58 closed out C1+C4+C2+C5+C3+D1+D2 across 6 PRs (#428-#433). Session 59 cleared all remaining Tier A pre-launch marketplace items (#376 proof workflow, #378 Open-for-Offers, #381 Action Needed dashboards, #377 cancel-listing cascade, #393 PLATFORM-INVENTORY). Session 60 closed #371 (edge-fn test harness, DEC-037), #442 (Stripe Connect tests), #445 (vitest coverage extension).
>
> Next pickup is **#438 (incorporation docs starter kit)** — see Tier B.

### Tier B: Pre-Launch Important (Needs Human Input)

These require decisions, walkthroughs, or external dependencies before coding.

| Issue | Title | Blocker / Decision Needed |
|-------|-------|--------------------------|
| #187 | Pre-launch manual verification | Needs systematic walkthrough. Partially done. |
| #257 | Resort data compliance audit | Legal review of seed data sources. |
| #322 | RAV Wishes proposal enforcement | Deferred until 30+ days of real proposal data. Post-beta. |
| **#404** | Phase 22 B5: Legal-blocked public policy docs (privacy, booking-terms, payment-policy, trust-safety, insurance-liability, subscription-terms, refund, cancellation) | Blocked by #80 (legal consult — timeshare lawyer). 8 drafts production-ready in `docs/support/policies/`, held with `status: 'draft'` pending lawyer sign-off. Bundle into the same lawyer pass as #438. |
| **#438** | Incorporation documentation starter kit (operating agreement, formation checklist, IP assignment, state tax notes, RAV-specific marketplace docs) | **NEXT PICKUP.** Confirmed Session 60: Delaware C-Corp via Stripe Atlas (vs Gust under boardroom review); 4 founders all Florida-based; foreign-entity registration in Florida; scope WIDE — full packet for #80 lawyer engagement. Goal: zero owners onboard before lawyer signs off. |
| **#461** | PaySafe Gap A — wire up `confirm-checkin` server action (renter arrival button is currently a no-op) | New issue from PaySafe spec §3.2 (DEC-038). Pre-launch. Blocks #462 + #467. |
| **#462** | PaySafe Gap B — auto-confirmation cron when renter ignores deadline | Depends on #461. Pre-launch — needed for fraud + dispute analytics. |
| **#464** | PaySafe Gap G — enforce dispute SLAs with alerting + business-hours config | Pre-launch (operational). 2-hour triage on safety/owner-no-show categories cannot be a paper target at launch. |
| **#465** | PaySafe Gap H — auto-mirror Stripe `charge.dispute.created` to internal disputes | Pre-launch. Chargeback evidence windows are tight; manual mirroring loses time. |
| **#466** | PaySafe Gap I — jurisdiction field on bookings + per-state disclosure logic | Pre-launch. Linked to #80 — counsel input gates seeding the rules table. Decision A/B/C in issue body re: launch jurisdictions. |

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

| Issue | Title | Notes |
|-------|-------|-------|
| #230 | Facebook Business Page | pre-launch |
| #231 | Instagram Business Account | pre-launch |
| #232 | LinkedIn Company Page | pre-launch |
| #234 | Google Business Profile | pre-launch |
| #213 | Social media presence setup (umbrella) | covers #230-#234 + #233 |
| #214 | Content strategy & campaign planning | post-launch (label) but feeds into pre-launch positioning |
| #256 | Pitch deck & investor materials | pre-launch — pickup #4 from Session 59 plan; uses PLATFORM-INVENTORY.md as source-of-truth |
| #233 | X (Twitter) profile setup | labeled `post-launch` — moved out of pre-launch group; surfaces here for tracking |
| #250-255 | Market Research epic (6 issues) | pre-launch — feature comparison, mystery shopping, review mining, keyword research, ARDA reports |

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
| **#368** | Tier value enhancements (faster payouts, cancellation upgrades, seasonal pricing) | post-launch — needs scoping decision; was previously unmapped to any tier |
| #71 | Percy GitHub integration | Low priority — private repo limitation |
| #440 | Archive PROJECT-HUB session handoffs 25-54 to COMPLETED-PHASES | Mechanical doc migration. Pure reorganization — defer until a docs-focused session. |
| **#443** | Edge-fn test for ingest-support-docs (admin ETL) | Low-risk admin ETL. Implementation guide posted as comment on issue (Session 60). Can be picked up anytime — ~2-3h work. |
| **#444** | Edge-fn tests for notification stack (notification-dispatcher, sms-scheduler, twilio-webhook) | Blocked on A2P 10DLC anyway (#127 chain). Wait until SMS handles production traffic before adding tests. |
| **#467** | PaySafe Gap C — pre-fill dispute form from check-in issue report | Post-launch UX win. Depends on #461 (Pre-launch). |
| **#468** | PaySafe Gap D — move `HOLD_PERIOD_DAYS` to `system_settings` | Post-launch ergonomics. Currently hardcoded at 5; ops cannot tune without redeploy. |
| **#469** | PaySafe Gap F — native split refunds, holdbacks, rebooking credits, fee waivers | Post-launch. Likely splits into a small epic — needs DEC for scope. |
| **#463** | PaySafe Gap E — enforce per-category dispute role mapping in schema/RLS | Pre-launch (low risk). In `Security Hardening` milestone (#24). |

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
| Apr 27–28, 2026 | 61 | **PaySafe Flow Specification SHIPPED (PR #460).** New `docs/payments/PAYSAFE-FLOW-SPEC.md` — authoritative internal spec for the escrow + dispute system across 11 sections. DEC-038 logged. **9 gap issues opened** (#461–#469): pre-launch (#461 confirm-checkin server action, #462 auto-confirm cron, #463 role-mapping enforcement, #464 SLA enforcement, #465 Stripe chargeback auto-mirror, #466 jurisdiction field) and post-launch (#467 issue→dispute pre-fill, #468 hold-period to system_settings, #469 split refunds/holdbacks/credits). Tier B updated with the 5 Launch-Readiness gap issues; Tier E updated with the 3 post-launch gap issues + #463 (Security Hardening). Doc-only PR — no test count change (1394), no migrations, no edge-fn changes. |
| Apr 25, 2026 | 60 | **#442 + #445 SHIPPED (PR #446).** Stripe Connect tests + vitest coverage extension to `supabase/functions/**`. 19 new tests (1375 → 1394). Coverage now measures handler.ts files; thresholds unchanged at 25/25/30/25 — all pass with 75/78/84/75 actuals. Tier A confirmed empty. Tier audit: added #368 + #443 + #444 to Tier E with explicit triggers; clarified #233 (X/Twitter) as post-launch; expanded #404 row to mention all 8 policy drafts (was 6); reframed #438 with confirmed Atlas + 4-founder + Florida foreign-entity scope. |
| Apr 25, 2026 | 60 | **#371 SHIPPED — edge function test harness.** DEC-037 logged: Vitest, not Deno-native. Pattern: each Stripe-touching + cancel-listing edge fn split into `handler.ts` (testable) + `index.ts` (5-line `Deno.serve` wrapper). 64 new tests across 6 files (1311 → 1375); 23 new `@p0` tags (176 → 199). Refactored: create-booking-checkout, verify-booking-payment, stripe-webhook, process-cancellation, cancel-listing. Plus extracted `text-chat/context-resolver.ts` for the pure intent-classification routing logic. New shared infra: `_shared/__tests__/{stripe-mock, edge-fn-fixtures, stripe-events}.ts`. Tier A now empty; next pickup **#438**. |
| Apr 25, 2026 | 60 | **Session 60 pickup + doc audit.** All 4 bootstrap docs brought current: LAUNCH-READINESS rebuilt with Sessions 53-59 platform-completeness rows + updated By-the-Numbers (1311 tests / 141 files / 065 migrations / 36 edge fns); PROJECT-HUB body 'Last Updated' bumped to Session 59; PRIORITY-ROADMAP + COMPLETED-PHASES frontmatter stamped to session-59. New issue **#440** opened for the larger archival task (move PROJECT-HUB Session 25-54 handoff entries into COMPLETED-PHASES). Tier E. Doc audit cleared before pivoting to #371. |
| Apr 24, 2026 | 59 | **Session close handoff.** All 5 Session-59 PRs merged (#434–#437). New issue **#438** opened for Session-60 incorporation-docs research. Priority queue explicitly set for next `/sdlc pickup`: #371 → #438 → #230-234 → #256. PROD deploy window for accumulated DEV migrations 060–065 + edge fns (`ingest-support-docs`, `cancel-listing`, `text-chat` with support branch) recommended before or alongside #371. |
| Apr 24, 2026 | 59 | **#393 shipped** — new `docs/PLATFORM-INVENTORY.md` gives a one-page mental model across 4 layers (Product / Platform / Dev Tooling / Governance). Linked from README + CLAUDE.md session-start block. Added to source-doc-map.json so source changes trigger staleness warnings. |
| Apr 24, 2026 | 59 | **#377 shipped** — cancel-listing cascade. Migration 065 adds audit cols + notification type. New `cancel-listing` edge fn orchestrates: listing → cancelled + audit stamp → bulk-reject pending bids → notify bidders → cancel confirmed/pending bookings via existing `process-cancellation` (Stripe refunds) → bump `cancellation_count`. New `CancelListingDialog` with impact preview (bid count / booking count / refund total) + reason input. Replaces the rudimentary status-flip in OwnerListings. |
| Apr 24, 2026 | 59 | **#381 shipped** — Action Needed sections on Traveler / Owner / Admin landing views. New `ActionNeededSection` component + `usePriorityActions` hooks (3 variants). Role-specific tiles: travelers see counter-offers + imminent check-ins; owners see proof-rejected + Wish-Matched confirmations + pending Offers + unread inquiries; admins see disputes + escrow + pending approvals + proof verifications. Empty state with role-relevant CTA. 3 new tests. |
| Apr 24, 2026 | 59 | **#376 + #378 bundled + shipped.** Migration 064 adds `listing_proof_status` enum + 9 new columns on `listings` + `listing-proofs` private storage bucket (10 MB cap, PDF/JPEG/PNG) + 4 RLS policies + 2 notification_catalog entries. Owner gets proof step in `ListProperty` with file+number+attestation; rejected listings get alert + `ReuploadProofDialog`. Admin gets `ProofVerifyDialog` with embedded preview, phone-verification notes, and Approve-button gating. #378 ships consistent Direct / Bidding-Open badges across ListProperty / OwnerListings / AdminListings / ListingCard / PropertyDetail. 17 new tests (pure-logic util). Help-text-everywhere memory captured. |
| Apr 22-23, 2026 | 58 | **PHASE 22 COMPLETE — 22/22 tickets shipped across 6 PRs this session.** PR #428 (C1+C4): text-chat `context:'support'` + 5 agent tools; DB-first with live Stripe reconcile. PR #429 (C2): route-based context detection + `<RavioFloatingChat />` on /my-trips, /owner-dashboard, /account. PR #430 (C5): Migration 061 `dispute_source` enum; AdminDisputes "via RAVIO" badges. PR #431 (C3): `intent-classifier.ts` + SSE `classified_context` + "Switched to X — back" chip. PR #432 (D1): Migration 062 `support_conversations` + `support_messages` + full transcript capture + escalation stamping. PR #433 (D2): Migration 063 `get_support_metrics` RPC + `AdminSupportInteractions` tab (metrics cards, filter bar, transcripts table, detail dialog) + `RavioChatRating` thumbs UI. 145 new tests total this session. |
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
