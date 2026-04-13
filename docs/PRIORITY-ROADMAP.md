---
last_updated: "2026-04-13T19:59:15"
change_ref: "3750de6"
change_type: "session-48"
status: "active"
---
# PRIORITY ROADMAP — Rent-A-Vacation

> **Purpose:** Single source of truth for what to work on next. Updated every session that includes a prioritization discussion.
> **Rule:** Start every working session by reading this file + `gh issue list --state open`. This file captures the WHY and ORDER; GitHub Issues captures the WHAT and STATUS.
> **Excluded permanently:** #127 (LLC/EIN), #63 (Accounting — blocked on #127), #65 (Tax Filing — blocked on #127), #80 (Legal — needs LLC)

---

## Current Priority Tiers (as of April 13, 2026 — Session 49)

### Tier A: Build Next (High Impact, Code-Ready)

These are the highest-value items we can build RIGHT NOW. No blockers, no decisions needed.

| Order | Issue | Title | Why it's here |
|-------|-------|-------|---------------|
| **A1** | #283 | Price drop alert notifications | Completes saved search → alert loop (infra already built). |
| **A2** | #286 | Owner Tax Information form (W-9) | Needed before real payouts. |
| **A3** | #259 | Testimonials collection + display | Social proof for launch credibility. |

### Tier B: Pre-Launch Important (Needs Human Input)

These require decisions, walkthroughs, or external dependencies before coding.

| Issue | Title | Blocker / Decision Needed |
|-------|-------|--------------------------|
| #187 | Pre-launch manual verification | Needs systematic walkthrough. Partially done. |
| #257 | Resort data compliance audit | Legal review of seed data sources. |
| #322 | RAV Wishes proposal enforcement | Deferred until 30+ days of real proposal data. Post-beta. |
| #338 | Admin Event Management UI | Move events from static code to DB-driven admin. Depends on staff workflow. |
| #339 | Multi-year event support | Recurring templates + 2027+ dates. Depends on #338. |

### Tier C: Tier Feature Differentiation (Bundle as Sprint)

These define what paid tiers actually GET. Can be built as a focused sprint.

| Issue | Title |
|-------|-------|
| #278 | Early access to new listings (Traveler Plus) |
| #279 | Exclusive deals for Premium travelers |
| #280 | Priority listing placement for Owner Pro |
| #281 | Concierge support for Premium travelers |
| #282 | Dedicated account manager for Owner Business |

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
| Apr 13, 2026 | 49 | #285 Fee transparency, #327 Event Search, #328 Attraction Filter, #337 Contrast pass completed. Logos updated. Discovery bar redesigned. 1016 tests. PRs #334-#345. |
| Apr 13, 2026 | 48 | #326 RAV Deals completed + closed. #273 Homepage completed (Session 47). Header nav consistency fix. Renumbered Tier A. |
| Apr 12, 2026 | 47 | Initial creation. Brand rebrand completed. Search & Discovery epic created (#325-#328). Full 5-tier prioritization. |

---

## How to Use This File

1. **At session start:** Read this file. Check `gh issue list --state open` for any new issues since last session.
2. **Pick work:** Start from Tier A, top to bottom. Skip if blocked or needs decision.
3. **After completing items:** Move them out of the tier, update the revision history.
4. **After any priority discussion:** Update the tiers, add a revision history entry with date + session + what changed.
5. **Cross-reference:** `docs/PROJECT-HUB.md` for architectural decisions, `docs/COMPLETED-PHASES.md` for technical history.
