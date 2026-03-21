---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Launch Readiness Checklist

> Pre-flight checklist for disabling Staff Only Mode and opening the platform to real users.
>
> **Current Status:** Staff Only Mode is **ENABLED** on PROD. Only RAV team members can access the platform.

---

## Quick Access

Admin Dashboard > **Launch** tab — runs automated checks and provides Go Live / Rollback buttons.

---

## Platform Completeness (Sessions 33-39)

The following major features were completed in Sessions 33-39 and are deployed:

| Area | What was built | Session |
|------|---------------|---------|
| UX Polish | Cancellation policy display, booking timeline, pricing suggestions, compare properties | 33 |
| Dashboard Consolidation | Owner dashboard 11 tabs -> 4, Renter dashboard (`/my-trips`) | 33-34 |
| Realtime | `useRealtimeSubscription` replaced all polling (notifications, messages, unread counts) | 34 |
| Owner Profiles | Public owner profile cards with `get_owner_profile_summary` RPC | 34 |
| Destinations | 10 destinations / 35 cities discovery pages | 34 |
| Pre-Booking Messaging | Listing inquiries + inquiry messages ("Ask the Owner") | 34 |
| Saved Searches | Saved search alerts with price drop tracking | 34 |
| Idle Week Alerts | Cron-based alerts for owners with unsold inventory (60d/30d) | 34 |
| OpenAPI Validation | 26 endpoints, all validated with Redocly (0 errors) | 35 |
| P0 Test Library | 97 critical-path tests across 14 files, `npm run test:p0` | 35 |
| iCal Export | RFC 5545 calendar export for owner bookings | 35 |
| Admin Tools | Property/listing editing, resort CSV import, dispute evidence upload | 36 |
| Dynamic Pricing | Urgency/seasonal/demand-based price suggestions | 37 |
| Referral Program | Referral codes, tracking, signup capture | 37 |
| Public API | API key infrastructure (migrations 044-045), `api-gateway` edge function, `/developers` Swagger UI, IP allowlisting with CIDR support | 38 |
| RAV Smart Suite | 5 tools on `/tools` hub (SmartEarn, SmartPrice, SmartCompare, SmartMatch, SmartBudget) | 38-39 |

### By the Numbers

| Metric | Count |
|--------|-------|
| Automated tests | 771 (99 test files) |
| P0 critical-path tests | 97 |
| SQL migrations | 45 (001-043 deployed to DEV + PROD; 044-045 pending deploy) |
| Edge functions | 27 |
| Type errors | 0 |
| Lint errors | 0 |
| Build status | Clean |

---

## Pre-Launch Checklist

### Infrastructure
| # | Check | Type | How to Verify | Status |
|---|-------|------|---------------|--------|
| 1 | Supabase connectivity | Auto | Launch tab runs a test query | Ready |
| 2 | Supabase points to PROD | Auto | `VITE_SUPABASE_URL` contains `xzfllqndrlmhclqfybew` | Ready |
| 3 | DNS & SSL valid | Manual | Visit https://rent-a-vacation.com — no certificate errors | Ready |
| 4 | Email sender verified (Resend) | Manual | Resend dashboard: `updates.rent-a-vacation.com` domain verified, `RESEND_API_KEY` set in Supabase secrets | Ready |
| 5 | API key infrastructure | Auto | Migrations 044-045 deployed, `api-gateway` edge function active | Pending deploy |

### Payments
| # | Check | Type | How to Verify |
|---|-------|------|---------------|
| 6 | Stripe live mode | Manual | Supabase Dashboard > Edge Functions > Secrets: `STRIPE_SECRET_KEY` starts with `sk_live_` |
| 7 | Stripe webhook configured | Manual | Stripe Dashboard > Developers > Webhooks: endpoint points to PROD Supabase `stripe-webhook` function |

### Security
| # | Check | Type | How to Verify |
|---|-------|------|---------------|
| 8 | No seed data on PROD | Auto | Launch tab checks for `dev-*@rent-a-vacation.com` accounts |
| 9 | RLS policies reviewed | Manual | Supabase Dashboard > Authentication > Policies: all public tables have RLS enabled |
| 10 | Staff Only Mode status | Auto | Launch tab reads `platform_staff_only` setting |

### Content & Legal
| # | Check | Type | How to Verify |
|---|-------|------|---------------|
| 11 | Terms of Service | Manual | Visit /terms — content reviewed by legal (#80) |
| 12 | Privacy Policy | Manual | Visit /privacy — content reviewed by legal (#80) |

### Monitoring
| # | Check | Type | How to Verify |
|---|-------|------|---------------|
| 13 | Sentry DSN configured | Auto | `VITE_SENTRY_DSN` environment variable is set |
| 14 | GA4 tracking | Auto | Hardcoded `G-G2YCVHNS25` in `src/lib/analytics.ts` |

---

## Go-Live Procedure

### Prerequisites
1. All automated checks pass (no red failures in Launch tab)
2. All manual checks verified by a human
3. Test a complete booking flow on the Vercel preview deploy
4. Confirm with team that you're ready

### Steps
1. Open Admin Dashboard > **Launch** tab
2. Verify all checks are green or blue (manual)
3. Click **Go Live** button
4. Confirm in the dialog
5. Platform is now open — `platform_staff_only` is set to `false`
6. Verify by:
   - Opening an incognito window
   - Signing up as a new user
   - Browsing listings
   - Checking that Stripe checkout loads (don't complete a real payment yet)

### What Happens
- The `platform_staff_only` setting in `system_settings` is set to `{ "enabled": false }`
- Login and Signup pages stop showing "Coming Soon" messages to non-staff users
- All approved users can access the full platform
- Existing data, bookings, and settings are unaffected

---

## Rollback Procedure

If issues are discovered after going live:

1. Open Admin Dashboard > **Launch** tab
2. Click **Emergency Rollback** button
3. Confirm in the dialog
4. Platform is locked again — only RAV team members can access

### What Rollback Does
- Sets `platform_staff_only` back to `{ "enabled": true }`
- Non-staff users see "Coming Soon" on their next page navigation
- In-progress sessions are not forcibly terminated, but new navigations are blocked
- No data is lost — bookings, payments, and user accounts remain intact

### When to Rollback
- Critical payment processing failure
- Security vulnerability discovered
- Stripe webhook not receiving events
- Database connectivity issues
- Any issue that would prevent users from completing bookings safely

---

## Blocked Items

The following checks cannot pass until external blockers are resolved:

| Check | Blocker | Issue |
|-------|---------|-------|
| Stripe live mode | LLC/EIN required for Stripe activation | #127 |
| Legal pages reviewed | Need legal counsel review | #80 |
| Accounting integration | Blocked on LLC/EIN | #127, #63 |

---

## Post-Launch Monitoring

After going live, monitor:

1. **Sentry** — error rate spike within first hour
2. **Stripe Dashboard** — webhook delivery success rate
3. **Supabase Dashboard** — database connections, edge function invocations
4. **GA4** — real user traffic appearing
5. **Resend** — email delivery rates for booking confirmations
