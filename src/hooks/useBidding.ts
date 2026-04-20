// Hooks for the Bidding System
// Provides data fetching and mutations for bids, travel requests, and proposals

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type {
  ListingBid,
  ListingBidWithDetails,
  BidOnListing,
  ListingWithBidding,
  TravelRequest,
  TravelRequestWithDetails,
  TravelProposal,
  TravelProposalWithDetails,
  Notification,
  NotificationPreferences,
  CreateBidInput,
  CreateTravelRequestInput,
  CreateProposalInput,
  OpenListingForBiddingInput,
  BidStatus,
  TravelRequestStatus,
  ProposalStatus,
} from '@/types/bidding';

// ============================================================
// LISTING BIDS - Owner-initiated bidding
// ============================================================

// Fetch listings open for bidding (for travelers — excludes own listings)
export function useListingsOpenForBidding() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['listings', 'open-for-bidding', user?.id],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      let query = supabase
        .from('listings')
        .select(`
          *,
          property:properties(*)
        `)
        .eq('open_for_bidding', true)
        .eq('status', 'active')
        .gt('bidding_ends_at', new Date().toISOString())
        .gte('check_out_date', today);

      // Exclude the current user's own listings
      if (user?.id) {
        query = query.neq('owner_id', user.id);
      }

      const { data, error } = await query.order('bidding_ends_at', { ascending: true });

      if (error) throw error;
      return data as ListingWithBidding[];
    },
  });
}

// Fetch bids for a specific listing (for owners)
export function useBidsForListing(listingId: string | undefined) {
  return useQuery({
    queryKey: ['bids', 'listing', listingId],
    queryFn: async () => {
      if (!listingId) return [];
      
      const { data, error } = await supabase
        .from('listing_bids')
        .select(`
          *,
          bidder:profiles!listing_bids_bidder_id_fkey(*)
        `)
        .eq('listing_id', listingId)
        .order('bid_amount', { ascending: false });

      if (error) throw error;
      return data as BidOnListing[];
    },
    enabled: !!listingId,
  });
}

// Fetch user's own bids (for travelers)
export function useMyBids() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['bids', 'my-bids', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('listing_bids')
        .select(`
          *,
          listing:listings(*, property:properties(*), owner:profiles!listings_owner_id_fkey(id, full_name))
        `)
        .eq('bidder_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ListingBidWithDetails[];
    },
    enabled: !!user,
  });
}

// Create a bid
export function useCreateBid() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBidInput) => {
      if (!user) throw new Error('Must be logged in');
      
      const { data, error } = await supabase
        .from('listing_bids')
        .insert({
          listing_id: input.listing_id,
          bidder_id: user.id,
          bid_amount: input.bid_amount,
          message: input.message || null,
          guest_count: input.guest_count,
          requested_check_in: input.requested_check_in || null,
          requested_check_out: input.requested_check_out || null,
        } as never)
        .select('*, listing:listings(owner_id, property:properties(resort_name))')
        .single();

      if (error) throw error;

      const owner_id = (data as { listing?: { owner_id?: string } } | null)?.listing?.owner_id;
      const resort_name = (data as { listing?: { property?: { resort_name?: string } } } | null)
        ?.listing?.property?.resort_name;
      if (owner_id) {
        supabase.functions.invoke('notification-dispatcher', {
          body: {
            type_key: 'new_bid_received',
            user_id: owner_id,
            payload: {
              title: 'New offer received',
              message: resort_name
                ? `$${input.bid_amount.toLocaleString()} offer on ${resort_name}`
                : `New $${input.bid_amount.toLocaleString()} offer on your listing`,
              bid_id: (data as { id?: string } | null)?.id,
              listing_id: input.listing_id,
            },
          },
        }).catch(() => {
          // Notification dispatch is best-effort; don't fail the bid creation
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit bid');
    },
  });
}

// Update bid status (owners: accept/reject/counter; renters: withdraw, accept/decline counter)
export function useUpdateBidStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      bidId, 
      status, 
      counterOfferAmount,
      counterOfferMessage 
    }: { 
      bidId: string; 
      status: BidStatus;
      counterOfferAmount?: number;
      counterOfferMessage?: string;
    }) => {
      const updateData: Record<string, unknown> = {
        status,
        responded_at: new Date().toISOString()
      };
      
      if (counterOfferAmount !== undefined) {
        updateData.counter_offer_amount = counterOfferAmount;
        updateData.counter_offer_message = counterOfferMessage || null;
      }

      const { data, error } = await supabase
        .from('listing_bids')
        .update(updateData as never)
        .eq('id', bidId)
        .select('*, listing:listings(owner_id, property_id)')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['bids'] });

      // Insert conversation event for bid status change (fire-and-forget)
      const listing = (data as Record<string, unknown>).listing as { owner_id: string; property_id: string } | null;
      if (listing) {
        const eventType = variables.status === 'accepted' ? 'bid_accepted'
          : variables.status === 'rejected' ? 'bid_rejected'
          : variables.counterOfferAmount ? 'bid_countered'
          : null;
        if (eventType) {
          supabase.rpc('get_or_create_conversation', {
            p_owner_id: listing.owner_id,
            p_traveler_id: (data as Record<string, unknown>).bidder_id as string,
            p_property_id: listing.property_id,
            p_context_type: 'bid',
          }).then(({ data: convId }) => {
            if (convId) {
              supabase.rpc('insert_conversation_event', {
                p_conversation_id: convId,
                p_event_type: eventType,
                p_event_data: {
                  amount: (data as Record<string, unknown>).bid_amount,
                  counter: variables.counterOfferAmount ?? null,
                },
              });
            }
          });
        }
      }

      const message = variables.status === 'accepted'
        ? 'Offer accepted!'
        : variables.status === 'rejected'
          ? 'Offer declined'
          : variables.status === 'withdrawn'
            ? 'Offer withdrawn'
            : 'Offer updated';
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update Offer');
    },
  });
}

// Open listing for bidding
export function useOpenListingForBidding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: OpenListingForBiddingInput) => {
      const { data, error } = await supabase
        .from('listings')
        .update({
          open_for_bidding: true,
          bidding_ends_at: input.bidding_ends_at,
          min_bid_amount: input.min_bid_amount || null,
          reserve_price: input.reserve_price || null,
          allow_counter_offers: input.allow_counter_offers ?? true,
        } as never)
        .eq('id', input.listing_id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      toast.success('Listing is now open for bidding!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to open listing for bidding');
    },
  });
}

// ============================================================
// TRAVEL REQUESTS - Traveler-initiated
// ============================================================

// Fetch open travel requests (for owners to browse)
export function useOpenTravelRequests() {
  return useQuery({
    queryKey: ['travel-requests', 'open'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('travel_requests')
        .select(`
          *,
          traveler:profiles!travel_requests_traveler_id_fkey(*)
        `)
        .eq('status', 'open')
        .gt('proposals_deadline', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TravelRequestWithDetails[];
    },
  });
}

// Fetch user's own travel requests
export function useMyTravelRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['travel-requests', 'mine', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('travel_requests')
        .select('*')
        .eq('traveler_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TravelRequest[];
    },
    enabled: !!user,
  });
}

// Create travel request
export function useCreateTravelRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateTravelRequestInput) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('travel_requests')
        .insert({
          traveler_id: user.id,
          ...input,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel-requests'] });
      toast.success('Travel request posted!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create travel request');
    },
  });
}

// Update travel request status
export function useUpdateTravelRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      requestId, 
      status 
    }: { 
      requestId: string; 
      status: TravelRequestStatus;
    }) => {
      const { data, error } = await supabase
        .from('travel_requests')
        .update({ status } as never)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['travel-requests'] });
      toast.success('Request updated');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update request');
    },
  });
}

// ============================================================
// TRAVEL PROPOSALS - Owner response to requests
// ============================================================

// Fetch proposals for a travel request (for travelers)
export function useProposalsForRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: ['proposals', 'request', requestId],
    queryFn: async () => {
      if (!requestId) return [];
      
      const { data, error } = await supabase
        .from('travel_proposals')
        .select(`
          *,
          property:properties(*),
          owner:profiles!travel_proposals_owner_id_fkey(*)
        `)
        .eq('request_id', requestId)
        .order('proposed_price', { ascending: true });

      if (error) throw error;
      return data as TravelProposalWithDetails[];
    },
    enabled: !!requestId,
  });
}

// Fetch owner's own proposals
export function useMyProposals() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['proposals', 'mine', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('travel_proposals')
        .select(`
          *,
          property:properties(*),
          request:travel_requests(*)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TravelProposalWithDetails[];
    },
    enabled: !!user,
  });
}

// Create proposal
export function useCreateProposal() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('travel_proposals')
        .insert({
          ...input,
          owner_id: user.id,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });

      // Wire to unified conversation layer (fire-and-forget)
      // Look up traveler_id from the travel request
      const proposal = data as Record<string, unknown>;
      if (proposal.request_id && proposal.property_id) {
        supabase
          .from('travel_requests')
          .select('traveler_id')
          .eq('id', proposal.request_id as string)
          .single()
          .then(({ data: request }) => {
            if (request?.traveler_id) {
              supabase.rpc('get_or_create_conversation', {
                p_owner_id: user!.id,
                p_traveler_id: request.traveler_id,
                p_property_id: proposal.property_id as string,
                p_listing_id: (proposal.listing_id as string) ?? null,
                p_context_type: 'travel_request',
                p_context_id: proposal.request_id as string,
              }).then(({ data: convId }) => {
                if (convId) {
                  supabase.rpc('insert_conversation_event', {
                    p_conversation_id: convId,
                    p_event_type: 'proposal_sent',
                    p_event_data: { proposal_id: proposal.id },
                  });
                }
              });
            }
          });
      }

      toast.success('Offer sent!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit proposal');
    },
  });
}

// Update proposal status (for travelers accepting/rejecting)
// When accepting a proposal that has no listing_id, auto-creates a listing
export function useUpdateProposalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proposalId,
      status
    }: {
      proposalId: string;
      status: ProposalStatus;
    }) => {
      // First, update the proposal status
      const { data: proposal, error } = await supabase
        .from('travel_proposals')
        .update({
          status,
          responded_at: new Date().toISOString()
        } as never)
        .eq('id', proposalId)
        .select('*, property:properties(*)')
        .single();

      if (error) throw error;

      // If accepted and no listing exists, auto-create one from proposal data
      if (status === 'accepted' && !proposal.listing_id) {
        const nights = Math.max(1, Math.ceil(
          (new Date(proposal.proposed_check_out).getTime() - new Date(proposal.proposed_check_in).getTime()) / (1000 * 60 * 60 * 24)
        ));
        const nightlyRate = Math.round(proposal.proposed_price / nights);
        const ownerPrice = nightlyRate * nights;
        const ravMarkup = Math.round(ownerPrice * 0.15);
        const finalPrice = ownerPrice + ravMarkup;

        const { data: listing, error: listingError } = await supabase
          .from('listings')
          .insert({
            property_id: proposal.property_id,
            owner_id: proposal.owner_id,
            check_in_date: proposal.proposed_check_in,
            check_out_date: proposal.proposed_check_out,
            nightly_rate: nightlyRate,
            owner_price: ownerPrice,
            rav_markup: ravMarkup,
            final_price: finalPrice,
            status: 'active',
            notes: `Auto-created from accepted travel request proposal`,
            cancellation_policy: 'moderate',
            source_type: 'wish_matched',
          } as never)
          .select()
          .single();

        if (listingError) throw listingError;

        // Link the listing back to the proposal
        await supabase
          .from('travel_proposals')
          .update({ listing_id: listing.id } as never)
          .eq('id', proposalId);

        return { ...proposal, listing_id: listing.id };
      }

      return proposal;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['travel-requests'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });

      // Insert conversation event for proposal status change (fire-and-forget)
      const proposal = data as Record<string, unknown>;
      if (proposal.property_id && proposal.owner_id && proposal.request_id) {
        supabase
          .from('travel_requests')
          .select('traveler_id')
          .eq('id', proposal.request_id as string)
          .single()
          .then(({ data: request }) => {
            if (request?.traveler_id) {
              supabase.rpc('get_or_create_conversation', {
                p_owner_id: proposal.owner_id as string,
                p_traveler_id: request.traveler_id,
                p_property_id: proposal.property_id as string,
                p_context_type: 'travel_request',
              }).then(({ data: convId }) => {
                if (convId) {
                  const eventType = variables.status === 'accepted' ? 'proposal_accepted' : 'proposal_rejected';
                  supabase.rpc('insert_conversation_event', {
                    p_conversation_id: convId,
                    p_event_type: eventType,
                    p_event_data: { proposal_id: proposal.id },
                  });
                }
              });
            }
          });
      }

      const message = variables.status === 'accepted'
        ? 'Offer accepted! You can now proceed to checkout.'
        : 'Offer updated';
      toast.success(message);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update proposal');
    },
  });
}

// ============================================================
// NOTIFICATIONS
// ============================================================

// Fetch user's notifications
export function useNotifications(limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id, limit],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Notification[];
    },
    enabled: !!user,
  });
}

// Get unread count
export function useUnreadNotificationCount() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', 'unread-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });
}

// Mark notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() } as never)
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Mark all as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Must be logged in');
      
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() } as never)
        .eq('user_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('All notifications marked as read');
    },
  });
}

// Notification preferences
export function useNotificationPreferences() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!user,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (preferences: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Must be logged in');

      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
        } as never)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Preferences saved');
    },
  });
}
