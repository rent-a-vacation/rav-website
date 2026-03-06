-- Migration 042: Dynamic Pricing Data
-- Adds get_dynamic_pricing_data() RPC for historical pricing analytics
-- Used by the dynamic pricing suggestion feature (#99)

CREATE OR REPLACE FUNCTION public.get_dynamic_pricing_data(
  p_brand TEXT,
  p_location TEXT,
  p_bedrooms INTEGER,
  p_check_in_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seasonal JSONB;
  v_market_avg NUMERIC;
  v_comparable_count INTEGER;
  v_pending_bids INTEGER;
  v_saved_searches INTEGER;
BEGIN
  -- 1. Monthly averages from completed bookings (last 12 months)
  --    Uses actual booking prices (what really sold) not listing prices
  SELECT
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'month', m.month_num,
        'avgNightlyRate', m.avg_rate,
        'bookingCount', m.cnt
      )
      ORDER BY m.month_num
    ), '[]'::jsonb)
  INTO v_seasonal
  FROM (
    SELECT
      EXTRACT(MONTH FROM l.check_in_date)::INTEGER AS month_num,
      ROUND(AVG(
        CASE
          WHEN l.nightly_rate > 0 THEN l.nightly_rate
          ELSE b.total_amount / GREATEST(
            EXTRACT(DAY FROM (l.check_out_date - l.check_in_date)), 1
          )
        END
      ))::NUMERIC AS avg_rate,
      COUNT(*)::INTEGER AS cnt
    FROM bookings b
    JOIN listings l ON b.listing_id = l.id
    JOIN properties p ON l.property_id = p.id
    WHERE b.status IN ('confirmed', 'completed')
      AND p.brand ILIKE p_brand
      AND p.location ILIKE '%' || split_part(p_location, ',', 1) || '%'
      AND p.bedrooms = p_bedrooms
      AND b.created_at >= NOW() - INTERVAL '12 months'
    GROUP BY month_num
  ) m;

  -- 2. Overall market average from active listings (same brand/location/bedrooms)
  SELECT
    COALESCE(ROUND(AVG(l.nightly_rate)), 0),
    COUNT(*)::INTEGER
  INTO v_market_avg, v_comparable_count
  FROM listings l
  JOIN properties p ON l.property_id = p.id
  WHERE l.status = 'active'
    AND l.nightly_rate > 0
    AND p.brand ILIKE p_brand
    AND p.location ILIKE '%' || split_part(p_location, ',', 1) || '%'
    AND p.bedrooms = p_bedrooms;

  -- 3. Pending bids on comparable listings (demand signal)
  SELECT COUNT(*)::INTEGER
  INTO v_pending_bids
  FROM listing_bids lb
  JOIN listings l ON lb.listing_id = l.id
  JOIN properties p ON l.property_id = p.id
  WHERE lb.status = 'pending'
    AND p.brand ILIKE p_brand
    AND p.location ILIKE '%' || split_part(p_location, ',', 1) || '%'
    AND p.bedrooms = p_bedrooms
    AND l.check_in_date BETWEEN p_check_in_date - 30 AND p_check_in_date + 30;

  -- 4. Saved searches matching this criteria (demand signal)
  SELECT COUNT(*)::INTEGER
  INTO v_saved_searches
  FROM saved_searches ss
  WHERE ss.search_criteria->>'destination' ILIKE '%' || split_part(p_location, ',', 1) || '%'
    AND ss.created_at >= NOW() - INTERVAL '30 days';

  RETURN jsonb_build_object(
    'seasonalData', v_seasonal,
    'marketAvg', v_market_avg,
    'comparableCount', v_comparable_count,
    'pendingBidCount', v_pending_bids,
    'savedSearchCount', v_saved_searches
  );
END;
$$;
