// @vitest-environment jsdom
// @p0
/**
 * Tests for <GuestProtectionBadge /> (#489) — the consumer-facing surface
 * of RAV Guest Protection on listing pages and checkout.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { GuestProtectionBadge } from "./GuestProtectionBadge";

const renderBadge = (variant?: "badge" | "banner") =>
  render(
    <MemoryRouter>
      <GuestProtectionBadge variant={variant} />
    </MemoryRouter>,
  );

describe("GuestProtectionBadge", () => {
  it("renders the compact badge variant by default", () => {
    renderBadge();
    const el = screen.getByTestId("guest-protection-badge");
    expect(el.textContent).toContain("RAV Guest Protection");
    expect(el.getAttribute("href")).toBe("/guest-protection");
  });

  it("renders the banner variant with the explanatory copy", () => {
    renderBadge("banner");
    const el = screen.getByTestId("guest-protection-banner");
    expect(el.textContent).toContain("RAV Guest Protection");
    expect(el.textContent).toMatch(/full refund within 5 business days/i);
    expect(el.textContent).toMatch(/30 days of check-in/i);
    expect(el.getAttribute("href")).toBe("/guest-protection");
  });
});
