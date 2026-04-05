-- Migration 050: Subscription metrics RPC for admin MRR dashboard
-- Returns aggregated subscription data: MRR, active/cancelled counts, tier breakdown.

CREATE OR REPLACE FUNCTION get_subscription_metrics()
RETURNS JSON
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_mrr_cents', (
      SELECT COALESCE(SUM(mt.monthly_price_cents), 0)
      FROM user_memberships um
      JOIN membership_tiers mt ON mt.id = um.tier_id
      WHERE um.status = 'active' AND mt.monthly_price_cents > 0
    ),
    'active_paid_count', (
      SELECT COUNT(*)
      FROM user_memberships um
      JOIN membership_tiers mt ON mt.id = um.tier_id
      WHERE um.status = 'active' AND mt.monthly_price_cents > 0
    ),
    'active_free_count', (
      SELECT COUNT(*)
      FROM user_memberships um
      JOIN membership_tiers mt ON mt.id = um.tier_id
      WHERE um.status = 'active' AND mt.monthly_price_cents = 0
    ),
    'cancelled_count', (
      SELECT COUNT(*) FROM user_memberships WHERE status = 'cancelled'
    ),
    'override_count', (
      SELECT COUNT(*) FROM user_memberships WHERE admin_override = TRUE AND status = 'active'
    ),
    'tier_breakdown', (
      SELECT COALESCE(json_agg(json_build_object(
        'tier_key', mt.tier_key,
        'tier_name', mt.tier_name,
        'role_category', mt.role_category,
        'monthly_price_cents', mt.monthly_price_cents,
        'user_count', sub.cnt,
        'mrr_cents', sub.mrr
      ) ORDER BY mt.role_category, mt.tier_level), '[]'::json)
      FROM (
        SELECT um.tier_id, COUNT(*) AS cnt, SUM(mt2.monthly_price_cents) AS mrr
        FROM user_memberships um
        JOIN membership_tiers mt2 ON mt2.id = um.tier_id
        WHERE um.status = 'active'
        GROUP BY um.tier_id
      ) sub
      JOIN membership_tiers mt ON mt.id = sub.tier_id
    )
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_subscription_metrics() TO authenticated;
