---
last_updated: "2026-03-16T16:04:25"
change_ref: "32ec398"
change_type: "session-40"
status: "active"
---

# Notification Center — Session 1 Handoff

## What Was Built

### Issue 1+2: Database Schema + Seed Data (#215, #216)
- **Migration 046**: 6 new tables, 3 enums, RLS policies, indexes, triggers, 3 RPCs
- **18 notification_catalog entries**: 15 existing types + 3 seasonal SMS
- **48 seasonal events**: 30 unique events across 8 destinations, all 2026 instances seeded
- Auto-computed reminder dates (84/42/14 days before event_date)

### Issue 3: Notification Dispatcher (#217)
- Multi-channel routing: in-app + email (Resend) + SMS (Twilio)
- 5 SMS guard checks: consent, phone validation, duplicate, already-listed, frequency cap
- SMS_TEST_MODE: full payload logging without Twilio API calls
- Default SMS templates for 12wk/6wk/2wk reminders

### Issue 4: SMS Scheduler (#218)
- Daily cron orchestrator (10:00 AM UTC)
- Queries event_instances for today's reminder matches
- Admin override: manual send for any instance with force_send

### Issue 5: Twilio Webhook (#219)
- Delivery status updates → notification_delivery_log
- STOP opt-out handling → sms_opted_in=false + preference rows disabled
- Twilio signature validation
- Valid TwiML response

### Issue 6: Bell Icon Enhancement (#220)
- Added navigation on click (routes to relevant entity based on type)
- "View all notifications" links to /notifications
- New useNotifications hook with getNotificationLink() utility

### Issue 7: Notifications Page (#221)
- /notifications route for all authenticated users
- Category filter (All/Bookings/Bids/Travel Requests/Reminders/System)
- Status filter (All/Unread/Read)
- Date grouping (Today/Yesterday/This Week/Older)
- Pagination (20 per page)

### Issue 8: Owner Preferences (#222)
- /settings/notifications for property_owner role
- Contact info section with E.164 phone normalization
- TCPA-compliant SMS opt-in (verbatim consent text + explicit confirm button)
- Per-type per-channel toggles (mandatory/channel_only/fully_optional)
- Lean save logic: only stores overrides, deletes defaults

### Issue 9: Admin Notification Center (#223)
- 4 tabs: Overview, Types, Event Calendar, Delivery Log
- Stat cards: opted-in count, messages sent, delivery rate, pending confirmations
- Inline catalog management (toggle active, SMS allowed)
- Event calendar with filters, date confirmation, manual send, cancel
- Delivery log with pagination, filters, CSV export

### Issue 10: Future One-Time Events (#224)
- GitHub issue created (no code)

## Testing
- **806 tests passing** (101 test files), 0 type errors, 0 lint errors
- **35 new tests added**: `useNotifications.test.ts` (14 tests), `notificationUtils.test.ts` (21 tests)
- **Build clean** (1m 23s)

## Deployment Status
- **Migration 046:** Deployed to DEV (`npx supabase db push --include-all`)
- **notification-dispatcher:** Deployed to DEV
- **sms-scheduler:** Deployed to DEV
- **twilio-webhook:** Deployed to DEV (fixed: replaced `deno.land/x/hmac` with Web Crypto API for Supabase bundler compatibility)
- **Twilio secrets:** Set in Supabase DEV (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `SMS_TEST_MODE=true`)
- **Vercel preview:** Twilio env vars also set
- **Verification:** `get_notification_center_stats` RPC confirmed working (returns 4 upcoming reminders for this week)
- **Flow manifests:** Updated — `/notifications` and `/settings/notifications` in traveler-lifecycle, `notification_center` admin tab in admin-lifecycle

## Known Issues / Limitations
1. **SMS_TEST_MODE=true** — no real SMS sent. Full payloads logged to `notification_delivery_log` with `status='test'`. Flip to `false` only after A2P 10DLC registration.
2. **pg_cron job** — the cron schedule in migration 046 needs actual SUPABASE_URL and SERVICE_ROLE_KEY substituted before applying
3. **Twilio webhook URL** — needs to be configured in Twilio console (set to `https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/twilio-webhook`)
4. **notification_type enum** — new notification types from catalog (seasonal_sms_*) are TEXT-based in the catalog, not added to the enum. The existing `notifications` table still uses the enum for its `type` column. In-app notifications for seasonal reminders would need the enum extended or the type column changed to TEXT.

## What Must Be Done Before Going Live (Real SMS)
1. Form LLC → get EIN (blocked on #127)
2. ~~Create Twilio account, purchase phone number~~ **DONE** (regular account created, secrets configured)
3. Register A2P 10DLC brand ($4, requires EIN) + campaign ($15)
4. Wait 1-2 weeks for carrier approval
5. Deploy migration 046 + edge functions to PROD
6. Set Twilio secrets in Supabase PROD
7. Set `SMS_TEST_MODE=false` in production
8. Substitute actual URL/key in pg_cron migration and apply to PROD

## Future Enhancements
- Add SMS opt-in checkbox to ListProperty page (owner onboarding flow)
- Component tests for NotificationPreferences and AdminNotificationCenter
- E2E tests for the full notification preferences flow
- Issue #224: One-time events support (low priority)
