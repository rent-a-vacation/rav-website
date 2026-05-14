/**
 * Commission rate accessor for edge functions.
 *
 * Reads from `system_settings.platform_commission_rate` and returns the
 * rate as a DECIMAL (0.12 for 12%). Falls back to DEC-041 values if the
 * row is missing or malformed.
 *
 * Edge functions that COMPUTE pricing for a new booking must use this
 * helper to fetch the live rate at booking-creation time and then persist
 * it on the booking record (`bookings.commission_rate_applied`). Edge
 * functions that operate on an EXISTING booking (refunds, payment verify,
 * webhooks) should read from `bookings.commission_rate_applied` so they
 * use the rate that was in effect when the traveler was charged — not
 * whatever the admin has since changed the platform rate to.
 *
 * Mirrors the frontend hook in `src/hooks/useCommissionRate.ts` and the
 * config in `src/config/commission.ts`. Issue #510.
 */

// SupabaseClient type is intentionally loose — Deno-side typing varies
// between deploy targets. Callers pass either an authenticated user
// client or the service-role client; both work.
// deno-lint-ignore no-explicit-any
type SupabaseLike = { rpc: (fn: string, args?: any) => Promise<{ data: any; error: any }> };

export interface EdgeCommissionRate {
  base: number; // 0.12
  proDiscount: number; // 0.02
  businessDiscount: number; // 0.04
}

// Mirror of DEFAULT_COMMISSION in src/config/commission.ts. Edge runtime
// cannot import the @/ alias, so the values are duplicated here. Keep in
// sync — a drift test could be added later (see disclaimers.ts pattern).
export const DEFAULT_COMMISSION: EdgeCommissionRate = {
  base: 0.12,
  proDiscount: 0.02,
  businessDiscount: 0.04,
};

export type OwnerTier = "free" | "pro" | "business";

/**
 * Fetch the live commission rate via the `get_platform_commission_rate`
 * SECURITY DEFINER RPC. Returns DEFAULT_COMMISSION on any error so the
 * checkout path never blocks on a settings-read failure.
 */
export async function getCommissionRate(
  supabase: SupabaseLike,
): Promise<EdgeCommissionRate> {
  try {
    const { data, error } = await supabase.rpc("get_platform_commission_rate");
    if (error || !data || typeof data !== "object") {
      console.warn("[commission] RPC failed, using DEFAULT_COMMISSION", error);
      return { ...DEFAULT_COMMISSION };
    }
    const row = data as Record<string, unknown>;
    const base = typeof row.rate === "number"
      ? (row.rate as number) / 100
      : DEFAULT_COMMISSION.base;
    const proDiscount = typeof row.pro_discount === "number"
      ? (row.pro_discount as number) / 100
      : DEFAULT_COMMISSION.proDiscount;
    const businessDiscount = typeof row.business_discount === "number"
      ? (row.business_discount as number) / 100
      : DEFAULT_COMMISSION.businessDiscount;
    return { base, proDiscount, businessDiscount };
  } catch (err) {
    console.warn("[commission] RPC threw, using DEFAULT_COMMISSION", err);
    return { ...DEFAULT_COMMISSION };
  }
}

/**
 * Effective commission rate for a given owner tier. Pure function;
 * tested independently.
 */
export function effectiveRate(
  rate: EdgeCommissionRate,
  tier: OwnerTier = "free",
): number {
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
