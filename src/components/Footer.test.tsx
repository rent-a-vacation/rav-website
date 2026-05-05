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
});
