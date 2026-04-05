import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import { AdminMemberships } from "./AdminMemberships";
import { mockOwnerFreeTier, mockOwnerProTier, mockOwnerBusinessTier, mockTravelerTiers } from "@/test/fixtures/memberships";

const allTiers = [...mockTravelerTiers(), mockOwnerFreeTier(), mockOwnerProTier(), mockOwnerBusinessTier()];

vi.mock("@/hooks/useMembership", () => ({
  useMembershipTiers: () => ({ data: allTiers }),
}));

const { mockMetrics, mockMemberships } = vi.hoisted(() => ({
  mockMetrics: {
    total_mrr_cents: 4500,
    active_paid_count: 3,
    active_free_count: 10,
    cancelled_count: 1,
    override_count: 1,
    tier_breakdown: [
      { tier_key: "owner_pro", tier_name: "Pro", role_category: "owner", monthly_price_cents: 1000, user_count: 2, mrr_cents: 2000 },
      { tier_key: "owner_business", tier_name: "Business", role_category: "owner", monthly_price_cents: 2500, user_count: 1, mrr_cents: 2500 },
    ],
  },
  mockMemberships: [
    {
      id: "mem-1",
      user_id: "user-1",
      status: "active",
      started_at: "2026-03-01T00:00:00Z",
      admin_override: false,
      admin_notes: null,
      tier: {
        id: "tier-pro-owner",
        tier_key: "owner_pro",
        role_category: "owner",
        tier_name: "Pro",
        tier_level: 1,
        monthly_price_cents: 1000,
        voice_quota_daily: 25,
        commission_discount_pct: 2,
        max_active_listings: 10,
        features: [],
        description: "Professional owner tools",
        is_default: false,
        stripe_price_id: "price_test_owner_pro",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    },
    {
      id: "mem-2",
      user_id: "user-2",
      status: "active",
      started_at: "2026-02-15T00:00:00Z",
      admin_override: true,
      admin_notes: "VIP customer",
      tier: {
        id: "tier-business-owner",
        tier_key: "owner_business",
        role_category: "owner",
        tier_name: "Business",
        tier_level: 2,
        monthly_price_cents: 2500,
        voice_quota_daily: -1,
        commission_discount_pct: 5,
        max_active_listings: null,
        features: [],
        description: "Unlimited owner access",
        is_default: false,
        stripe_price_id: "price_test_owner_business",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    },
  ],
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "user_memberships") {
        return {
          select: () => ({
            order: () => Promise.resolve({ data: mockMemberships, error: null }),
          }),
        };
      }
      if (table === "profiles") {
        return {
          select: () => ({
            in: () =>
              Promise.resolve({
                data: [
                  { id: "user-1", email: "pro@test.com" },
                  { id: "user-2", email: "business@test.com" },
                ],
                error: null,
              }),
          }),
        };
      }
      return { select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }) };
    }),
    rpc: vi.fn().mockResolvedValue({ data: mockMetrics, error: null }),
  },
}));

describe("AdminMemberships", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders MRR metric cards", async () => {
    render(<AdminMemberships />);
    await waitFor(() => {
      expect(screen.getByText("$45")).toBeInTheDocument();
    });
    expect(screen.getByText("Monthly Recurring Revenue")).toBeInTheDocument();
    expect(screen.getByText("Active Subscribers")).toBeInTheDocument();
    expect(screen.getByText("ARPU")).toBeInTheDocument();
    expect(screen.getByText("Churn Rate")).toBeInTheDocument();
  });

  it("renders active paid subscriber count", async () => {
    render(<AdminMemberships />);
    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("renders membership table with user emails", async () => {
    render(<AdminMemberships />);
    await waitFor(() => {
      expect(screen.getByText("pro@test.com")).toBeInTheDocument();
      expect(screen.getByText("business@test.com")).toBeInTheDocument();
    });
  });

  it("shows admin override badge for overridden memberships", async () => {
    render(<AdminMemberships />);
    await waitFor(() => {
      expect(screen.getByText("Admin Override")).toBeInTheDocument();
    });
  });

  it("renders filter dropdowns", async () => {
    render(<AdminMemberships />);
    await waitFor(() => {
      expect(screen.getByText("All Statuses")).toBeInTheDocument();
      expect(screen.getByText("All Roles")).toBeInTheDocument();
    });
  });

  it("shows override count in description", async () => {
    render(<AdminMemberships />);
    await waitFor(() => {
      expect(screen.getByText(/1 admin overrides/)).toBeInTheDocument();
    });
  });
});
