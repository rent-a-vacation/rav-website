---
last_updated: "2026-05-13T03:30:00"
change_ref: "manual-edit"
change_type: "session-67"
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

## Next-Session Pickup (confirmed with user end of Session 66)

Session 66 closed out the 12-item compliance hardening sprint. All build-now items shipped end-to-end. The umbrella tracker #480 stays open until counsel signs off on disclaimer text via #494 + CA disclosure text arrives via #493.

**On resume, the highest-value next moves:**

1. **Schedule + run the counsel meeting** — non-engineering. Walk into the meeting with `docs/legal/counsel-meeting-prep.md`. Capture decisions on C1–C12. The three legal docs + PDFs in `docs/legal/` are counsel-ready.
2. **After counsel meeting:** File the focused follow-up PR for **#494** (1h — flip `legalReviewRequired:false` + fill `reviewedBy/reviewedDate` across 9 registry entries; bump version if any text revised). If counsel returned CA text, file **#493** (30 min — one registry entry).
3. **#510 full scope** — Complete the central-commission-config refactor: DB runtime read (`system_settings.platform_commission_rate` via `useSystemSettings` hook), admin UI for changing the rate with audit log, async pricing-function refactor. ~1-2 days. **Blocks #509.** (Carried over from Session 65.)
4. **Phase 2 Stage 2b** — Live actuals overlay on `/executive-dashboard/financial-model`. Pull real user counts + bookings + revenue from Supabase. Show "actuals (Mo 1-N)" alongside forecast. ~3-5 days. Independent. (Carried over from Session 65.)
5. **#509** — Promotional commission rate overrides. **Builds on #510 full.** (Carried over from Session 65.)

**Also pending — depends on counsel C-answer:**
- **C4 + C5 returned** → build host-type classification + commercial-threshold cron + state-level licensing gate (P-10 / P-11 / PL-1 / PL-2 in `compliance-gap-analysis.md`). ~3-4 days.
- **C6 returned** → build resort-ownership verification flow (P-9). ~6-12h.
- **C8 counsel-drafted policies** → replace 8 drafts at `docs/support/policies/*.md`, flip `status: draft → active`, push via `sync-support-docs.yml`. ~1-2h mechanical.

## Current Priority Tiers (as of May 13, 2026 — Session 67 close)

### Tier A: Build Next (High Impact, Code-Ready)

**Session 67 closed out #510 (commission rate runtime architecture, full scope). Remaining carry-over items:**

1. **#509** — Promotional commission rate overrides. **Now unblocked** by #510 closure (DEC-043 resolution chain in place). ~2-3 days.
2. **Phase 2 Stage 2b** — Live actuals overlay on Financial Model dashboard. ~3-5 days. Independent.

### Session 66 close — compliance hardening (12 of 12 shipped)

User-confirmed compliance posture at session close:
- 12 build-now items shipped end-to-end against the 2026-05-05 audit against Legal Dossier v3 + Compliance Brief v1.0
- 17 migrations (063–079) applied to **both DEV + PROD** (Session-63 backlog cleared)
- Test count 1492 → 1754 (+262, +17.6%)
- All disclaimers deployed verbatim from central registry; **awaiting counsel sign-off via #494**
- CA-specific disclosure wired but text-empty; **awaiting counsel C10 via #493**
- Pay Safe / Stripe destination-charge architecture documented; **awaiting written sign-off per counsel C1**

**Documentation deliverables for the counsel meeting:**
- `docs/legal/counsel-meeting-prep.md` (NEW) — agenda + 12-decision matrix
- `docs/legal/attorney-meeting-compliance-status.md` (refreshed) — Part 5 two-column status
- `docs/legal/compliance-gap-analysis.md` (refreshed) — Part 4 priority gaps with engineering effort per counsel decision

**Outstanding doc-only updates (deferred, not blocking, carried from Session 65):**
- BRAND-LOCK.md § 5 (15% → 12%)
- `docs/RAV-PRICING-TAXES-ACCOUNTING.md` prose updates (15% → 12%)

### Tier B: Pre-Launch Important (Needs Human Input)

These require decisions, walkthroughs, or external dependencies before coding.

| Issue | Title | Blocker / Decision Needed |
|-------|-------|--------------------------|
| #187 | Pre-launch manual verification | Needs systematic walkthrough. Partially done. |
| #257 | Resort data compliance audit | Legal review of seed data sources. |
| #322 | RAV Wishes proposal enforcement | Deferred until 30+ days of real proposal data. Post-beta. |
| **#404** | Phase 22 B5: Legal-blocked public policy docs (privacy, booking-terms, payment-policy, trust-safety, insurance-liability, subscription-terms, refund, cancellation) | Blocked by #80 (legal consult — timeshare lawyer). 8 drafts production-ready in `docs/support/policies/`, held with `status: 'draft'` pending lawyer sign-off. Counsel question **C8** covers drafting/review approach. Bundle into the same lawyer pass as #438. |
| **#438** | Incorporation documentation starter kit (operating agreement, formation checklist, IP assignment, state tax notes, RAV-specific marketplace docs) | **NEXT PICKUP.** Confirmed Session 60: Delaware C-Corp via Stripe Atlas; 4 founders all Florida-based; foreign-entity registration in Florida; scope WIDE — full packet for #80 lawyer engagement. Goal: zero owners onboard before lawyer signs off. Counsel meeting now scheduled per Session 66. |
| **#480** | Compliance umbrella — 12 build-now items shipped (Session 66); 2 counsel-pending follow-ups open | **Open until counsel meeting closes.** Tracks #493 (CA disclosure text — C10) + #494 (post-counsel `reviewedBy` flip across 9 registry entries — C9 + possibly C11). |
| **#493** | CA-specific disclosure (8.7-CA) verbatim text | **Blocked on counsel C10.** 30-min PR after text arrives — adds one registry entry to `src/lib/disclaimers/registry.ts` + email mirror. `<StateSpecificDisclaimer propertyState="CA" />` starts rendering immediately. |
| **#494** | Post-counsel disclaimer `reviewedBy` / `reviewedDate` flip across 9 registry entries | **Blocked on counsel C9.** 1-hour PR after meeting: flip `legalReviewRequired: false`, set `reviewedBy + reviewedDate`. If text revised, bump versions + edit email mirror in lock-step (drift test asserts). |

**Note (Session 66 cleanup):** All Session-63 PaySafe gap items (#461, #462, #463, #464, #465, #467, #468, #473) are SHIPPED and applied to PROD. Removed from Tier B. PaySafe Gap I (#466) was rendered moot by Migration 074 (`listings.state` column) + `<StateSpecificDisclaimer />` wiring — the per-state disclosure rules table is not needed since the registry-driven approach achieves the same goal cleanly.

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
| **#469** | PaySafe Gap F — native split refunds, holdbacks, rebooking credits, fee waivers | Post-launch. Confirmed deferral by user in Session 63 — admin handles complex disputes manually for the first ~10 cases. Real feature epic when promoted. |

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
| May 13, 2026 | 67 | **#510 SHIPPED — Commission rate runtime architecture (full scope).** DEC-043 logged. Migration 080: `admin_audit_log` generic ledger + `bookings.commission_rate_applied` + public `get_platform_commission_rate()` SECURITY DEFINER RPC + idempotent UPSERT to DEC-041 values. New public `useCommissionRate()` hook + `useEffectiveCommissionRate(tier?)` convenience wrapper (React Query, 5-min cache). Edge-function `getCommissionRate(supabase)` helper in `_shared/commission.ts`. `computeListingPricing` / `computeFeeBreakdown` accept optional rate parameter. 7+ frontend call sites wired through `useEffectiveCommissionRate`. Edge function `create-booking-checkout` persists the resolved rate on `bookings.commission_rate_applied`. Admin UI in `SystemSettings.tsx` now has editable Pro + Business discount inputs, AlertDialog showing full before/after diff + notes textarea, and Recent Changes list reading from `admin_audit_log` via `useCommissionAuditLog`. Drift-bug fix: `useSystemSettings.ts` + `useOwnerCommission.ts` fallback defaults moved from stale 15/2/5 to `DEFAULT_COMMISSION`-sourced 12/2/4. Hardcoded 0.15 purged from `calculatorLogic.ts`, `costComparator.ts`, `yieldEstimator.ts`, `useBusinessMetrics.ts`. Docs updates: PRICING-TAXES (15% → 12% prose + tier table 13/10 → 10/8 + new commission_rate_applied + audit log mentions); BRAND-LOCK § 5 + § 8 (numerical claims refreshed). 30 new tests across `useCommissionRate.test.ts`, `_shared/__tests__/commission.test.ts`, `pricing.test.ts`. 4 pre-existing test files updated to mock `useCommissionRate` (`AdminListingEditDialog`, `BidFormDialog`, `usePublishDraft`) or rebase expectations on `DEFAULT_COMMISSION` (`useOwnerCommission`, `calculatorLogic`, `costComparator`). Also shipped Session-66 follow-up workflow fix: PR #527 (`daily-summary.yml` guards against empty-commit-window 404). **Tier A: #510 done; #509 now unblocked**. |
| May 12, 2026 | 66 | **Compliance Hardening Sprint COMPLETE — 12 build-now items shipped.** Multi-day arc (May 6 + May 11-12) closing all build-now items from the 2026-05-05 audit against *Legal Research Memorandum v3* + *Compliance Development Brief v1.0*. Shipped: central disclaimer registry + 9 placements (#483), About page (#484), No Timeshare Sales validator (#485), `listings.state` + Migration 074 (#486), FL/CA disclosure rendering (#487), marketplace-facilitator tracker + Migration 075 (#488), Guest Protection Policy surface (#489), MLA notice + ToS carve-out + Migration 076 (#490), listing accuracy reporting + Migration 077 (#491), fraud reporting + Migration 078 (#492), CC&R attestation + Migration 079 (#481), robots.txt + scraping policy (#482). PR #500 cleared Session-63 migration backlog. **Tests 1492 → 1754 (+262, +17.6%); 17 migrations applied to both DEV + PROD.** Counsel meeting docs created: `counsel-meeting-prep.md` (NEW) + refreshed `attorney-meeting-compliance-status.md` + `compliance-gap-analysis.md`. Tier B trimmed: 8 SHIPPED PaySafe gap items removed; 2 counsel-pending follow-up issues added (#493, #494) plus umbrella #480. Tier A unchanged — Session 65 carry-overs (#510 / Stage 2b / #509) remain top-of-queue. |
| May 6, 2026 | 64 | **DEC-040 logged — sequential Phase numbering retired.** Phase 22 was the last numbered phase; new work (5+ related issues sharing an outcome) goes into themed milestones (`Launch Readiness`, `Security Hardening`, `Role-Based UX Overhaul`, etc.). PROJECT-HUB.md, this file, and `CLAUDE.md` updated with the new convention. `scripts/docs-sync-check.ts` extended with `checkPhaseNumbering()` rule that fails CI on any new "Phase 23+" reference outside the allowlist. Auto-memory saved. **No tier changes.** Doc-only Session 64. |
| May 2, 2026 | 63 | **#473 SHIPPED (PR #474)** — PostHog session recording disabled + Sentry `beforeSend` filter for EvalError/CSP events; resolves 16-user CSP block on /signup. **PaySafe Compliance doc created** (`docs/payments/PAYSAFE-COMPLIANCE.md`) — captures marketplace + Stripe Connect compliance posture, gap closure register, placeholder for incoming counsel references; DEC-039 logged. **PaySafe gaps C (#467), D (#468) promoted Tier E → Tier B**, and #463 (Gap E) consolidated under Tier B per user stance "minimal post-launch deferral." Session 63 working scope: 7 of 9 PaySafe gaps (A, B, C, D, E, G, H) + #473. F deferred (user confirmed); I gated on #80 lawyer pass. |
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
