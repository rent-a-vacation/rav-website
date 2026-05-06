// @vitest-environment jsdom
// @p0
/**
 * Tests for the Terms of Service page — asserts the legally-required Disclaimer 8.3
 * (Non-Broker / Non-Agent) and 8.6 (Limitation of Liability) are sourced from the
 * central registry rather than inline prose. This is the post-2026-05-05 compliance
 * audit fix that closes counsel rows 13 (8.6 — was generic intermediary text) and
 * 10 (8.3 — was missing).
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Stub the page-meta hook (it manipulates document.head)
vi.mock("@/hooks/usePageMeta", () => ({
  usePageMeta: vi.fn(),
}));

// Stub Header / Footer to keep the test focused on the page body
vi.mock("@/components/Header", () => ({
  default: () => <header data-testid="stub-header" />,
}));
vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="stub-footer" />,
}));

import Terms from "./Terms";

const renderTerms = () =>
  render(
    <MemoryRouter>
      <Terms />
    </MemoryRouter>,
  );

describe("Terms of Service — required disclaimers", () => {
  it("renders Disclaimer 8.3 (Non-Broker / Non-Agent) sourced from the central registry", () => {
    renderTerms();
    const block = screen.getByTestId("disclaimer-8.3");
    expect(block.getAttribute("data-disclaimer-id")).toBe("8.3");
    expect(block.textContent).toMatch(/does not act as a real estate broker, real estate agent, travel agent, or fiduciary/);
    expect(block.textContent).toMatch(/No employee or representative of Rent-A-Vacation is authorized to provide legal, tax, financial, or real estate advice/);
  });

  it("renders Disclaimer 8.6 (Limitation of Liability) verbatim — replaces the prior generic intermediary text", () => {
    renderTerms();
    const block = screen.getByTestId("disclaimer-8.6");
    expect(block.getAttribute("data-disclaimer-id")).toBe("8.6");
    // Must contain the 12-month-fee cap
    expect(block.textContent).toMatch(/total platform fees paid by such user in the twelve \(12\) months preceding/);
    // Must exclude consequential / punitive damages
    expect(block.textContent).toMatch(/indirect, incidental, special, consequential, or punitive damages/);
  });

  it("does NOT contain the legacy generic intermediary text that the audit flagged as wrong", () => {
    renderTerms();
    // The pre-fix Terms.tsx Section 8 said: "Rent-A-Vacation acts as an intermediary between
    // owners and travelers. We are not responsible for the condition of properties..."
    // That language fails Legal Dossier § 8.6 because it's missing the 12-month fee cap +
    // consequential-damages exclusion. Confirm it's gone.
    const main = document.querySelector("main");
    expect(main?.textContent ?? "").not.toMatch(
      /We are not responsible for the condition of properties, the conduct of users, or any damages arising from the use of our service beyond what is required by law/,
    );
  });
});
