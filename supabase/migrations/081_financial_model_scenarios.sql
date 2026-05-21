-- 081_financial_model_scenarios.sql
-- Phase 2 Stage 2c (#550): per-user financial-model scenarios with sparse JSON overrides.
-- RLS-gated to RAV team. Read-only share semantics (author is sole editor).

CREATE TABLE IF NOT EXISTS public.financial_model_scenarios (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text NOT NULL,
  multiplier        text NOT NULL DEFAULT 'Base',
  overrides         jsonb NOT NULL DEFAULT '{}'::jsonb,
  expense_overrides jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_shared         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fms_multiplier_chk
    CHECK (multiplier IN ('Conservative', 'Base', 'Optimistic')),
  CONSTRAINT fms_name_len
    CHECK (char_length(name) BETWEEN 1 AND 80),
  CONSTRAINT fms_name_unique_per_owner
    UNIQUE (owner_id, name)
);

CREATE INDEX IF NOT EXISTS idx_fms_shared
  ON public.financial_model_scenarios(is_shared)
  WHERE is_shared = true;

ALTER TABLE public.financial_model_scenarios ENABLE ROW LEVEL SECURITY;

-- SELECT: RAV team can see their own + any shared
DROP POLICY IF EXISTS fms_select ON public.financial_model_scenarios;
CREATE POLICY fms_select ON public.financial_model_scenarios
  FOR SELECT
  TO authenticated
  USING (
    public.is_rav_team(auth.uid())
    AND (owner_id = auth.uid() OR is_shared = true)
  );

-- INSERT: RAV team can insert rows owned by themselves
DROP POLICY IF EXISTS fms_insert ON public.financial_model_scenarios;
CREATE POLICY fms_insert ON public.financial_model_scenarios
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_rav_team(auth.uid())
    AND owner_id = auth.uid()
  );

-- UPDATE: only the owner can edit; cannot reassign ownership
DROP POLICY IF EXISTS fms_update ON public.financial_model_scenarios;
CREATE POLICY fms_update ON public.financial_model_scenarios
  FOR UPDATE
  TO authenticated
  USING (
    public.is_rav_team(auth.uid())
    AND owner_id = auth.uid()
  )
  WITH CHECK (
    public.is_rav_team(auth.uid())
    AND owner_id = auth.uid()
  );

-- DELETE: only the owner
DROP POLICY IF EXISTS fms_delete ON public.financial_model_scenarios;
CREATE POLICY fms_delete ON public.financial_model_scenarios
  FOR DELETE
  TO authenticated
  USING (
    public.is_rav_team(auth.uid())
    AND owner_id = auth.uid()
  );

-- Auto-bump updated_at
DROP TRIGGER IF EXISTS set_financial_model_scenarios_updated_at
  ON public.financial_model_scenarios;
CREATE TRIGGER set_financial_model_scenarios_updated_at
  BEFORE UPDATE ON public.financial_model_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.financial_model_scenarios IS
  'Phase 2 Stage 2c (#550): per-user scenarios for /executive-dashboard/financial-model. Sparse JSON overrides on data.ts baseline. Author is sole editor (read-only share).';

COMMENT ON COLUMN public.financial_model_scenarios.overrides IS
  'Sparse JSON map keyed by InputRow.name (e.g., gOwnGrowth, hEngMonth). Values override the canonical baseline in src/lib/financial-model/data.ts. Sparse: only fields that differ from baseline are present.';

COMMENT ON COLUMN public.financial_model_scenarios.expense_overrides IS
  'Array of sparse expense patches: [{category, item, amount}]. Keyed by (category, item) compound. Only amount field is overrideable in Stage 2c; adding/removing expense rows is out of scope.';
