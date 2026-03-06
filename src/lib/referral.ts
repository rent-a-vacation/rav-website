/**
 * Referral program utilities for Rent-A-Vacation.
 */

/**
 * Build a full referral signup URL from a referral code.
 */
export function buildReferralLink(code: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "https://rent-a-vacation.com";
  return `${base}/signup?ref=${encodeURIComponent(code)}`;
}

/**
 * Extract a referral code from URL search params.
 * Returns null if no valid code is present.
 */
export function extractReferralCode(searchParams: URLSearchParams): string | null {
  const code = searchParams.get("ref")?.trim().toUpperCase();
  if (!code || code.length < 4) return null;
  return code;
}

export interface ReferralStats {
  totalReferrals: number;
  convertedReferrals: number;
  pendingReferrals: number;
  totalReward: number;
  rewardType: "commission_discount" | "credit";
}

/**
 * Calculate conversion rate from referral stats.
 */
export function referralConversionRate(stats: ReferralStats): number {
  if (stats.totalReferrals === 0) return 0;
  return Math.round((stats.convertedReferrals / stats.totalReferrals) * 100);
}

/**
 * Format reward display text based on type and amount.
 */
export function formatRewardText(rewardType: string, amount: number): string {
  if (rewardType === "credit") {
    return `$${(amount / 100).toFixed(2)} credit`;
  }
  return `${amount}% commission discount`;
}
