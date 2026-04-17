import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Fetches tier levels for a set of owner IDs.
 * Returns a Map<owner_id, tier_level> for use in priority sort.
 */
export function useOwnerTierLevels(ownerIds: string[]) {
  // Stable key: sort + join to avoid cache misses on order changes
  const key = ownerIds.length > 0 ? [...ownerIds].sort().join(',') : '';

  return useQuery({
    queryKey: ['owner-tier-levels', key],
    queryFn: async () => {
      if (ownerIds.length === 0) return new Map<string, number>();

      const { data, error } = await supabase
        .from('user_memberships')
        .select('user_id, tier:membership_tiers(tier_level)')
        .in('user_id', ownerIds)
        .in('status', ['active', 'pending']);

      if (error) throw error;

      const map = new Map<string, number>();
      for (const row of data || []) {
        const tierLevel = (row.tier as unknown as { tier_level: number } | null)?.tier_level ?? 0;
        map.set(row.user_id, tierLevel);
      }
      return map;
    },
    enabled: ownerIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
}
