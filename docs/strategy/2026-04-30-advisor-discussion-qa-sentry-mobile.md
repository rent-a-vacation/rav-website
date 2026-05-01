---
last_updated: "2026-05-01T01:14:55"
change_ref: "a1d0ffa"
change_type: "session-62-strategic-discussion"
status: "active"
---

# Strategic Discussion — Apr 30, 2026

> **Purpose:** Reference doc capturing an advisor-style conversation on four cross-cutting topics. Treat as a living reference — when we revisit any of these topics, update the relevant section and bump the date.
>
> **Linked from:** [PROJECT-HUB.md](../PROJECT-HUB.md) Session Handoff (Session 62).

---

## Topics

1. [Remaining work — sequencing the path to launch](#1-remaining-work)
2. [Sentry on the free tier — maximizing signal](#2-sentry)
3. [Testing workflow — replacing the QA spreadsheet pain](#3-testing-workflow)
4. [Mobile app — Capacitor wrap timing](#4-mobile-app)
5. [Proposed sequence](#5-proposed-sequence)

---

## 1. Remaining work

### Live snapshot (as of Apr 30, 2026)
- **23 open pre-launch issues**
- **#127 Business formation** is still the rate-limiter for: Stripe Tax activation, Puzzle.io setup, bank account, A2P 10DLC (which gates SMS), Twilio production phone, full PaySafe rollout
- Apr 27 incorporation handoff (term sheet → DocuSign → Atlas filing) is the only thing that unsticks ~6 downstream issues
- **#438** (incorporation docs review) is the gating sub-task

### Critical-path groups
| Group | Issues | Blocking? |
|-------|--------|-----------|
| Business formation | #127, #438 | Yes — rate-limiter |
| PaySafe gaps (escrow + dispute) | #461 (A), #462 (B), #463 (E), #464 (G), #465 (H), #466 (I) | Yes — pre-launch |
| Legal / data | #80 (ToS+Privacy), #257 (resort data audit) | Yes — pre-launch |
| Manual verification | #187 | Yes — final pre-flight |
| Marketing setup | #230-234 | No — tedious, batch |
| Pitch deck | #256 | No — but ties to VC asks |

### User status (Apr 30)
- Major incorporation decisions made; user filling term sheet → DocuSign → Atlas filing imminent
- Expectation: **#127 unblocks "quickly"** — within the week
- Once #127 lands, downstream chain (Stripe Tax → Puzzle.io → bank → SMS) opens up

### Defer to post-launch
- Mobile epic #240-248 (except a thin VC-demo subset — see Topic 4)
- API write/OAuth (#188-191), volume discount (#165), tier value enhancements (#368)

---

## 2. Sentry

### Goal
Maximize free-tier value (5K errors/mo + 50 replays + 1 user + 30-day retention). The bottleneck is **signal-to-noise** and **time-to-reproduce**, not volume.

### What's already configured (memory + SENTRY-GUIDE.md)
- Source maps uploading
- Browser tracing at 5%
- Session replay on errors only
- GitHub integration installed at org level (but **not functioning** for issue creation — see Open Question)

### Tactics ranked by leverage
1. **Inbound filters** (Settings → Inbound Filters) — block localhost, browser extensions, legacy IE, web crawlers. Cuts 30-40% of noise.
2. **`beforeSend` filtering** — drop `ResizeObserver loop limit exceeded`, network timeouts you can't act on, Stripe.js init noise.
3. **User + role context** on every event: `Sentry.setUser({ id, role, tier })` after auth. Turns "anonymous stack" into "Pro-tier owner on /listings/edit."
4. **Release tracking** on every Vercel deploy → Sentry shows "first seen in v0.9.3" + suspect commits.
5. **GitHub integration** — link Sentry → GH repo for one-click issue creation. *(See Open Question below — not currently working.)*
6. **Raise replay sampling for errors** to 100% if under quota — every error gets a video, eliminating most repro round-trips.

### Defer
- Edge function instrumentation (#227 — post-launch)
- Performance traces beyond 5%

### Open question (Apr 30)
**The "Track this issue in Jira/GitHub" link in Sentry takes user to Settings/Integrations page where GitHub is installed, but nothing further happens.** Diagnostic plan in next-actions section below.

---

## 3. Testing workflow

### The pain
- Testers add notes in Google Sheet rows ("RAV QA Scenario Test.xlsx" in Drive)
- Notes are unstructured prose → hard to map to requirements/fixes
- No link between Sentry errors and tester reports
- Reproducing each report = manual click-through in the app
- Daily friction high enough to be a workflow problem

### Constraints
- **Testers will NOT use GitHub directly** (too complex for non-devs — confirmed by user)
- **Apps Script inside the spreadsheet feels too complicated** (logic embedded in test data)
- Mastra/AI agent = overkill (nondeterministic, costs tokens, harder to debug)

### Decision: Hybrid Google Form → GitHub Issue
The test-coverage spreadsheet stays as-is for scenario tracking (Pass / Fail / Blocked per row). Bug intake moves to a **Google Form** that auto-creates GitHub issues via Apps Script.

**Tester experience (3 steps):**
1. Run scenario; mark result in spreadsheet (Pass / Fail / Blocked).
2. If Fail or Blocked: click "Report bug" link in their row → opens Google Form with scenario # pre-filled.
3. Fill structured fields (browser, role, repro steps, screenshot, optional Sentry event URL) → submit. Confirmation with issue # appears within seconds.

Testers never see GitHub. They stay entirely in Google.

**Behind the scenes:**
- Google Forms `onSubmit` trigger → Apps Script (server-side, invisible to tester)
- Apps Script calls GitHub REST API → creates issue with labels (`qa-bug`, `scenario-S-XX`, role tag)
- Issue # written back to the form's response sheet AND to the scenario row
- All bug context is now structured + linkable to Sentry

### One-time developer work (~2-3 hours)
- [ ] Create Google Form with 10 structured fields:
  - Scenario # (pre-filled via URL param)
  - Tester name (pre-filled)
  - Role tested (Owner / Renter / Admin / Public)
  - Browser + device
  - What did you do? (steps to reproduce)
  - What did you expect?
  - What actually happened?
  - Screenshot upload
  - Sentry event URL (optional — copy-paste from Sentry alert email)
  - Severity (Blocker / High / Medium / Low)
- [ ] Write Apps Script `onFormSubmit` handler (~50 lines):
  - Read form response
  - POST to GitHub REST API `/repos/rent-a-vacation/rav-website/issues`
  - Labels: `qa-bug`, `scenario-{N}`, `role-{role}`, severity
  - Body: structured markdown including all fields
  - Write returned issue # back to form response row
- [ ] Generate GitHub fine-grained PAT (`issues: write` on rav-website) — store in Apps Script `PropertiesService` (not in code)
- [ ] Add "Report bug for this scenario" link column in scenario spreadsheet (formula generates pre-filled Form URL per row)
- [ ] One-page tester instructions (Google Doc) with screenshots — live in same Drive folder
- [ ] Test end-to-end with a fake scenario before rolling out

### Open question
- **Sentry event URL field**: testers may not know how to grab this. Two paths:
  - (a) Train them: "If you see a red toast, click it → copy URL"
  - (b) Auto-correlate: Apps Script searches Sentry API for matching events near the report timestamp + user role
  - **Recommendation:** start with (a), revisit (b) if it's painful

### Multi-tester collision in spreadsheet (new finding — Apr 30)

**Problem:** Today, 4 testers all enter notes in the same single "notes" cell per row. No attribution (who wrote what), no timestamps, cells bloat with mixed-author prose. Untriageable.

**Solution: column-per-tester status grid + Form-only for bug reports**

Restructured spreadsheet schema:

| Scenario # | Step # | Action | Expected | Tester A | Tester B | Tester C | Tester D | Report bug |
|---|---|---|---|---|---|---|---|---|
| S-12 | 7 | Click Confirm | Booking confirmed | Pass | **Fail** | Pass | Pending | [Link] |

**Rules:**
- Each tester writes ONLY in their own status column (Pass / Fail / Blocked / Pending)
- **No prose in the spreadsheet.** Failure context goes in the Form.
- Form pre-fills tester name from the column they clicked Report bug from
- Form captures timestamp automatically (submission time)
- All authored discussion lives in the GitHub issue, not the cell

**Form fields when triggered from a specific tester column:**
- Tester name (auto — which column triggered the link)
- Submission timestamp (auto)
- Scenario # + step # + action + expected (auto, from row context)
- "What did you actually see?" (the only thing tester types)
- Browser, role, severity, screenshot (manual)

**Net result:**
- Cell collision eliminated
- Attribution always present
- Timestamps always present
- Spreadsheet stays scannable as a coverage grid
- Bug detail lives in GitHub where it belongs

### Why testers' issues don't show in Sentry — Apr 30 finding

User reported: "2 testers ran 30 scenarios yesterday but no issues showed up in Sentry."

**Diagnosis:** category mismatch, not a config bug. Sentry only catches crashes (uncaught exceptions, promise rejections, React errors, CSP violations). Most QA findings are *functional defects* — wrong text, broken layout, button does nothing, accepted bad input — none of which throw exceptions. They simply don't go to Sentry.

**Implication:**
- Sentry handles the ~20% crash subset
- The QA Google Form → GH Issue handles the ~80% functional subset
- Don't expect tester findings to appear in Sentry; that's not Sentry's job
- Optional: Form has a "Sentry event URL" field testers paste IF they happen to see a red toast / console error, to correlate when applicable

Documented in [`SENTRY-GUIDE.md` §0](../SENTRY-GUIDE.md) "What Sentry catches vs. what it doesn't".

### Triage — visible Sentry issues as of Apr 30

| Issue | Severity | Action |
|-------|----------|--------|
| RangeError "Invalid time value" on `/booking-success` (4 events, 1 user) | Real bug | Fix — likely bad `new Date(string)` |
| EvalError 'unsafe-eval' blocked on `/signup` (159 events, 0 users) | Investigate | Signup uses `eval` or third-party script that does — verify signup actually works |
| script-src 'eval' blocked (219 events, **16 users**) | Investigate | Same root cause — 16 real users affected, not noise |
| img-src googletagmanager.com blocked (20 events) | Fix CSP | Allowlist for GA |
| connect-src ingest.sentry.io blocked (1 event) | Fix CSP | Sentry's own beacons blocked — ironic |
| connect-src c.daily.co blocked (1 event) | Investigate | Why is RAV reaching daily.co? Extension? Code? |

---

## 4. Mobile app

### Decision (locked)
- **Capacitor over React Native** (DEC-011)
- Reuses existing React code
- Mobile epic #240 already defined with 8 sub-stories (#241-248), ~53-74 hrs estimated
- User aligned with full-quality build approach

### Two distinct goals being conflated
| Goal | Scope | Time | Why now |
|------|-------|------|---------|
| **VC demo** | Capacitor shell (#241) + UX polish (#242 safe areas, basic deep links). TestFlight + internal Play track. **No store launch.** | 1-2 weeks | Investor leverage, mobile-on-iPhone demo |
| **Real launch** | All 8 stories + Apple dev account + Google Play + push infra + offline + store review (~1 week each) | 53-74 hrs code + 2-3 weeks process | Should ride PaySafe so launch tells a feature story (biometric escrow + push for dispute updates) |

### Recommended approach (user-aligned)
- Build **Phase 12a (VC demo subset)** first — ship to TestFlight in ~2 weeks
- Defer full launch until after PaySafe ships → mobile + escrow + biometric is a much stronger pitch than web-only
- Capacitor shell unlocks future biometric auth + push notifications when PaySafe needs them

---

## 5. Proposed sequence

| Order | Owner | Item | Status |
|-------|-------|------|--------|
| 1 | User | Push #438 incorporation docs → Atlas filing | In progress (Apr 27 handoff) |
| 2 | Claude | QA workflow (Google Form → GH Issue) — see §3 setup checklist | Approved Apr 30, ready to scaffold |
| 3 | Claude | Sentry diagnostic walkthrough (see §2 open question) | Approved Apr 30, ready to walk through |
| 4 | Claude | Sentry tactical pass: inbound filters, `beforeSend`, user context, release tracking | After #3 diagnostic resolves |
| 5 | Claude | Phase 12a (Capacitor shell + UX polish for VC demo) | After #2 + #3 |
| 6 | Claude | PaySafe Gaps A + B + E (lowest-risk wiring) | Parallel to #5 |
| 7 | User | #127 lands → unblocks downstream | Pending Atlas |
| 8 | Claude | PaySafe Gaps G + H + I + Stripe Tax activation + Puzzle.io | After #7 |
| 9 | Claude | Full mobile epic + edge fn Sentry + marketing setup | Post-launch |

---

## Decisions made (Apr 30)
- **DEC-DRAFT-01:** QA bug intake will use Google Form → Apps Script → GitHub Issue. Spreadsheet stays for scenario tracking only.
- **DEC-DRAFT-02:** Mobile gets a "Phase 12a" demo-only subset for VC pitches; full launch deferred until after PaySafe.
- **DEC-DRAFT-03:** Sentry GitHub integration to be debugged before adding more Sentry tactical work.

> If any of these solidify after implementation, promote to formal `DEC-XXX` entries in PROJECT-HUB Key Decisions Log.

---

## Next-session pickup
When this doc is referenced again, start by:
1. Re-checking which sequence items have shipped vs. open
2. Updating §1 with current open-issue counts
3. Promoting DEC-DRAFT entries to formal DECs if implemented
4. Adding new topics under a "Followup discussions" section (don't overwrite this conversation — append)

---

## Conversation provenance
- Session 62 (Apr 30, 2026)
- User in advisor-mode — wanted opinion + plan, not implementation
- Source: live conversation transcript with Claude (Opus 4.7, 1M context)
