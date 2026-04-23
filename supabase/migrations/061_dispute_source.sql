-- Migration 061: dispute_source enum + source column on disputes
-- Phase 22 C5 (#409) — DEC-036. Distinguishes agent-opened disputes from
-- manually-filed ones so admins can surface / measure / triage differently.
--
-- Values:
--   user_filed     — dispute opened via ReportIssueDialog or similar user UI
--   ravio_support  — dispute opened by the RAVIO support agent via the
--                    open_dispute tool (only after user-confirmed escalation)
--
-- Default is user_filed; all existing rows keep that value implicitly.
-- Every new insert must supply source explicitly or rely on the default.

-- ── Enum ────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_source') THEN
    CREATE TYPE public.dispute_source AS ENUM ('user_filed', 'ravio_support');
  END IF;
END $$;

-- ── Column ──────────────────────────────────────────────────────────────────
ALTER TABLE public.disputes
  ADD COLUMN IF NOT EXISTS source public.dispute_source
  NOT NULL DEFAULT 'user_filed';

COMMENT ON COLUMN public.disputes.source IS
  'How the dispute was opened. ravio_support = agent-opened via open_dispute tool; user_filed = manual user filing (ReportIssueDialog).';

-- ── Index ───────────────────────────────────────────────────────────────────
-- Enables admin filter ("RAVIO Support" / "User-Filed") to scan efficiently
-- when the agent-opened volume grows.
CREATE INDEX IF NOT EXISTS idx_disputes_source ON public.disputes (source);
