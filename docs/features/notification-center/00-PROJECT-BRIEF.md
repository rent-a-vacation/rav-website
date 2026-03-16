---
last_updated: "2026-03-16T16:04:25"
change_ref: "32ec398"
change_type: "session-40"
status: "active"
---

# Notification Center — Project Brief

## Overview

The Notification Center is a first-class platform capability that unifies in-app, email, and SMS notification channels. It replaces the flat `notification_preferences` table with a catalog-driven system and adds seasonal event SMS reminders to drive owner engagement.

## Architecture

### Data Model

| Table | Purpose |
|-------|---------|
| `notification_catalog` | Admin registry of all notification types, channel defaults |
| `user_notification_preferences` | Per-user per-type per-channel preferences (sparse — only explicit changes) |
| `seasonal_events` | Event templates (the "what" — annual fixed or floating) |
| `event_instances` | Year-specific instances with auto-computed reminder dates |
| `notification_delivery_log` | Unified delivery tracking across all channels |
| `sms_suppression_log` | Audit trail for suppressed SMS sends |

### Enums
- `recurrence_type`: annual_fixed, annual_floating, one_time
- `event_category`: major_holidays, school_breaks, sports_events, local_events, weather_peak_season
- `destination_bucket`: orlando, miami, las_vegas, maui_hawaii, myrtle_beach, colorado, new_york, nashville

### Edge Functions
- `notification-dispatcher` — Central routing engine (in-app + email + SMS)
- `sms-scheduler` — Daily cron trigger for seasonal reminders
- `twilio-webhook` — Delivery status updates + STOP opt-out

### Frontend
- `NotificationBell` — Enhanced with navigation + "View all" link
- `/notifications` — Full notification feed with filters and date grouping
- `/settings/notifications` — Owner preferences with TCPA-compliant SMS opt-in
- Admin "Notifications" tab — Overview, Types, Event Calendar, Delivery Log

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `TWILIO_ACCOUNT_SID` | Supabase secrets | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Supabase secrets | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | Supabase secrets | Sender phone number (E.164) |
| `SMS_TEST_MODE` | Supabase secrets | 'true' in DEV — logs but doesn't call Twilio |
| `RESEND_API_KEY` | Supabase secrets | Already exists — reused |

## Key Decisions

- **Catalog-driven preferences**: One source of truth for notification types. Users only store explicit overrides.
- **SMS is opt-in only**: `default_sms = false` on all catalog entries. TCPA compliance requires explicit consent.
- **SMS_TEST_MODE**: Zero code changes needed to go live — single env var flip after A2P 10DLC registration.
- **Generated reminder dates**: `reminder_12wk`, `reminder_6wk`, `reminder_2wk` are computed columns (84/42/14 days before event_date).

## GitHub Issues
- #215 Core Schema Migration
- #216 Seed 2026 Event Data
- #217 Notification Dispatcher
- #218 SMS Scheduler
- #219 Twilio Webhook
- #220 Bell Icon + Feed
- #221 Notifications Page
- #222 Owner Preferences
- #223 Admin Notification Center
- #224 Future: One-Time Events
