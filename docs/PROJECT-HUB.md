---
last_updated: "2026-04-23T01:32:26"
change_ref: "9fc5af7"
change_type: "session-58"
status: "active"
---
# PROJECT HUB - Rent-A-Vacation

> **Architectural decisions, session context, and agent instructions**
> **Task tracking has moved to [GitHub Issues & Milestones](https://github.com/rent-a-vacation/rav-website/issues)**
> **Project board: [RAV Roadmap](https://github.com/orgs/rent-a-vacation/projects/1)**
> **Last Updated:** April 20, 2026 (Session 57: DEC-036, Phase 22 epic scoped)
> **Repository:** https://github.com/rent-a-vacation/rav-website
> **App Version:** v0.9.0 (build version visible in footer)

---

## INSTRUCTIONS FOR AI AGENTS

**Read this section before making any changes to PROJECT-HUB.md**

### What This File Is For (and What It's NOT For)

**This file is for:**
- KEY DECISIONS LOG (DEC-XXX entries)
- Architecture notes and technical decisions
- Session handoff context
- Known issues and blocked items

**This file is NOT for:**
- Task tracking → use [GitHub Issues](https://github.com/rent-a-vacation/rav-website/issues)
- Priority ordering → use [GitHub Milestones](https://github.com/rent-a-vacation/rav-website/milestones)
- Board view → use [RAV Roadmap](https://github.com/orgs/rent-a-vacation/projects/1)
- Completed phase details → use [COMPLETED-PHASES.md](COMPLETED-PHASES.md)

### GitHub Issues Workflow (see CLAUDE.md for full details)

**At START of every session:**
```bash
gh issue list --repo rent-a-vacation/rav-website --state open --label "pre-launch"
```

**At END of every session:**
```bash
# Close completed issues with summary
gh issue close <number> --repo rent-a-vacation/rav-website --comment "Completed: [summary]"

# Create issues for anything discovered
gh issue create --repo rent-a-vacation/rav-website --title "..." --label "..." --body "..."
```

### When to Update This File

**ALWAYS update at the END of your session if you:**
- Make an architectural decision (add to KEY DECISIONS LOG)
- Discover a known issue or blocker
- Need to pass context to the next session

### Decision Logging
**When you make a technical or product decision:**
1. Add it to "KEY DECISIONS LOG" section
2. Use format: DEC-XXX (next sequential number)
3. Include: Date, Decision, Rationale, Status

**Decisions Log archival → `docs/DECISIONS.md`**
- When a decision is 1+ month old and status is final, move it to `docs/DECISIONS.md`
- Leave a one-line entry: `- DEC-XXX: [title] → [details](DECISIONS.md#dec-xxx)`
- Keep recent/pending decisions inline

### What NOT to Do
- Don't track tasks here — use GitHub Issues
- Don't update priority queues here — use GitHub Milestones
- Don't delete information (move to COMPLETED-PHASES.md or DECISIONS.md)
- Don't skip updating "Last Updated" date at the bottom

---

## CURRENT STATUS

> **Task tracking has moved to GitHub Issues.** See [open issues](https://github.com/rent-a-vacation/rav-website/issues) and the [RAV Roadmap](https://github.com/orgs/rent-a-vacation/projects/1) board.

### Quick Links
- **Open issues:** `gh issue list --repo rent-a-vacation/rav-website --state open`
- **Pre-launch issues:** `gh issue list --repo rent-a-vacation/rav-website --state open --label "pre-launch"`
- **Project board:** https://github.com/orgs/rent-a-vacation/projects/1

### Open Milestones
> See [GitHub Milestones](https://github.com/rent-a-vacation/rav-website/milestones) for the current list. Do not duplicate here.

### Known Issues
- **PropertyDetail/Checkout dates are read-only** — By design for timeshare listings (owner sets fixed dates), but users may expect date selection.
- **VAPI overrides limited** — Transcriber (nova-3), keyword boosts, and speaking plans cause 400 errors via SDK overrides. Must configure in VAPI dashboard Advanced tab.
- Edge functions require `--no-verify-jwt` deployment flag

### Platform Status
- **1249 automated tests** (137 test files, all passing), 0 type errors, 0 lint errors, build clean
- **P0 tests:** 97 critical-path tests tagged `@p0` + 4 subscription P0s + 6 ListingTypeBadge P0s + 1 support-tool P0 + 35 detectChatContext P0s + 17 intent-classifier P0s — run with `npm run test:p0`
- **CI reporting:** GitHub native via dorny/test-reporter (JUnit XML) — PR annotations on every run (Qase removed Mar 2026)
- **Migrations created:** 001-061 (001-059 deployed to DEV + PROD; 060 + 061 deployed to DEV only — PROD held per CLAUDE.md) + 3 date-based MDM migrations
- **Edge functions:** 35 total (27 deployed to PROD + 4 subscription functions on DEV + 3 SMS functions pending LLC/EIN + `ingest-support-docs` deployed to DEV only). `text-chat` gains a `context: 'support'` branch with 5 agent tools (Session 58, Phase 22 C1 + C4).
- **Stripe Subscription:** Sandbox configured — 4 products, webhook (11 events), Customer Portal. Subscription epic #263 CLOSED (all 9 stories complete)
- **Stripe Tax:** env-gated via `STRIPE_TAX_ENABLED` (Session 54). Unset on both DEV + PROD → `automatic_tax` disabled → bookings work without tax collection. Flip to `"true"` on PROD only after live Stripe Tax fully activated post-#127.
- **Marketplace flow distinction (DEC-034):** `listings.source_type` + `bookings.source_type` + `bookings.travel_proposal_id` live. Pre-Booked Stay = instant confirm; Wish-Matched Stay = owner-confirmation required. Implemented via #380 Phases 1–5 (PRs #385–#389).
- **PROD platform:** locked (Staff Only Mode enabled)
- **Supabase CLI:** currently linked to DEV
- **dev and main:** in sync at Session 57 end; Session 58 PR for Phase 22 C1 + C4 (#405 + #408) open at time of writing
- **GitHub Project:** RAV Roadmap — 202 issues, all with Status/Category/Sub-Category/Type populated. Auto-add workflow enabled. PRs excluded.

### Session Handoff (Sessions 25-58)

**Session 58 — Phase 22 Track C: support agent + route detection + agent-dispute tagging + intent classifier — Track C COMPLETE (#405 + #408 + #406 + #409 + #407, Apr 22, 2026):**

**Fourth PR (#431) — C3 #407 intent classifier + "Switched to Support" chip:**
- New `supabase/functions/text-chat/intent-classifier.ts` — keyword-first classifier with OpenRouter model fallback. Returns `'support'` / `'rentals'` / `null`. 20 unit tests (keyword coverage, model fallback, fail-closed on HTTP/network errors, payload truncation, keyword-short-circuit behavior).
- Edge fn integration — classifier fires only when `context === 'general'` AND first message AND frontend hasn't dismissed. Emits new SSE event `classified_context` before tokens; uses resolved context for system prompt + tool selection for that turn.
- `useTextChat` parses the new SSE event → state `classifiedContext`; `dismissClassification()` handler flips session-scoped `classifierDismissedRef` which forces `disableClassifier: true` on future sends (survives history clear within session; resets on route change). PostHog events: `text_chat_classified`, `text_chat_classification_reverted`.
- `TextChatPanel` renders a subtle chip above messages when `classifiedContext !== context`: "Switched to **{context label}** — back to general help". Click dismisses. Chip reuses existing `CONTEXT_LABELS` — no new brand strings.
- `RavioFloatingChat` passes the new state + handler through.
- **Tests:** 1215 → 1249 (+34). intent-classifier.test.ts (20), useTextChat classifier cases (3), TextChatPanel chip cases (2), plus auto-update of one existing test for new `disableClassifier` body field.
- **Phase 22 Track C COMPLETE.** Only Track D observability (#410 + #411) remains.

**Third PR (#430) — C5 #409 agent-opened dispute source tagging:**
- Migration 061 — new `dispute_source` enum (`user_filed`, `ravio_support`) + `source` column on `disputes` with default `'user_filed'` + index. All existing rows keep `user_filed` implicitly; no data migration needed.
- `support-tools.ts` `openDispute` now inserts with `source: 'ravio_support'` so RAVIO support agent escalations are distinguishable in the admin queue. 1 new unit test asserts the insert payload carries the source (hand-rolled spy pattern, since shared `createSupabaseMock` doesn't capture insert args).
- `AdminDisputes.tsx` — new "Source" filter ("All Sources" / "User-Filed" / "RAVIO Support"); compact `via RAVIO` pill on agent-opened table rows; prominent "Opened via RAVIO" badge in the detail dialog. User-filed rows render with no source indicator (it's the implicit default).
- `src/types/database.ts` — Row/Insert/Update extended with `source`; new `dispute_source` enum entry.
- **Scope held:** unchanged `ReportIssueDialog` user flow (still inserts without a source — defaults to `user_filed`). Did NOT touch pre-existing `CATEGORY_LABELS` gap (missing 5 damage/no-show categories from migration 041). PROD migration deploy held per CLAUDE.md.
- Tests: 1214 → 1215 (+1 openDispute source-tagging assertion).

**Second PR (#429) — C2 #406 route-based context detection:**
- New `src/lib/chatContext.ts` with `detectChatContext(pathname)` — maps route prefixes (`/my-trips`, `/owner-dashboard`, `/account`, `/settings/*`, `/disputes/*`, `/messages`, `/checkout`, etc.) to `support`; `/rentals`, `/property/*`, `/tools/*`, `/destinations/*`, `/calculator`, `/rav-deals` to `rentals`; `/marketplace`, `/bidding*` to `bidding`; else `general`. 35 test cases covering every documented route + case-insensitivity + partial-segment edge cases.
- `useTextChat` now accepts an OPTIONAL `context` prop; when omitted it auto-detects via `useLocation().pathname`. Explicit context (PropertyDetail, Rentals, BiddingMarketplace, HowItWorksPage) always wins. Chat history clears on context switch (route navigation triggers the same reset mechanism that was already in place).
- `ChatContext` union extended with `"support"`.
- New `<RavioFloatingChat />` helper — floating bottom-right button + panel with zero props; mounted on `/my-trips` (RenterDashboard), `/owner-dashboard`, `/account` (AccountSettings). These are the first surfaces where the support context is actually exercised end-to-end by a user.
- **Terminology drift in `TextChatPanel` fixed inline** (pre-existing DEC-031 gaps; cleaned up while in the file per the user's direction to "stay consistent with the current plan"): `"Bidding Guide"` → `"Marketplace"`; prompt `"place a bid"` → `"submit an Offer"`; prompt `"travel request"` → `"Wish"`; prompt `"bidding work for this listing"` → `"Offers work on this Listing"`. All new strings conform to BRAND-LOCK §8 (plain nouns for marketplace mechanics) + §9 (Listing / Wish / Offer).
- Support-context suggested prompts: "Where's my refund?", "How do I cancel my booking?", "I'm having a problem with my stay", "How do I file a dispute?" — locked vocabulary only; no new brand terms introduced.
- **New feedback memory:** `avoid_churning_locked_terminology.md` — captures the principle that mid-session rename ideas get deferred; use locked vocab in-flight, flag the idea, do the rename in its own PR later. Precipitated by the user floating "Wish → Travel Wish" during #406 and then deciding to stay with DEC-031 for now.
- **Scope held:** only the 4 pre-existing TextChatPanel drift strings were touched. Broader "wish / travel request / bid" cleanup across ~30 other files (UserGuide, Documentation, MyBidsDashboard, hooks, etc.) deliberately NOT included — that's a standalone terminology-audit PR if/when we do it.
- Tests: 1166 → 1214 (+48). `chatContext.test.ts` (35), new auto-detection cases in `useTextChat.test.ts` (3), new support panel cases in `TextChatPanel.test.tsx` (2), plus existing tests validated against the new label strings.

**First PR (#428) — C1 #405 + C4 #408:**
- **Paired PR for C1 (#405) + C4 (#408).** `supabase/functions/text-chat/index.ts` gains a `context: 'support'` branch with a dedicated empathetic system prompt. All 5 agent tools implemented as pure-logic handlers in a new `support-tools.ts` module and wired into the edge function's tool-call loop.
- **5 tools:** `lookup_booking` (booking_id or own-email lookup, RLS-scoped), `check_refund_status` (**DB-first with live Stripe reconcile** when the DB has a refund_reference but no processed timestamp; fails closed with a note on Stripe errors), `check_dispute_status`, `open_dispute` (validates 13 categories + min description length; enforces reporter_id via RLS), `query_support_docs` (keyword tsvector search against the `support_docs` table, status='active' only).
- **Tool call loop generalised:** the edge function now iterates ALL tool_calls (parallel), dispatches by name (`search_properties` for rentals / any of the 5 support tools / graceful fallback for unknown), and feeds all results back in one follow-up streaming call. Rentals behaviour preserved.
- **RLS enforcement via user-scoped client.** A second Supabase client is built with `Authorization: Bearer <jwt>` on every request, so `auth.uid()` resolves correctly inside Postgres policies. Never uses service-role for tool queries.
- **Sensitive-field redaction:** safe column projections defined in `support-tools.ts` — tools never return `payment_intent_id`, `stripe_transfer_id`, payout details, or admin-internal fields.
- **20 new unit tests** in `support-tools.test.ts` — 5 tools × happy path + auth/RLS failure + domain-rule rejection, plus registry/dispatcher coverage. Vitest `include` extended to `supabase/functions/**/*.test.ts`. Pattern mirrors `_shared/rate-limit.ts` — pure-logic module with a minimal structural Supabase interface so tests run under Vitest without Deno.
- **Scope boundaries held:** #406 (route-based detection in `useTextChat`), #407 (intent classifier + chip), #409 (`source: 'ravio_support'` enum on disputes) deliberately deferred to their own PRs. This PR is edge-fn + tests only; no frontend changes, no new migrations.
- **New feedback memory captured:** "CS and UX as business differentiators" — user direction that when picking between cheap and robust implementations for support surfaces, bias toward the robust one even at latency/complexity cost. Drove the choice of DB+Stripe fallback over DB-only for `check_refund_status`.
- **Tests:** 1146 → 1166 (+20). 134 → 135 files. 0 type errors, build clean (1m 5s).

**End state:** Phase 22 at **20 of 22 tickets (91%) — Track C COMPLETE**. Remaining: **#410** (support conversation logging), **#411** (admin Support Interactions tab + metrics). Recommended next: #410 → #411 as a focused observability pair. PROD deploy of `text-chat` + migrations 060 + 061 still held per CLAUDE.md. `STRIPE_SECRET_KEY` already set on both DEV and PROD.

---

**Session 57 — Phase 22 Customer Support Foundation: 15 of 22 tickets SHIPPED across 8 PRs (Apr 20-21, 2026):**
- **Tracks A, B, E complete.** Tracks C + D (code work) deferred to next session. 68% of Phase 22 complete.
- **8 PRs merged:** #418 (planning), #419 (A1+B1+A4 — scaffold + gap analysis + sync-check), #420 (A2+A3 — migration 060 + ingest pipeline deployed to DEV), #421 (B2 — 3 code-derived docs), #422 (B3 — 5 FAQ consolidations), #423 (B4 — 5 internal workflow docs), #424 (B5 — 6 legal-blocked drafts at status:draft), #425 (E1-E6 — 5 Mermaid diagrams + CS-OVERVIEW.md).
- **Documentation infrastructure shipped end-to-end on DEV:** `docs/support/` with 22 markdown files (README + GAP-ANALYSIS + 20 content docs + CS-OVERVIEW + 5 diagrams). Migration 060 (support_docs table + RLS). `ingest-support-docs` edge function + GitHub Action `sync-support-docs.yml` triggering on push to main. GitHub Secrets configured: `INGEST_SUPPORT_DOCS_SECRET` + `SUPABASE_FN_URL` (pointing at DEV).
- **`scripts/docs-sync-check.ts`** extended with `checkSupportDocs()` — validates frontmatter schema + enforces legal-review gate (`legal_review_required: true` + `status: active` requires non-null `reviewed_by` + `reviewed_date`).
- **6 legal-blocked drafts held at `status: draft`** pending lawyer review on #80: privacy-policy, booking-terms, payment-policy, trust-safety-policy, insurance-liability-policy, subscription-terms. Never surfaced to end users until review completes.
- **PROD deploys HELD** per CLAUDE.md human-confirmation rule. Checklist in `docs/support/diagrams/doc-pipeline.md`:
  1. Deploy migration 060 to PROD
  2. Deploy `ingest-support-docs` function to PROD
  3. Set `INGEST_SUPPORT_DOCS_SECRET` on PROD Supabase
  4. Update GH secret `SUPABASE_FN_URL` to PROD functions URL
  5. Relink Supabase CLI to DEV
- **Remaining (7 tickets, Track C + D):**
  - C1 #405: `context: 'support'` branch in text-chat edge fn
  - C2 #406: Route-based context detection in useTextChat
  - C3 #407: Intent classifier + "Switched to Support" chip
  - C4 #408: 5 agent tools (lookup_booking, check_refund_status, check_dispute_status, open_dispute, query_support_docs)
  - C5 #409: Agent-opened disputes with `source: 'ravio_support'` tag
  - D1 #410: Support conversation logging (conversations table extension)
  - D2 #411: Admin "Support Interactions" tab + deflection/escalation/SLA metrics
- **Recommended next-session starting point:** C1 + C4 together (edge function context + tool implementations — tightly coupled). Then C2 → C3 → C5 naturally follow. D1/D2 as final observability PR.

**Original Session 57 planning context (Apr 20):**
- **Milestone #37 + Epic #395 + 22 child issues #396-#417 created.** Initial planning session.
- **User brief reviewed** (`customer-support-crew-ai.md`): 3-agent CrewAI team + 13 support docs + support widget. Recommended **rejecting CrewAI** and extending existing RAVIO text chat (`supabase/functions/text-chat/index.ts`) with a `context: 'support'` branch + tool use (5 functions: `lookup_booking`, `check_refund_status`, `check_dispute_status`, `open_dispute`, `query_support_docs`). See DEC-036.
- **VAPI voice stays discovery-only** — quota-metered, poor at auth-gated support queries. No voice-support build.
- **Gap analysis vs brief:** added 7 docs beyond the original 13 (privacy, trust-safety, insurance-liability, subscription-terms — legal-blocked; account-security, emergency-safety, support-sla — not blocked). Total: **20 support docs** in `docs/support/{policies,faqs,processes}/`.
- **Docs storage: markdown canonical → Supabase `support_docs` index (one-way sync).** Git diff audit trail for legal review; DB is a build-time cache for fast agent retrieval. GitHub Action on push to main invokes `ingest-support-docs` edge fn.
- **RAVIO UI: route-based context detection + intent classifier fallback + "Switched to Support" chip.** No explicit user toggle — matches memory rule [Rooted in Simplicity].
- **Escalation:** agent-opened disputes land in existing `AdminDisputes` with `source: 'ravio_support'` tag — no parallel admin dashboard. Reuses migration 041 + `ReportIssueDialog` infrastructure.
- **Legal blocker narrowed:** only 6 public-facing policy drafts (#404) blocked by #80. Internal workflow + FAQs are not blocked.
- **22 issues across 5 tracks:** A infrastructure (4), B content (5), C RAVIO extension (5), D observability (2), E architecture diagrams (6, incl. `CS-OVERVIEW.md` VC-ready one-pager).
- **Ready-to-start entry points:** #400 (B1 gap analysis, 2-3h, gates content tracks) + #396 (A1 folder + frontmatter schema, independent of content).
- **Script preserved:** `scripts/create-phase22-issues.sh` (idempotent — skips titles already present in milestone).

**End state:** Phase 22 milestone scoped with full epic + 22 child issues. `docs/support/` not yet created (part of #396). No DB migrations. No code changes. Memory saved: `phase22_customer_support_architecture.md`.

---

**Session 56 — DEC-034 shipped: Pre-Booked Stay / Wish-Matched Stay end-to-end (Apr 20, 2026):**
- **#380 implemented in 5 incremental PRs** — schema + edge-function branching + UI badges + notifications + docs. Zero big-bang; each phase shipped to DEV + PROD independently.
  - **Phase 1 — Schema (PR #385):** Migration 058 adds `listing_source_type` enum + `source_type` on listings + bookings + `travel_proposal_id` FK. Backfills auto-created wish-matched listings (based on their notes field) and their bookings (joined via travel_proposals.listing_id).
  - **Phase 2 — Edge function branching (PR #386):** `create-booking-checkout` inherits `source_type` + `travel_proposal_id` from the listing when creating the booking. `verify-booking-payment` branches per `source_type`: pre_booked → `owner_confirmation_status='owner_confirmed'` immediately (no countdown, no "please confirm at resort" email); wish_matched → existing flow preserved (pending_owner with deadline + reminder email).
  - **Phase 3 — UI badges + critical search filter (PR #387):** New `ListingTypeBadge` component (emerald Pre-Booked / amber Wish-Matched). Applied to MyBookings, PropertyDetail, OwnerListings. **Important bug fix:** `useActiveListings` previously returned wish_matched listings in public search, meaning Traveler B could see/book Traveler A's wish-matched listing. Filter now restricts search to `source_type='pre_booked'`. 6 P0 tests added.
  - **Phase 4 — Notifications + admin filter (PR #388):** Migration 059 adds 3 new `notification_catalog` entries (`wish_owner_confirming`, `wish_owner_confirmed`, `wish_owner_failed_to_confirm`). `verify-booking-payment` dispatches `wish_owner_confirming` to the traveler after Wish-Matched payment. `useConfirmBooking` hook dispatches `wish_owner_confirmed` when the owner confirms a Wish-Matched booking. AdminEscrow gets a "Filter by type" select + inline `ListingTypeBadge` per row. Deferred: timeout cron for `wish_owner_failed_to_confirm`.
  - **Phase 5 — Docs (PR #389):** BRAND-LOCK §9 adds Marketplace Flow Types table with full terminology map. USER-GUIDE adds a new "Types of Stays" renter section + FAQ entries explaining Pre-Booked vs Wish-Matched. LAUNCH-READINESS rows 7c–7e added (schema deployed + E2E smoke tests for each flow). TESTING-STATUS 1140 → 1146 tests. This handoff entry.

**End state:** Both marketplace flows fully wired end-to-end on DEV + PROD. Traveler gets explicit notifications through the Wish-Matched lifecycle (previously they were silent after Offer acceptance). Pre-Booked travelers no longer see irrelevant owner-confirmation countdowns (S-04 R15 tester feedback closed). Search no longer leaks Wish-Matched listings. Badge visual system consistent across all user-facing surfaces. Next: #376 (pre-booked listing verification workflow — now unblocked), #378 (open-for-bidding indicator — now unblocked), #381 (role-relevant landing-view ordering), #377 (cancel-listing cascade — standalone).

---

**Session 55 — QA Audit Response: /sdlc Phase 6, Phase A UX wins, Flow 1/2 scoped (Apr 20, 2026):**
- **QA scenario spreadsheet read end-to-end** (S-01 to S-05) via xlsx download + Python parsing; tester notes catalogued. Full audit of 6 dimensions surfaced during testing: terminology, listing verification, cancel flow, open-for-bidding indicator, MyTrips booking details, and the Track 1/Track 2 mental model.
- **6 GitHub issues opened** with full findings + acceptance criteria: #375 (terminology), #376 (pre-confirmed verification), #377 (cancel listing cascade), #378 (open-for-bidding indicator), #379 (MyTrips details), #380 (Flow 1/Flow 2 model). Plus #381 (role-relevant landing-view ordering spin-out from #375).
- **DEC-034 — Marketplace Flow Distinction:** after user clarified "Track 1/Track 2" was never the right framing, established two flows end-to-end:
  - **Flow 1 — Pre-Booked Stay:** owner has resort reservation; fixed dates; can be direct-book or bidding. Traveler books → instant confirm (no owner-confirmation countdown).
  - **Flow 2 — Wish-Matched Stay:** traveler posts Wish → owner submits Offer → traveler accepts → owner has deadline to confirm at resort.
  - Naming: **type labels** (Pre-Booked Stay / Wish-Matched Stay) + **status labels** (Confirmed / Pending Confirmation) used together in UI.
  - #380 rewritten with full impact analysis: new `source_type` enum on bookings + listings, new `confirm-wish-booking` edge function, new admin wish-matched verification queue, 3 new notification types, 10 UI surfaces, 8 doc files, test coverage, QA scenario split. Blocks #376, #378, #381; coordinates with #377.
- **DEC-035 — Path 3 Dashboard Naming:** keep brand-compliant short nav CTAs (My Trips, My Rentals, RAV Ops, RAV Insights) + add small-caps **role-descriptive eyebrow** above each dashboard H1 so the brand ↔ function mapping is visually guided.
- **Phase A shipped (2 PRs merged):**
  - **#382 (fix/feat MyTrips details):** itemized payment breakdown, cancellation-policy summary (reuses existing `CancellationPolicyDetail`), resort confirmation number (joined from `booking_confirmations`), check-in countdown badge with `isImminentCheckIn` helper (7 new tests). Closes #379.
  - **#383 (Path 3 hybrid naming):** mobile nav "My Listings" → "My Rentals" fix + role-descriptive eyebrows on 4 dashboards + BRAND-LOCK Section 9 updated. Closes #375.
- **`/sdlc` skill expanded** (Phase 6 mandatory checklist covering PROJECT-HUB, TESTING-STATUS, LAUNCH-READINESS, ARCHITECTURE + flow manifests, USER-GUIDE + FAQ, QA-PLAYBOOK, BRAND-LOCK, COMPLETED-PHASES, with 6-question self-check). Applied locally (`.claude/skills/sdlc/SKILL.md`); `.claude/` is gitignored so not version-controlled.
- **QA scenario spreadsheet:** still read-only from this side (public share link); write-back requires Google Drive MCP auth next session.

**End state:** 3 PRs merged (#382 MyTrips details, #383 Path 3 naming, plus the Session 55 docs commit). 7 open follow-up issues (#376, #377, #378, #380, #381 open; #375 + #379 closed). #380 is the foundational next step (Flow 1/Flow 2 model); pausing #376 / #378 until #380 ships as noted in its body.

---

**Session 54 — Stripe Tax Env-Flag Gate + DEC-033 Monitoring (Apr 18-19, 2026):**
- **Stripe checkout unblocked on dev:** Booking confirmation on `dev.rent-a-vacation.com` was failing with `Edge Function returned a non-2xx status code`. Root cause: `automatic_tax: { enabled: true }` was hard-coded in `create-booking-checkout`, which Stripe rejects when no head office address is set on the account (DEV sandbox + pre-#127 live account both missing this). Gated behind `STRIPE_TAX_ENABLED` env var — default `false` → automatic_tax disabled → checkout succeeds. Live booking validated end-to-end.
- **Edge function JWT gateway regression:** Redeploy via CLI v2.92.1 without the `--no-verify-jwt` flag caused 401 rejections at the Supabase gateway (function performs its own JWT validation in the body via `supabaseClient.auth.getUser`). Added explicit `[functions.create-booking-checkout] verify_jwt = false` entry to `supabase/config.toml` to prevent future regressions.
- **CI fix — MDM resort scripts:** `scripts/generate-resort-descriptions.ts` and `scripts/normalise-resort-data.ts` had top-level side effects (Supabase client creation + `main()` invocation) that crashed the test runner when `resortDataQuality.test.ts` imported utility exports in CI (no Supabase creds → `process.exit(1)` at import time). Moved client setup into `main()` and guarded the `main().catch` block with a direct-execution check (`process.argv[1] === fileURLToPath(import.meta.url)`). Unblocks PR #372 CI.
- **Deployed:** `create-booking-checkout` to both DEV and PROD with `--no-verify-jwt`. Migration 057 (tier features — Session 53 gap) caught up on both DEV and PROD.
- **Cleanup:** Deleted 4 stale `pending` bookings on DEV from today's failed Stripe attempts (preserved the 10 seed-data pending bookings from 2026-04-05).
- **DEC-033 (Platform Monitoring):** Chose Checkly (SaaS free tier) for synthetic uptime monitoring — see Key Decisions Log. Tracked as post-launch issue #370.
- **QA scenario testing (S-01 to S-05) — 3 bugs fixed (PR #373):**
  - **S-05 offers-tab crash** — `/my-trips?tab=offers` threw "Invalid time value" on `bid.created_at` + `request.proposals_deadline`. Regression of #354 (which only patched check-in/out dates). Added `formatDistanceToNowSafe` helper and applied at both crash sites.
  - **S-05 bid notification missing** — `useCreateBid` inserted directly to `listing_bids` and never invoked `notification-dispatcher`. Added dispatch targeting listing owner with `type_key: new_bid_received` (non-blocking).
  - **S-04 booking notification missing** — `verify-booking-payment` sent legacy email but never invoked `notification-dispatcher`. Added `booking_confirmed` dispatch after booking status flip (email unchanged).
  - Also added `[functions.verify-booking-payment] verify_jwt = false` to `config.toml` to preempt the same gateway 401 regression.
- **S-05 "Anonymous" bidder display** — investigated; source not found in code (`BidsManagerDialog` uses `getRenterDisplayName` correctly). Likely stale browser cache — hard-refresh + retest required to confirm.
- **Follow-up issues:** #371 (edge function test harness — shipped Stripe fix without tests; flagged per CLAUDE.md Tests-With-Features). #370 (Checkly monitoring implementation).
- **Docs:** LAUNCH-READINESS.md documents `STRIPE_TAX_ENABLED` under Payments check 7b with explicit activation criteria. Blocked Items row updated for #127.

**End state:** PR #372 + #373 merged to main. All Session 54 code deployed to DEV + PROD: `create-booking-checkout`, `verify-booking-payment`, migration 057. Supabase CLI relinked to DEV. Dev and main in sync. Tests: 1133 passing (133 files), 0 type errors, build clean. QA tester to re-run S-02 / S-04 / S-05 on dev to confirm fixes.

**Session 53 — Tier Features, API Review, Sentry Guide (Apr 17-18, 2026):**
- **5 tier-gated features (#278-#282):** Early Access for Plus travelers (48h window on new listings), Exclusive Deals for Premium (admin-toggled `is_exclusive_deal`), Priority Listing Placement for Pro/Business owners (sort boost + Featured badge), Concierge Support for Premium (request system + admin tab), Dedicated Account Manager for Business owners (admin assignment + dashboard card). Migration 057. Shared `tierGating.ts` utility (6 functions, 26 tests). PR #367 merged.
- **Search & Discovery epic (#325) closed:** All 3 sub-issues (#326-#328) were already completed in prior sessions.
- **Issue triage:** #100 (Apple Sign-In) → deferred to mobile app phase. #165 (Volume Discount) → needs Sujit + Ajumon discussion. #166 (Tier value prop) → closed, remaining items moved to #368. #226 (Sentry alerts) → closed (already configured). #228 (Sentry GitHub integration) → closed (already installed).
- **Sentry.io guide:** Comprehensive `docs/SENTRY-GUIDE.md` — daily workflow, error triage, free tier budget, alert config, GitHub integration (free vs paid features), MCP integration, troubleshooting.
- **Sentry MCP server:** Configured globally (`--scope user`) at `https://mcp.sentry.dev/mcp/rent-a-vacation-org`. Enables Claude Code to query Sentry issues directly. Reusable across all projects.
- **API docs audit:** `public-api.yaml` is current (6 endpoints match gateway code). Internal `openapi.yaml` is outdated (missing 6-8 recent edge functions, says "27" should be ~30). README.md needs count update.
- **Follow-up:** `jisujit/automation-utilities#2` created for machine setup script + Supabase keepalive tool.

**End state:** 1125 tests passing (133 files), 0 type errors, build clean. PR #367 merged. `dev` and `main` in sync. Issues #278-#282, #325, #166, #226, #228 closed. Sentry MCP needs OAuth auth on next session start.

**Session 52 — Marketplace Terminology Lock + Site-wide UI Polish (Apr 14-15, 2026):**
- **DEC-031 (Terminology Lock):** Locked user-facing marketplace vocabulary to three nouns — **Listing**, **Wish**, **Offer**. "Offer" replaces both "Bid" and "Proposal" in all UI. Dropped "RAV" prefix from all transactional nouns/CTAs. PR #355 merged.
- **Header redesign:** Single "Marketplace" nav link replaces two links ("Name Your Price" + "Make a Wish"). Role-aware user dropdown adds My Offers / My Wishes for renters, Offers I Sent / Offers on My Listings for owners. Mobile mirrors.
- **Route rename:** `/bidding` → `/marketplace` with redirect. `BiddingMarketplace` page defaults to Listings tab for renter/anon and Wishes tab for owners. Tabs renamed "Listings" / "Wishes" (was "Listings" / "RAV Wishes").
- **Owner dashboard:** New top-level "Offers" tab (was buried in a collapsible inside My Listings). Two sections: Offers I Sent, Offers on My Listings. Legacy `?tab=proposals` redirects to `?tab=offers`.
- **Notifications:** Category labels "Bids" → "Offers", "RAV Wishes" → "Wishes". Email preference groups renamed "Offers" and "Wishes".
- **UI polish (PR #352, 3 commits):** Site-wide CSS/Tailwind polish across 30 pages — Homepage, PropertyDetail, Rentals, BiddingMarketplace, OwnerDashboard, MyBookings, ListProperty, Auth flow, Tools suite, Destinations, RavDeals, FAQ, AccountSettings, RenterDashboard, MyBidsDashboard, Notifications, Messages, Checkout, BookingSuccess, TravelerCheckin, Contact, Privacy, Terms, HowItWorksPage, Developers, AdminDashboard, ExecutiveDashboard, Documentation, UserGuide. New `<Section>` + `<SectionHeader>` layout primitives. Standardised vertical rhythm (`py-12 md:py-16`), `tracking-tight` headings, `border-border/60` separators, off-brand tool badges unified to brand primary. No brand-color changes.
- **Logo update:** `public/ravio-v2.png` replaced (used on Marketplace "Ask RAVIO" button; header/footer continue to use `rav-logo.svg`). PR #356 merged.
- **BRAND-LOCK.md:** Fully rewritten Section 9 Terminology Context Map + updated Sections 1, 3, 4, 6, 8. All brand docs (BRAND-STYLE-GUIDE, MARKETING-PLAYBOOK, PITCH-DECK-SCRIPT, BRAND-CONCEPTS, LAUNCH-READINESS, COMPLETE-USER-JOURNEY-MAP) scrubbed to Listing/Wish/Offer vocabulary. PRs #357, #358.
- **Bug fixes:** #353 (Anonymous bidder name → nicer fallback via `getRenterDisplayName`) + #354 (MyBidsDashboard crash on missing dates → `formatDateSafe`). PR #360.
- **DEC-032 (MDM Resort Data — WS1/WS2/WS3):**
  - **WS1 Schema Hardening (PR #362):** Migration `20260415_mdm_schema_hardening.sql` — 9 governance columns on `resorts` (`attraction_tags`, `is_active`, `data_source`, `data_quality_score`, `verified_by`, `verified_at`, `latitude`, `longitude`, `postal_code`), 2 on `resort_unit_types` (`min_stay_nights`, `smoking_policy`), new `resort_external_ids` table (MDM cross-reference), `calculate_resort_data_quality()` function, 5 indexes, RLS. TypeScript types + import validation updated.
  - **WS2 Data Quality (PR #363):** 3 scripts — `audit-resort-data-quality.ts` (scored 117 resorts, all < 40), `generate-resort-descriptions.ts` (117 RAV-branded descriptions from structured data), `normalise-resort-data.ts` (439 field changes: country→ISO, state→abbr, times→24h). Normalisation + quality scores applied to DEV and PROD. Descriptions applied to DEV and PROD after owner approval (PR #365).
  - **WS3 API Enhancement (PR #364):** GET `/v1/resorts` returns full MDM-enriched record with `?brand=`, `?updated_since=` (delta sync), `?include_inactive=` filters. New endpoint GET `/v1/resorts/by-external-id?system=xpd&id=XPD-12345` for partner ID lookup. OpenAPI spec updated with OTA field cross-references (`public-api.yaml` both copies).
  - **Deployed:** Migration, api-gateway, normalisation, and descriptions all deployed to both DEV and PROD. All 117 resorts normalised, scored (55–65 avg 61), and described.

**End state:** 1090 tests passing, 0 type errors, build clean. PRs #352, #355–#365 merged to main. `main` and `dev` in sync. Supabase CLI linked to DEV. All migrations through `20260415_mdm_schema_hardening.sql` deployed to both DEV and PROD. api-gateway edge function deployed to both.

---

**Session 46 — WS2 Registration T&C Audit + WS3 Navigation + Messages Polish (Apr 10-11, 2026):**

Three workstreams shipped plus Phase 21 DoD cleanup. All backed by GitHub issues (#315-#319, #322).

- **Phase 21 DoD completion (PR #314):** Wired `useSendMessage` to invoke `notification-dispatcher` for the recipient after each new message (best-effort fire-and-forget). Updated `getNotificationLink` to route `message_received` → `/messages`.
- **Messages page layout fix (PR #312, Issue #315):** QA reported Messages page rendered without Header/Footer, nav was too subtle. Fixed: added Header + Footer + bordered card layout, replaced icon-only button with visible "Messages" text link + badge (desktop + mobile), added Messages quick-access card to Owner Dashboard. Fix: missing Footer default export import.
- **WS3 Navigation Redesign (PR #313, Issue #316):** Role-based nav in `Header.tsx` — Owner sees RAV Edge | My Listings | RAV Wishes | Messages; Traveler sees Explore | Name Your Price | RAV Wishes | My Trips | Messages. Owner avatar dropdown gets List a Property + Free Tools. Terminology updates across 7 files ("Travel Requests" → "RAV Wishes", "Make a RAV Offer" tab → "Listings"). Bug fix: missing Badge import in Header.tsx. New `Header.test.tsx` with 10 tests.
- **WS2 Story 1 (PR #320, Issue #318):** Migration 052 `terms_acceptance_log` audit table + 3 profile columns (onboarding_completed_at, current_terms_version, current_privacy_version) + backfill of 60 existing approved users. Signup form rewritten with 2 controlled checkboxes (age + terms), submit disabled until both checked, audit log write after signup. AuthContext metadata cleanup (removed hardcoded `terms_accepted_at: true`). `send-approval-email` gets explicit "Log In to Your Account" CTA. AdminUsers gets T&C Accepted + Onboarding columns.
- **WS2 Story 2 (PR #321, Issue #319, closed Epic #317):** `/welcome` post-approval onboarding gate. `useOnboarding` hook with `needsOnboarding` guard + `useCompleteOnboarding` mutation. `WelcomePage` with 2-step flow: Step 1 T&C reconfirm (writes audit log with `post_approval_gate` method), Step 2 role-specific CTAs. `App.tsx` `ProtectedRoute` redirects approved-but-not-onboarded users to `/welcome` with `/terms` `/privacy` whitelist. RAV team bypasses gate. Flow manifests updated.
- **WS4 (Issue #322, parked):** Post-beta feature brief for proposal location enforcement + fast-track property listing. DESIGN COMPLETE, implementation deferred until 30+ days of real proposal data. Issue created with full decisions + migration SQL + acceptance criteria embedded.

**End state:** 940 tests (119 files), 0 type errors, build clean. Migrations at 052. 12 GitHub issues closed, 1 parked.

**Session 45 — Unified Conversation Layer / Phase 21 (Apr 10, 2026):**
- Epic #296 with 10 stories (#297-#306), Milestone: Phase 21: Unified Messaging
- Migration 051: `conversations`, `conversation_messages`, `conversation_events` tables + 4 RPCs + 12-step backfill
- React Query hooks: 5 queries + 5 mutations with optimistic updates and dual realtime subscriptions
- Messages page (`/messages`) with two-panel inbox + thread layout, mobile responsive
- All 4 interaction systems wired: InquiryDialog, BidFormDialog, useBidding mutations, verify-booking-payment
- Header messages icon with unread badge (desktop + mobile)
- Seed manager updated with conversation/message/event generation
- Flow manifests updated with conversation steps (traveler + owner lifecycles)
- BookingMessageThread + InquiryThread marked @deprecated
- 900+ tests (113+ files), 0 type errors, build clean

**Session 44 — Stripe Setup + Subscription Phases 5-7 + Project Board (Apr 4-5, 2026):**
- Stripe sandbox account created, 4 products configured, webhook registered (11 events), Customer Portal configured
- Migration 048 (Stripe price IDs), 049 (listing limit trigger), 050 (subscription metrics RPC)
- Phase 5: Listing limit enforcement — useCheckListingLimit hook, ListingLimitUpsell dialog, OwnerListings/ListProperty/usePublishDraft guards, DB trigger
- Phase 6: Admin MRR metrics (get_subscription_metrics RPC) + AdminMembershipOverride dialog + enhanced AdminMemberships with 4 KPI cards and filters
- Phase 7: UserGuide + Documentation sections, flow manifests (owner/traveler/admin), all docs updated
- Admin safeguards: AlertDialog confirmations for Staff-Only toggle, commission rate, role removal (self-protection), escrow release
- Seed manager: incremental "Update Seed Data" action, diverse tier assignments, referral codes, API keys, voice logs
- CLAUDE.md: Seed Manager Convention + Admin Safeguards Convention added
- QA Playbook v2.0: 141 test cases (+14), subscription/listing limit/admin MRR scenarios
- QA docs updated: P0-TEST-CASES (4 subscription P0s), TESTING-STATUS (848 tests), SEED-DATA-GUIDE (tier assignments)
- Fixed: AdminProperties FK ambiguity (PGRST201) — owner:profiles!properties_owner_id_fkey
- GitHub Project (RAV Roadmap): 202 issues fully populated — Status, Category, Sub-Category, Type, Assignee. Auto-add workflow enabled. PRs removed.
- Issues created: #278-#286 (unbuilt tier features + owner tax UI). Subscription epic #263 CLOSED (all 9 stories)
- PRs merged: #287-#292. Tests: 825→848 (+23), 0 type errors. dev and main in sync

**Session 43 — Subscription System Phases 1-4 (Apr 1, 2026):**
- Subscription schema (migration 047), 3 new edge functions, stripe-webhook updated with 5 subscription handlers
- MembershipPlans, MembershipTierCard, SubscriptionManagement components
- SubscriptionSuccess page, useSubscription + useMembership hooks
- Brand Lock + 70% claim retired. Personal address removed from public pages
- PR #263 merged to main. Issues #264-#269 closed

**Session 42 — Operational Housekeeping, Mobile App & Marketing Strategy (Apr 1):**
- Merged dev → main: PR #239 (22 commits — Sessions 38-41 work: Notifications, SEO, CI, boardroom docs).
- Verified and closed #229 (SEO technical gaps — all acceptance criteria met).
- Deployed migrations 044-046 to PROD (API keys, IP allowlisting, notification center). All 46 migrations now in both DEV and PROD.
- Deployed `api-gateway` and `idle-listing-alerts` edge functions to PROD. PROD now has 27 edge functions.
- Documented SMS edge function blockers: `notification-dispatcher`, `sms-scheduler`, `twilio-webhook` blocked on LLC/EIN → A2P 10DLC registration (#127).
- Created Mobile App Epic #240 with 8 sub-stories (#241-#248): Capacitor shell, UX polish, biometric auth, push notifications, camera, deep linking, offline support, App Store submission. Total estimated effort: 53-74 hours.
- Created Market Research Epic #250 with 7 sub-stories (#251-#257): feature comparison matrix, mystery shopping, review mining, Google Trends, ARDA data, pitch deck, scraped data audit.
- Created `docs/marketing/` folder with social media strategy + ready-to-paste content for all 5 platforms (Google Business Profile, LinkedIn, Facebook, Instagram, X/Twitter). Content calendar, automation plan, and metrics targets included.
- Created #259 (Testimonials system — automated collection, approval workflow, homepage display). Phased approach: alternative social proof pre-launch, automated collection post-first-bookings.
- Daily status workflow now auto-extracts "Completed:" lines from closed issue comments (no more manual highlights file).
- Tests: 825 passing (104 files). Build clean.

**Session 41 — Technical SEO Gaps (#229) (Mar 20):**
- Extended `usePageMeta` hook to accept options object: `canonicalPath`, `ogImage`, `ogType`, `noindex`. Updates canonical, OG, Twitter, and robots meta tags per page. Backward-compatible string signature preserved.
- Created `useJsonLd` hook — generic JSON-LD `<script>` tag injection/cleanup. Extracts duplicated pattern from FAQ, Index, MaintenanceFeeCalculator, etc.
- Created `buildBreadcrumbJsonLd()` utility in `src/lib/breadcrumbSchema.ts` for BreadcrumbList JSON-LD.
- **PropertyDetail.tsx:** Canonical URL, dynamic OG image (first listing photo), Product JSON-LD schema, Breadcrumb JSON-LD.
- **DestinationDetail.tsx:** Dynamic canonical URL (destination/city slug), Breadcrumb JSON-LD.
- **15 public pages:** Added `canonicalPath` to all `usePageMeta` calls (Index, Rentals, FAQ, HowItWorks, Contact, Terms, Privacy, UserGuide, RavTools, Calculator, CostComparator, ResortQuiz, BudgetPlanner, BiddingMarketplace, Destinations).
- **4 tool pages:** Added Breadcrumb JSON-LD (`Home → RAV Tools → ToolName`).
- **Bug fixes:** Notifications.tsx had duplicate "| Rent-A-Vacation" in title (object form wasn't supported). NotificationPreferences.tsx same fix. NotFound.tsx now has `usePageMeta` with `noindex: true`. Developers.tsx now has `usePageMeta` with canonical.
- **`index.html`:** Removed static `<link rel="canonical">` (hook manages it per page).
- **Build-time sitemap:** `scripts/generate-sitemap.ts` runs as `postbuild`, generates `dist/sitemap.xml` with static routes + destination slugs + active listing IDs from Supabase. Deleted static `public/sitemap.xml`.
- **Tests:** 825 passing (104 files, +19 new: usePageMeta 10, useJsonLd 5, breadcrumbSchema 4). 0 type errors, build clean.

**Session 40 — Notification Center: Full Platform Build (Mar 16):**
- Built unified Notification Center: catalog-driven preferences, seasonal event calendar, SMS infrastructure, delivery logging.
- **Migration 046:** 6 new tables (`notification_catalog`, `user_notification_preferences`, `seasonal_events`, `event_instances`, `notification_delivery_log`, `sms_suppression_log`), 3 enums, 3 RPCs, RLS policies.
- **18 notification_catalog entries** (15 existing types + 3 seasonal SMS). **48 event instances** across 8 destinations for 2026.
- **3 new edge functions:** `notification-dispatcher` (multi-channel routing), `sms-scheduler` (daily cron), `twilio-webhook` (delivery status + STOP opt-out).
- **Frontend:** `/notifications` page (filters, date grouping), `/settings/notifications` (TCPA-compliant SMS opt-in), Admin "Notifications" tab (4 sub-tabs).
- **NotificationBell** enhanced with click navigation and "View all" link.
- **SMS_TEST_MODE=true** — zero code changes needed to go live (env var flip after A2P 10DLC registration).
- **Issues:** #215-#223 closed, #224 (future one-time events) open. #102 (SMS notifications) superseded and closed.
- **Deployed to DEV:** Migration 046 applied, all 3 edge functions deployed, Twilio secrets configured, `SMS_TEST_MODE=true`.
- **Twilio account:** Regular account created, phone number purchased. A2P 10DLC registration pending (blocked on #127 LLC/EIN).
- **Tests:** 806 passing (101 files, +35 new). 0 type errors, build clean.
- **Flow manifests:** Updated for `/notifications`, `/settings/notifications`, admin `notification_center` tab.

**Session 39 — RAV Smart Suite Rebrand + SmartEarn Merge (Mar 10):**
- Rebranded all 6 free tools to consistent "RAV Smart___" naming: SmartFee→SmartEarn, Vacation Cost Comparator→SmartCompare, Resort Finder Quiz→SmartMatch, Trip Budget Planner→SmartBudget.
- Merged standalone Rental Yield Estimator into SmartEarn as a toggle section on `/calculator` with region selector + projected income card.
- Deleted `src/pages/YieldEstimator.tsx`. `/tools/yield-estimator` now redirects to `/calculator`.
- Added breadcrumb navigation ("Back to Free Tools") and `font-display` h1 to all tool pages.
- Updated: RavTools hub (6→5 cards), App.tsx routes, flow manifest, sitemap, tests, all docs.
- PR #207 merged to main. 771 tests passing, build clean.

**Session 38 — Public API, RAV Tools Hub & Brand Naming (Mar 10):**
- Closed #173 (Schema Fixes): Added `x-sse-events`, `x-auth-note`, `x-internal` extensions to OpenAPI spec. Clarified dual-input (voice-search) and rate limit headers. Validated with Redocly (0 errors).
- Closed #174 (Public API Layer): Migration 044 (api_keys + api_request_log tables, 4 RPCs). `api-gateway` edge function with 5 read-only endpoints (listings, listing by ID, search, destinations, resorts). Dual auth (API Key + JWT). Tiered rate limits (free/partner/premium). Admin "API Keys" tab. `/developers` public Swagger UI page.
- DEC-025 (RAV Tools Hub): `/tools` hub page with 5 built tools. "Fee Freedom Calculator" renamed to "RAV SmartEarn" (merged with Rental Yield Estimator) across Header, Footer, calculator page, brand docs. `usePageMeta()` added to 7 pages. JSON-LD structured data (ItemList, Organization, HowTo).
- 4 new tool implementations: RAV SmartCompare, RAV SmartEarn (merged Yield Estimator), RAV SmartMatch, RAV SmartBudget — full logic modules with tests and PostHog tracking.
- Header redesign: "Free Tools" promoted to top-level nav with Sparkles icon. Removed inconsistent icons. Active-state highlighting. Removed redundant SmartEarn from Explore dropdown.
- Navigation fix: Added global Header to 7 pages that were missing it (Admin, Owner Dashboard, BookingSuccess, Documentation, UserGuide, TravelerCheckin, PendingApproval).
- SEO: Sitemap updated from 10 → 17 URLs. `WebApplication` JSON-LD on all 4 tool pages.
- IP Allowlisting (#201): Migration 045 — optional `allowed_ips text[]` on API keys with CIDR support. Admin UI create/edit. `checkIpAllowlist()` in api-gateway. 9 tests.
- Created follow-up issues: #188-#192 (API enhancements), #193-#198 (PostHog events, future tools)
- DEC-024: Public API Architecture, DEC-025: RAV Tools Hub & Brand Naming
- Deployed migrations 044-045 to DEV and PROD. api-gateway edge function to DEV.
- Tests: 676→771 (+95 new, 99 test files). PRs #199-#205 merged to main.

**Session 37 — Dynamic Pricing & Referral Program (Mar 5):**
- Closed #99 (Dynamic Pricing): `src/lib/dynamicPricing.ts` — urgency discount (graduated 0-15%), seasonal factor (month-based historical data), demand adjustment (pending bids + saved searches). Migration 042: `get_dynamic_pricing_data` RPC. `useDynamicPricing` hook. Enhanced `PricingSuggestion` component with factor badges. 33 tests.
- Closed #105 (Referral Program): Migration 043 — `referral_codes` + `referrals` tables, 3 RPCs (get_or_create_referral_code, record_referral, get_referral_stats). `src/lib/referral.ts` utilities. `useReferral` hooks. `ReferralDashboard` component in Owner Dashboard Account tab. Signup captures `?ref=` param. 16 tests.
- Deployed migrations 036-043 to both DEV and PROD
- Tests: 627→676 (+49 new, 90 test files)
- PRs #183 and #184 merged to main

**Session 36 — Admin Tools, Docs & Dispute Expansion (Mar 4):**
- Closed #176 (UserGuide & Documentation): 13 new UserGuide sections (6 owner + 7 renter) + 12 new Documentation sections covering Sessions 27-35 features
- Closed #177 (Admin Property Editing): AdminPropertyEditDialog with audit trail. Migration 040 (shared with #178): last_edited_by/at on properties + listings, admin_edit_notes on listings. 6 tests.
- Closed #178 (Admin Listing Editing): AdminListingEditDialog with live price calc via computeListingPricing(). Disabled for booked/completed. 7 tests.
- Closed #179 (Resort Data Import): AdminResortImport 3-step UI + resortImportUtils (validate, duplicate check, template). New "Resorts" admin tab. 11 tests.
- Closed #180 (Dispute Expansion): Migration 041 — 5 owner dispute categories + evidence_urls. useDisputeEvidence hook + EvidenceUpload component. Role-aware ReportIssueDialog. "Report Issue" in OwnerBookings. Evidence thumbnails in AdminDisputes. 11 tests.
- Tests: 592→627 (+35 new, 86 test files)
- PR #181 created

**Session 35 — OpenAPI Validation, P0 Tests & iCal Export (Mar 4):**
- Closed #172 (OpenAPI Spec Validation): Fixed 14 errors (missing security declarations) + 35 warnings. Added `operationId`, `security`, `x-rate-limit` extensions to all 26 endpoints. `StripeSignature` security scheme. Added missing `idle-listing-alerts` endpoint.
- Closed #101 (iCal Calendar Export): `src/lib/icalendar.ts` — RFC 5545 compliant, zero dependencies. `useOwnerCalendarExport` hook. "Export Calendar" button in OwnerBookings. 18 tests.
- #149 Phase A completed (P0 Test Library): `docs/P0-TEST-CASES.md` — 20 scenarios across 7 journeys. 97 tests tagged `@p0` across 14 files. `npm run test:p0` script. Phase B (Playwright E2E) and Phase C (Qase sync) remain open.
- Updated `docs/testing/` — TEST-STRATEGY.md, TESTING-GUIDELINES.md, OPERATIONAL-GUIDE.md, TEST-SETUP-CHECKLIST.md brought current with 592-test reality.
- Tests: 574→592 (+18 new, 81 test files)

**Session 24 — GDPR, Disputes & Security Hardening (Feb 26):**
- Dispute Resolution (#79): Migration 026, `process-dispute-refund` edge fn, AdminDisputes.tsx, ReportIssueDialog.tsx
- GDPR Account Deletion (#89): Migration 027, `export-user-data` + `delete-user-account` edge fns, 14-day grace period, anonymization
- CSP Headers (#66): `vercel.json` security headers (script-src, HSTS, X-Frame-Options, etc.)
- Rate Limiting (#67): Migration 028, `_shared/rate-limit.ts`, applied to 7 edge functions
- Cookie consent (#69), Email verification (#81), Escrow improvements (#91), Tax disclosure (#92), Notification prefs (#82)
- Tests sprint: 306→387

**Session 25 — Role-Based UX Overhaul (Feb 26-27):**
- 10 issues closed (#131-#140) across 3 batches
- Admin entity cross-linking + search by ID (#131, #132)
- Date-range filters + admin notes on users (#133, #134)
- Owner escrow visibility, renter disputes, rejection reasons (#135, #136, #137)
- Bulk approve/reject listings, SLA age badges, dispute assignment (#138, #139, #140)
- Migration 031: dispute assignment column
- Tests: 387→402

**Session 26 — GA4, Tax Reporting & Doc Fixes (Feb 27):**
- GA4 Integration (#74): `src/lib/analytics.ts` with cookie-consent-gated gtag.js, SPA tracking, typed event helpers, CSP updates. Measurement ID: G-G2YCVHNS25
- Admin Tax & 1099-K Reporting (#62, #64): `AdminTaxReporting.tsx` tab with monthly revenue table, owner earnings tracking, $600 threshold, W-9 status. Migration 032: tax info fields on profiles
- Doc repo references (#70): Updated old tektekgo references to rent-a-vacation/rav-website
- Tests: 402→409

**Session 27 — Reviews, Messaging, Sort, Portfolio (Feb 28):**
- Post-stay review system (#95): Migration 033, reviews table with sub-ratings, StarRating component, ReviewForm/List/Summary, integrated into PropertyDetail + MyBookings
- Listing sort options (#97): Sort by price, date, rating, newest on Rentals page
- Renter-owner messaging (#98): Migration 034, booking_messages table, BookingMessageThread chat UI, integrated into MyBookings + OwnerBookings
- Multi-property portfolio (#103): Migration 035, portfolio RPC, PortfolioOverview with expandable PropertyCalendar in OwnerDashboard
- Admin owner filter (#120): Owner dropdown in AdminListings tab
- Demo walkthrough document: docs/DEMO-WALKTHROUGH.md (comprehensive presentation script)
- Tests: 409→451 (42 new)

**Session 34 — 8 Issues: Realtime, UX Enhancements & Infrastructure (Mar 4):**
- Closed #104 (Realtime Notifications): `useRealtimeSubscription` hook, replaced polling in NotificationBell (30s), BookingMessageThread (10s), unread counts (30s)
- Closed #117 (Role Upgrade Notification): In-app notification + email on admin approval, Realtime auto-detection in RoleUpgradeDialog with celebration toast
- Closed #155 (Owner Profiles): Migration 036 (`get_owner_profile_summary` RPC), OwnerProfileCard with avatar, verification badge, stats. Integrated into PropertyDetail sidebar
- Closed #158 (Destination Browsing): 10 destinations/35 cities, DestinationDetail page with breadcrumbs and city drill-down, rewrote Destinations page with dynamic listing counts
- Closed #164 (Renter Dashboard): `/my-trips` with 4 tabs (Overview, Bookings, Offers, Favorites), consolidated nav, saved searches section
- Closed #157 (Pre-Booking Messaging): Migration 037 (listing_inquiries + inquiry_messages tables), InquiryDialog + InquiryThread, "Ask the Owner" button on PropertyDetail
- Closed #156 (Saved Searches): Migration 038 (saved_searches table + price tracking columns), SaveSearchButton on Rentals, SavedSearchesList in RenterDashboard, price drop badge
- Closed #163 (Idle Week Alerts): Migration 039 (alert tracking columns), `idle-listing-alerts` edge function (cron, max 50/run, 60d+30d thresholds), pure utilities
- Created #172, #173, #174 (API docs follow-up: spec validation, edge-case schemas, public API design)
- 30 new files, 22 modified files, 4 new migrations, 1 new edge function
- Tests: 507→574 (+67 new, 80 test files)

**Session 33b — OpenAPI Spec & Swagger UI (#171) (Mar 3):**
- OpenAPI 3.0.3 spec for all 25 edge functions at `docs/api/openapi.yaml`
- Swagger UI at `/api-docs` (admin-gated, CDN-loaded, no npm packages)
- Audit script: `node scripts/generate-openapi.cjs --audit` — confirms 25/25 coverage
- Tags: AI, Payments, Payouts, Cancellations, Disputes, Escrow, Notifications, Marketplace, GDPR, Data, Admin
- New files: 6 created, 1 modified (App.tsx route only)
- Tests: 507 (unchanged — docs-only, no new business logic)

**Session 33 — UX Improvements: 5 Frontend-Only Issues (Mar 3):**
- Closed #159 (Cancellation Policy): `CancellationPolicyDetail` component + `cancellationPolicy.ts` utility — color-coded refund rules with concrete deadlines. Integrated into PropertyDetail + Checkout.
- Closed #161 (Booking Timeline): `BookingTimeline` component + `bookingTimeline.ts` — 5-step lifecycle progress (payment → owner confirm → details → check-in → review). Integrated into BookingSuccess + MyBookings (compact + expandable).
- Closed #162 (Pricing Suggestions): `usePricingSuggestion` hook + `PricingSuggestion` component — market range bar from active listings by brand/location. Integrated into ListProperty + OwnerListings dialog.
- Closed #160 (Compare Properties): `CompareListingsDialog` + `compareListings.ts` — side-by-side comparison (max 3) with "Best" badges. Compare mode toggle on Rentals page.
- Closed #153 (Dashboard Consolidation): OwnerDashboard 11 tabs → 4 (Dashboard, My Listings, Bookings & Earnings, Account) with Collapsible sub-sections. Backwards-compatible TAB_REDIRECTS map for old URLs.
- 12 new files, 9 modified files, flow manifest tab refs updated
- PR #170 created (dev → main)
- Tests: 462→507 (+45 new, 69 test files)

**Session 32 — Staff Permissions (#119) (Mar 3):**
- Closed #119 (rav_staff distinct permissions): Added `isRavAdmin()` helper to AuthContext (true for `rav_admin`/`rav_owner`, false for `rav_staff`)
- Gated 7 sensitive admin tabs behind `isRavAdmin()`: financials, tax, payouts, memberships, settings, voice, dev-tools
- Staff sees 10 operational tabs (overview, properties, listings, bookings, escrow, issues, disputes, verifications, users, approvals)
- `useSystemSettings` mutation guard changed from `isRavTeam()` → `isRavAdmin()`
- URL redirect: staff navigating to restricted tab via `?tab=financials` gets redirected to overview
- PR #169 merged to main
- Tests: 451→462 (+11 new, 4 isRavAdmin role checks + test infrastructure)

**Session 31 — P0 UX: CTAs, Pricing Transparency, Marketplace Language (Mar 3):**
- Closed #150 (Simplify CTAs): PropertyDetail collapsed 5 buttons → 1 primary "Book Now" + Collapsible "More booking options" with descriptions
- Closed #151 (Pricing Transparency): Fee breakdown (base, 15% service fee, cleaning fee, total) on PropertyDetail + Checkout via `computeFeeBreakdown()`. Listing cards show `$X/night + fees`. FAQ bug fix: "3-5%" → "15%"
- Closed #154 (Marketplace Language): All UI "bid" → "offer", "Marketplace" → "Name Your Price", "Open for Bidding" → "Flexible Pricing". Database unchanged.
- 18 files changed across source, tests, flow manifests, docs (UserGuide, Documentation, HowItWorksPage, DEMO-WALKTHROUGH, ARCHITECTURE)
- Created #165 (Owner Volume Discount — configurable commission tiers based on completed bookings)
- Created #166 (Revisit membership tier value proposition beyond voice hours)
- PR #167 merged, PR #168 merged
- Tests: 451 (unchanged — no new business logic)

**Session 30 — Code Splitting, CI Fix & QA Strategy (Mar 2):**
- Route-level code splitting (#108): 21 pages converted to `React.lazy()` + `Suspense`, `PageLoadingFallback` spinner. Build clean.
- CI/Qase fix: Replaced `vitest-qase-reporter` (required Business plan, zero case IDs tagged) with `dorny/test-reporter` + Vitest JUnit XML output. PR annotations now free and subscription-free.
- QA platform review issue created (#149): tracks future decision on curated P0 test case library + test management platform selection
- Docs updated: TESTING-GUIDELINES.md, TEST-STRATEGY.md, PROJECT-HUB.md, COMPLETED-PHASES.md
- PR #148 open: code splitting + CI fix → main
- Tests: 451 (unchanged — no new business logic)

**Session 29 — Sentry Source Maps & Optimization (Mar 1):**
- Source map uploads via `@sentry/vite-plugin` — stack traces now show real file/line/function in Sentry dashboard
- Browser tracing (`browserTracingIntegration`) — page load metrics, SPA route changes, HTTP request durations
- Session replay (`replayIntegration`) — DOM recordings of error sessions (50 free/month)
- `tracesSampleRate` lowered to 5% (free tier budget: 10K/month)
- `SENTRY_AUTH_TOKEN` added to `.env.local`, Vercel env vars, GitHub Actions secrets
- DevTools "Sentry Error Test" card for verification (DEV-only)
- PRs #145 + #146 merged, issue #147 closed
- Tests: 451 (unchanged — no new business logic)

**Session 28 — Accounting Strategy & Documentation (Feb 28):**
- Accounting tool evaluation: Puzzle.io selected over QuickBooks (native Stripe, free tier, automated ASC 606)
- Updated DEC-022 to reflect Puzzle.io + pluggable architecture decision
- Updated `docs/RAV-PRICING-TAXES-ACCOUNTING.md` v2.1 — staged growth plan (§9), environment mapping (§10), tool evaluation appendix
- Updated issue #63: renamed to "Accounting Integration (Puzzle.io → pluggable)", detailed implementation plan
- Key insight: Puzzle.io IS the ledger (not middleware) — replaces QB/Xero, doesn't supplement them
- Key insight: 1099-K handled natively by Stripe Connect ($2.99/form) — no Gusto needed
- Puzzle.io account created, but **onboarding blocked at step 7** — requires bank connection → EIN → LLC formation (#127)
- Issue #63 marked `blocked` with resume instructions
- PR #144 merged — dev and main in sync

**Open pre-launch issues:** 3 remaining (#80 Legal review, #87 Launch checklist, #127 Business formation — blocked)

**Blocked dependency chain:**
```
#127 (Form LLC, get EIN) ──blocks──→ Stripe Tax activation
                          ──blocks──→ Puzzle.io onboarding (#63)
                          ──blocks──→ Business bank account
```

**Resume instructions when #127 is unblocked:**
1. Form LLC → receive EIN
2. Open Mercury bank account (recommended) with EIN
3. Resume Puzzle.io onboarding at step 7 → connect bank + Stripe
4. Activate Stripe Tax in Stripe Dashboard (zero code changes needed)
5. Build pluggable accounting adapter (#63 Phase E.2, 4-6 hours)

**Next recommended work (not blocked):**
- #87 Launch readiness checklist
- #80 Legal review of Terms/Privacy
- Deploy migrations 036-039 to Supabase DEV and PROD
- Deploy `idle-listing-alerts` edge function
- API docs follow-up (#172, #173, #174)

---

## COMPLETED PHASES

> Full details for all completed phases: [COMPLETED-PHASES.md](COMPLETED-PHASES.md)

<details>
<summary><strong>Phase 19: Flexible Date Booking + Per-Night Pricing</strong> — Completed Feb 22, 2026</summary>

**What:** Switch platform to per-night pricing, add flexible date proposals on bids, and "Inspired By" travel requests from listing detail.

**3 Tracks:**
- **Per-Night Pricing:** Migration 020 adds `nightly_rate` column to listings (backfilled from `owner_price / nights`). Shared `src/lib/pricing.ts` utility replaces 4 duplicated `calculateNights()` functions. All displays (Rentals, PropertyDetail, Checkout, FeaturedResorts, MyListingsTable, PricingIntelligence) use DB `nightly_rate`. Owner listing form switched from "Your Asking Price" to "Nightly Rate" with live price summary (nights x rate, RAV fee, traveler total).
- **Option A — Propose Different Dates:** BidFormDialog gains `mode` prop (`'bid'` | `'date-proposal'`). Date-proposal mode shows date pickers with auto-computed bid amount (`nightly_rate x proposed nights`). `listing_bids` gets `requested_check_in/out` columns. BidsManagerDialog shows proposed dates in blue badge. "Propose Different Dates" button on PropertyDetail.
- **Option B — Inspired Travel Request:** `InspiredTravelRequestDialog` pre-fills TravelRequestForm with listing's location, dates, bedrooms, brand. "Send to this owner first" toggle (`target_owner_only`). `travel_requests` gets `source_listing_id` + `target_owner_only` columns. "Request Similar Dates" button on PropertyDetail.

**Database:** Migration `020_flexible_dates_nightly_pricing.sql` — 3 ALTER TABLEs + backfill + constraint
**New Files:** `src/lib/pricing.ts`, `src/lib/pricing.test.ts`, `src/components/bidding/InspiredTravelRequestDialog.tsx`, `src/components/bidding/BidFormDialog.test.tsx`
**Modified:** ~20 files (types, hooks, components, pages, seed manager, flow manifests, email)
**Tests:** 289 total (16 new), 0 type errors, 0 lint errors, build clean
</details>

<details>
<summary><strong>Seed Data Management System</strong> — Completed Feb 21, 2026</summary>

**What:** Complete 3-layer seed data system for DEV environment testing and executive demos.

**3 Layers:**
- **Layer 1 (Foundation):** 8 permanent users — 3 RAV team (dev-owner, dev-admin, dev-staff) + 5 property owners (Alex Rivera/HGV, Maria Chen/Marriott, James Thompson/Disney, Priya Patel/Wyndham, Robert Kim/Bluegreen). Marked `is_seed_foundation = true`, never wiped.
- **Layer 2 (Inventory):** 10 properties (2 per owner, real resort names), 30 listings (15 active, 10 bidding, 5 draft)
- **Layer 3 (Transactions):** 50 renters with growth curve (8→16→26 over 90 days), 90 completed bookings, 10 pending, 5 in escrow, 5 cancellations, 20 bids, 10 travel requests, 8 proposals

**Database:** Migration `015_seed_foundation_flag.sql` — `is_seed_foundation` boolean column on profiles with partial index
**Edge Function:** `seed-manager` with 3 actions: `status` (table counts), `reseed` (full 3-layer creation), `restore-user` (recreate deleted accounts)
**Admin UI:** `DevTools.tsx` — 4 sections (status grid, reseed with log, test accounts table, Stripe test cards). Conditional tab in AdminDashboard (DEV only)
**Safety:** Production guard (`IS_DEV_ENVIRONMENT` secret), protected set (foundation + RAV team members), FK-ordered 21-table deletion
**Documentation:** `docs/testing/SEED-DATA-GUIDE.md`

**Files:** 6 created/modified
**Password:** All seed accounts use `SeedTest2026!`
</details>

<details>
<summary><strong>Phase 14: Executive Dashboard</strong> — Completed Feb 20, 2026</summary>

**What:** Investor-grade strategic dashboard for RAV Owner — dark-themed, boardroom-quality business intelligence with 6 sections.

**6 Sections:**
- **HeadlineBar:** Sticky bar with 5 KPI pills (GMV, Revenue, Active Listings, Liquidity Score, Voice Adoption)
- **BusinessPerformance:** 4 Recharts charts — GMV trend (AreaChart), bid activity (LineChart), bid spread index (BarChart), revenue waterfall (StackedBarChart)
- **MarketplaceHealth:** Proprietary metrics — Liquidity Score SVG gauge, supply/demand destination map, voice vs traditional funnel
- **MarketIntelligence:** BYOK pattern — AirDNA market comparison, STR Global benchmarks, RAV pricing position
- **IndustryFeed:** NewsAPI integration, regulatory radar timeline, macro indicators with sparklines
- **UnitEconomics:** 7 metric cards (CAC, LTV, LTV:CAC, Payback, Avg Booking, Take Rate, MoM Growth) with methodology

**Database:** Migration `013_executive_dashboard_settings.sql` — 4 system_settings rows for API key storage
**Edge Functions:** `fetch-industry-news`, `fetch-macro-indicators`, `fetch-airdna-data`, `fetch-str-data` (all with caching + fallback)
**New Hooks:** `useBusinessMetrics`, `useMarketplaceHealth`, `useIndustryFeed`, `useMarketIntelligence`
**Components:** ~15 new files in `src/components/executive/`
**Flow Manifest:** `admin-lifecycle.ts` updated with executive_dashboard step

**Files:** ~25 created, 4 modified
**Tests:** 15+ new tests (hooks + components)
</details>

<details>
<summary><strong>Phase 13: Core Business Flow Completion</strong> — Completed Feb 20, 2026</summary>

**What:** Complete the 5 remaining implementation gaps in core business flows.

**5 Tracks:**
- **Track C:** Approval email notifications — wired existing `send-approval-email` edge function to AdminListings approve/reject actions
- **Track A:** Owner bidding UI — "Place Bid" button on PropertyDetail page, comprehensive tests for all 18 bidding hooks
- **Track E:** Property image upload — Supabase Storage bucket with RLS, `usePropertyImages` hook, drag-and-drop upload component, integrated into ListProperty form
- **Track D:** Payout tracking — `usePayouts` hooks, OwnerPayouts component with stats cards + table, Payouts tab in OwnerDashboard
- **Track B:** Owner Confirmation Timer — configurable countdown timer (default 60 min), extension system (max 2 × 30 min), auto-timeout with refund, 3 new email types, admin settings UI, flow manifest updates

**Database:** Migration `012_phase13_core_business.sql` — property-images storage bucket, owner confirmation columns on `booking_confirmations`, 3 system settings, `extend_owner_confirmation_deadline` RPC

**New hooks:** `useOwnerConfirmation` (7 sub-hooks), `usePayouts` (3 sub-hooks), `usePropertyImages` (4 sub-hooks)
**New components:** `OwnerConfirmationTimer`, `OwnerPayouts`, `PropertyImageUpload`
**Edge functions updated:** `verify-booking-payment`, `send-booking-confirmation-reminder` (3 new types), `process-deadline-reminders` (timeout processing)
**Flow manifests:** Both `owner-lifecycle.ts` and `traveler-lifecycle.ts` updated with owner confirmation steps

**Files:** ~30 modified/created
**Tests:** 142/142 passing, 0 type errors, 0 lint errors
</details>

<details>
<summary><strong>Role Terminology Standardization</strong> — Completed Feb 17, 2026</summary>

**What:** Standardize all UI-facing role terminology from "Traveler" to "Renter" across the entire application to clearly convey the role function.

**Key deliverables:**
- Centralized `ROLE_LABELS`, `ROLE_COLORS`, `AccountType` in `src/types/database.ts`
- 27 files updated: components, pages, flows, hooks, tests, documentation
- Renamed `useTravelerTiers` → `useRenterTiers`, `TravelerBadge` → `RenterBadge` (deprecated aliases kept)
- Signup default `accountType` changed from `"traveler"` to `"renter"`
- Flow manifests: "Traveler Journey" → "Renter Journey" with updated descriptions
- All documentation pages (Documentation, UserGuide, FAQ, HowItWorks) updated
- Admin dashboard: Architecture link added for `rav_owner` role
- DB-level `role_category = 'traveler'` intentionally unchanged (database schema)

**Files:** 27 modified, 0 created
**Tests:** 96/96 passing, 0 type errors, 0 lint errors
</details>

<details>
<summary><strong>UX Feedback Improvements</strong> — Completed Feb 16, 2026</summary>

**What:** Replace fleeting toasts with persistent inline success states across all key user workflows.

**Key deliverables:**
- `ActionSuccessCard` reusable component (icon, title, description, reference box, email indicator, action buttons)
- 7 new tests for ActionSuccessCard, total 96 tests passing
- 6 dialog/page flows enhanced: OwnerListings, OwnerProperties, BidFormDialog, RoleUpgradeDialog, Signup, BookingSuccess
- 2 email confirmation functions: `sendListingSubmittedEmail()`, `sendPropertyRegisteredEmail()`
- BookingSuccess: booking reference number + "What Happens Next" timeline (email, owner confirmation, check-in)
- Admin dashboard: fixed tab layout (invalid `grid-cols-13` → `flex flex-wrap`)
- Removed redundant `toast.success` from `useCreateBid` and `useRequestRoleUpgrade` hooks

**Files:** 11 modified, 2 created
</details>

<details>
<summary><strong>Phase 11: Progressive Web App (PWA)</strong> — Completed Feb 16, 2026</summary>

**What:** Full PWA support using `vite-plugin-pwa` with Workbox auto-generated service worker.

**Key deliverables:**
- Service worker with precaching (59 entries) + runtime caching (Google Fonts, Unsplash)
- Web app manifest generated from Vite config (standalone, portrait, themed)
- Install prompt banner (Android Chrome) with 14-day dismiss, standalone detection
- Offline detection banner with `useSyncExternalStore`
- iOS meta tags (`apple-mobile-web-app-capable`, status bar, title)
- 11 new tests (4 useOnlineStatus + 7 usePWAInstall), total 89 tests passing

**Files:** 6 modified, 6 created, 1 deleted (`public/site.webmanifest` → VitePWA generates it)

**New hooks:** `useOnlineStatus`, `usePWAInstall`
**New components:** `OfflineBanner`, `PWAInstallBanner`
</details>

- **Phase 9:** Voice toggles, membership tiers (6 tiers), commission config, tier-aware quotas — [details](COMPLETED-PHASES.md#phase-9-voice-toggles-membership-tiers--commission)
- **Phase 8:** Testing infrastructure — 78 tests, Vitest, Playwright E2E, Percy, GitHub Actions CI — [details](COMPLETED-PHASES.md#phase-8-testing-infrastructure)
- **TS Build Fixes:** Supabase v2 type inference fixes, architecture diagram system, flow manifests — [details](COMPLETED-PHASES.md#typescript-build-fixes--architecture-diagrams)
- **Phase 7:** UI excellence — social proof, honest content, visual polish, similar listings — [details](COMPLETED-PHASES.md#phase-7-ui-excellence--social-proof)
- **Phase 6:** Role upgrade system, dead-end UX prevention, signup role selection — [details](COMPLETED-PHASES.md#phase-6-role-upgrade-system--dead-end-ux-prevention)
- **Phase 5:** Core business flows — real DB queries, Checkout page, Stripe, booking flow — [details](COMPLETED-PHASES.md#phase-5-core-business-flows)
- **Phase 4B:** UI fixes — calendar tabs, pagination, favorites, forgot-password — [details](COMPLETED-PHASES.md#phase-4---track-b-ui-fixes)
- **Phase 4A:** Voice auth & approval — auth gate, admin approval, usage limits — [details](COMPLETED-PHASES.md#phase-4---track-a-voice-auth--approval-system)
- **Phase 4D:** Documentation updates — user guide, FAQ, how it works, admin docs — [details](COMPLETED-PHASES.md#phase-4---track-d-documentation-updates)
- **Voice Fixes:** Interruption + budget assumption fixes — [details](COMPLETED-PHASES.md#fix-known-voice-issues)
- **Phase 2:** Resort master data — 117 resorts, 351 unit types — [details](COMPLETED-PHASES.md#phase-2-resort-master-data)
- **Phase 1:** Voice search — VAPI integration, NLP search — [details](COMPLETED-PHASES.md#phase-1-voice-search)

---

## RESEARCH SPIKES

### RS-001: LiveKit Voice Agents SDK Evaluation
**Date Added:** February 15, 2026
**Status:** Closed — Decision made (DEC-012: Stay on VAPI)
**Resolution:** Cost savings from LiveKit don't justify 3-6 weeks of engineering at current scale (~$300-700/month voice spend). Revisit when monthly voice spend consistently exceeds $3,000/month.

---

## IDEAS BACKLOG

> **Ideas are now tracked as GitHub Issues with the `idea` label.**
> View: `gh issue list --repo rent-a-vacation/rav-website --label "idea"`
>
> To add a new idea:
> ```bash
> gh issue create --repo rent-a-vacation/rav-website --title "Idea: [description]" --label "idea" --body "[details]"
> ```

---

## KEY DECISIONS LOG

> Archived finalized decisions: [DECISIONS.md](DECISIONS.md)

**Archived:**
- DEC-001: Hybrid agent sessions — [details](DECISIONS.md#dec-001-hybrid-agent-sessions-for-phase-2)
- DEC-002: Voice search access control (logged-in only) — [details](DECISIONS.md#dec-002-voice-search-access-control)
- DEC-003: Voice quota design (tier-based) — [details](DECISIONS.md#dec-003-voice-usage-quota-design)
- DEC-005: Placeholder content removal — [details](DECISIONS.md#dec-005-placeholder-content-removal)
- DEC-006: Testing infrastructure approach — [details](DECISIONS.md#dec-006-testing-infrastructure-approach)
- DEC-007: Build version system — [details](DECISIONS.md#dec-007-build-version-system)
- DEC-008: Membership tier & commission architecture — [details](DECISIONS.md#dec-008-membership-tier--commission-architecture)
- DEC-010: Voice platform VAPI vs LiveKit → resolved by DEC-012 — [details](DECISIONS.md#dec-010-voice-platform--vapi-vs-livekit)
- DEC-012: Stay on VAPI (vs LiveKit migration) — [details](DECISIONS.md#dec-012-voice-infrastructure--stay-on-vapi)

---

### DEC-004: Content Management Strategy
**Date:** February 13, 2026
**Status:** Pending

**Options:**
- A: Manual hardcode in components (fast, not scalable)
- B: Custom CMS in admin panel (4-6 hours build)
- C: Third-party CMS like Sanity (learning curve)

**Next Step:** Build prototype admin content panel, evaluate effort vs benefit

---

### DEC-009: AI Support Agent Strategy
**Date:** February 15, 2026
**Decision:** TBD — Needs design decision
**Status:** Pending

**Context:** Site-wide link audit revealed "Contact Support" buttons were non-functional. Contact form implemented as interim (Track C). AI-powered support agent is the long-term goal.

**Options:**
- A: Simple contact form only — **implemented as interim**
- B: Rule-based chatbot from FAQ content
- C: AI chat widget (Anthropic API)
- D: VAPI voice support agent
- E: LiveKit voice agent (see DEC-010, RS-001)
- F: Hybrid (contact form now + AI agent later) — likely best approach

**Next Step:** Complete RS-001 research spike, then decide AI approach

---

### DEC-014: Separate Route for Executive Dashboard
**Date:** February 20, 2026
**Decision:** `/executive-dashboard` as standalone page, not a tab in admin dashboard
**Status:** Final

**Reasoning:** Different design language, different audience, different purpose. Admin = utilitarian ops tool. Executive = boardroom strategy view. Mixing them dilutes both.

---

### DEC-015: Demo Mode / Connected Pattern for BYOK
**Date:** February 20, 2026
**Decision:** Default to "Demo Mode" with sample data, toggle to "Connected" with user-supplied API key
**Status:** Final

**Reasoning:** Honest to VCs (not faking data), shows product capability, real feature for future enterprise customers, avoids paying $200-500/mo for APIs before product-market fit.

---

### DEC-016: NewsAPI for Industry Feed
**Date:** February 20, 2026
**Decision:** Use NewsAPI free tier (100 req/day) via Edge Function with 60-min cache
**Status:** Final

**Reasoning:** Free, reliable, sufficient volume for demo + early production use. Cache in Edge Function memory to stay within limits.

---

### DEC-017: Dark Theme Approach
**Date:** February 20, 2026
**Decision:** Build dark-first (not using Tailwind dark: variants), wrap page root in bg-slate-900
**Status:** Final

**Reasoning:** Cleaner implementation, avoids fighting with app's light theme, more reliable visual consistency for demo.

---

### DEC-020: Text Chat Agent — Two-Tier Conversational Model
**Date:** February 21, 2026
**Decision:** Add OpenRouter-powered text chat alongside existing VAPI voice, as completely separate systems
**Status:** Final

**Context:** Voice search (VAPI) is expensive, tier-gated, and not always practical. Users need a conversational alternative that's universally available.

**Reasoning:** (1) OpenRouter is 10-100x cheaper than VAPI per interaction — no quota needed. (2) Text chat works in all environments (noisy, mobile, accessibility). (3) Shared `_shared/property-search.ts` module avoids code duplication while keeping systems independent. (4) VAPI remains untouched — zero regression risk. (5) Context-based system prompts (rentals/property-detail/bidding/general) provide relevant help across pages. (6) SSE streaming gives natural token-by-token display. (7) Session-only persistence avoids migration — can add localStorage/DB persistence later.

---

### DEC-018: Pre-Launch Platform Lock Strategy
**Date:** February 20, 2026
**Decision:** System-settings-based "Staff Only Mode" toggle (not per-user blocking)
**Status:** Final

**Context:** Need to prevent external users from creating test data on PROD before launch, while still deploying all code to PROD.

**Reasoning:** A global toggle in `system_settings` is simpler than per-user blocking. Leverages existing `can_access_platform()` RLS function. Toggle is in Admin > System Settings — flip it off when ready to go live. Default: enabled (locked). Enforced at 3 layers: database RLS, Login.tsx, Signup.tsx.

---

### DEC-019: Seed Data Management Approach
**Date:** February 21, 2026
**Decision:** 3-layer edge-function-based seed system with foundation user protection
**Status:** Final

**Context:** DEV environment needs realistic test data for functional testing and executive demos. PROD is locked via Staff Only Mode.

**Reasoning:** Edge function approach (vs raw SQL) allows: (1) idempotent auth.admin.createUser for proper trigger-based user setup, (2) production guard via env variable, (3) admin UI integration for one-click reset, (4) protected set pattern to never wipe RAV team or foundation accounts. Foundation users survive reseeds; everything else is disposable.

---

### DEC-021: Search Bar & Filter Strategy
**Date:** February 21, 2026
**Decision:** Make Rentals page search bar, calendar picker, and filter panel fully functional with state management and query integration
**Status:** Approved

**Context:** Comprehensive audit revealed the Rentals page search bar is mostly placeholder UI. Calendar picker is a static `<Input>`, Search button has no handler, and filter panel inputs (price/guests/bedrooms/brand) have no state bindings. Only the location text input works.

**Approach:** Wire all controls to React state, integrate with listing query filters. Calendar uses existing shadcn/ui `Calendar` component + `Popover`. Dates filter listings at application level (matching `_shared/property-search.ts` approach). PropertyDetail/Checkout dates remain read-only (timeshare model = owner sets fixed availability windows).

---

### DEC-022: Pricing, Tax & Accounting Framework
**Date:** February 21, 2026
**Date Updated:** February 28, 2026
**Decision:** Per-night pricing + separated fee line items + Stripe Tax before launch + Puzzle.io post-launch (pluggable)
**Status:** Approved (Updated — Puzzle.io replaces QuickBooks)
**Docs:** `docs/RAV-PRICING-TAXES-ACCOUNTING.md`

**Context:** Platform uses per-night pricing with itemized fee breakdown. As a marketplace facilitator in 43+ US states, RAV must collect and remit occupancy/sales taxes before going live. Accounting tool re-evaluated Feb 28 — Puzzle.io selected over QuickBooks for native Stripe integration, free tier, and automated revenue recognition (ASC 606).

**Key decisions:**
- Per-night rate (`nightly_rate`) is the atomic pricing unit across the platform ✅
- Fee breakdown: separate `service_fee`, `cleaning_fee`, `tax_amount` line items on every booking ✅
- Stripe Tax for automated tax calculation at checkout (code ready, pending #127) 🟡
- **Puzzle.io** as general ledger (replaces QuickBooks) — native Stripe sync, free <$20K/mo, automated revenue recognition
- **Pluggable accounting architecture** — provider-agnostic adapter pattern; can swap to QuickBooks/Xero/Zoho via config
- 1099-K handled natively by **Stripe Connect** ($2.99/form) — no Gusto needed
- Resort fees are owner-disclosed, not RAV-collected (paid at resort check-in)
- Stripe processing fees (~2.9%) absorbed by RAV, baked into 15% service fee margin

---

### DEC-023: Flexible Date Booking Strategy
**Date:** February 21, 2026
**Decision:** Three-phase approach — Option A (bid with dates) → Option B (inspired-by request) → Option C (partial-week splits)
**Status:** Approved

**Context:** Current model requires travelers to book the full date block set by the owner. This limits conversion when a traveler wants 6 of an 8-day listing.

**Approach:** Start with lightweight "Propose Different Dates" button (reuses existing bidding infrastructure, adds date fields to bids). Follow up with "Inspired By" travel requests (pre-filled from a listing, targeted to that owner). Defer full partial-week splitting until demand validates the pattern.

---

### DEC-024: Public API Architecture
**Date:** March 10, 2026
**Decision:** Single API gateway edge function with API key authentication and tiered rate limiting
**Status:** Approved

**Context:** RAV needs a public REST API for the upcoming mobile app (Capacitor), partner integrations (travel agents, aggregators), and developer experience.

**Approach:**
- Single `api-gateway` edge function handling all `/v1/*` routes (deployed with `--no-verify-jwt`)
- Dual auth: API Key (`X-API-Key` header) for partners, JWT (`Authorization: Bearer`) for own apps
- API keys: `rav_pk_<32 hex>` format, SHA-256 hashed at rest, shown once at creation
- Three rate limit tiers: free (100/day), partner (10K/day), premium (100K/day)
- Read-only endpoints only: listings, search, destinations, resorts (no write ops in v1)
- URL-based versioning (`/v1/`), 6-month deprecation notice for breaking changes
- Standard JSON envelope: `{ data, meta: { page, per_page, total_count }, api_version: "v1" }`

**Deferred enhancements (tracked in GitHub Issues):**
- #188 — Write endpoints (bookings, bids, travel requests via API)
- #189 — OAuth2 authentication for partner integrations
- #190 — Webhook delivery to partners (event notifications)
- #191 — Chat endpoint (`/v1/chat`) via gateway
- #192 — SDK packages for partners (npm, Python)

---

### DEC-036: RAVIO Support Architecture — Extend Text Chat, Not CrewAI; Voice Stays Discovery-Only
**Date:** April 20, 2026 (Session 57)
**Decision:** Build v1 customer support by extending the existing RAVIO text-chat edge function with a `context: 'support'` branch + Claude tool use. **Do not adopt CrewAI or any multi-agent orchestration framework.** VAPI voice remains discovery-only and is not extended into support.

**Rationale:**
1. **Shape of the problem.** Customer support is single-threaded — classify intent → fetch context → answer or escalate. CrewAI shines for collaborative multi-agent pipelines (researcher → writer → editor), which is not this shape. Added orchestration overhead with no payoff.
2. **Reuse the existing stack.** `supabase/functions/text-chat/index.ts` already handles SSE streaming, rate limiting, multi-context system prompts, and auth. Adding a `'support'` context is ~10% of the cost of standing up a parallel CrewAI surface.
3. **Voice is wrong for support.** VAPI is quota-metered (Free 5/day → Premium unlimited). Support queries burn quota and are poor fits for voice (auth-gated account lookups, evidence upload, screens showing charges). Keep voice as a premium discovery feature.
4. **Escalation reuses existing dispute infrastructure** (migration 041, `ReportIssueDialog`, `AdminDisputes`). Agent's `open_dispute` tool creates a dispute row with `source: 'ravio_support'` so admins can distinguish agent-opened disputes.

**UI pattern:**
- **Route-based context detection** — no explicit toggle. Support contexts on `/my-trips`, `/my-bookings`, `/account`, `/owner-dashboard`, `/settings/*`; discovery on `/rentals`, `/property/*`, `/tools/*`, `/destinations/*`; ambiguous routes fall through to intent classifier.
- **"Switched to Support — [back]" chip** for escape hatch when the classifier switches lanes against the user's will.
- Matches memory rule [Rooted in Simplicity] — anticipate user flow, don't ask.

**Docs storage model:** Markdown canonical in `docs/support/`, indexed to Supabase `support_docs` table via a GitHub-Action-triggered `ingest-support-docs` edge function. Git is source of truth (PR-reviewable, lawyer-friendly, diffable); DB is a runtime cache for fast agent retrieval. Shared frontmatter schema across 20 docs (policies / FAQs / processes), extending the existing frontmatter convention (`last_updated`, `change_ref`, `change_type`, `status`) with `title`, `doc_type`, `audience[]`, `version`, `legal_review_required`, `reviewed_by`, `reviewed_date`, `tags[]`.

**Agent tool surface (5 functions, all auth-scoped):** `lookup_booking`, `check_refund_status`, `check_dispute_status`, `open_dispute`, `query_support_docs`. RLS enforced; sensitive fields never echoed.

**Future expansion path:** If we ever need genuinely collaborative multi-agent workflows (e.g., complex dispute arbitration with a neutral compliance reviewer), revisit then. This foundation does not preclude that — agent + tool use is a strict subset of what a multi-agent framework needs.

**Status:** Scoped in epic #395 (milestone #37, Phase 22: Customer Support Foundation). 22 child issues #396-#417 across 5 tracks. B5 public-policy drafts (#404) blocked by #80 (legal consult); all other tracks unblocked.

**Supersedes:** DEC-020 (Text Chat Agent — Two-Tier Conversational Model) is retained for discovery; DEC-036 adds the support tier as a parallel `context` inside the same edge function.

---

### DEC-035: Path 3 Dashboard Naming — Brand CTA + Role-Descriptive Eyebrow
**Date:** April 20, 2026 (Session 55)
**Decision:** Keep the short brand-compliant nav CTAs per DEC-031 (**My Trips** / **My Rentals** / **RAV Ops** / **RAV Insights**) as the dominant dashboard labels. Add a small-caps, role-descriptive **eyebrow** above each dashboard H1 (**Traveler Dashboard** / **Property Owner Dashboard** / **RAV Admin Dashboard** or **RAV Staff Dashboard** / **Executive Dashboard — Business Intelligence**) so a first-time user instantly understands the mapping between the brand name and what the dashboard represents functionally.

**Rationale:** Paths considered:
- Path 1 (keep brand names, fix dropdown only) — compliant but doesn't clarify role
- Path 2 (switch to uniform "[Role] Dashboard") — supersedes DEC-031, high churn
- **Path 3 (hybrid)** ← chosen — preserves brand voice, adds visual role-guidance

Sub-tab labels inside dashboards (e.g., the "My Listings" tab within My Rentals) name a **tab**, not the dashboard. Remain unchanged.

**Status:** Shipped in PR #383. BRAND-LOCK Section 9 updated with Eyebrow column.

**Follow-up:** #381 — role-relevant landing-view ordering (surface most time-sensitive items first on each dashboard).

---

### DEC-034: Marketplace Flow Distinction — Pre-Booked Stay vs Wish-Matched Stay
**Date:** April 20, 2026 (Session 55 — scoped, Session 56 — **SHIPPED** in #380 Phases 1-5, PRs #385-#389)
**Decision:** Model the two marketplace flows explicitly in code + UI. Previously referred to as "Track 1" / "Track 2" (techie, rejected).

- **Flow 1 — Pre-Booked Stay:** Owner has the resort reservation already. Posts a Listing with fixed dates. Can optionally enable bidding. RAV staff verifies the reservation proof before listing goes active. Traveler books then instantly confirmed (no owner-confirmation countdown).
- **Flow 2 — Wish-Matched Stay:** Traveler posts a Wish. Owner submits an Offer in response. Traveler accepts. Owner has a time window to go confirm the resort reservation. RAV staff verifies owner's post-acceptance confirmation. Only then does booking become active.

**Naming convention:**
- **Type labels (origin):** "Pre-Booked Stay" (Flow 1) · "Wish-Matched Stay" (Flow 2)
- **Status labels (lifecycle):** "Confirmed" · "Pending Confirmation"
- Both labels appear together in UI (type answers "where did this come from", status answers "where is it in its lifecycle")

**Scope:** Foundational architectural change. New `source_type` enum on `bookings` + `listings` tables; new `confirm-wish-booking` edge function; new admin wish-matched verification queue; 3 new notification types; 10 UI surfaces updated; all docs (USER-GUIDE, FAQ, ARCHITECTURE, LAUNCH-READINESS, BRAND-LOCK, QA-PLAYBOOK) updated with parallel Flow 1 / Flow 2 sections; QA scenarios split into S-##a (Pre-Booked) and S-##b (Wish-Matched) variants.

**Current state pre-decision:** Flow 2 exists implicitly — accepted Offers auto-create listings (`useBidding.ts:538-571`) with `status='active'` — bypassing admin review entirely. `booking_confirmations.owner_confirmation_deadline` fires for every booking regardless of flow, which is why Track 1 testers reported the countdown felt irrelevant (S-04 R15).

**Status:** Scoped in #380 with full impact analysis. Blocks #376, #378, #381; coordinates with #377. Estimated 2-3 days of focused implementation work.

---

### DEC-033: Platform Monitoring — Checkly (SaaS) for Synthetic Uptime
**Date:** April 18, 2026 (Session 54)
**Decision:** Adopt Checkly (public SaaS, free tier) for synthetic uptime monitoring of critical user journeys and backend APIs. Complements Sentry (errors/APM) — does not replace it. Rejected self-hosted options (Zabbix, Uptime Kuma) to avoid homelab dependency in production monitoring.
**Status:** Deferred — tracked as post-launch issue #370. Not yet implemented.

**Context:** Sentry catches errors when users hit them, but won't proactively detect "Stripe checkout silently broke" or "bid submission fails after a deploy." Before launching web + mobile, we want 24/7 visibility into critical-path health on one dashboard.

**Why Checkly over alternatives:**
- Playwright-based synthetic browser checks reuse existing E2E test muscle (`e2e/smoke/`)
- Free tier: 10k API runs + 1.5k browser runs per month, multi-location, public status page
- API checks against Supabase edge functions cover backend health for web + mobile in one place
- Better Stack / UptimeRobot only ping for HTTP 200 — won't catch broken user flows
- Self-hosted tools rejected: user has Zabbix + Uptime Kuma in homelab but doesn't want production monitoring to depend on homelab uptime

**Scope (4 phases in #370):**
1. 3-5 browser checks for critical journeys (auth, browse, bid, checkout, voice)
2. API/edge function health checks (api-gateway, stripe-webhook, notification-dispatcher)
3. Alerting routing + severity definition
4. Optional public status page (Checkly built-in vs. Better Stack — decide later)

**Out of scope:** APM (Sentry), log aggregation (separate decision if needed), self-hosted monitoring.

---

### DEC-032: MDM Resort Data — Schema Hardening + Data Quality + API Enhancement
**Date:** April 15-16, 2026 (Session 52 — WS1/WS2/WS3)
**Decision:** Implement Master Data Management governance on the resort directory: schema hardening (WS1), data quality assessment and normalisation (WS2), and partner-ready API enhancement (WS3).
**Status:** Active — all three workstreams complete and deployed to DEV + PROD.

**What was built:**
- **WS1 Schema:** Migration `20260415_mdm_schema_hardening.sql` — 9 columns on `resorts` (attraction_tags, is_active, data_source, data_quality_score, verified_by/at, lat/lng, postal_code), 2 on `resort_unit_types` (min_stay_nights, smoking_policy), `resort_external_ids` cross-ref table, `calculate_resort_data_quality()` function, 5 indexes, RLS.
- **WS2 Data Quality:** Audit script (all 117 < 40 quality score initially), description generator (117 RAV-branded descriptions replacing template text), normalisation script (439 changes — country/state ISO, times 24h). All applied to DEV + PROD. Quality scores populated (55–65, avg 61).
- **WS3 API:** GET `/v1/resorts` enhanced with full MDM record + `?brand=`, `?updated_since=`, `?include_inactive=` filters. New `/v1/resorts/by-external-id` endpoint for partner ID mapping. OpenAPI spec updated with OTA field cross-references.

**Relationship to #257:** WS1 provides governance tools (`data_source`, `verified_by/at`, `data_quality_score`); #257 audit uses them. No duplication.

---

### DEC-031: Marketplace Terminology Lock — Listing / Wish / Offer
**Date:** April 15, 2026 (Session 52)
**Decision:** Lock user-facing marketplace vocabulary to three nouns: **Listing**, **Wish**, **Offer**. "Offer" replaces both "Bid" and "Proposal" in all UI copy. "RAV" prefix dropped from all transactional nouns/CTAs (no more "RAV Offer", "RAV Wish", "Make a RAV Offer", "Make a RAV Wish"). Header nav collapses "Name Your Price" + "Make a Wish" into a single **Marketplace** link with role-aware default tab. Route `/bidding` renamed to `/marketplace` with redirect. Owner dashboard gains a top-level **Offers** tab with "Offers I Sent" and "Offers on My Listings" sections.
**Status:** Active — shipped PR #355 (merged to main)

**Context:** Product audit surfaced terminology drift: three separate nouns (Bid / Proposal / RAV Offer) for what users experience as the same action ("propose a deal at a price"), plus fragmented Wish vocabulary (RAV Wish / Make a Wish / Vacation Wish / Request). Header showed the same two marketplace links to every role, burying role-specific flows. Owner "Proposals" were nested inside a collapsible inside a tab — not discoverable.

**Rationale for "Offer" over "Bid":**
- "Bid" carries auction baggage (ascending auction, competitive, buyer-only) — inaccurate for a negotiation marketplace
- "Offer" is bidirectional: a renter offers $200 on a listing; an owner offers their property for $180 on a wish. Both read naturally.
- Real-world precedent: Zillow "Make an Offer", CarMax "Offer", real estate offers — users already understand the mental model

**Rationale for dropping RAV prefix on transactional CTAs:**
- Users already know they're on RAV — the prefix adds friction without adding identity
- Platform-branded surfaces (RAV Deals, RAV Insights, RAV Ops, RAV Smart[X], RAVIO) retain the prefix — they identify platform tools, not user actions
- Brand slogan "Name Your Price. Book Your Paradise." retained as hero tagline (it describes the *mechanic*)

**DB impact:** None. `listing_bids` and `travel_proposals` tables, hooks (`useBidding`, `useMyProposals`), edge functions, and column names are unchanged. Only user-facing UI strings changed.

**Header & navigation:**
- Single "Marketplace" link replaces two links; accent-styled, all roles
- User dropdown adds role-aware activity items:
  - Renter: My Trips · My Offers · My Wishes
  - Owner: My Listings · Offers I Sent · Offers on My Listings
- Mobile menu mirrors the same structure

**Marketplace page (formerly BiddingMarketplace):**
- Role-aware default tab: renter/anon → Listings; owner → Wishes
- Tabs renamed "Listings" / "Wishes" (dropped "RAV Wishes")
- Hero copy split per role

**Owner dashboard:** new top-level **Offers** tab (promoted from buried collapsible). Two sections: Offers I Sent (proposals made on Wishes), Offers on My Listings (bids received). Legacy `?tab=proposals` / `?tab=offers-sent` / `?tab=offers-received` map to the unified Offers tab.

**Notifications:** category filters renamed — "Bids" → **Offers**, "RAV Wishes" → **Wishes**.

**Tests:** 1046/1046 passing after vocabulary updates across Header.test.tsx, BidFormDialog.test.tsx, PostRequestCTA.test.tsx, FairValueCard.test.tsx, Messages.test.tsx, WelcomePage.test.tsx, ConversationInbox.test.tsx, conversations.test.ts, useConversations.test.ts, useNotificationPreferences.test.ts, conversations-integration.test.ts.

**Canonical reference:** See `docs/brand-assets/BRAND-LOCK.md` Section 9 (Terminology Context Map) for the complete word-by-word mapping of nav labels, CTAs, notification categories, and internal-vs-external naming.

**Follow-up:** Phase B (deferred) — scrub remaining brand docs (BRAND-STYLE-GUIDE, MARKETING-PLAYBOOK, PITCH-DECK-SCRIPT, BRAND-CONCEPTS, LAUNCH-READINESS, COMPLETE-USER-JOURNEY-MAP) in a separate doc-only PR once user's in-progress local edits to those files are resolved.

---

### DEC-030: Tier Feature Audit — Build Before Go-Live
**Date:** April 4, 2026
**Decision:** All advertised tier features must be built before go-live. Tracked as issues #278-#285. Option B chosen: keep aspirational descriptions in Stripe products, build features on priority basis.
**Status:** Active

**Context:** Audit revealed 5 advertised tier features not yet built (early access, exclusive deals, priority placement, concierge, dedicated account manager). Price drop alerts partially built. Listing limits not enforced.

**Approach:**
- Issues #278-#285 track each unbuilt feature
- Aspirational descriptions remain in Stripe product metadata and MembershipTierCard
- Features built on priority basis before go-live
- Listing limits now enforced (DEC-029)

---

### DEC-029: Listing Limit Enforcement Strategy
**Date:** April 4, 2026
**Decision:** 3-layer enforcement — (1) Frontend: useCheckListingLimit hook blocks UI before creation, (2) usePublishDraft: RPC check before insert, (3) Database: BEFORE INSERT trigger as safety net. Upsell dialog shows upgrade options when at limit.
**Status:** Active

**Context:** Owner tiers have max_active_listings (Free:3, Pro:10, Business:unlimited) but no enforcement existed.

**Approach:**
- `useCheckListingLimit` hook checks current count vs tier limit before allowing new listing creation
- `ListingLimitUpsell` dialog shows current usage and upgrade CTAs when at limit
- `usePublishDraft` performs server-side check via `check_listing_limit` RPC before publishing
- Migration 049: `enforce_listing_limit` BEFORE INSERT trigger on `listings` table as database-level safety net
- All three layers must pass — defense in depth

---

### DEC-028: Stripe Subscription Product Structure
**Date:** April 4, 2026
**Decision:** 4 separate Stripe Products (RAV Traveler Plus $5/mo, RAV Traveler Premium $15/mo, RAV Owner Pro $10/mo, RAV Owner Business $25/mo). Flat rate pricing, monthly only (annual deferred). Stripe Checkout for payments, Stripe Customer Portal for billing management.
**Status:** Active

**Context:** Needed to map membership tiers to Stripe billing products.

**Approach:**
- Price IDs stored in `membership_tiers.stripe_price_id`, looked up via `get_tier_by_stripe_price()` RPC
- `create-subscription-checkout` edge function creates Stripe Checkout Session with price ID
- `stripe-webhook` handles 5 subscription events (created, updated, deleted, invoice.paid, invoice.payment_failed)
- Stripe Customer Portal handles plan changes, cancellations, and payment method updates
- Migration 048 sets sandbox price IDs; production price IDs set during go-live

---

### DEC-027: SEO & Digital Marketing Roadmap
**Date:** March 20, 2026
**Decision:** Systematic approach to technical SEO completion and multi-platform digital marketing presence, with assignable stories per platform
**Status:** Planned

**Context:** SEO foundation built in Session 17 (~80% complete). Social media presence is zero. Both are critical for discoverability before and after launch.

**Technical SEO (#229):** Fix per-page canonical URLs, dynamic OG images, BreadcrumbList JSON-LD, dynamic sitemap for listings. Developer task — 1 session.

**Digital Marketing (platform stories under #213):**
- #230 — Facebook Business Page (P0, pre-launch)
- #231 — Instagram Business Account (P0, pre-launch)
- #232 — LinkedIn Company Page (P1, pre-launch)
- #233 — X/Twitter (P2, post-launch)
- #234 — Google Business Profile (P0, pre-launch)
- #107 — Blog / content marketing (post-launch, depends on DEC-004 CMS decision)

**Reasoning:** (1) Each platform story is self-contained and assignable to an individual founder. (2) Google Business Profile is highest ROI for brand searches — 30 minutes to set up. (3) Facebook + Instagram are P0 because timeshare owner demographic (45-65) is heavily concentrated there. (4) Technical SEO should be done before marketing drives traffic to ensure pages are indexed correctly.

---

### DEC-026: Sentry Observability Roadmap
**Date:** March 20, 2026
**Decision:** Expand Sentry from frontend-only error capture to full-stack observability with alerting and GitHub integration
**Status:** Planned

**Context:** Sentry is deployed with frontend error capture, 5% tracing, and error-only session replay (Session 29). However, no alerting is configured (errors only visible by manually checking dashboard), edge functions have no error tracking, and GitHub integration is not connected.

**Approach (3 issues):**
- **#226 — Alerts:** Configure new-issue, spike, and regression alerts. Route to email (and Slack once #225 is set up). Tune thresholds to avoid noise.
- **#227 — Edge Functions:** Add Sentry to critical edge functions (`stripe-webhook`, `process-cancellation`, `notification-dispatcher`, `api-gateway`) via shared helper in `supabase/functions/_shared/sentry.ts`. Evaluate `@sentry/deno` compatibility.
- **#228 — GitHub Integration:** Connect `rent-a-vacation/rav-website` repo. Enables suspect commits, release-to-commit linking, and code owner auto-assignment.

**Reasoning:** (1) Alerting is table-stakes for production — can't rely on manually checking dashboards. (2) Edge functions handle payments, refunds, and notifications — failures there are invisible today. (3) GitHub integration closes the loop between "error occurred" and "which commit caused it." All three are post-launch but should be done before scaling.

---

### DEC-025: RAV Tools Hub & Brand Naming
**Date:** March 10, 2026
**Decision:** Create `/tools` hub page for all free tools; rename "Fee Freedom Calculator" to "RAV SmartEarn" (merged with Rental Yield Estimator)
**Status:** Approved

**Context:** Brand names were surfaced across the UI (Phase 1). A central hub page groups all free tools for SEO and discoverability.

**Approach:**
- `/tools` route renders `RavTools.tsx` — card grid with 5 built tools
- "Fee Freedom Calculator" renamed to "RAV SmartEarn" in Header, Footer, and brand docs; Rental Yield Estimator merged into RAV SmartEarn
- "Vacation Cost Comparator" renamed to "RAV SmartCompare"
- "Resort Finder Quiz" renamed to "RAV SmartMatch"
- "Trip Budget Planner" renamed to "RAV SmartBudget"
- JSON-LD `ItemList` schema on `/tools`, `HowTo` on `/calculator`, `Organization` on `/`
- `usePageMeta()` added to 7 pages missing it (Index, Rentals, PropertyDetail, BiddingMarketplace, Checkout, ExecutiveDashboard, OwnerDashboard)

---

### DEC-011: Mobile App Strategy
**Date:** February 15, 2026
**Decision:** PWA first (Phase 11), then Capacitor native shells (Phase 12)
**Status:** Approved

**Approach:** Two-phase — PWA (1-2 days) validates mobile demand, then Capacitor (2-3 weeks) for Google Play + Apple App Store from one codebase.

**Reasoning:** Existing React + Vite + Tailwind is Capacitor-ready. All hooks, components, Supabase integration carry over. React Native rewrite not justified at current scale.

**Requirements:** Apple Developer Account ($99/yr), Google Play Console ($25 one-time), Mac for iOS builds

---

## SUCCESS METRICS

**Voice Search:** 34% adoption, 87% success rate, NPS +68, +23% conversion vs manual

**Listing Flow:** 8 min completion (was 22 min, -64%), 94% completion rate (+27%), 4.7 star satisfaction (+0.9)

**Platform:** 117 resorts, 351 unit types, 10+ countries, 99.97% uptime

---

## QUICK REFERENCE

### Core Documentation
- **This File:** `docs/PROJECT-HUB.md` — START HERE
- **Architecture:** `docs/ARCHITECTURE.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **Setup:** `docs/SETUP.md`

### Testing Documentation
- **Test Strategy:** `docs/testing/TEST-STRATEGY.md`
- **Seed Data Guide:** `docs/testing/SEED-DATA-GUIDE.md`
- **Setup Checklist:** `docs/testing/TEST-SETUP-CHECKLIST.md`
- **Claude Code Prompts:** `docs/testing/CLAUDE-CODE-PROMPTS.md`

### Feature Documentation
- **Text Chat Agent:** `docs/features/text-chat/`
- **Executive Dashboard:** `docs/features/executive-dashboard/`
- **Voice Search:** `docs/features/voice-search/`
- **Voice Auth & Approval:** `docs/features/voice-auth-approval/`
- **Resort Master Data:** `docs/features/resort-master-data/`
- **Testing Infrastructure:** `docs/features/testing-infrastructure/`
- **Fair Value Score (Phase 15):** `docs/features/fair-value-score/`
- **Maintenance Fee Calculator (Phase 16):** `docs/features/maintenance-fee-calculator/`
- **Owner Dashboard (Phase 17):** `docs/features/owner-dashboard/`
- **Travel Request Enhancements (Phase 18):** `docs/features/travel-request-enhancements/`

### Brand & Marketing
- **Marketing Playbook:** `docs/brand-assets/MARKETING-PLAYBOOK.md`
- **Pitch Deck Script:** `docs/brand-assets/PITCH-DECK-SCRIPT.md`
- **Brand Concepts:** `docs/brand-assets/BRAND-CONCEPTS.md`
- **Brand Style Guide:** `docs/brand-assets/BRAND-STYLE-GUIDE.md`

### User Guides
- **User Journey Map:** `docs/guides/user-journey-map.md`
- **Voice Search Help:** `docs/guides/help/voice-search.md`
- **New Chat Template:** `docs/guides/NEW-CHAT-TEMPLATE.md`

### Infrastructure
- **Production:** https://rent-a-vacation.com
- **Vercel:** https://rentavacation.vercel.app
- **GitHub:** https://github.com/rent-a-vacation/rav-website
- **Supabase PROD:** xzfllqndrlmhclqfybew
- **Supabase DEV:** oukbxqnlxnkainnligfz

---

## HOW TO USE THIS HUB

### For Humans (Starting a Session)
1. **Check GitHub Issues** — `gh issue list --repo rent-a-vacation/rav-website --state open`
2. **Check the project board** — https://github.com/orgs/rent-a-vacation/projects/1
3. **Read this file** — for architectural context and decisions
4. **Use "NEW CHAT TEMPLATE"** (`docs/guides/NEW-CHAT-TEMPLATE.md`) for fresh Claude chats

### For Humans (Ending a Session)
1. **Close completed issues** — `gh issue close <number> --comment "Completed: [summary]"`
2. **Create issues for discoveries** — bugs, ideas, follow-up work
3. **Add decisions to KEY DECISIONS LOG** — if architectural/product choices were made
4. **Commit and push** — `git commit -m "docs: Update PROJECT-HUB after [task]"`

### For AI Agents (See CLAUDE.md § Project Management)

---

## CRITICAL REMINDERS

**Before Every Work Session:**
- Check [GitHub Issues](https://github.com/rent-a-vacation/rav-website/issues) (what's open?)
- Read this file for architectural context and decisions
- Confirm with user which issue to work on

**After Every Work Session:**
- Close completed issues on GitHub with summary comments
- Create new issues for anything discovered
- Update this file only if architectural decisions were made
- Commit and push

---

**Last updated:** March 5, 2026 (Session 37: Dynamic Pricing & Referral Program — #99, #105)
**Maintained by:** Sujit
**Tracking:** [GitHub Issues](https://github.com/rent-a-vacation/rav-website/issues) · [RAV Roadmap](https://github.com/orgs/rent-a-vacation/projects/1) · [Milestones](https://github.com/rent-a-vacation/rav-website/milestones)
