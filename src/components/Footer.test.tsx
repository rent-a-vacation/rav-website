// @vitest-environment jsdom
// @p0
/**
 * Tests for the global Footer — trademark/affiliation disclaimer.
 * GitHub Issue: #479 — Add trademark disclaimer footer
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

const renderFooter = () =>
  render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );

describe("Footer trademark disclaimer", () => {
  it("renders an affiliation disclaimer naming the major vacation-club brands", () => {
    renderFooter();

    const disclaimer = screen.getByText(/trademarks of their respective owners/i);
    expect(disclaimer).toBeTruthy();

    const brands = [
      "Hilton",
      "Marriott",
      "Disney",
      "Wyndham",
      "Bluegreen",
      "Hyatt",
      "Holiday Inn Club",
      "WorldMark",
    ];
    for (const brand of brands) {
      expect(disclaimer.textContent).toContain(brand);
    }
  });

  it("clarifies that Rent-A-Vacation is independent and not affiliated with any vacation-club brand", () => {
    renderFooter();

    const disclaimer = screen.getByText(/trademarks of their respective owners/i);
    expect(disclaimer.textContent).toMatch(/independent secondary marketplace/i);
    expect(disclaimer.textContent).toMatch(/not affiliated with/i);
    expect(disclaimer.textContent).toMatch(/endorsed by/i);
    expect(disclaimer.textContent).toMatch(/sponsored by/i);
  });

  it("renders the trademark disclaimer through the central registry (not inline text)", () => {
    renderFooter();
    // The trademark disclaimer must come from the central disclaimer registry so a single
    // text update propagates everywhere. data-disclaimer-id="trademark" confirms registry sourcing.
    const tm = screen.getByTestId("disclaimer-trademark");
    expect(tm.getAttribute("data-disclaimer-id")).toBe("trademark");
  });

  it("renders the Marketplace Disclaimer (8.1) in the footer", () => {
    renderFooter();
    const block = screen.getByTestId("disclaimer-8.1");
    expect(block.textContent).toMatch(/technology platform/);
    expect(block.textContent).toMatch(/not a party to any rental agreement/);
  });

  it("renders the No Timeshare Sales Disclaimer (8.2) in the footer", () => {
    renderFooter();
    const block = screen.getByTestId("disclaimer-8.2");
    expect(block.textContent).toMatch(/rental of timeshare periods only/);
    expect(block.textContent).toMatch(/does not facilitate, broker, or assist in the purchase, sale, transfer, or resale/);
  });

  it("links to the About page (where Disclaimer 8.3 also appears)", () => {
    renderFooter();
    const aboutLink = screen.getByRole("link", { name: /about/i });
    expect(aboutLink.getAttribute("href")).toBe("/about");
  });
});
