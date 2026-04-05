import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ListingLimitUpsell } from "./ListingLimitUpsell";
import { mockOwnerProTier, mockOwnerBusinessTier } from "@/test/fixtures/memberships";
import { BrowserRouter } from "react-router-dom";

vi.mock("@/hooks/useMembership", () => ({
  useOwnerTiers: () => ({
    data: [
      {
        id: "tier-free-owner",
        tier_key: "owner_free",
        tier_name: "Free",
        tier_level: 0,
        monthly_price_cents: 0,
        max_active_listings: 3,
      },
      mockOwnerProTier(),
      mockOwnerBusinessTier(),
    ],
  }),
}));

function renderUpsell(props: Partial<React.ComponentProps<typeof ListingLimitUpsell>> = {}) {
  return render(
    <BrowserRouter>
      <ListingLimitUpsell
        open={true}
        onOpenChange={vi.fn()}
        currentCount={3}
        maxListings={3}
        tierName="Free"
        {...props}
      />
    </BrowserRouter>
  );
}

describe("ListingLimitUpsell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders listing count and limit", () => {
    renderUpsell();
    expect(screen.getByText(/3 of 3 listings/)).toBeInTheDocument();
    expect(screen.getByText(/Free/)).toBeInTheDocument();
  });

  it("shows upgrade tiers above current level", () => {
    renderUpsell();
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Business")).toBeInTheDocument();
    expect(screen.getByText("$10/mo")).toBeInTheDocument();
    expect(screen.getByText("$25/mo")).toBeInTheDocument();
  });

  it("shows listing limits for upgrade tiers", () => {
    renderUpsell();
    expect(screen.getByText("Up to 10 listings")).toBeInTheDocument();
    expect(screen.getByText("Unlimited listings")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    renderUpsell({ open: false });
    expect(screen.queryByText("Listing Limit Reached")).not.toBeInTheDocument();
  });
});
