import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { DEFAULT_COMMISSION } from "@/config/commission";

/**
 * Public commission rate hook — anonymous-safe.
 *
 * Reads the live platform commission rate from
 * `system_settings.platform_commission_rate` via the SECURITY DEFINER
 * RPC `get_platform_commission_rate()` (migration 080). The RPC is
 * granted to `anon`, so this hook works for non-authenticated browsers
 * computing prices on PropertyDetail / Rentals / Checkout.
 *
 * Returns rates as DECIMALS (e.g. 0.12 for 12%) so they slot directly
 * into `computeListingPricing(nightlyRate, nights, rate)` etc. without
 * needing to divide by 100.
 *
 * Falls back to DEFAULT_COMMISSION from src/config/commission.ts if
 * either the RPC fails or returns a row without the expected fields.
 * Issue #510.
 */

export interface CommissionRate {
  base: number; // 0.12 for 12%
  proDiscount: number; // 0.02 for 2pp off
  businessDiscount: number; // 0.04 for 4pp off
}

export type OwnerTier = "free" | "pro" | "business";

const COMMISSION_QUERY_KEY = ["commission-rate"] as const;
const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes — rate changes are rare

interface RpcRow {
  rate?: number;
  pro_discount?: number;
  business_discount?: number;
}

function rowToCommissionRate(row: RpcRow | null | undefined): CommissionRate {
  if (!row || typeof row !== "object") {
    return {
      base: DEFAULT_COMMISSION.base,
      proDiscount: DEFAULT_COMMISSION.proDiscount,
      businessDiscount: DEFAULT_COMMISSION.businessDiscount,
    };
  }
  const base = typeof row.rate === "number" ? row.rate / 100 : DEFAULT_COMMISSION.base;
  const proDiscount =
    typeof row.pro_discount === "number" ? row.pro_discount / 100 : DEFAULT_COMMISSION.proDiscount;
  const businessDiscount =
    typeof row.business_discount === "number"
      ? row.business_discount / 100
      : DEFAULT_COMMISSION.businessDiscount;
  return { base, proDiscount, businessDiscount };
}

export function useCommissionRate() {
  return useQuery<CommissionRate>({
    queryKey: COMMISSION_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_platform_commission_rate");
      if (error) {
        console.warn("[useCommissionRate] RPC failed, using DEFAULT_COMMISSION", error);
        return rowToCommissionRate(null);
      }
      return rowToCommissionRate(data as RpcRow);
    },
    staleTime: STALE_TIME_MS,
    placeholderData: rowToCommissionRate(null),
  });
}

/**
 * Effective commission rate for a given owner tier.
 * If no tier passed, returns the base rate.
 */
export function effectiveRate(rate: CommissionRate, tier: OwnerTier = "free"): number {
  switch (tier) {
    case "pro":
      return Math.max(0, rate.base - rate.proDiscount);
    case "business":
      return Math.max(0, rate.base - rate.businessDiscount);
    case "free":
    default:
      return rate.base;
  }
}

/**
 * Convenience: returns just the effective rate as a number (decimal),
 * pre-resolved for the given tier. Falls back to DEFAULT_COMMISSION.base
 * while the query is still loading. Suitable for price-display callers
 * that need a stable number to pass to computeListingPricing(...).
 */
export function useEffectiveCommissionRate(tier: OwnerTier = "free"): number {
  const { data } = useCommissionRate();
  return effectiveRate(
    data ?? {
      base: DEFAULT_COMMISSION.base,
      proDiscount: DEFAULT_COMMISSION.proDiscount,
      businessDiscount: DEFAULT_COMMISSION.businessDiscount,
    },
    tier,
  );
}

// Exported for tests that want to exercise the row -> CommissionRate
// translation in isolation.
export const __testing = { rowToCommissionRate };
