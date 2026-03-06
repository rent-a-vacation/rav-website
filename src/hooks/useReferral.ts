import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { ReferralStats } from "@/lib/referral";

/**
 * Get or create the current user's referral code.
 */
export function useReferralCode() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_or_create_referral_code");
      if (error) throw error;
      return data as string;
    },
    enabled: !!user,
    staleTime: Infinity, // Code never changes
  });
}

/**
 * Get referral stats for the current user.
 */
export function useReferralStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_referral_stats");
      if (error) throw error;
      return data as unknown as ReferralStats;
    },
    enabled: !!user,
    staleTime: 60_000, // 1 min cache
  });
}

/**
 * Get the list of referred users (for the referral dashboard).
 */
export function useReferralList() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["referral-list", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("id, referred_user_id, referral_code, status, reward_type, reward_amount, converted_at, created_at")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

/**
 * Record a referral during signup.
 */
export function useRecordReferral() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ referralCode, newUserId }: { referralCode: string; newUserId: string }) => {
      const { error } = await supabase.rpc("record_referral", {
        p_referral_code: referralCode,
        p_new_user_id: newUserId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-stats"] });
    },
  });
}
