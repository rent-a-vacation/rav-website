-- ============================================================
-- Migration 056: Multi-Year Event Generation (#339)
-- ------------------------------------------------------------
-- Adds the RPC that copies event_instances forward from a source
-- year to a target year for every active template, so staff don't
-- have to hand-create 30+ rows every December.
--
-- Semantics:
--   * annual_fixed     — dates carry over cleanly; date_confirmed = true.
--   * annual_floating  — structure copies over but date_confirmed = false
--                        and auto_generated = true. Staff confirms each
--                        new date via the existing "Confirm date" badge.
--   * one_time         — never auto-generated.
--
-- Idempotent: skips instances that already exist for
--   (event_id, destination, year). Safe to re-run.
-- ============================================================

CREATE OR REPLACE FUNCTION public.generate_event_instances_for_year(
  p_year         INT,
  p_source_year  INT DEFAULT NULL
)
RETURNS TABLE (
  created_count   INT,
  skipped_count   INT,
  confirmed_count INT,
  unconfirmed_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_year     INT := COALESCE(p_source_year, p_year - 1);
  v_created         INT := 0;
  v_skipped         INT := 0;
  v_confirmed       INT := 0;
  v_unconfirmed     INT := 0;
  r                 RECORD;
  v_new_start       DATE;
  v_new_end         DATE;
  v_confirmed_flag  BOOL;
  v_exists          BOOL;
BEGIN
  -- Admin-only
  IF NOT public.is_rav_team(auth.uid()) THEN
    RAISE EXCEPTION 'Only RAV staff can generate event instances';
  END IF;

  IF p_year <= v_source_year THEN
    RAISE EXCEPTION 'Target year (%) must be after source year (%)', p_year, v_source_year;
  END IF;

  FOR r IN
    SELECT
      ei.event_id,
      ei.destination,
      ei.event_date,
      ei.end_date,
      ei.priority,
      ei.notes,
      se.recurrence_type
    FROM public.event_instances ei
    JOIN public.seasonal_events se ON se.id = ei.event_id
    WHERE ei.year = v_source_year
      AND ei.status = 'active'
      AND se.active = true
      AND se.recurrence_type IN ('annual_fixed', 'annual_floating')
  LOOP
    -- Dedup: skip if a row already exists for (event_id, destination, year).
    -- Use IS NOT DISTINCT FROM so NULL destinations compare equal.
    SELECT EXISTS(
      SELECT 1 FROM public.event_instances
      WHERE event_id = r.event_id
        AND destination IS NOT DISTINCT FROM r.destination
        AND year = p_year
    ) INTO v_exists;

    IF v_exists THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Shift dates forward by (p_year - v_source_year) years.
    v_new_start := r.event_date + ((p_year - v_source_year) || ' years')::INTERVAL;
    v_new_end   := CASE
      WHEN r.end_date IS NULL THEN NULL
      ELSE r.end_date + ((p_year - v_source_year) || ' years')::INTERVAL
    END;

    -- Fixed events carry their confirmed status forward; floating events
    -- need a human to re-check the shifted date.
    v_confirmed_flag := (r.recurrence_type = 'annual_fixed');

    INSERT INTO public.event_instances (
      event_id, destination, year, event_date, end_date,
      priority, status, auto_generated, date_confirmed, notes
    ) VALUES (
      r.event_id, r.destination, p_year, v_new_start, v_new_end,
      r.priority, 'active', true, v_confirmed_flag,
      COALESCE(r.notes, '') ||
        CASE WHEN COALESCE(r.notes, '') = '' THEN '' ELSE E'\n' END ||
        format('Auto-generated from %s instance on %s', v_source_year, NOW()::DATE)
    );

    v_created := v_created + 1;
    IF v_confirmed_flag THEN
      v_confirmed := v_confirmed + 1;
    ELSE
      v_unconfirmed := v_unconfirmed + 1;
    END IF;
  END LOOP;

  RETURN QUERY SELECT v_created, v_skipped, v_confirmed, v_unconfirmed;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_event_instances_for_year(INT, INT) TO authenticated;
