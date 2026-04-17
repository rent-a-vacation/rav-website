import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type ConciergeCategory = 'general' | 'booking_help' | 'complaint' | 'recommendation';
export type ConciergeStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ConciergeRequest {
  id: string;
  traveler_id: string;
  subject: string;
  description: string;
  category: ConciergeCategory;
  status: ConciergeStatus;
  assigned_to: string | null;
  resolution_notes: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConciergeRequestWithAssignee extends ConciergeRequest {
  assignee?: { full_name: string; email: string } | null;
  traveler?: { full_name: string; email: string } | null;
}

export const CONCIERGE_CATEGORIES: { value: ConciergeCategory; label: string }[] = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'booking_help', label: 'Booking Help' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'recommendation', label: 'Recommendation' },
];

export const CONCIERGE_STATUSES: { value: ConciergeStatus; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

/** Fetch current user's concierge requests */
export function useMyConciergeRequests() {
  const { user } = useAuth();

  return useQuery<ConciergeRequest[]>({
    queryKey: ['concierge-requests', 'mine', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concierge_requests')
        .select('*')
        .eq('traveler_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ConciergeRequest[];
    },
    enabled: !!user,
  });
}

/** Create a new concierge request */
export function useCreateConciergeRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { subject: string; description: string; category: ConciergeCategory }) => {
      const { data, error } = await supabase
        .from('concierge_requests')
        .insert({
          traveler_id: user!.id,
          subject: input.subject,
          description: input.description,
          category: input.category,
        })
        .select()
        .single();

      if (error) throw error;
      return data as ConciergeRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concierge-requests'] });
    },
  });
}

/** Admin: fetch all concierge requests with traveler + assignee info */
export function useAdminConciergeRequests() {
  return useQuery<ConciergeRequestWithAssignee[]>({
    queryKey: ['concierge-requests', 'admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('concierge_requests')
        .select(`
          *,
          traveler:profiles!concierge_requests_traveler_id_fkey(full_name, email),
          assignee:profiles!concierge_requests_assigned_to_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ConciergeRequestWithAssignee[];
    },
  });
}

/** Admin: update a concierge request (assign, change status, add notes) */
export function useUpdateConciergeRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      status?: ConciergeStatus;
      assigned_to?: string | null;
      resolution_notes?: string;
    }) => {
      const updates: Record<string, unknown> = {};
      if (input.status !== undefined) updates.status = input.status;
      if (input.assigned_to !== undefined) updates.assigned_to = input.assigned_to;
      if (input.resolution_notes !== undefined) updates.resolution_notes = input.resolution_notes;
      if (input.status === 'resolved') updates.resolved_at = new Date().toISOString();

      const { error } = await supabase
        .from('concierge_requests')
        .update(updates)
        .eq('id', input.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['concierge-requests'] });
    },
  });
}
