import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  suggestDynamicPrice,
  type DynamicPriceSuggestion,
  type SeasonalDataPoint,
} from "@/lib/dynamicPricing";

interface DynamicPricingRpcResult {
  seasonalData: SeasonalDataPoint[];
  marketAvg: number;
  comparableCount: number;
  pendingBidCount: number;
  savedSearchCount: number;
}

/**
 * Fetch dynamic pricing data from the RPC and compute a suggested nightly rate.
 *
 * Returns null when inputs are missing or data is insufficient.
 */
export function useDynamicPricing(
  brand: string | undefined,
  location: string | undefined,
  bedrooms: number | undefined,
  checkInDate: string | undefined
): { suggestion: DynamicPriceSuggestion | null; isLoading: boolean } {
  const enabled = Boolean(brand && location && bedrooms && checkInDate);

  const { data, isLoading } = useQuery({
    queryKey: ["dynamic-pricing", brand, location, bedrooms, checkInDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dynamic_pricing_data", {
        p_brand: brand!,
        p_location: location!,
        p_bedrooms: bedrooms!,
        p_check_in_date: checkInDate!,
      });
      if (error) throw error;
      return data as unknown as DynamicPricingRpcResult;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min cache
  });

  if (!enabled || !data || data.comparableCount < 2) {
    return { suggestion: null, isLoading };
  }

  const baseRate = data.marketAvg;
  if (baseRate <= 0) return { suggestion: null, isLoading };

  const suggestion = suggestDynamicPrice(
    baseRate,
    checkInDate!,
    data.seasonalData,
    { pendingBidCount: data.pendingBidCount, savedSearchCount: data.savedSearchCount },
    data.comparableCount
  );

  return { suggestion, isLoading };
}
