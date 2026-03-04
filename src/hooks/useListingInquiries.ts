import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';

export interface ListingInquiry {
  id: string;
  listing_id: string;
  asker_id: string;
  owner_id: string;
  subject: string;
  created_at: string;
  updated_at: string;
}

export interface InquiryMessage {
  id: string;
  inquiry_id: string;
  sender_id: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender?: { full_name: string | null };
}

/** Fetch inquiries for a listing (owner view) */
export function useListingInquiries(listingId: string | undefined) {
  return useQuery({
    queryKey: ['listing-inquiries', listingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_inquiries')
        .select('*')
        .eq('listing_id', listingId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as ListingInquiry[];
    },
    enabled: !!listingId,
  });
}

/** Fetch user's own inquiries */
export function useMyInquiries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-inquiries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('listing_inquiries')
        .select('*')
        .eq('asker_id', user!.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as ListingInquiry[];
    },
    enabled: !!user,
  });
}

/** Fetch messages in an inquiry thread (with Realtime) */
export function useInquiryMessages(inquiryId: string | undefined) {
  // Realtime: instant message updates
  useRealtimeSubscription({
    table: 'inquiry_messages',
    event: 'INSERT',
    filter: inquiryId ? `inquiry_id=eq.${inquiryId}` : undefined,
    invalidateKeys: inquiryId ? [['inquiry-messages', inquiryId]] : undefined,
    enabled: !!inquiryId,
  });

  return useQuery({
    queryKey: ['inquiry-messages', inquiryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inquiry_messages')
        .select('*, sender:profiles!inquiry_messages_sender_id_fkey(full_name)')
        .eq('inquiry_id', inquiryId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as InquiryMessage[];
    },
    enabled: !!inquiryId,
  });
}

/** Create a new inquiry + first message */
export function useCreateInquiry() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      listing_id: string;
      owner_id: string;
      subject: string;
      message: string;
    }) => {
      // Create inquiry
      const { data: inquiry, error: inquiryError } = await supabase
        .from('listing_inquiries')
        .insert({
          listing_id: params.listing_id,
          asker_id: user!.id,
          owner_id: params.owner_id,
          subject: params.subject,
        } as never)
        .select()
        .single();

      if (inquiryError) throw inquiryError;

      // Create first message
      const { error: msgError } = await supabase
        .from('inquiry_messages')
        .insert({
          inquiry_id: inquiry.id,
          sender_id: user!.id,
          body: params.message,
        } as never);

      if (msgError) throw msgError;

      // Insert notification for the owner
      await supabase.from('notifications').insert({
        user_id: params.owner_id,
        type: 'message_received',
        title: 'New Inquiry',
        message: `A traveler has a question about your listing: "${params.subject}"`,
        listing_id: params.listing_id,
      } as never);

      return inquiry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['listing-inquiries', data.listing_id] });
      queryClient.invalidateQueries({ queryKey: ['my-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['inquiry-count'] });
    },
  });
}

/** Send a reply in an inquiry thread */
export function useSendInquiryMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { inquiry_id: string; body: string }) => {
      const { data, error } = await supabase
        .from('inquiry_messages')
        .insert({
          inquiry_id: params.inquiry_id,
          sender_id: user!.id,
          body: params.body,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['inquiry-messages', params.inquiry_id] });
    },
  });
}

/** Count of inquiries for a listing (social proof) */
export function useInquiryCount(listingId: string | undefined) {
  return useQuery({
    queryKey: ['inquiry-count', listingId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('listing_inquiries')
        .select('*', { count: 'exact', head: true })
        .eq('listing_id', listingId!);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000,
  });
}
