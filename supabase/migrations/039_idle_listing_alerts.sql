-- Migration 039: Idle Listing Alert Tracking
-- Tracks when idle week alerts were sent to prevent duplicate emails

ALTER TABLE listings ADD COLUMN IF NOT EXISTS idle_alert_60d_sent_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS idle_alert_30d_sent_at TIMESTAMPTZ;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS idle_alert_opt_out BOOLEAN DEFAULT false;
