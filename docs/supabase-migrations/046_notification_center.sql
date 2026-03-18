-- ============================================================
-- Migration 046: Notification Center — Core Schema
-- GitHub Issue: #215
-- ============================================================
-- Builds the unified notification center: catalog-driven preferences,
-- seasonal event calendar, SMS infrastructure, and delivery logging.
-- Keeps existing `notifications` table and `notification_type` enum intact.
-- ============================================================

-- ============================================================
-- 1. DROP OLD notification_preferences TABLE
-- ============================================================
-- The old table used flat boolean columns (email_new_bid, email_bid_accepted, etc.)
-- which is not scalable. Replaced by catalog + per-user-per-type-per-channel model.
-- Pre-launch: minimal data, safe to drop.

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notification_preferences') THEN
    -- Log any opted-out preferences before dropping
    RAISE NOTICE 'Dropping notification_preferences — row count: %',
      (SELECT count(*) FROM public.notification_preferences);
    DROP TABLE public.notification_preferences CASCADE;
  END IF;
END $$;

-- ============================================================
-- 2. NOTIFICATION CATALOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_catalog (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_key               TEXT UNIQUE NOT NULL,
  display_name           TEXT NOT NULL,
  description            TEXT NOT NULL,
  category               TEXT NOT NULL CHECK (category IN ('transactional', 'marketing', 'system')),
  opt_out_level          TEXT NOT NULL CHECK (opt_out_level IN ('mandatory', 'channel_only', 'fully_optional')),
  default_in_app         BOOL NOT NULL DEFAULT true,
  default_email          BOOL NOT NULL DEFAULT true,
  default_sms            BOOL NOT NULL DEFAULT false,
  channel_in_app_allowed BOOL NOT NULL DEFAULT true,
  channel_email_allowed  BOOL NOT NULL DEFAULT true,
  channel_sms_allowed    BOOL NOT NULL DEFAULT false,
  active                 BOOL NOT NULL DEFAULT true,
  sort_order             INT NOT NULL DEFAULT 0,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. USER NOTIFICATION PREFERENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type_key   TEXT NOT NULL,
  channel    TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms')),
  enabled    BOOL NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type_key, channel)
);

-- ============================================================
-- 4. SMS COLUMNS ON PROFILES
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_e164        TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified    BOOL NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_opted_in      BOOL NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_opted_in_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sms_opted_out_at  TIMESTAMPTZ;

-- ============================================================
-- 5. ENUMS FOR SEASONAL EVENTS
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recurrence_type') THEN
    CREATE TYPE public.recurrence_type AS ENUM (
      'annual_fixed',
      'annual_floating',
      'one_time'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_category') THEN
    CREATE TYPE public.event_category AS ENUM (
      'major_holidays',
      'school_breaks',
      'sports_events',
      'local_events',
      'weather_peak_season'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'destination_bucket') THEN
    CREATE TYPE public.destination_bucket AS ENUM (
      'orlando',
      'miami',
      'las_vegas',
      'maui_hawaii',
      'myrtle_beach',
      'colorado',
      'new_york',
      'nashville'
    );
  END IF;
END $$;

-- ============================================================
-- 6. SEASONAL EVENTS (template — the "what")
-- ============================================================

CREATE TABLE IF NOT EXISTS public.seasonal_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  category          public.event_category NOT NULL,
  recurrence_type   public.recurrence_type NOT NULL,
  typical_month     INT CHECK (typical_month BETWEEN 1 AND 12),
  typical_week      INT CHECK (typical_week BETWEEN 1 AND 5),
  is_location_fixed BOOL NOT NULL DEFAULT true,
  sms_template_12wk TEXT,
  sms_template_6wk  TEXT,
  sms_template_2wk  TEXT,
  active            BOOL NOT NULL DEFAULT true,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. EVENT INSTANCES (the "when and where" for a specific year)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_instances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES public.seasonal_events(id) ON DELETE CASCADE,
  destination    public.destination_bucket NOT NULL,
  year           INT NOT NULL,
  event_date     DATE NOT NULL,
  reminder_12wk  DATE GENERATED ALWAYS AS (event_date - 84) STORED,
  reminder_6wk   DATE GENERATED ALWAYS AS (event_date - 42) STORED,
  reminder_2wk   DATE GENERATED ALWAYS AS (event_date - 14) STORED,
  priority       TEXT NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('urgent', 'high', 'medium', 'plan')),
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active', 'cancelled', 'past')),
  auto_generated BOOL NOT NULL DEFAULT false,
  date_confirmed BOOL NOT NULL DEFAULT false,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, destination, year)
);

-- ============================================================
-- 8. NOTIFICATION DELIVERY LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notification_delivery_log (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_id     UUID REFERENCES public.notifications(id) ON DELETE SET NULL,
  type_key            TEXT NOT NULL,
  channel             TEXT NOT NULL CHECK (channel IN ('in_app', 'email', 'sms')),
  instance_id         UUID REFERENCES public.event_instances(id) ON DELETE SET NULL,
  reminder_type       TEXT CHECK (reminder_type IN ('12_week', '6_week', '2_week')),
  phone_e164          TEXT,
  twilio_message_sid  TEXT,
  resend_message_id   TEXT,
  recipient_email     TEXT,
  subject_or_title    TEXT,
  message_body        TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending',
  test_mode           BOOL NOT NULL DEFAULT false,
  error_message       TEXT,
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 9. SMS SUPPRESSION LOG
-- ============================================================

CREATE TABLE IF NOT EXISTS public.sms_suppression_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  instance_id        UUID REFERENCES public.event_instances(id) ON DELETE SET NULL,
  suppression_reason TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. ENABLE RLS
-- ============================================================

ALTER TABLE public.notification_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_suppression_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_instances ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. RLS POLICIES
-- ============================================================

-- ----- NOTIFICATION CATALOG -----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone authenticated can read catalog' AND tablename = 'notification_catalog') THEN
    CREATE POLICY "Anyone authenticated can read catalog"
      ON public.notification_catalog FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff and admin can manage catalog' AND tablename = 'notification_catalog') THEN
    CREATE POLICY "Staff and admin can manage catalog"
      ON public.notification_catalog FOR ALL
      TO authenticated
      USING (public.is_rav_team(auth.uid()))
      WITH CHECK (public.is_rav_team(auth.uid()));
  END IF;
END $$;

-- ----- USER NOTIFICATION PREFERENCES -----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own notification prefs' AND tablename = 'user_notification_preferences') THEN
    CREATE POLICY "Users can read own notification prefs"
      ON public.user_notification_preferences FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR public.is_rav_team(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own notification prefs' AND tablename = 'user_notification_preferences') THEN
    CREATE POLICY "Users can manage own notification prefs"
      ON public.user_notification_preferences FOR ALL
      TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ----- NOTIFICATION DELIVERY LOG -----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own delivery log' AND tablename = 'notification_delivery_log') THEN
    CREATE POLICY "Users can read own delivery log"
      ON public.notification_delivery_log FOR SELECT
      TO authenticated
      USING (user_id = auth.uid() OR public.is_rav_team(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can write delivery log' AND tablename = 'notification_delivery_log') THEN
    CREATE POLICY "Service role can write delivery log"
      ON public.notification_delivery_log FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can update delivery log' AND tablename = 'notification_delivery_log') THEN
    CREATE POLICY "Service role can update delivery log"
      ON public.notification_delivery_log FOR UPDATE
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- ----- SMS SUPPRESSION LOG -----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff can read suppression log' AND tablename = 'sms_suppression_log') THEN
    CREATE POLICY "Staff can read suppression log"
      ON public.sms_suppression_log FOR SELECT
      TO authenticated
      USING (public.is_rav_team(auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role can write suppression log' AND tablename = 'sms_suppression_log') THEN
    CREATE POLICY "Service role can write suppression log"
      ON public.sms_suppression_log FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- ----- SEASONAL EVENTS -----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone authenticated can read seasonal events' AND tablename = 'seasonal_events') THEN
    CREATE POLICY "Anyone authenticated can read seasonal events"
      ON public.seasonal_events FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff and admin can manage seasonal events' AND tablename = 'seasonal_events') THEN
    CREATE POLICY "Staff and admin can manage seasonal events"
      ON public.seasonal_events FOR ALL
      TO authenticated
      USING (public.is_rav_team(auth.uid()))
      WITH CHECK (public.is_rav_team(auth.uid()));
  END IF;
END $$;

-- ----- EVENT INSTANCES -----
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone authenticated can read event instances' AND tablename = 'event_instances') THEN
    CREATE POLICY "Anyone authenticated can read event instances"
      ON public.event_instances FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Staff and admin can manage event instances' AND tablename = 'event_instances') THEN
    CREATE POLICY "Staff and admin can manage event instances"
      ON public.event_instances FOR ALL
      TO authenticated
      USING (public.is_rav_team(auth.uid()))
      WITH CHECK (public.is_rav_team(auth.uid()));
  END IF;
END $$;

-- ============================================================
-- 12. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_user_notif_prefs_user
  ON public.user_notification_preferences(user_id);

CREATE INDEX IF NOT EXISTS idx_delivery_log_user
  ON public.notification_delivery_log(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delivery_log_channel_status
  ON public.notification_delivery_log(channel, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_instances_reminders
  ON public.event_instances(reminder_12wk, reminder_6wk, reminder_2wk)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_event_instances_dest_year
  ON public.event_instances(destination, year, status);

CREATE INDEX IF NOT EXISTS idx_profiles_sms_opted_in
  ON public.profiles(sms_opted_in)
  WHERE sms_opted_in = true;

-- ============================================================
-- 13. TRIGGERS
-- ============================================================

CREATE TRIGGER update_notification_catalog_updated_at
  BEFORE UPDATE ON public.notification_catalog
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seasonal_events_updated_at
  BEFORE UPDATE ON public.seasonal_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_instances_updated_at
  BEFORE UPDATE ON public.event_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 14. SEED NOTIFICATION CATALOG
-- ============================================================
-- All 15 existing notification_type enum values + 3 seasonal SMS types.
-- Uses ON CONFLICT to be idempotent.

INSERT INTO public.notification_catalog (type_key, display_name, description, category, opt_out_level, default_in_app, default_email, default_sms, channel_in_app_allowed, channel_email_allowed, channel_sms_allowed, sort_order) VALUES
  -- MANDATORY (transactional — cannot be turned off)
  ('booking_confirmed',   'Booking Confirmed',     'Confirmation when a booking is finalized',                'transactional', 'mandatory',      true, true, false, true, true, false, 10),
  ('payment_received',    'Payment Received',      'Receipt when a payment is processed',                     'transactional', 'mandatory',      true, true, false, true, true, false, 11),
  ('bid_accepted',        'Bid Accepted',          'Your bid on a listing has been accepted by the owner',    'transactional', 'mandatory',      true, true, false, true, true, false, 12),
  ('proposal_accepted',   'Proposal Accepted',     'Your proposal for a travel request has been accepted',    'transactional', 'mandatory',      true, true, false, true, true, false, 13),

  -- CHANNEL_ONLY (can change channel but not disable entirely)
  ('new_bid_received',             'New Bid Received',              'A renter has placed a bid on your listing',              'transactional', 'channel_only', true, true, false, true, true, false, 20),
  ('bid_rejected',                 'Bid Rejected',                  'Your bid was not accepted by the owner',                 'transactional', 'channel_only', true, true, false, true, true, false, 21),
  ('new_proposal_received',        'New Proposal Received',         'An owner has proposed dates for your travel request',    'transactional', 'channel_only', true, true, false, true, true, false, 22),
  ('proposal_rejected',            'Proposal Rejected',             'Your proposal was not accepted by the renter',           'transactional', 'channel_only', true, true, false, true, true, false, 23),
  ('bid_expired',                  'Bid Expired',                   'A bid has expired without action',                       'transactional', 'channel_only', true, true, false, true, true, false, 24),
  ('bidding_ending_soon',          'Bidding Ending Soon',           'Bidding on a listing closes soon — act now',             'transactional', 'channel_only', true, true, false, true, true, false, 25),
  ('request_expiring_soon',        'Request Expiring Soon',         'A travel request is about to expire',                    'transactional', 'channel_only', true, true, false, true, true, false, 26),
  ('travel_request_expiring_soon', 'Travel Request Expiring Soon',  'Your travel request will expire soon',                   'transactional', 'channel_only', true, true, false, true, true, false, 27),
  ('travel_request_matched',       'Travel Request Matched',        'A listing matches your travel request criteria',         'transactional', 'channel_only', true, true, false, true, true, false, 28),
  ('new_travel_request_match',     'New Travel Request Match',      'A new travel request matches your property',             'transactional', 'channel_only', true, true, false, true, true, false, 29),

  -- FULLY_OPTIONAL
  ('message_received',    'Message Received',          'A new message in a booking or inquiry thread',                  'transactional',  'fully_optional', true, true, false, true, true, false, 40),

  -- SEASONAL SMS (SMS-only, opt-in required)
  ('seasonal_sms_12wk',  '12-Week Seasonal Reminder', 'Early bird alert — list your property 12 weeks before a peak event', 'marketing', 'fully_optional', false, false, false, false, false, true, 50),
  ('seasonal_sms_6wk',   '6-Week Seasonal Reminder',  'Urgency reminder — peak event is 6 weeks away',                      'marketing', 'fully_optional', false, false, false, false, false, true, 51),
  ('seasonal_sms_2wk',   '2-Week Seasonal Reminder',  'Final push — last chance to list before a peak event',               'marketing', 'fully_optional', false, false, false, false, false, true, 52)
ON CONFLICT (type_key) DO NOTHING;

-- ============================================================
-- 15. RPC FUNCTIONS
-- ============================================================

-- Returns effective channel preference for a user.
-- If no explicit preference row exists, returns the catalog default.
CREATE OR REPLACE FUNCTION public.get_notification_preference(
  p_user_id UUID,
  p_type_key TEXT,
  p_channel TEXT
) RETURNS BOOL
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
DECLARE
  v_enabled BOOL;
  v_catalog_default BOOL;
BEGIN
  -- Check for explicit user preference
  SELECT enabled INTO v_enabled
  FROM public.user_notification_preferences
  WHERE user_id = p_user_id
    AND type_key = p_type_key
    AND channel = p_channel;

  IF FOUND THEN
    RETURN v_enabled;
  END IF;

  -- Fall back to catalog default
  SELECT CASE p_channel
    WHEN 'in_app' THEN default_in_app
    WHEN 'email'  THEN default_email
    WHEN 'sms'    THEN default_sms
  END INTO v_catalog_default
  FROM public.notification_catalog
  WHERE type_key = p_type_key;

  RETURN COALESCE(v_catalog_default, false);
END;
$$;

-- Admin dashboard stats
CREATE OR REPLACE FUNCTION public.get_notification_center_stats()
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN json_build_object(
    'total_sms_opted_in',
      (SELECT count(*) FROM public.profiles WHERE sms_opted_in = true),
    'messages_sent_30d',
      (SELECT count(*) FROM public.notification_delivery_log
       WHERE created_at > NOW() - INTERVAL '30 days'
         AND channel = 'sms' AND status IN ('sent', 'delivered', 'test')),
    'messages_delivered_30d',
      (SELECT count(*) FROM public.notification_delivery_log
       WHERE created_at > NOW() - INTERVAL '30 days'
         AND channel = 'sms' AND status = 'delivered'),
    'upcoming_reminders_7d',
      (SELECT count(*) FROM public.event_instances
       WHERE status = 'active' AND date_confirmed = true
         AND (reminder_12wk BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
           OR reminder_6wk  BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
           OR reminder_2wk  BETWEEN CURRENT_DATE AND CURRENT_DATE + 7)),
    'pending_date_confirmations',
      (SELECT count(*) FROM public.event_instances
       WHERE date_confirmed = false AND status = 'active'
         AND year >= EXTRACT(YEAR FROM CURRENT_DATE))
  );
END;
$$;

-- Returns upcoming event instances where any reminder date falls within N days
CREATE OR REPLACE FUNCTION public.get_upcoming_reminders(p_days_ahead INT DEFAULT 7)
RETURNS TABLE (
  instance_id     UUID,
  event_name      TEXT,
  destination     public.destination_bucket,
  event_date      DATE,
  reminder_type   TEXT,
  reminder_date   DATE,
  priority        TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    ei.id,
    se.name,
    ei.destination,
    ei.event_date,
    CASE
      WHEN ei.reminder_12wk BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead THEN '12_week'
      WHEN ei.reminder_6wk  BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead THEN '6_week'
      WHEN ei.reminder_2wk  BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead THEN '2_week'
    END AS reminder_type,
    CASE
      WHEN ei.reminder_12wk BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead THEN ei.reminder_12wk
      WHEN ei.reminder_6wk  BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead THEN ei.reminder_6wk
      WHEN ei.reminder_2wk  BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead THEN ei.reminder_2wk
    END AS reminder_date,
    ei.priority
  FROM public.event_instances ei
  JOIN public.seasonal_events se ON se.id = ei.event_id
  WHERE ei.status = 'active'
    AND ei.date_confirmed = true
    AND (
      ei.reminder_12wk BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead
      OR ei.reminder_6wk  BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead
      OR ei.reminder_2wk  BETWEEN CURRENT_DATE AND CURRENT_DATE + p_days_ahead
    )
  ORDER BY reminder_date ASC;
END;
$$;

-- ============================================================
-- 16. SEED SEASONAL EVENTS + 2026 INSTANCES
-- ============================================================
-- Data sourced from owner_reminder_tool.xlsx Master Event Calendar.
-- 48 events across 8 destinations for 2026.
-- Separated into seasonal_events (templates) and event_instances (2026 dates).

-- ----- SEASONAL EVENTS (30 unique events) -----

INSERT INTO public.seasonal_events (id, name, category, recurrence_type, typical_month, is_location_fixed, notes) VALUES
  -- Orlando
  ('a0000001-0000-0000-0000-000000000001', 'Summer Break - Theme Parks',        'school_breaks',       'annual_fixed',    6, true,  'Orlando theme park peak season'),
  ('a0000001-0000-0000-0000-000000000002', 'Spring Break - Universal/Disney',   'major_holidays',      'annual_fixed',    3, true,  'Orlando spring break'),
  ('a0000001-0000-0000-0000-000000000003', 'Thanksgiving Week - Disney',        'major_holidays',      'annual_fixed',   11, true,  'Orlando Thanksgiving'),
  ('a0000001-0000-0000-0000-000000000004', 'Christmas/New Year - Disney',       'major_holidays',      'annual_fixed',   12, true,  'Orlando holiday season'),
  ('a0000001-0000-0000-0000-000000000005', 'MLB Spring Training Nearby',        'sports_events',       'annual_floating', 3, true,  'Spring training around Orlando'),
  ('a0000001-0000-0000-0000-000000000006', 'Marathon Weekend',                  'local_events',        'annual_floating', 1, true,  'Orlando Marathon Weekend'),
  -- Miami
  ('a0000002-0000-0000-0000-000000000001', 'Spring Break Beach Season',         'school_breaks',       'annual_fixed',    3, true,  'Miami spring break peak'),
  ('a0000002-0000-0000-0000-000000000002', 'Summer Peak Beach Season',          'weather_peak_season', 'annual_fixed',    6, true,  'Miami summer peak'),
  ('a0000002-0000-0000-0000-000000000003', 'Art Basel Miami',                   'local_events',        'annual_floating',12, true,  'Art Basel Miami Beach'),
  ('a0000002-0000-0000-0000-000000000004', 'Ultra Music Festival',              'local_events',        'annual_floating', 3, true,  'Ultra Music Festival'),
  ('a0000002-0000-0000-0000-000000000005', 'Miami Open Tennis',                 'sports_events',       'annual_floating', 3, true,  'Miami Open ATP/WTA'),
  ('a0000002-0000-0000-0000-000000000006', 'New Year''s Eve - Miami',           'major_holidays',      'annual_fixed',   12, true,  'Miami NYE'),
  -- Las Vegas
  ('a0000003-0000-0000-0000-000000000001', 'Super Bowl Weekend',                'sports_events',       'annual_floating', 2, false, 'Super Bowl — city changes yearly'),
  ('a0000003-0000-0000-0000-000000000002', 'March Madness NCAA',                'sports_events',       'annual_floating', 3, true,  'NCAA Tournament in Vegas'),
  ('a0000003-0000-0000-0000-000000000003', 'New Year''s Eve - Las Vegas',       'major_holidays',      'annual_fixed',   12, true,  'Vegas NYE'),
  ('a0000003-0000-0000-0000-000000000004', 'CES Convention',                    'local_events',        'annual_floating', 1, true,  'Consumer Electronics Show'),
  ('a0000003-0000-0000-0000-000000000005', 'NASCAR Cup Series',                 'sports_events',       'annual_floating', 3, true,  'NASCAR at Las Vegas Motor Speedway'),
  ('a0000003-0000-0000-0000-000000000006', 'EDC Music Festival',                'local_events',        'annual_floating', 5, true,  'Electric Daisy Carnival'),
  -- Maui / Hawaii
  ('a0000004-0000-0000-0000-000000000001', 'Summer Family Season',              'school_breaks',       'annual_fixed',    6, true,  'Hawaii summer family peak'),
  ('a0000004-0000-0000-0000-000000000002', 'Whale Watching Peak Season',        'weather_peak_season', 'annual_fixed',    1, true,  'Humpback whale season peak'),
  ('a0000004-0000-0000-0000-000000000003', 'Spring Break - Hawaii',             'school_breaks',       'annual_fixed',    3, true,  'Hawaii spring break'),
  ('a0000004-0000-0000-0000-000000000004', 'Thanksgiving Week - Hawaii',        'major_holidays',      'annual_fixed',   11, true,  'Hawaii Thanksgiving'),
  ('a0000004-0000-0000-0000-000000000005', 'Ironman World Championship',        'sports_events',       'annual_floating',10, true,  'Ironman Kona'),
  ('a0000004-0000-0000-0000-000000000006', 'Christmas Holidays - Hawaii',       'major_holidays',      'annual_fixed',   12, true,  'Hawaii holiday season'),
  -- Myrtle Beach
  ('a0000005-0000-0000-0000-000000000001', 'Summer Break Peak',                 'school_breaks',       'annual_fixed',    6, true,  'Myrtle Beach summer peak'),
  ('a0000005-0000-0000-0000-000000000002', 'Memorial Day Weekend',              'major_holidays',      'annual_fixed',    5, true,  'Memorial Day'),
  ('a0000005-0000-0000-0000-000000000003', 'July 4th Weekend',                  'major_holidays',      'annual_fixed',    7, true,  'Independence Day weekend'),
  ('a0000005-0000-0000-0000-000000000004', 'Labor Day Weekend',                 'major_holidays',      'annual_fixed',    9, true,  'Labor Day'),
  ('a0000005-0000-0000-0000-000000000005', 'Spring Break - Myrtle Beach',       'school_breaks',       'annual_fixed',    3, true,  'Myrtle Beach spring break'),
  ('a0000005-0000-0000-0000-000000000006', 'Beach Music Festival',              'local_events',        'annual_floating', 5, true,  'Carolina Beach Music Festival'),
  -- Colorado
  ('a0000006-0000-0000-0000-000000000001', 'Ski Season Opens',                  'weather_peak_season', 'annual_fixed',   11, true,  'Colorado ski season opener'),
  ('a0000006-0000-0000-0000-000000000002', 'Peak Ski - Winter Break',           'school_breaks',       'annual_fixed',   12, true,  'Peak ski / winter break'),
  ('a0000006-0000-0000-0000-000000000003', 'Presidents Day Ski Weekend',        'major_holidays',      'annual_fixed',    2, true,  'Presidents Day ski'),
  ('a0000006-0000-0000-0000-000000000004', 'Spring Skiing Final Runs',          'weather_peak_season', 'annual_fixed',    3, true,  'Late season skiing'),
  ('a0000006-0000-0000-0000-000000000005', 'X Games Aspen',                     'sports_events',       'annual_floating', 1, true,  'Winter X Games'),
  ('a0000006-0000-0000-0000-000000000006', 'Summer Hiking Season',              'weather_peak_season', 'annual_fixed',    6, true,  'Colorado summer hiking'),
  -- New York
  ('a0000007-0000-0000-0000-000000000001', 'New Year''s Eve/Day - NYC',         'major_holidays',      'annual_fixed',   12, true,  'NYC Times Square NYE'),
  ('a0000007-0000-0000-0000-000000000002', 'Thanksgiving Parade Week',          'major_holidays',      'annual_fixed',   11, true,  'Macy''s Thanksgiving Parade'),
  ('a0000007-0000-0000-0000-000000000003', 'NYC Marathon',                      'sports_events',       'annual_floating',11, true,  'New York City Marathon'),
  ('a0000007-0000-0000-0000-000000000004', 'Summer in the City',                'weather_peak_season', 'annual_fixed',    6, true,  'NYC summer peak'),
  ('a0000007-0000-0000-0000-000000000005', 'US Open Tennis',                    'sports_events',       'annual_floating', 8, true,  'US Open at Flushing Meadows'),
  ('a0000007-0000-0000-0000-000000000006', 'Spring Break/Easter - NYC',         'major_holidays',      'annual_fixed',    3, true,  'NYC spring break / Easter'),
  -- Nashville
  ('a0000008-0000-0000-0000-000000000001', 'CMA Music Festival',                'local_events',        'annual_floating', 6, true,  'Country Music Association fest'),
  ('a0000008-0000-0000-0000-000000000002', 'New Year''s Eve - Nashville',       'major_holidays',      'annual_fixed',   12, true,  'Nashville NYE'),
  ('a0000008-0000-0000-0000-000000000003', 'NFL Draft',                         'sports_events',       'annual_floating', 4, false, 'NFL Draft — city changes yearly'),
  ('a0000008-0000-0000-0000-000000000004', 'Spring Break Season - Nashville',   'school_breaks',       'annual_fixed',    3, true,  'Nashville spring break'),
  ('a0000008-0000-0000-0000-000000000005', 'Nashville SC Soccer',               'sports_events',       'annual_floating', 3, true,  'Nashville SC season opener'),
  ('a0000008-0000-0000-0000-000000000006', 'Bonnaroo Music Festival',           'local_events',        'annual_floating', 6, true,  'Bonnaroo in Manchester, TN')
ON CONFLICT (id) DO NOTHING;

-- ----- 2026 EVENT INSTANCES (48 rows) -----
-- Dates from owner_reminder_tool.xlsx Master Event Calendar.
-- reminder_12wk, reminder_6wk, reminder_2wk are auto-computed generated columns.

INSERT INTO public.event_instances (event_id, destination, year, event_date, priority, status, auto_generated, date_confirmed) VALUES
  -- Orlando (6)
  ('a0000001-0000-0000-0000-000000000001', 'orlando',      2026, '2026-06-01', 'medium', 'active', false, true),
  ('a0000001-0000-0000-0000-000000000002', 'orlando',      2026, '2026-03-14', 'urgent', 'active', false, true),
  ('a0000001-0000-0000-0000-000000000003', 'orlando',      2026, '2026-11-26', 'plan',   'active', false, true),
  ('a0000001-0000-0000-0000-000000000004', 'orlando',      2026, '2026-12-20', 'plan',   'active', false, true),
  ('a0000001-0000-0000-0000-000000000005', 'orlando',      2026, '2026-03-01', 'plan',   'active', false, true),
  ('a0000001-0000-0000-0000-000000000006', 'orlando',      2026, '2026-01-10', 'plan',   'active', false, true),
  -- Miami (6)
  ('a0000002-0000-0000-0000-000000000001', 'miami',        2026, '2026-03-07', 'plan',   'active', false, true),
  ('a0000002-0000-0000-0000-000000000002', 'miami',        2026, '2026-06-15', 'plan',   'active', false, true),
  ('a0000002-0000-0000-0000-000000000003', 'miami',        2026, '2026-12-04', 'plan',   'active', false, true),
  ('a0000002-0000-0000-0000-000000000004', 'miami',        2026, '2026-03-27', 'urgent', 'active', false, true),
  ('a0000002-0000-0000-0000-000000000005', 'miami',        2026, '2026-03-23', 'urgent', 'active', false, true),
  ('a0000002-0000-0000-0000-000000000006', 'miami',        2026, '2026-12-31', 'plan',   'active', false, true),
  -- Las Vegas (6)
  ('a0000003-0000-0000-0000-000000000001', 'las_vegas',    2026, '2026-02-08', 'plan',   'active', false, true),
  ('a0000003-0000-0000-0000-000000000002', 'las_vegas',    2026, '2026-03-19', 'urgent', 'active', false, true),
  ('a0000003-0000-0000-0000-000000000003', 'las_vegas',    2026, '2026-12-31', 'plan',   'active', false, true),
  ('a0000003-0000-0000-0000-000000000004', 'las_vegas',    2026, '2026-01-06', 'plan',   'active', false, true),
  ('a0000003-0000-0000-0000-000000000005', 'las_vegas',    2026, '2026-03-01', 'plan',   'active', false, true),
  ('a0000003-0000-0000-0000-000000000006', 'las_vegas',    2026, '2026-05-15', 'medium', 'active', false, true),
  -- Maui / Hawaii (6)
  ('a0000004-0000-0000-0000-000000000001', 'maui_hawaii',  2026, '2026-06-15', 'plan',   'active', false, true),
  ('a0000004-0000-0000-0000-000000000002', 'maui_hawaii',  2026, '2026-01-15', 'plan',   'active', false, true),
  ('a0000004-0000-0000-0000-000000000003', 'maui_hawaii',  2026, '2026-03-14', 'urgent', 'active', false, true),
  ('a0000004-0000-0000-0000-000000000004', 'maui_hawaii',  2026, '2026-11-26', 'plan',   'active', false, true),
  ('a0000004-0000-0000-0000-000000000005', 'maui_hawaii',  2026, '2026-10-10', 'plan',   'active', false, true),
  ('a0000004-0000-0000-0000-000000000006', 'maui_hawaii',  2026, '2026-12-20', 'plan',   'active', false, true),
  -- Myrtle Beach (6)
  ('a0000005-0000-0000-0000-000000000001', 'myrtle_beach', 2026, '2026-06-20', 'plan',   'active', false, true),
  ('a0000005-0000-0000-0000-000000000002', 'myrtle_beach', 2026, '2026-05-25', 'medium', 'active', false, true),
  ('a0000005-0000-0000-0000-000000000003', 'myrtle_beach', 2026, '2026-07-04', 'plan',   'active', false, true),
  ('a0000005-0000-0000-0000-000000000004', 'myrtle_beach', 2026, '2026-09-07', 'plan',   'active', false, true),
  ('a0000005-0000-0000-0000-000000000005', 'myrtle_beach', 2026, '2026-03-14', 'urgent', 'active', false, true),
  ('a0000005-0000-0000-0000-000000000006', 'myrtle_beach', 2026, '2026-05-08', 'medium', 'active', false, true),
  -- Colorado (6)
  ('a0000006-0000-0000-0000-000000000001', 'colorado',     2026, '2026-11-20', 'plan',   'active', false, true),
  ('a0000006-0000-0000-0000-000000000002', 'colorado',     2026, '2026-12-20', 'plan',   'active', false, true),
  ('a0000006-0000-0000-0000-000000000003', 'colorado',     2026, '2026-02-14', 'plan',   'active', false, true),
  ('a0000006-0000-0000-0000-000000000004', 'colorado',     2026, '2026-03-15', 'urgent', 'active', false, true),
  ('a0000006-0000-0000-0000-000000000005', 'colorado',     2026, '2026-01-23', 'plan',   'active', false, true),
  ('a0000006-0000-0000-0000-000000000006', 'colorado',     2026, '2026-06-15', 'plan',   'active', false, true),
  -- New York (6)
  ('a0000007-0000-0000-0000-000000000001', 'new_york',     2026, '2026-12-31', 'plan',   'active', false, true),
  ('a0000007-0000-0000-0000-000000000002', 'new_york',     2026, '2026-11-26', 'plan',   'active', false, true),
  ('a0000007-0000-0000-0000-000000000003', 'new_york',     2026, '2026-11-01', 'plan',   'active', false, true),
  ('a0000007-0000-0000-0000-000000000004', 'new_york',     2026, '2026-06-20', 'plan',   'active', false, true),
  ('a0000007-0000-0000-0000-000000000005', 'new_york',     2026, '2026-08-31', 'plan',   'active', false, true),
  ('a0000007-0000-0000-0000-000000000006', 'new_york',     2026, '2026-03-29', 'high',   'active', false, true),
  -- Nashville (6)
  ('a0000008-0000-0000-0000-000000000001', 'nashville',    2026, '2026-06-04', 'medium', 'active', false, true),
  ('a0000008-0000-0000-0000-000000000002', 'nashville',    2026, '2026-12-31', 'plan',   'active', false, true),
  ('a0000008-0000-0000-0000-000000000003', 'nashville',    2026, '2026-04-23', 'high',   'active', false, true),
  ('a0000008-0000-0000-0000-000000000004', 'nashville',    2026, '2026-03-14', 'urgent', 'active', false, true),
  ('a0000008-0000-0000-0000-000000000005', 'nashville',    2026, '2026-03-07', 'plan',   'active', false, true),
  ('a0000008-0000-0000-0000-000000000006', 'nashville',    2026, '2026-06-11', 'plan',   'active', false, true)
ON CONFLICT (event_id, destination, year) DO NOTHING;

-- ============================================================
-- 17. VERIFICATION QUERIES (run manually after migration)
-- ============================================================
-- SELECT count(*) FROM public.notification_catalog;
-- Expected: 18 (15 existing notification types + 3 seasonal SMS)
--
-- SELECT count(*) FROM public.event_instances WHERE year = 2026;
-- Expected: 48
--
-- SELECT destination, count(*) FROM public.event_instances WHERE year = 2026
-- GROUP BY destination ORDER BY destination;
-- Expected: 6 per destination
--
-- SELECT se.name, ei.event_date, ei.reminder_12wk, ei.reminder_6wk, ei.reminder_2wk,
--   (ei.event_date - ei.reminder_12wk) AS days_12wk,
--   (ei.event_date - ei.reminder_6wk) AS days_6wk,
--   (ei.event_date - ei.reminder_2wk) AS days_2wk
-- FROM public.event_instances ei
-- JOIN public.seasonal_events se ON se.id = ei.event_id
-- LIMIT 5;
-- Expected: days_12wk=84, days_6wk=42, days_2wk=14
