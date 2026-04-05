import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface ListingLimitResult {
  canCreate: boolean;
  currentCount: number;
  maxListings: number | null;
  tierName: string | null;
  isLoading: boolean;
}

export function useCheckListingLimit(): ListingLimitResult {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["listing-limit", user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check the RPC gate
      const { data: canCreate, error: rpcError } = await supabase.rpc(
        "check_listing_limit",
        { _owner_id: user.id }
      );
      if (rpcError) throw rpcError;

      // Get current active/pending listing count
      const { count, error: countError } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .in("status", ["active", "pending_approval"]);
      if (countError) throw countError;

      // Get tier info for display
      const { data: membership, error: tierError } = await supabase
        .from("user_memberships")
        .select("tier:membership_tiers(tier_name, max_active_listings)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (tierError) throw tierError;

      const tier = membership?.tier as { tier_name: string; max_active_listings: number | null } | null;

      return {
        canCreate: canCreate ?? true,
        currentCount: count ?? 0,
        maxListings: tier ? tier.max_active_listings : 3, // null = unlimited (Business), default 3 (Free) when no tier found
        tierName: tier?.tier_name ?? "Free",
      };
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes — listing count changes more often
  });

  return {
    canCreate: data?.canCreate ?? true,
    currentCount: data?.currentCount ?? 0,
    maxListings: data?.maxListings ?? null,
    tierName: data?.tierName ?? null,
    isLoading,
  };
}
