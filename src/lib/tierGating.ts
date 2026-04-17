/**
 * Tier-gating utilities for membership-based feature access.
 *
 * Tier levels: 0 = Free, 1 = Plus/Pro, 2 = Premium/Business
 * Role categories: "traveler" | "owner"
 */

/** Hours a listing stays in "early access" mode (visible only to Plus+) */
export const EARLY_ACCESS_HOURS = 48;

/** Check if a listing is within the early access window */
export function isListingInEarlyAccess(createdAt: string, now = new Date()): boolean {
  const created = new Date(createdAt);
  const diffMs = now.getTime() - created.getTime();
  return diffMs >= 0 && diffMs < EARLY_ACCESS_HOURS * 60 * 60 * 1000;
}

/** Traveler Plus (level 1+) can see early access listings */
export function canSeeEarlyAccess(tierLevel: number | undefined): boolean {
  return (tierLevel ?? 0) >= 1;
}

/** Traveler Premium (level 2) can see exclusive deals */
export function canSeeExclusiveDeals(tierLevel: number | undefined): boolean {
  return (tierLevel ?? 0) >= 2;
}

/** Owner Pro/Business (level 1+) gets priority listing placement */
export function isOwnerPriorityTier(tierLevel: number | undefined): boolean {
  return (tierLevel ?? 0) >= 1;
}

/** Traveler Premium (level 2) can access concierge support */
export function canAccessConcierge(
  tierLevel: number | undefined,
  roleCategory: string | undefined,
): boolean {
  return roleCategory === 'traveler' && (tierLevel ?? 0) >= 2;
}

/** Owner Business (level 2) gets a dedicated account manager */
export function hasAccountManager(
  tierLevel: number | undefined,
  roleCategory: string | undefined,
): boolean {
  return roleCategory === 'owner' && (tierLevel ?? 0) >= 2;
}
