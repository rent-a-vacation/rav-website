import type { MembershipTier, UserMembership, UserMembershipWithTier } from "@/types/database";

export function mockMembershipTier(overrides: Partial<MembershipTier> = {}): MembershipTier {
  return {
    id: "tier-free-traveler",
    tier_key: "traveler_free",
    role_category: "traveler",
    tier_name: "Free",
    tier_level: 0,
    monthly_price_cents: 0,
    voice_quota_daily: 5,
    commission_discount_pct: 0,
    max_active_listings: null,
    features: ["Browse listings", "Book properties", "Voice search (5/day)"],
    description: "Basic traveler access",
    is_default: true,
    stripe_price_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function mockOwnerFreeTier(): MembershipTier {
  return mockMembershipTier({
    id: "tier-free-owner",
    tier_key: "owner_free",
    role_category: "owner",
    tier_name: "Free",
    tier_level: 0,
    monthly_price_cents: 0,
    voice_quota_daily: 5,
    commission_discount_pct: 0,
    max_active_listings: 3,
    features: ["List up to 3 properties", "Voice search (5/day)"],
    description: "Basic owner access",
  });
}

export function mockOwnerProTier(): MembershipTier {
  return mockMembershipTier({
    id: "tier-pro-owner",
    tier_key: "owner_pro",
    role_category: "owner",
    tier_name: "Pro",
    tier_level: 1,
    monthly_price_cents: 1000,
    voice_quota_daily: 25,
    commission_discount_pct: 2,
    max_active_listings: 10,
    features: ["List up to 10 properties", "2% commission discount"],
    description: "Professional owner tools",
    is_default: false,
    stripe_price_id: "price_test_owner_pro",
  });
}

export function mockOwnerBusinessTier(): MembershipTier {
  return mockMembershipTier({
    id: "tier-business-owner",
    tier_key: "owner_business",
    role_category: "owner",
    tier_name: "Business",
    tier_level: 2,
    monthly_price_cents: 2500,
    voice_quota_daily: -1,
    commission_discount_pct: 5,
    max_active_listings: null,
    features: ["Unlimited listings", "5% commission discount"],
    description: "Unlimited owner access",
    is_default: false,
    stripe_price_id: "price_test_owner_business",
  });
}

export function mockTravelerTiers(): MembershipTier[] {
  return [
    mockMembershipTier(),
    mockMembershipTier({
      id: "tier-plus-traveler",
      tier_key: "traveler_plus",
      tier_name: "Plus",
      tier_level: 1,
      monthly_price_cents: 500,
      voice_quota_daily: 25,
      is_default: false,
      stripe_price_id: "price_test_traveler_plus",
    }),
    mockMembershipTier({
      id: "tier-premium-traveler",
      tier_key: "traveler_premium",
      tier_name: "Premium",
      tier_level: 2,
      monthly_price_cents: 1500,
      voice_quota_daily: -1,
      is_default: false,
      stripe_price_id: "price_test_traveler_premium",
    }),
  ];
}

export function mockOwnerTiers(): MembershipTier[] {
  return [mockOwnerFreeTier(), mockOwnerProTier(), mockOwnerBusinessTier()];
}

export function mockUserMembership(overrides: Partial<UserMembership> = {}): UserMembership {
  return {
    id: "membership-1",
    user_id: "user-1",
    tier_id: "tier-free-traveler",
    status: "active",
    started_at: "2026-01-01T00:00:00Z",
    expires_at: null,
    stripe_subscription_id: null,
    stripe_customer_id: null,
    cancelled_at: null,
    admin_override: false,
    admin_notes: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function mockUserMembershipWithTier(
  overrides: Partial<UserMembershipWithTier> = {}
): UserMembershipWithTier {
  return {
    ...mockUserMembership(),
    tier: mockMembershipTier(),
    ...overrides,
  };
}
