---
last_updated: "2026-05-15T00:00:00"
change_ref: "manual-edit"
change_type: "session-68-notification-center-readme"
status: "active"
---

# Notification Center — Feature README

> Multi-channel notification system (in-app + email + SMS) with admin-configurable catalog, per-user preferences, TCPA-compliant SMS opt-in, and seasonal-event-driven SMS reminders.

**Status:** ✅ Built and shipped (issues #215–#223; #224 deferred). Migration `046_notification_center.sql` deployed to DEV.

**Planning brief:** [`00-PROJECT-BRIEF.md`](00-PROJECT-BRIEF.md) (original 6-table spec) and [`01-SESSION1-HANDOFF.md`](01-SESSION1-HANDOFF.md) (build-out summary).

---

## What this is

Three layers:

1. **In-app notifications** — bell icon in header with unread badge + popover (10 most recent), full feed at `/notifications` with filters and date grouping.
2. **Email** — via Resend (existing transactional email infrastructure).
3. **SMS** — via Twilio with TCPA-compliant double opt-in, STOP keyword handling, and per-user frequency caps. Currently in `SMS_TEST_MODE=true` until A2P 10DLC registration completes.

Plus an **admin panel** for catalog management, event calendar, and delivery-log monitoring.

---

## User-facing entry points

| Surface | Component | Route |
|---|---|---|
| Bell icon (header) | `src/components/bidding/NotificationBell.tsx` | global |
| Full feed | `src/pages/Notifications.tsx` | `/notifications` |
| User preferences | `src/pages/settings/NotificationPreferences.tsx` | `/settings/notifications` |
| Admin panel | `src/components/admin/AdminNotificationCenter.tsx` (4 tabs) | `/admin?tab=notifications` |

## Backend

| Layer | Path | Purpose |
|---|---|---|
| Edge fn | `supabase/functions/notification-dispatcher/` | Multi-channel router; 5 SMS guard checks (consent, validation, dedup, already-listed, frequency cap) |
| Edge fn | `supabase/functions/sms-scheduler/` | Daily cron (10 AM UTC) — matches `event_instances` for today's reminder windows + admin `force_send` override |
| Edge fn | `supabase/functions/twilio-webhook/` | Inbound webhook — delivery status → `notification_delivery_log`; STOP opt-out handling; Twilio signature validation |
| Edge fn | `supabase/functions/send-verification-notification/` | Generic email trigger (used by AdminVerifications) |
| Hook | `src/hooks/useNotifications.ts` | Wraps queries + Realtime subscription (issue #220) |
| Hook | `src/hooks/useNotificationPreferences.ts` | Fetches prefs + auto-creates default row |
| Hook | `useUpdateNotificationPreference()` | Optimistic update + rollback |

## Database schema (`046_notification_center.sql`)

| Table | Purpose |
|---|---|
| `notification_catalog` | Admin registry of 18 notification types (4 mandatory + 10 channel-only + 1 fully optional + 3 seasonal SMS) |
| `user_notification_preferences` | Sparse per-user overrides (user_id, type_key, channel, enabled) |
| `seasonal_events` | Event templates (name, category, recurrence, SMS templates for 12wk / 6wk / 2wk) |
| `event_instances` | Year-specific instances with auto-computed reminder dates (`reminder_12wk = event_date - 84 days` etc.) |
| `notification_delivery_log` | Unified delivery tracking (channel, status, user_id, etc.) |
| `sms_suppression_log` | Audit trail for suppressed SMS + STOP opt-outs |
| `profiles` (additions) | `phone_e164`, `phone_verified`, `sms_opted_in`, `sms_opted_in_at`, `sms_opted_out_at` |

The flat `notification_preferences` table from earlier work was **dropped** in 046 in favor of catalog + sparse-overrides model.

## Notification types (18 in catalog)

- **Mandatory** (can't disable): `booking_confirmed`, `payment_received`, `bid_accepted`, `proposal_accepted`
- **Channel-only** (can change channel, can't disable): `new_bid_received`, `bid_rejected`, `new_proposal_received`, `proposal_rejected`, `bid_expired`, `bidding_ending_soon`, `request_expiring_soon`, `travel_request_expiring_soon`, `travel_request_matched`, `new_travel_request_match`
- **Fully optional**: `message_received`
- **Seasonal SMS** (opt-in only): `seasonal_sms_12wk`, `seasonal_sms_6wk`, `seasonal_sms_2wk`

Categories: transactional (15) vs. marketing (3 seasonal SMS). Channels: `in_app`, `email`, `sms`.

## Tests

- `src/hooks/useNotifications.test.ts` (14 tests)
- `src/hooks/useNotificationPreferences.test.ts`
- `src/components/admin/AdminListings.test.tsx` (has "email notifications" describe block)

## Known limitations / follow-ups

1. **`SMS_TEST_MODE=true`** in DEV — payload logged but no real SMS sent. Flip to `false` after A2P 10DLC registration completes.
2. **`pg_cron` job** in migration needs `SUPABASE_URL` + `SERVICE_ROLE_KEY` substitution before deployment to PROD.
3. **Twilio webhook URL** must be manually configured in Twilio console (one-time).
4. **`notification_type` enum vs. catalog** — seasonal SMS types are TEXT in catalog but not in the in-app `notification_type` enum. If we ever want in-app reminders for seasonal events, the enum needs extension OR the type column needs to become TEXT.
5. **Issue #224** (deferred) — full notification analytics dashboard. Not blocking launch.

## Related docs

- [`../../testing/QA-PLAYBOOK.md`](../../testing/QA-PLAYBOOK.md) — QA scenarios for notifications
- [`../../RAV-PRICING-TAXES-ACCOUNTING.md`](../../RAV-PRICING-TAXES-ACCOUNTING.md) — payment notifications mention
- TCPA-compliance copy lives in `src/pages/settings/NotificationPreferences.tsx` (search "By providing your phone number")
