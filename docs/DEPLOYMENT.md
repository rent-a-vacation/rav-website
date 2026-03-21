---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Rent-A-Vacation Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT FLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   feature/*  ──PR──>  dev  ──PR──>  main  ──auto-deploy──> Vercel PROD │
│                        │              │                        │        │
│                        │              │                        ▼        │
│                        ▼              │                 Supabase PROD   │
│                  Vercel Preview       │              (xzfllqndrlmhclqfybew)│
│                        │              │                                 │
│                        ▼              │                                 │
│                  Supabase DEV ◄───────┘                                │
│                  (oukbxqnlxnkainnligfz)                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Environment Mapping

| Environment | Frontend Host | Database | Usage |
|-------------|---------------|----------|-------|
| **Development** | Vercel Preview (from `dev` branch) | Supabase DEV (`oukbxqnlxnkainnligfz`) | Active development & testing |
| **Preview** | Vercel Preview (PR/branch deploys) | Supabase DEV | PR reviews, feature testing |
| **Production** | `rent-a-vacation.com` (`rentavacation.vercel.app`) | Supabase PROD (`xzfllqndrlmhclqfybew`) | Live users |

---

## Repository

**GitHub:** https://github.com/rent-a-vacation/rav-website.git

### Branch Strategy: `dev` → `main`

```
feature/* (optional)
    ↓ PR
  dev   →  Vercel Preview Deploy  →  Supabase DEV
    ↓ PR (release)
  main  →  Vercel Production      →  Supabase PROD
```

**Rules:**
- **`dev`** is the working branch. All new code goes here first.
- **`main`** is the production branch. Protected — requires PR + CI passing.
- **Never push directly to `main`**. Always create a PR from `dev` (or a feature branch).
- Feature branches are optional for small changes but recommended for larger work.

---

## Deployment Workflows

### 1. Development (dev branch → Vercel Preview)

All code pushed to `dev`:
1. Vercel creates a preview deployment automatically
2. Preview connects to **Supabase DEV** project
3. Test against DEV data before promoting to production

### 2. Production (main branch → Vercel Production)

When a PR from `dev` is merged to `main`:
1. Vercel automatically deploys to production
2. Live at: `https://rent-a-vacation.com` (alias: `https://rentavacation.vercel.app`)
3. Uses **Supabase PROD** environment variables

### 3. Edge Function Deployment (27 functions)

Edge Functions must be deployed **manually via Supabase CLI** from your local machine.

```bash
# Clone repository (if not done)
git clone https://github.com/rent-a-vacation/rav-website.git
cd rav-website

# Install Supabase CLI (if not installed)
npm install -g supabase

# Deploy to DEV
supabase link --project-ref oukbxqnlxnkainnligfz
supabase functions deploy api-gateway
supabase functions deploy create-booking-checkout
supabase functions deploy create-connect-account
supabase functions deploy create-stripe-payout
supabase functions deploy delete-user-account
supabase functions deploy export-user-data
supabase functions deploy fetch-airdna-data
supabase functions deploy fetch-industry-news
supabase functions deploy fetch-macro-indicators
supabase functions deploy fetch-str-data
supabase functions deploy idle-listing-alerts
supabase functions deploy match-travel-requests
supabase functions deploy process-cancellation
supabase functions deploy process-deadline-reminders
supabase functions deploy process-dispute-refund
supabase functions deploy process-escrow-release
supabase functions deploy seed-manager
supabase functions deploy send-approval-email
supabase functions deploy send-booking-confirmation-reminder
supabase functions deploy send-cancellation-email
supabase functions deploy send-contact-form
supabase functions deploy send-email
supabase functions deploy send-verification-notification
supabase functions deploy stripe-webhook
supabase functions deploy text-chat
supabase functions deploy verify-booking-payment
supabase functions deploy voice-search

# Deploy to PROD (switch project)
supabase link --project-ref xzfllqndrlmhclqfybew
# Run the same deploy commands as above for PROD
```

> **Note:** `seed-manager` is DEV-only and should NOT be deployed to PROD.

---

## Environment Variables

### Vercel Configuration

**Production Environment:**
```env
VITE_SUPABASE_URL=https://xzfllqndrlmhclqfybew.supabase.co
VITE_SUPABASE_ANON_KEY=<prod_anon_key>
```

**Preview Environment:**
```env
VITE_SUPABASE_URL=https://oukbxqnlxnkainnligfz.supabase.co
VITE_SUPABASE_ANON_KEY=<dev_anon_key>
```

### Supabase Edge Function Secrets

Set these in **both DEV and PROD** Supabase projects:

```bash
# Via CLI
supabase secrets set RESEND_API_KEY=re_your_key --project-ref <PROJECT_REF>
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx --project-ref <PROJECT_REF>
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx --project-ref <PROJECT_REF>
supabase secrets set OPENROUTER_API_KEY=sk-or-xxx --project-ref <PROJECT_REF>
supabase secrets set NEWSAPI_KEY=xxx --project-ref <PROJECT_REF>
supabase secrets set IS_DEV_ENVIRONMENT=true --project-ref <PROJECT_REF>

# Or via Supabase Dashboard:
# Project Settings → Edge Functions → Secrets
```

**Required Secrets (Supabase Edge Functions):**
| Secret | Description |
|--------|-------------|
| `RESEND_API_KEY` | Email delivery via Resend (`updates.rent-a-vacation.com` domain) |
| `STRIPE_SECRET_KEY` | Stripe payment processing |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature verification (`whsec_...`) |
| `NEWSAPI_KEY` | Industry news feed for Executive Dashboard |
| `OPENROUTER_API_KEY` | OpenRouter API for RAVIO text chat agent |
| `IS_DEV_ENVIRONMENT` | Set to `true` for DEV, `false` (or omit) for PROD — guards seed data and dev-only features |

**Required Secrets (GitHub Repository):**
| Secret | Description |
|--------|-------------|
| `RESEND_GITHUB_NOTIFICATIONS_KEY` | Resend API key for GitHub Actions issue notification emails |
| `PERCY_TOKEN` | Percy visual regression testing (currently disabled for private repo) |
| `QASE_API_TOKEN` | Qase test management integration |
| `SUPABASE_URL` | Supabase URL for CI tests |
| `SUPABASE_ANON_KEY` | Supabase anon key for CI tests |

### GitHub Actions

**Issue Notifications** (`.github/workflows/issue-notifications.yml`):
- Triggers on: issue assigned, issue closed, new issue comment
- Sends email via Resend API to RAV team (sujit, ajumon, celin, sandhya @rent-a-vacation.com)
- FROM: `RAV Updates <notifications@updates.rent-a-vacation.com>`
- Uses separate Resend API key (`RESEND_GITHUB_NOTIFICATIONS_KEY`) from edge functions
- **Currently disabled** to conserve Resend quota

---

## Database Setup

### Extensions Required

Enable these in **both DEV and PROD** via Supabase Dashboard → Database → Extensions:

1. **pg_cron** - For scheduled jobs
2. **pg_net** - For HTTP requests from database

### Schema Migrations

Migrations are located in `supabase/migrations/` (migrations 001–045). Run via Supabase CLI:

```bash
# Push all migrations to linked project
supabase db push

# Or run individual migrations via Supabase Dashboard → SQL Editor
```

---

## Monitoring & Analytics

### Sentry (Error Tracking)

- **Organization:** `rent-a-vacation-org`
- **Project:** `rav-website`
- **Source maps:** Uploading enabled (Vite plugin)
- **Browser tracing:** 5% sample rate
- **Session replay:** Error-only (captures replays when errors occur)
- **Dashboard:** https://rent-a-vacation-org.sentry.io

#### Current scope
- **Frontend only** — `@sentry/react` in `src/lib/sentry.ts`, initialized in `src/main.tsx`
- **User context** — user ID + role set on login via `setSentryUser()` in AuthContext (no PII)
- **ErrorBoundary** — React crashes captured with component stack in `src/components/ErrorBoundary.tsx`
- **Noise filtering** — browser extensions, network errors, ResizeObserver loops ignored
- **Free tier budget** — 10K transactions/month (tracing), 50 session replays/month

#### Planned enhancements
- **#226** — Configure alert rules (new issues, error spikes, regressions)
- **#227** — Instrument Supabase edge functions (server-side error tracking)
- **#228** — GitHub integration (suspect commits, release association)

### Google Analytics 4

- **Measurement ID:** `G-G2YCVHNS25`
- **Cookie consent:** GA4 is gated behind cookie consent — tracking only activates after user accepts cookies
- **Dashboard:** https://analytics.google.com (property: G-G2YCVHNS25)

---

## Automated Reminders (CRON Jobs)

### What the CRON SQL Does

The CRON SQL schedules a PostgreSQL job that runs every 30 minutes. It uses `pg_cron` to schedule and `pg_net` to make an HTTP POST request to the Edge Function.

```sql
-- Runs every 30 minutes, calls the edge function via HTTP
select cron.schedule(
  'process-deadline-reminders',   -- Job name
  '*/30 * * * *',                  -- Every 30 minutes
  $$
  select net.http_post(
    url:='https://<PROJECT_REF>.supabase.co/functions/v1/process-deadline-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer <ANON_KEY>"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### What the Edge Function Does

The `process-deadline-reminders` function:

1. **Queries pending booking confirmations** with deadlines within 12 hours
2. **Sends reminder emails to owners:**
   - Standard reminder (6-12 hours remaining)
   - Urgent reminder (< 6 hours remaining)
3. **Queries pending check-in confirmations** around check-in time
4. **Sends check-in reminders to travelers** within 2 hours of arrival
5. **Tracks which reminders were sent** to avoid duplicates

### Setup CRON Job

Run this SQL in **both DEV and PROD** Supabase SQL Editor:

**For PROD:**
```sql
select cron.schedule(
  'process-deadline-reminders',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/process-deadline-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_PROD_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

**For DEV:**
```sql
select cron.schedule(
  'process-deadline-reminders',
  '*/30 * * * *',
  $$
  select net.http_post(
    url:='https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/process-deadline-reminders',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_DEV_ANON_KEY"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);
```

### Manage CRON Jobs

```sql
-- View all scheduled jobs
select * from cron.job;

-- Unschedule a job
select cron.unschedule('process-deadline-reminders');

-- View job run history
select * from cron.job_run_details order by start_time desc limit 20;
```

---

## Stripe Configuration

Currently in **Test Mode** for both environments.

- Test cards: `4242 4242 4242 4242`
- Dashboard: https://dashboard.stripe.com/test

### Webhook Setup

Configure webhook endpoints in **both** Stripe test and live dashboards:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint:
   - **DEV:** `https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/stripe-webhook`
   - **PROD:** `https://xzfllqndrlmhclqfybew.supabase.co/functions/v1/stripe-webhook`
3. Select events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`, `account.updated`, `transfer.created`, `transfer.reversed`
4. Copy the signing secret (`whsec_...`) and set as `STRIPE_WEBHOOK_SECRET` in Supabase Edge Function secrets

**What the webhook handles:**
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Confirms booking if still pending (safety net for browser closures) |
| `checkout.session.expired` | Cancels pending booking when session expires without payment |
| `charge.refunded` | Tracks refund, cancels booking if full refund |
| `account.updated` | Syncs Connect account status (onboarding, charges/payouts enabled) |
| `transfer.created` | Marks booking payout as paid, sets status to completed |
| `transfer.reversed` | Marks booking payout as failed |

### For Production
1. Activate Stripe account
2. Switch to live keys
3. Update `STRIPE_SECRET_KEY` in Supabase Edge Function secrets
4. Create live webhook endpoint and update `STRIPE_WEBHOOK_SECRET`

---

## Testing

- **771 automated tests** across 99 test files (Vitest)
- **97 P0 critical-path tests** — `npm run test:p0`
- **E2E:** Playwright smoke tests in `e2e/smoke/`
- **Visual regression:** Percy (currently disabled for private repo)

```bash
npm run test              # Unit + integration (watch mode)
npm run test:p0           # P0 critical-path tests (~2s)
npm run test:coverage     # With coverage report
npm run test:e2e          # Playwright E2E
```

---

## Troubleshooting

### Edge Functions Not Working

1. Verify function is deployed: `supabase functions list --project-ref <REF>`
2. Check secrets are set: `supabase secrets list --project-ref <REF>`
3. View logs: `supabase functions logs process-deadline-reminders --project-ref <REF>`

### CRON Job Not Running

1. Verify extensions enabled: `select * from pg_extension where extname in ('pg_cron', 'pg_net');`
2. Check job exists: `select * from cron.job;`
3. Check job history: `select * from cron.job_run_details order by start_time desc limit 10;`

### Emails Not Sending

1. Verify `RESEND_API_KEY` is set in Edge Function secrets
2. Verify domain is validated in Resend: https://resend.com/domains
3. Check Edge Function logs for errors

---

## Quick Reference

| Task | Command/Location |
|------|------------------|
| Deploy Edge Functions | `supabase functions deploy <name> --project-ref <ref>` |
| Set Secrets | `supabase secrets set KEY=value --project-ref <ref>` |
| View Function Logs | `supabase functions logs <name> --project-ref <ref>` |
| Enable Extensions | Supabase Dashboard → Database → Extensions |
| Push Migrations | `supabase db push` |
| View CRON Jobs | `select * from cron.job;` |
| Vercel Settings | https://vercel.com/dashboard |
| Sentry Dashboard | https://rent-a-vacation-org.sentry.io |
| GA4 Dashboard | https://analytics.google.com |

---

## Contact

- **Domain:** rent-a-vacation.com
- **Phone:** 1-800-RAV-0800
- **Location:** Jacksonville, FL
