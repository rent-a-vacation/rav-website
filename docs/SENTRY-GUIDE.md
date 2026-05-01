---
last_updated: "2026-05-01T01:14:55"
change_ref: "a1d0ffa"
change_type: "session-53"
status: "active"
---
# Sentry.io Guide for Rent-A-Vacation

> A practical reference for using Sentry effectively on the free (Developer) tier.

## Quick Links

| Resource | URL |
|----------|-----|
| **Sentry Dashboard** | https://rent-a-vacation-org.sentry.io |
| **Project** | `rav-website` |
| **Organization** | `rent-a-vacation-org` |
| **GitHub Integration** | Installed — `rent-a-vacation/rav-website` connected |

---

## 0. Current Status & Action Plan (last reviewed 2026-04-30, Session 62)

> Living checklist. When we revisit Sentry, **start here** to know what's done vs. open.
> Strategic context: [`docs/strategy/2026-04-30-advisor-discussion-qa-sentry-mobile.md`](strategy/2026-04-30-advisor-discussion-qa-sentry-mobile.md) §2.

### Verified working ✅
- Frontend SDK initialized (`src/lib/sentry.ts`) — error capture 100%, traces 5%, replays on-error 100%
- Source maps uploading via `@sentry/vite-plugin` (production builds only) — confirmed in `vite.config.ts:103-116`
- GitHub integration **installed** at org level — `rent-a-vacation/rav-website` repo connected (Screenshot 162148)
- Stack trace linking infra in place — but mapping config is broken, see below
- 2 alert rules active: high-priority issues (email), uptime monitor on dev.rent-a-vacation.com
- Sentry MCP server connected for AI-assisted debugging (`~/.sentry/mcp.json` cached)

### Broken / suboptimal — actionable on free tier 🔧
- **[CRITICAL] Code Mappings misconfigured** (Screenshot 162350 + 162432)
  - Stack Trace Root: `../../` ← wrong
  - Source Code Root: empty ← wrong
  - **Result:** clicking a stack frame in any Sentry error does NOT jump to the correct GitHub source line. Every triage takes longer than it should.
  - **Fix:** see action plan below — takes 30 seconds.

### To do (free-tier wins, ordered by leverage) ⏳
- [x] **Fix Code Mappings** — DONE Apr 30. Stack frames now jump to GitHub source. Final values: Stack Trace Root = `../`, Source Code Root = empty (auto-derived via Sentry's "Set up Code Mapping" wizard from the GitHub URL). Verified with `BookingSuccess.tsx:157` frame opening correctly on GitHub.
- [ ] **Investigate EvalError + script-src CSP errors on `/signup`** (159 + 219 events, 16 users affected) — may indicate signup is partially broken
- [ ] **Configure Inbound Filters** (Project Settings → Inbound Filters) — block legacy IE, web crawlers, browser extensions, known noisy IPs. Cuts 30-40% of error noise typically.
- [ ] **Set up Ownership Rules** (Project Settings → Ownership Rules) — auto-assign all issues to you (only one team member right now). Free.
- [ ] **Add custom tag for `tier`** (Project Settings → Tags & Context) — so you can filter errors by Free / Plus / Pro / Premium / Business. Currently you have `role` but not `tier`.
- [ ] **Enable Auto Resolve** with a 30-day window (Project Settings → General → Auto Resolve, currently Disabled per Screenshot 162621) — keeps the issue list focused on what actually still happens.
- [ ] **Add `production` URL to uptime monitoring** once #127 lands and you go live (currently only dev site is monitored — limit is 1 monitor on free tier, so this means swapping when ready).

### Confirmed gated to paid plan — DO NOT PURSUE 🚫
Documented on the GitHub Integration overview page (Screenshot 161823):
- ❌ Auto-create GitHub issue from Sentry error → requires **Team plan ($26/mo)**
- ❌ "Track this issue in Jira/GitHub" button working → requires **Team plan**
- ❌ Two-way sync of comments / assignees / status → requires **Team plan**
- ❌ Auto-create issues from alert conditions → requires **Business plan**
- ❌ CODEOWNERS-based auto-assignment → requires **Business plan**

**Workaround for free tier:** when you find a real bug in Sentry, manually create the GitHub issue using the `gh issue create` snippet in §3 below. The QA workflow we're building (Google Form → GitHub Issue) handles the *new bug* path; this manual workflow handles the *Sentry-found bug* path.

### What Sentry catches vs. what it doesn't (set tester expectations)

> **Sentry is a crash reporter, not a QA tool.** Most QA findings are functional defects, not crashes. Don't expect tester-found issues to appear in Sentry — they won't, because no JavaScript exception was thrown.

**Sentry catches (~20% of QA findings):**
- Uncaught JavaScript exceptions / promise rejections
- React component crashes (via `ErrorBoundary.tsx`)
- CSP violations (currently 6 visible — some are real, some are noise)
- Anything that ends up in `window.onerror`

**Sentry does NOT catch (~80% of QA findings — these belong in the Google Form):**
- Functional defects: "button didn't do anything", "wrong text", "form accepted bad input"
- Layout / mobile / accessibility issues
- Server-side errors in Supabase edge functions (until #227 instruments them)
- HTTP errors caught and shown as toasts (no exception was thrown)
- Wrong navigation, missing CTAs, broken validation messages

**Implication for testers:**
- Their notes / Form submissions ARE the primary signal for functional defects.
- IF they happen to see a red error toast or browser console error, optionally paste the Sentry issue URL into the bug Form (optional field). This correlates QA report ↔ Sentry crash.
- Don't try to "find issues in Sentry" — find them in the Form-generated GitHub issues; use Sentry for the crash subset.

### Action: Fix Code Mappings (do this now)

In Sentry → Settings → Integrations → GitHub → Configure → **Code Mappings** tab → click pencil icon to edit existing mapping:

| Field | Current value (wrong) | New value (correct) |
|-------|----------------------|---------------------|
| Project | rav-website | rav-website (no change) |
| Repo | rent-a-vacation/rav-website | (no change) |
| Branch | main | main (no change) |
| **Stack Trace Root** | `../../` | `app:///` |
| **Source Code Root** | (empty) | (leave empty) |

**Note (Apr 30 finding):** the actual prefix turned out to be `../` (not `app:///` as initially assumed). The simplest path is to use Sentry's auto-derivation: in any unresolved issue's Stack Trace, click the **"Set up Code Mapping"** button next to an in-app frame, and paste the GitHub URL of the file (e.g. `https://github.com/rent-a-vacation/rav-website/blob/main/src/pages/BookingSuccess.tsx`). Sentry computes Stack Trace Root + Source Code Root from comparing the live frame path to the URL. Manual values: Stack Trace Root = `../`, Source Code Root = empty.

**Verification:** open any recent Sentry issue → in the Stack Trace section, find a frame with the green **"In App"** badge → click the **GitHub icon** next to that frame → it should open the exact line on GitHub. Frames in `node_modules/...` won't have GitHub icons (library code is not in the repo) — that's expected, not a bug.

---

## 1. What's Set Up Today

### Frontend Error Tracking (`src/lib/sentry.ts`)

| Setting | Value | Why |
|---------|-------|-----|
| Error capture rate | 100% | Captures every error. Free tier allows 5K errors/month |
| Transaction sample rate | 5% | Performance tracing. Free tier allows 10K transactions/month |
| Session replay (normal) | 0% | Don't record normal sessions to save quota |
| Session replay (on error) | 100% | Always record the session when an error occurs. Free tier: 50 replays/month |
| Environment detection | Auto | Uses Supabase URL to detect `development` vs `production` |
| Release tagging | `rav-website@0.9.0` | From package.json version, set by `@sentry/vite-plugin` |
| PII stripping | Yes | `beforeSend` removes `user.email` and `user.ip_address` |
| User context | ID + role only | Set via `setSentryUser()` in `AuthContext.tsx` |

### Source Maps

- Built as `"hidden"` (not exposed to users in browser)
- Uploaded automatically on every production build via `@sentry/vite-plugin`
- Deleted from `dist/` after upload for security
- Auth token: `SENTRY_AUTH_TOKEN` in `.env.local`

### Error Filtering (`ignoreErrors`)

These errors are silently dropped — they're browser noise, not bugs:
- Browser extension errors: `top.GLOBALS`, `originalCreateNotification`, `canvas.contentDocument`
- Network errors: `Failed to fetch`, `NetworkError`, `Load failed`
- Layout observer: `ResizeObserver loop`

### Error Boundary (`src/components/ErrorBoundary.tsx`)

- Wraps the entire app in `App.tsx`
- Catches React component crashes (lifecycle errors, render failures)
- Sends full error + React component stack to Sentry
- Shows user-friendly recovery UI with "Try Again" and "Go Home" buttons

### Existing Alert Rules

1. **"Send a notification for high priority issues"** — emails you when a high-priority issue is detected
2. **"Uptime Monitoring for dev.rent-a-vacation.com"** — pings the dev site every 1 minute

### GitHub Integration (Free Tier Features)

What's **enabled** (free):
- Commit data enrichment — Sentry links errors to the commits that touched those lines
- Stack trace linking — click a stack frame to jump to the exact line in GitHub
- Suspect commits — on new issues, Sentry identifies which recent commit likely caused it

What's **NOT available** on free tier (requires Team/Business plan):
- Creating GitHub issues directly from Sentry errors
- Synchronizing assignees between Sentry and GitHub
- Syncing comments on Sentry issues to GitHub
- CODEOWNERS-based auto-assignment
- Auto-creating GitHub issues from alert conditions

> This is why "Track this issue in Jira, GitHub, etc." in the error detail view doesn't work — that feature requires the Team plan ($26/mo). The workaround is to manually create a GitHub issue when you find a bug in Sentry.

---

## 2. Free Tier Budget

| Resource | Monthly Limit | Current Usage | Notes |
|----------|--------------|---------------|-------|
| Errors | 5,000 | ~196 (14 days) | Plenty of headroom |
| Transactions | 10,000 | Low (5% sample) | Performance traces |
| Session Replays | 50 | Active | Error-only recording |
| Alert Rules | Unlimited* | 2 configured | *Issue alerts are unlimited; metric alerts limited on free |
| Uptime Monitors | 1 | 1 active (dev site) | Add production URL when ready |
| Cron Monitors | 1 | 0 | Could monitor edge function crons |
| Spike Protection | Enabled | No spikes detected | Auto-discards during sudden spikes |

### Budget Tips
- At 196 errors per 14 days, you're on pace for ~400/month — well within 5K limit
- If error volume spikes (e.g., after launch), consider reducing `sampleRate` to 0.5 (50%)
- Transaction sample rate at 5% is conservative — you could increase to 10% and still stay within budget
- Session replays at 50/month means ~1.5/day — enough for debugging production errors

---

## 3. Daily Workflow: How to Use Sentry

### Morning Check (2 minutes)

1. Open https://rent-a-vacation-org.sentry.io/issues/
2. Filter: **"is:unresolved"** (default) and **"firstSeen:-24h"** (new in last 24 hours)
3. If there are new issues, triage them (see below)
4. Check the alert email — the "high priority issues" alert triggers automatically

### Triaging an Error

When you click into an issue, here's what to look at:

#### a) The Title & Message
- The error type (e.g., `TypeError`, `ReferenceError`) and message tell you *what* broke
- The "Events" count tells you *how often* — 1 event = one-off, 50 events = systematic

#### b) Stack Trace (most important)
- Read top-to-bottom: the topmost frame is where the error happened
- Click any frame to see the source code (GitHub integration links directly)
- Gray frames are library code (React, Supabase SDK) — focus on your code (colored frames)

#### c) Breadcrumbs (left sidebar)
- Shows what the user did *before* the error: page navigations, clicks, API calls
- Helps you reproduce: "They clicked X, navigated to Y, then it crashed"

#### d) Tags
- `environment`: development or production
- `release`: which version (rav-website@0.9.0)
- `user.id`: which user hit the error (look up in Supabase)
- `url`: which page they were on

#### e) Session Replay (if available)
- Click "Replay" to watch a video of what the user saw
- Shows mouse movements, clicks, page transitions, and the moment of the crash
- Only available on error sessions (100% capture rate)

#### f) Suspect Commits
- Sentry shows which recent commits touched the code that crashed
- Click the commit SHA to go directly to the diff in GitHub

### Resolving an Issue

- **Resolve**: Click "Resolve" when you've fixed the bug and deployed. If the error recurs, Sentry will reopen it as a regression.
- **Ignore**: Click "Ignore" for errors you've investigated and determined are not bugs (e.g., user-caused, third-party).
- **Mark as Reviewed**: Acknowledges you've seen it without resolving.

### Creating a GitHub Issue from a Sentry Error (Manual Workaround)

Since the automatic "Track in GitHub" feature requires a paid plan, use this manual workflow:

1. In the Sentry error detail, copy:
   - Error title and message
   - The URL/page where it occurred
   - The stack trace (top 3-4 frames)
   - The Sentry issue URL
2. Create a GitHub issue:
   ```bash
   gh issue create --repo rent-a-vacation/rav-website \
     --title "Bug: [error message]" \
     --label "bug,platform" \
     --body "**Sentry Issue:** [paste Sentry URL]
   
   **Error:** [message]
   **Page:** [URL]
   **Stack:** [top frames]
   **Frequency:** [X events in Y days]"
   ```
3. In Sentry, add a comment on the issue linking to the GitHub issue number

---

## 4. Alert Configuration

### Current Alerts

| Alert | Type | Trigger | Action |
|-------|------|---------|--------|
| High priority issues | Issue Alert | New issue with high priority | Email notification |
| Uptime monitoring | Uptime | dev.rent-a-vacation.com down | Email notification |

### Recommended Alert Strategy (Free Tier)

The most valuable single alert on the free tier is **"When a new issue is created"** — this catches:
- New bugs introduced by recent deploys
- Regressions (previously resolved issues that recur)
- Errors in new features

To create this (if not already covered by the existing "high priority" alert):

1. Go to **Alerts → Create Alert → Issue Alert**
2. Environment: `production` (avoid dev noise)
3. Conditions: "A new issue is created"
4. Filters: "The issue's level is `error` or `fatal`" (skip warnings)
5. Action: "Send a notification to Me"
6. Name: "New production error"

### Notification Settings

Your current settings (from Settings → Account → Notifications):
- **Issue Alerts:** On (email delivery)
- **Issue Workflow:** Default (changes in assignment, resolution)
- **Deploys:** Default (release notifications)
- **Weekly Reports:** Default (weekly summary email)

All of these are free and useful. Keep them on.

---

## 5. Understanding the Releases View

The Releases page (Explore → Releases) shows:

| Metric | What It Means |
|--------|--------------|
| **Adoption** | % of sessions on this release (100% = everyone is on the latest deploy) |
| **Crash Free Rate** | % of sessions without an error. 88% means 12% of sessions hit a bug |
| **Crashes** | Total error events in this release |
| **New Issues** | Error types that appeared for the first time in this release |

**88% crash-free rate** is below the typical target of 95%+. This means roughly 1 in 8 user sessions encounters an error. Worth investigating the top issues to improve this.

---

## 6. Performance Monitoring (Explore → Frontend)

The performance dashboard shows:
- **Transaction Throughput**: page loads per minute
- **Transaction Duration**: how long pages take to load (p50, p75, p95)
- **Performance Score**: Lighthouse-style score (currently 87 — good)
- **Web Vitals**: LCP, FID, CLS metrics

At 5% sample rate, this gives you directional data, not exact numbers. Good enough for pre-launch.

---

## 7. Edge Function Monitoring (Future — #227)

Currently, Supabase edge functions have NO Sentry tracking. Errors in:
- `stripe-webhook` (payment processing)
- `process-cancellation` (refunds)
- `notification-dispatcher` (email/SMS delivery)
- `api-gateway` (public API)

...are only visible in Supabase function logs, which are ephemeral and have no alerting.

When #227 is implemented, these critical functions will report errors to Sentry with:
- Function name and environment tags
- Request context (method, path, user ID)
- Error stack traces

---

## 8. MCP Integration (AI-Assisted Debugging)

Sentry provides an MCP (Model Context Protocol) server that allows AI tools like Claude Code to query Sentry issues directly during development sessions.

**MCP Server URL:** `https://mcp.sentry.dev/mcp/rent-a-vacation-org`  
**Transport:** Streamable HTTP with OAuth authentication  
**Scope:** User-level (works across all projects/sessions)

### Setup (one-time)

The MCP server was added with:
```bash
claude mcp add --transport http --scope user sentry https://mcp.sentry.dev/mcp/rent-a-vacation-org
```

On first use in a new session, your browser opens for Sentry OAuth login. The token is cached at `~/.sentry/mcp.json` — you won't need to authenticate again.

### What It Enables

Once authenticated, Claude Code can directly query Sentry:
- "What are the top unresolved errors in production?"
- "Show me the stack trace for issue XXXX"
- "What errors were introduced in the last release?"
- Paste a Sentry issue URL and ask Claude to investigate

### Reusing in Other Projects

Since the MCP server is configured at `--scope user` (global), it works in every Claude Code session regardless of which project directory you're in. To scope it to a different Sentry project:

```bash
# For a different org/project
claude mcp add --transport http --scope user sentry-other https://mcp.sentry.dev/mcp/other-org/other-project
```

Or use the unscoped URL for access to all orgs:
```bash
claude mcp add --transport http --scope user sentry https://mcp.sentry.dev/mcp
```

---

## 9. Files Reference

| File | Purpose |
|------|---------|
| `src/lib/sentry.ts` | Sentry initialization, config, user context |
| `src/components/ErrorBoundary.tsx` | React error boundary with Sentry capture |
| `src/contexts/AuthContext.tsx` | Sets Sentry user context on login/logout |
| `src/components/admin/DevTools.tsx` | Test buttons to verify Sentry is working |
| `vite.config.ts` | Source map upload plugin config |
| `.env.local` | `VITE_SENTRY_DSN` and `SENTRY_AUTH_TOKEN` |

---

## 10. Troubleshooting

### "I'm not getting alert emails"
1. Check Settings → Account → Notifications → Issue Alerts is "On"
2. Check Settings → Account → Email Addresses — verify your email
3. Check the Alert Rule → ensure your team/user is in the notification target

### "Errors aren't showing up in Sentry"
1. Check `VITE_SENTRY_DSN` is set in `.env.local`
2. Open browser DevTools → Network → filter for `sentry.io` — you should see POST requests
3. Use the DevTools test buttons (Admin Dashboard → Dev Tools) to send a test error

### "Source maps aren't working (stack traces show minified code)"
1. Check `SENTRY_AUTH_TOKEN` is set in `.env.local`
2. Run a production build: `npm run build` — look for "Successfully uploaded source maps to Sentry" in output
3. In Sentry, check the release → Artifacts tab to confirm source maps are uploaded

### "Session replay shows blank"
1. Replays only record on error sessions (`replaysOnErrorSampleRate: 1.0`)
2. Normal browsing sessions are NOT recorded (`replaysSessionSampleRate: 0`)
3. Check Settings → Account → Stats & Usage → Replays to see quota usage

### "I want to track an error in GitHub but the button doesn't work"
The "Track this issue in Jira, GitHub, etc." feature requires the Sentry Team plan ($26/mo). Use the manual workflow described in Section 3 instead.
