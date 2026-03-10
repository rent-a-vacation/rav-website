-- Migration 044: API Key Infrastructure for Public API
-- Provides API key management, rate limiting, and request logging

-- ─── Tables ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_prefix text NOT NULL,          -- First 8 chars of the key (for display: rav_pk_xxxx...)
  key_hash text NOT NULL UNIQUE,     -- SHA-256 hash of the full key
  scopes text[] NOT NULL DEFAULT '{}',
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'partner', 'premium')),
  daily_limit integer NOT NULL DEFAULT 100,
  per_minute_limit integer NOT NULL DEFAULT 10,
  daily_usage integer NOT NULL DEFAULT 0,
  daily_usage_reset_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  revoked_at timestamptz,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS api_request_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id uuid REFERENCES api_keys(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  method text NOT NULL DEFAULT 'GET',
  status_code integer,
  response_time_ms integer,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_api_request_log_key_id ON api_request_log(key_id);
CREATE INDEX IF NOT EXISTS idx_api_request_log_created_at ON api_request_log(created_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_owner ON api_keys(owner_user_id);

-- Trigger for updated_at
CREATE TRIGGER set_api_keys_updated_at
  BEFORE UPDATE ON api_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_log ENABLE ROW LEVEL SECURITY;

-- Service role only — no direct frontend access
-- Admin reads via service role client or RPCs

-- ─── RPCs ───────────────────────────────────────────────────────────────────

-- Validate an API key by its hash, returns the key record if valid
CREATE OR REPLACE FUNCTION validate_api_key(p_key_hash text)
RETURNS TABLE (
  key_id uuid,
  owner_user_id uuid,
  name text,
  scopes text[],
  tier text,
  daily_limit integer,
  per_minute_limit integer,
  daily_usage integer,
  daily_usage_reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ak.id,
    ak.owner_user_id,
    ak.name,
    ak.scopes,
    ak.tier,
    ak.daily_limit,
    ak.per_minute_limit,
    ak.daily_usage,
    ak.daily_usage_reset_at
  FROM api_keys ak
  WHERE ak.key_hash = p_key_hash
    AND ak.is_active = true
    AND ak.revoked_at IS NULL
    AND (ak.expires_at IS NULL OR ak.expires_at > now());

  -- Update last_used_at as a side effect
  UPDATE api_keys SET last_used_at = now() WHERE api_keys.key_hash = p_key_hash;
END;
$$;

-- Increment daily usage counter with auto-reset, returns true if within limit
CREATE OR REPLACE FUNCTION increment_api_key_usage(p_key_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_limit integer;
  v_current_usage integer;
  v_reset_at timestamptz;
BEGIN
  SELECT daily_limit, daily_usage, daily_usage_reset_at
  INTO v_daily_limit, v_current_usage, v_reset_at
  FROM api_keys
  WHERE id = p_key_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Auto-reset if a new day has started (24h since last reset)
  IF v_reset_at < now() - interval '24 hours' THEN
    UPDATE api_keys
    SET daily_usage = 1, daily_usage_reset_at = now()
    WHERE id = p_key_id;
    RETURN true;
  END IF;

  -- Check if within limit
  IF v_current_usage >= v_daily_limit THEN
    RETURN false;
  END IF;

  -- Increment
  UPDATE api_keys
  SET daily_usage = daily_usage + 1
  WHERE id = p_key_id;

  RETURN true;
END;
$$;

-- Admin: list all API keys (for admin dashboard)
CREATE OR REPLACE FUNCTION list_api_keys()
RETURNS TABLE (
  id uuid,
  owner_user_id uuid,
  owner_email text,
  name text,
  key_prefix text,
  scopes text[],
  tier text,
  daily_limit integer,
  per_minute_limit integer,
  daily_usage integer,
  is_active boolean,
  revoked_at timestamptz,
  expires_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only RAV admins can list all keys
  IF NOT is_rav_team(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    ak.id,
    ak.owner_user_id,
    p.email AS owner_email,
    ak.name,
    ak.key_prefix,
    ak.scopes,
    ak.tier,
    ak.daily_limit,
    ak.per_minute_limit,
    ak.daily_usage,
    ak.is_active,
    ak.revoked_at,
    ak.expires_at,
    ak.last_used_at,
    ak.created_at
  FROM api_keys ak
  LEFT JOIN profiles p ON p.id = ak.owner_user_id
  ORDER BY ak.created_at DESC;
END;
$$;

-- Admin: get usage stats for a specific key
CREATE OR REPLACE FUNCTION get_api_key_stats(p_key_id uuid, p_days integer DEFAULT 7)
RETURNS TABLE (
  endpoint text,
  request_count bigint,
  avg_response_time_ms numeric,
  error_count bigint,
  day date
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT is_rav_team(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    arl.endpoint,
    count(*)::bigint AS request_count,
    round(avg(arl.response_time_ms)::numeric, 1) AS avg_response_time_ms,
    count(*) FILTER (WHERE arl.status_code >= 400)::bigint AS error_count,
    arl.created_at::date AS day
  FROM api_request_log arl
  WHERE arl.key_id = p_key_id
    AND arl.created_at >= now() - (p_days || ' days')::interval
  GROUP BY arl.endpoint, arl.created_at::date
  ORDER BY arl.created_at::date DESC, arl.endpoint;
END;
$$;
