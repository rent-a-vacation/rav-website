-- Migration 045: Optional IP allowlisting for API keys
-- Partners can restrict their API key to specific IP addresses

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS allowed_ips text[];

-- Drop existing functions first (return type changed — cannot use CREATE OR REPLACE)
DROP FUNCTION IF EXISTS validate_api_key(text);
DROP FUNCTION IF EXISTS list_api_keys();

-- Recreate validate_api_key with allowed_ips
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
  daily_usage_reset_at timestamptz,
  allowed_ips text[]
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
    ak.daily_usage_reset_at,
    ak.allowed_ips
  FROM api_keys ak
  WHERE ak.key_hash = p_key_hash
    AND ak.is_active = true
    AND ak.revoked_at IS NULL
    AND (ak.expires_at IS NULL OR ak.expires_at > now());

  -- Update last_used_at as a side effect
  UPDATE api_keys SET last_used_at = now() WHERE api_keys.key_hash = p_key_hash;
END;
$$;

-- Recreate list_api_keys with allowed_ips
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
  created_at timestamptz,
  allowed_ips text[]
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
    ak.created_at,
    ak.allowed_ips
  FROM api_keys ak
  LEFT JOIN profiles p ON p.id = ak.owner_user_id
  ORDER BY ak.created_at DESC;
END;
$$;
