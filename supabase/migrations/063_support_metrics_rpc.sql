-- Migration 063: get_support_metrics RPC
-- Phase 22 D2 (#411) — DEC-036.
--
-- Admin-facing aggregation over support_conversations + support_messages.
-- Called from the Support Interactions tab. One round trip, server-side
-- median via percentile_cont on user→assistant response gaps.
--
-- Access: wrapper around RLS-protected tables; explicit is_rav_team guard
-- returns an empty result to non-team callers (belt + suspenders).

CREATE OR REPLACE FUNCTION public.get_support_metrics(
  date_from timestamptz,
  date_to   timestamptz
)
RETURNS TABLE (
  total_conversations      bigint,
  ended_conversations      bigint,
  deflected_count          bigint,
  escalated_count          bigint,
  deflection_pct           numeric,
  escalation_pct           numeric,
  median_response_ms       numeric,
  rated_count              bigint,
  positive_rating_count    bigint,
  negative_rating_count    bigint
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Non-team callers get an empty result rather than an error (keeps the
  -- admin UI's error handling simple and never leaks aggregates).
  IF NOT public.is_rav_team(auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH window AS (
    SELECT *
    FROM public.support_conversations
    WHERE started_at >= date_from
      AND started_at <  date_to
  ),
  response_gaps AS (
    -- For each assistant turn, the ms gap to the *immediately preceding*
    -- user turn in the same conversation. Captures "time to reply" per turn.
    SELECT
      EXTRACT(EPOCH FROM (m.created_at - prev.created_at)) * 1000.0 AS gap_ms
    FROM public.support_messages m
    JOIN public.support_messages prev
      ON prev.conversation_id = m.conversation_id
     AND prev.turn_index      = m.turn_index - 1
     AND prev.turn_type       = 'user'
    JOIN window w ON w.id = m.conversation_id
    WHERE m.turn_type = 'assistant'
  )
  SELECT
    (SELECT COUNT(*) FROM window)                                          AS total_conversations,
    (SELECT COUNT(*) FROM window WHERE ended_at IS NOT NULL)               AS ended_conversations,
    (SELECT COUNT(*) FROM window
       WHERE ended_at IS NOT NULL AND escalated_at IS NULL)                AS deflected_count,
    (SELECT COUNT(*) FROM window WHERE escalated_at IS NOT NULL)           AS escalated_count,
    CASE
      WHEN (SELECT COUNT(*) FROM window WHERE ended_at IS NOT NULL) = 0 THEN NULL
      ELSE ROUND(
        100.0 * (SELECT COUNT(*) FROM window
                   WHERE ended_at IS NOT NULL AND escalated_at IS NULL)
             / (SELECT COUNT(*) FROM window WHERE ended_at IS NOT NULL),
        1
      )
    END                                                                    AS deflection_pct,
    CASE
      WHEN (SELECT COUNT(*) FROM window) = 0 THEN NULL
      ELSE ROUND(
        100.0 * (SELECT COUNT(*) FROM window WHERE escalated_at IS NOT NULL)
             / (SELECT COUNT(*) FROM window),
        1
      )
    END                                                                    AS escalation_pct,
    (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY gap_ms) FROM response_gaps) AS median_response_ms,
    (SELECT COUNT(*) FROM window WHERE user_rating IS NOT NULL)            AS rated_count,
    (SELECT COUNT(*) FROM window WHERE user_rating = 1)                    AS positive_rating_count,
    (SELECT COUNT(*) FROM window WHERE user_rating = -1)                   AS negative_rating_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_support_metrics(timestamptz, timestamptz) TO authenticated;

COMMENT ON FUNCTION public.get_support_metrics(timestamptz, timestamptz) IS
  'Aggregates support conversation metrics for the admin Support Interactions tab (#411). Returns empty rows to non-RAV-team callers.';
