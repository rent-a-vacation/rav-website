// Post-approval onboarding gate
// Session 2 of WS2 Epic #317 — Story #319

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '@/lib/termsVersions';
import type { Profile } from '@/types/database';

/**
 * Returns true if the user needs to go through the post-approval onboarding gate.
 * Rules:
 * - Must be approved
 * - Must NOT have completed onboarding
 * - Must NOT be RAV team (admins bypass the gate entirely)
 */
export function needsOnboarding(profile: Profile | null, isRavTeam: boolean): boolean {
  if (!profile) return false;
  if (isRavTeam) return false;
  if (profile.approval_status !== 'approved') return false;
  return !profile.onboarding_completed_at;
}

/**
 * Marks onboarding complete.
 * - Writes audit row to terms_acceptance_log with acceptance_method 'post_approval_gate' (best-effort)
 * - Updates profile: onboarding_completed_at + current_terms_version + current_privacy_version
 *
 * The profile update is authoritative — if it fails, the mutation fails.
 * The audit log write is best-effort — a failure there is logged but doesn't block onboarding.
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      // Best-effort audit log write
      try {
        await supabase.from('terms_acceptance_log').insert({
          user_id: user.id,
          terms_version: CURRENT_TERMS_VERSION,
          privacy_version: CURRENT_PRIVACY_VERSION,
          terms_accepted: true,
          privacy_accepted: true,
          age_verified: true,
          acceptance_method: 'post_approval_gate',
          user_agent: navigator.userAgent,
        });
      } catch (auditError) {
        console.error('Failed to write terms_acceptance_log:', auditError);
      }

      // Authoritative profile update
      const { data, error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed_at: new Date().toISOString(),
          current_terms_version: CURRENT_TERMS_VERSION,
          current_privacy_version: CURRENT_PRIVACY_VERSION,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate auth-related queries so profile is refetched
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}
