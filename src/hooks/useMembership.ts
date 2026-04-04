import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { MembershipTier, UserMembershipWithTier } from "@/types/database";

export function useMembershipTiers() {
  return useQuery<MembershipTier[]>({
    queryKey: ["membership-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_tiers")
        .select("*")
        .order("role_category")
        .order("tier_level");

      if (error) throw error;
      return (data as MembershipTier[]) || [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes — rarely changes
  });
}

export function useRenterTiers() {
  return useQuery<MembershipTier[]>({
    queryKey: ["membership-tiers", "traveler"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("role_category", "traveler")
        .order("tier_level");

      if (error) throw error;
      return (data as MembershipTier[]) || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useOwnerTiers() {
  return useQuery<MembershipTier[]>({
    queryKey: ["membership-tiers", "owner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membership_tiers")
        .select("*")
        .eq("role_category", "owner")
        .order("tier_level");

      if (error) throw error;
      return (data as MembershipTier[]) || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** @deprecated Use useRenterTiers instead */
export const useTravelerTiers = useRenterTiers;

export function useMyMembership() {
  const { user } = useAuth();

  return useQuery<UserMembershipWithTier | null>({
    queryKey: ["my-membership", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_memberships")
        .select("*, tier:membership_tiers(*)")
        .eq("user_id", user.id)
        .in("status", ["active", "cancelled", "pending"])
        .maybeSingle();

      if (error) throw error;
      return data as UserMembershipWithTier | null;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
