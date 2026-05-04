-- Migration 073: Cron schedules for Session 63 edge functions
-- #462 (auto-confirm-checkins) and #464 (sla-monitor).
--
-- Both jobs invoke their respective edge functions hourly via pg_net.
-- Auth uses the service-role JWT pulled from vault.decrypted_secrets
-- under the key 'service_role_key'. If that secret is not present, the
-- net.http_post call will receive an empty Authorization header and the
-- edge function will reject the request — the failure mode is "cron
-- runs every hour and gets a 401" rather than corrupted data.
--
-- To set the secret one-time per environment:
--   SELECT vault.create_secret('<service_role_jwt>', 'service_role_key');
--
-- Project URL is environment-specific:
--   PROD: https://xzfllqndrlmhclqfybew.supabase.co
--   DEV:  https://oukbxqnlxnkainnligfz.supabase.co
-- Stored in app.settings.supabase_url GUC if available; otherwise the
-- migration falls back to hardcoded PROD URL. Override in DEV:
--   ALTER DATABASE postgres SET app.settings.supabase_url
--     TO 'https://oukbxqnlxnkainnligfz.supabase.co';

-- ── Helper: resolve the project URL ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.session63_supabase_url()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('app.settings.supabase_url', true),
    'https://xzfllqndrlmhclqfybew.supabase.co'  -- PROD fallback
  );
$$;

-- ── Unschedule prior versions (idempotent re-run) ───────────────────────────
DO $$
BEGIN
  PERFORM cron.unschedule('auto-confirm-checkins-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  PERFORM cron.unschedule('sla-monitor-hourly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ── auto-confirm-checkins (hourly) ──────────────────────────────────────────
SELECT cron.schedule(
  'auto-confirm-checkins-hourly',
  '0 * * * *',  -- top of every hour
  $$
  SELECT net.http_post(
    url := public.session63_supabase_url() || '/functions/v1/auto-confirm-checkins',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
        ''
      )
    ),
    body := jsonb_build_object('source', 'pg_cron')
  ) AS request_id;
  $$
);

-- ── sla-monitor (hourly, offset by 30 min so the two cron jobs don't pile) ──
SELECT cron.schedule(
  'sla-monitor-hourly',
  '30 * * * *',
  $$
  SELECT net.http_post(
    url := public.session63_supabase_url() || '/functions/v1/sla-monitor',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
        ''
      )
    ),
    body := jsonb_build_object('source', 'pg_cron')
  ) AS request_id;
  $$
);
