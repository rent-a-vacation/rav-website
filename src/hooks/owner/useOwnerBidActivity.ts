import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getRenterDisplayName } from '@/lib/displayName';
import type { BidEvent } from '@/types/ownerDashboard';

function mapBidStatus(status: string): BidEvent['event_type'] {
  switch (status) {
    case 'accepted': return 'accepted';
    case 'rejected': return 'rejected';
    case 'counter': return 'counter_offer';
    default: return 'new_bid';
  }
}

export function useOwnerBidActivity() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['owner-bid-activity', user?.id],
    queryFn: async (): Promise<BidEvent[]> => {
      const { data, error } = await supabase
        .from('listing_bids')
        .select(`
          id, listing_id, bidder_id, bid_amount, status, created_at,
          listing:listings!inner(owner_id, property:properties!inner(resort_name)),
          bidder:profiles!listing_bids_bidder_id_fkey(id, full_name, email)
        `)
        .eq('listing.owner_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!data) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return data.map((bid: any) => {
        const name = getRenterDisplayName({
          fullName: bid.bidder?.full_name,
          email: bid.bidder?.email,
          userId: bid.bidder?.id ?? bid.bidder_id,
        });
        return {
          id: bid.id,
          listing_id: bid.listing_id,
          property_name: bid.listing?.property?.resort_name || 'Unknown',
          event_type: mapBidStatus(bid.status),
          amount: bid.bid_amount,
          traveler_initial: name
            .replace(/^(Renter|Owner|User)\s+/, '')
            .replace(/^#/, '')
            .charAt(0)
            .toUpperCase() || '?',
          created_at: bid.created_at,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
  });
}
