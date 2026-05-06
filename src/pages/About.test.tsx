// @vitest-environment jsdom
// @p0
/**
 * Tests for the About page. About page is a placement requirement for Disclaimer 8.3
 * (Non-Broker / Non-Agent) per Legal Dossier Section VIII.
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

import About from "./About";

const renderAbout = () =>
  render(
    <MemoryRouter>
      <About />
    </MemoryRouter>,
  );

describe("About page", () => {
  it("renders the headline and key positioning copy", () => {
    renderAbout();
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("About Rent-A-Vacation");
    expect(screen.getByText(/marketplace for renting unused timeshare/i)).toBeTruthy();
  });

  it("renders Disclaimer 8.3 (Non-Broker / Non-Agent) sourced from the central registry", () => {
    renderAbout();
    const block = screen.getByTestId("disclaimer-8.3");
    expect(block.getAttribute("data-disclaimer-id")).toBe("8.3");
    expect(block.textContent).toMatch(/does not act as a real estate broker/);
  });

  it("explicitly states that the platform does not facilitate timeshare sales (paraphrased + Disclaimer 8.2 covered in Footer)", () => {
    renderAbout();
    expect(screen.getByText(/do not facilitate, broker, or assist in the purchase, sale, transfer, or resale/i)).toBeTruthy();
  });

  it("describes Pay Safe as Stripe-routed (RAV never holds funds)", () => {
    renderAbout();
    expect(screen.getByText(/Pay Safe service routes payments through Stripe/i)).toBeTruthy();
    expect(screen.getByText(/never holds renter funds in its own bank account/i)).toBeTruthy();
  });
});
