-- Migration 036: Owner Profile Summary RPC
-- Provides aggregated owner stats for trust signals on PropertyDetail

CREATE OR REPLACE FUNCTION get_owner_profile_summary(_owner_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'first_name', split_part(COALESCE(p.full_name, ''), ' ', 1),
    'avatar_url', p.avatar_url,
    'member_since', p.created_at,
    'is_verified', COALESCE(p.approval_status = 'approved', false),
    'listing_count', (
      SELECT count(*)
      FROM listings l
      JOIN properties prop ON l.property_id = prop.id
      WHERE prop.owner_id = _owner_id
      AND l.status IN ('active', 'booked')
    ),
    'review_count', COALESCE(rs.total_reviews, 0),
    'avg_rating', COALESCE(rs.avg_rating, 0),
    'response_time_hours', NULL
  )
  FROM profiles p
  LEFT JOIN LATERAL (
    SELECT count(*) as total_reviews, round(avg(r.rating)::numeric, 1) as avg_rating
    FROM reviews r
    JOIN properties prop ON r.property_id = prop.id
    WHERE prop.owner_id = _owner_id
  ) rs ON true
  WHERE p.id = _owner_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
