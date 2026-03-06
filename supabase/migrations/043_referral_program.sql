-- Migration 043: Referral Program
-- Adds referral_codes and referrals tables + RPCs for #105

-- 1. Referral codes table (one per user)
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_referral_user UNIQUE (user_id),
  CONSTRAINT unique_referral_code UNIQUE (code)
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes(user_id);

-- 2. Referrals table (tracks each referral relationship)
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  reward_type TEXT NOT NULL DEFAULT 'commission_discount' CHECK (reward_type IN ('commission_discount', 'credit')),
  reward_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_referred_user UNIQUE (referred_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- 3. Add referral settings to system_settings
INSERT INTO public.system_settings (setting_key, setting_value)
VALUES (
  'referral_program',
  '{"enabled": true, "reward_type": "commission_discount", "referrer_reward_pct": 1, "referred_credit_cents": 2500}'::jsonb
)
ON CONFLICT (setting_key) DO NOTHING;

-- 4. RLS policies
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can read their own referral code
DO $$ BEGIN
  CREATE POLICY referral_codes_select_own ON public.referral_codes
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can insert their own referral code
DO $$ BEGIN
  CREATE POLICY referral_codes_insert_own ON public.referral_codes
    FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anyone can look up a code (for signup validation)
DO $$ BEGIN
  CREATE POLICY referral_codes_select_by_code ON public.referral_codes
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users can read referrals where they are the referrer
DO $$ BEGIN
  CREATE POLICY referrals_select_own ON public.referrals
    FOR SELECT USING (auth.uid() = referrer_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RAV team can read all referrals
DO $$ BEGIN
  CREATE POLICY referrals_select_admin ON public.referrals
    FOR SELECT USING (public.is_rav_team());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. RPC: Generate or get referral code for current user
CREATE OR REPLACE FUNCTION public.get_or_create_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_code TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check for existing code
  SELECT code INTO v_code FROM referral_codes WHERE user_id = v_user_id;
  IF FOUND THEN
    RETURN v_code;
  END IF;

  -- Generate a unique 8-char alphanumeric code
  LOOP
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    BEGIN
      INSERT INTO referral_codes (user_id, code)
      VALUES (v_user_id, v_code);
      RETURN v_code;
    EXCEPTION WHEN unique_violation THEN
      -- Try again with a different code
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- 6. RPC: Record a referral (called during signup)
CREATE OR REPLACE FUNCTION public.record_referral(p_referral_code TEXT, p_new_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
  v_settings JSONB;
  v_reward_type TEXT;
  v_reward_amount NUMERIC;
BEGIN
  -- Look up referrer
  SELECT user_id INTO v_referrer_id
  FROM referral_codes
  WHERE code = upper(p_referral_code) AND is_active = true;

  IF NOT FOUND THEN
    RETURN; -- Invalid code, silently ignore
  END IF;

  -- Don't allow self-referral
  IF v_referrer_id = p_new_user_id THEN
    RETURN;
  END IF;

  -- Get reward settings
  SELECT setting_value INTO v_settings
  FROM system_settings
  WHERE setting_key = 'referral_program';

  v_reward_type := COALESCE(v_settings->>'reward_type', 'commission_discount');
  v_reward_amount := COALESCE((v_settings->>'referrer_reward_pct')::NUMERIC, 1);

  -- Insert referral (ignore if referred user already has a referral)
  INSERT INTO referrals (referrer_id, referred_user_id, referral_code, reward_type, reward_amount)
  VALUES (v_referrer_id, p_new_user_id, upper(p_referral_code), v_reward_type, v_reward_amount)
  ON CONFLICT (referred_user_id) DO NOTHING;
END;
$$;

-- 7. RPC: Get referral stats for current user
CREATE OR REPLACE FUNCTION public.get_referral_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_total INTEGER;
  v_converted INTEGER;
  v_pending INTEGER;
  v_total_reward NUMERIC;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE status = 'converted')::INTEGER,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER,
    COALESCE(SUM(reward_amount) FILTER (WHERE status = 'converted'), 0)
  INTO v_total, v_converted, v_pending, v_total_reward
  FROM referrals
  WHERE referrer_id = v_user_id;

  RETURN jsonb_build_object(
    'totalReferrals', v_total,
    'convertedReferrals', v_converted,
    'pendingReferrals', v_pending,
    'totalReward', v_total_reward,
    'rewardType', 'commission_discount'
  );
END;
$$;

-- 8. Trigger to update updated_at
CREATE TRIGGER set_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
