import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OwnerFeeExplainer } from "./OwnerFeeExplainer";
import { MemoryRouter } from "react-router-dom";

// Mock useOwnerCommission
const mockCommission = vi.hoisted(() => ({
  effectiveRate: 15,
  tierDiscount: 0,
  tierName: "Free",
  loading: false,
}));

vi.mock("@/hooks/useOwnerCommission", () => ({
  useOwnerCommission: () => mockCommission,
}));

function renderExplainer() {
  return render(
    <MemoryRouter>
      <OwnerFeeExplainer />
    </MemoryRouter>
  );
}

describe("OwnerFeeExplainer", () => {
  beforeEach(() => {
    mockCommission.effectiveRate = 15;
    mockCommission.tierDiscount = 0;
    mockCommission.tierName = "Free";
    mockCommission.loading = false;
  });

  it("renders the fee explainer card", () => {
    renderExplainer();
    expect(screen.getByText("How Your Fees Work")).toBeTruthy();
  });

  it("shows effective commission rate", () => {
    renderExplainer();
    expect(screen.getByText("15%")).toBeTruthy();
    expect(screen.getByText("15% base rate")).toBeTruthy();
  });

  it("shows Stripe protection message", () => {
    renderExplainer();
    expect(screen.getByText("Stripe processing fees never touch your payout")).toBeTruthy();
  });

  it("shows sample calculation", () => {
    renderExplainer();
    expect(screen.getByText("$200 × 5 nights")).toBeTruthy();
    expect(screen.getByText("$1,000")).toBeTruthy();
    expect(screen.getByText("$1,100")).toBeTruthy(); // owner payout
    expect(screen.getByText("$1,250")).toBeTruthy(); // guest total
  });

  it("shows tier upgrade nudge for Free tier", () => {
    renderExplainer();
    expect(screen.getByText(/Upgrade to/)).toBeTruthy();
    expect(screen.getByText("View plans")).toBeTruthy();
  });

  it("shows tier discount for Pro users", () => {
    mockCommission.effectiveRate = 13;
    mockCommission.tierDiscount = 2;
    mockCommission.tierName = "Pro";
    renderExplainer();
    expect(screen.getByText("13%")).toBeTruthy();
    expect(screen.getByText(/15% base − 2% Pro discount/)).toBeTruthy();
    expect(screen.getByText(/Pro savings/)).toBeTruthy();
    // No upgrade nudge for Pro
    expect(screen.queryByText(/Upgrade to/)).toBeNull();
  });

  it("shows Business tier discount", () => {
    mockCommission.effectiveRate = 10;
    mockCommission.tierDiscount = 5;
    mockCommission.tierName = "Business";
    renderExplainer();
    expect(screen.getByText("10%")).toBeTruthy();
    expect(screen.getByText(/15% base − 5% Business discount/)).toBeTruthy();
  });

  it("returns null while loading", () => {
    mockCommission.loading = true;
    const { container } = renderExplainer();
    expect(container.firstChild).toBeNull();
  });

  it("links to fee guide", () => {
    renderExplainer();
    expect(screen.getByText("Full fee details in our guide")).toBeTruthy();
  });
});
