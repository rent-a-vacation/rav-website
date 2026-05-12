-- 076_profiles_active_duty_military.sql
--
-- Adds `is_active_duty_military` to `profiles` so signup can capture optional
-- self-disclosure of active-duty status. Drives the conditional MLA notice
-- at checkout (Steines v. Westgate Palace, 11th Cir. 2024 — Military Lending
-- Act overrides Federal Arbitration Act for timeshare-related arbitration).
--
-- IMPORTANT: The MLA carve-out paragraph added to Terms.tsx Section 9 in the
-- companion code change protects active-duty servicemembers regardless of
-- self-disclosure. This field is purely for the optional in-product UX
-- (notice rendering at checkout) — it does NOT gate access to the protection.
--
-- GitHub issue #490; compliance-gap-analysis item P-13.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active_duty_military BOOLEAN;

COMMENT ON COLUMN public.profiles.is_active_duty_military IS
  'Optional self-disclosure: NULL = not answered, TRUE = active-duty servicemember (or dependent), FALSE = no. Drives the MLA notice render at checkout. The Terms-of-Service MLA carve-out (Steines v. Westgate Palace, 10 U.S.C. § 987) applies regardless of this field — protections are by law, not by checkbox. #490.';

COMMIT;
