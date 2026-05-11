// @vitest-environment jsdom
// @p0
/**
 * Tests for the /guest-protection page (#489). Asserts the consumer-facing
 * promise + verbatim Disclaimer 8.5 from the central registry + scope boundaries.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: vi.fn(),
}));
vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="stub-header" />,
}));
vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="stub-footer" />,
}));

import GuestProtection from "./GuestProtection";

const renderPage = () =>
  render(
    <MemoryRouter>
      <GuestProtection />
    </MemoryRouter>,
  );

describe("GuestProtection page", () => {
  it("renders the headline and headline promise", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("RAV Guest Protection");
    expect(screen.getByText(/if your Host cancels close to check-in, you get every dollar back fast/i)).toBeTruthy();
  });

  it("renders the three-pillar What/When/HowFast section", () => {
    renderPage();
    // These phrases appear in both the pillar copy and the verbatim 8.5 disclaimer;
    // assert presence (>= 1 match) rather than uniqueness.
    expect(screen.getAllByText(/Host cancellation within 30 days of check-in/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/100% refund of your booking total/i)).toBeTruthy();
    expect(screen.getAllByText(/within 5 business days/i).length).toBeGreaterThan(0);
    // Pillar-specific headings
    expect(screen.getByText(/What this covers/i)).toBeTruthy();
  });

  it("explains the Pay Safe / Stripe escrow architecture", () => {
    renderPage();
    expect(screen.getByText(/Pay Safe service routes payments through Stripe/i)).toBeTruthy();
    expect(screen.getByText(/Renter funds never sit in a Rent-A-Vacation bank account/i)).toBeTruthy();
  });

  it("clearly states what is NOT covered (renter-initiated cancellations + post-check-in issues)", () => {
    renderPage();
    expect(screen.getByText(/Renter-initiated cancellations follow the listing's cancellation policy/i)).toBeTruthy();
    expect(screen.getByText(/handled through the dispute system/i)).toBeTruthy();
  });

  it("renders Disclaimer 8.5 verbatim from the central registry", () => {
    renderPage();
    const block = screen.getByTestId("disclaimer-8.5");
    expect(block.getAttribute("data-disclaimer-id")).toBe("8.5");
    // Verbatim load-bearing phrases from Legal Dossier § 8.5
    expect(block.textContent).toMatch(/Host cancellation within 30 days of check-in/);
    expect(block.textContent).toMatch(/full refund within 5 business days/);
    expect(block.textContent).toMatch(/platform fee is non-refundable except in cases of Host cancellation or verified fraud/);
  });
});
