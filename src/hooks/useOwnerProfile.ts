import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface OwnerProfileSummary {
  first_name: string;
  avatar_url: string | null;
  member_since: string;
  is_verified: boolean;
  listing_count: number;
  review_count: number;
  avg_rating: number;
  response_time_hours: number | null;
}

export function useOwnerProfile(ownerId: string | undefined) {
  return useQuery({
    queryKey: ['owner-profile', ownerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_owner_profile_summary' as never, {
        _owner_id: ownerId,
      } as never);
      if (error) throw error;
      return data as OwnerProfileSummary;
    },
    enabled: !!ownerId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
