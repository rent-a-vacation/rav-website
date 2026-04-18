---
last_updated: "2026-04-18T03:44:08"
change_ref: "4f7b3b4"
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
