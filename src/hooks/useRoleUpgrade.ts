import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { toast } from 'sonner';
import type { RoleUpgradeRequest, AppRole } from '@/types/database';

// Fetch user's own role upgrade requests (with Realtime updates)
export function useMyRoleUpgradeRequests() {
  const { user } = useAuth();

  // Realtime: auto-refresh when admin approves/rejects
  useRealtimeSubscription({
    table: 'role_upgrade_requests',
    event: 'UPDATE',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    invalidateKeys: [['role-upgrade-requests'], ['roles']],
    enabled: !!user,
  });

  return useQuery({
    queryKey: ['role-upgrade-requests', 'mine', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('role_upgrade_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as RoleUpgradeRequest[];
    },
    enabled: !!user,
  });
}

// Check if user has a pending request for a specific role
export function useHasPendingRequest(role: AppRole) {
  const { data: requests } = useMyRoleUpgradeRequests();
  return requests?.some((r) => r.requested_role === role && r.status === 'pending') ?? false;
}

// Get the latest request for a specific role
export function useLatestRequestForRole(role: AppRole) {
  const { data: requests } = useMyRoleUpgradeRequests();
  return requests?.find((r) => r.requested_role === role) ?? null;
}

// Request a role upgrade
export function useRequestRoleUpgrade() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ role, reason }: { role: AppRole; reason?: string }) => {
      const { data, error } = await supabase.rpc('request_role_upgrade' as never, {
        _requested_role: role,
        _reason: reason || null,
      } as never);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-upgrade-requests'] });
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit role upgrade request');
    },
  });
}

// Admin: Fetch all pending role upgrade requests
export function usePendingRoleUpgradeRequests() {
  return useQuery({
    queryKey: ['role-upgrade-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_upgrade_requests')
        .select('*, user:profiles!role_upgrade_requests_user_id_fkey(id, email, full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as (RoleUpgradeRequest & {
        user: { id: string; email: string; full_name: string | null };
      })[];
    },
  });
}

// Admin: Approve a role upgrade request + notify user
export function useApproveRoleUpgrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (request: { id: string; user_id: string; user_email?: string; user_name?: string; requested_role: string }) => {
      // 1. Approve the role
      const { data, error } = await supabase.rpc('approve_role_upgrade' as never, {
        _request_id: request.id,
        _approved_by: user?.id,
      } as never);
      if (error) throw error;

      // 2. Insert in-app notification for the user
      await supabase.from('notifications').insert({
        user_id: request.user_id,
        type: 'role_upgrade_approved',
        title: 'Role Upgrade Approved',
        message: `Your request to become a ${request.requested_role.replace('_', ' ')} has been approved! You now have access to all ${request.requested_role.replace('_', ' ')} features.`,
      } as never);

      // 3. Send email notification via edge function (fire-and-forget)
      if (request.user_email) {
        supabase.functions.invoke('send-email', {
          body: {
            to: request.user_email,
            subject: 'Your Role Upgrade Has Been Approved!',
            html: `<p>Hi ${request.user_name || 'there'},</p>
<p>Great news! Your request to become a <strong>${request.requested_role.replace('_', ' ')}</strong> on Rent-A-Vacation has been approved.</p>
<p>You can now access all ${request.requested_role.replace('_', ' ')} features. Log in to get started!</p>
<p>— The Rent-A-Vacation Team</p>`,
          },
        }).catch(() => { /* email is best-effort */ });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-upgrade-requests'] });
      toast.success('Role upgrade approved!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to approve role upgrade');
    },
  });
}

// Admin: Reject a role upgrade request
export function useRejectRoleUpgrade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('reject_role_upgrade' as never, {
        _request_id: requestId,
        _rejected_by: user?.id,
        _reason: reason || null,
      } as never);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-upgrade-requests'] });
      toast.success('Role upgrade rejected');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reject role upgrade');
    },
  });
}
