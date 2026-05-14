import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useMyMembership } from "./useMembership";
import { DEFAULT_COMMISSION } from "@/config/commission";

interface OwnerCommission {
  effectiveRate: number; // percent units, e.g. 12 for 12%
  tierDiscount: number;
  tierName: string;
  loading: boolean;
}

// Fallback in percent units. Sourced from DEFAULT_COMMISSION so this file
// does not re-encode DEC-041 (issue #510).
const FALLBACK_PERCENT = DEFAULT_COMMISSION.base * 100;

export function useOwnerCommission(): OwnerCommission {
  const { user } = useAuth();
  const { data: membership } = useMyMembership();

  const { data: rate, isLoading } = useQuery<number>({
    queryKey: ["owner-commission-rate", user?.id],
    queryFn: async () => {
      if (!user) return FALLBACK_PERCENT;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_owner_commission_rate", {
        _owner_id: user.id,
      });

      if (error) {
        console.error("Error fetching commission rate:", error);
        return FALLBACK_PERCENT;
      }

      return data ?? FALLBACK_PERCENT;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return {
    effectiveRate: rate ?? FALLBACK_PERCENT,
    tierDiscount: membership?.tier?.commission_discount_pct ?? 0,
    tierName: membership?.tier?.tier_name ?? "Free",
    loading: isLoading,
  };
}
