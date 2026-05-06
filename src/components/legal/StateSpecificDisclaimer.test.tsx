// @vitest-environment jsdom
// @p0
/**
 * Tests for <StateSpecificDisclaimer /> — geo-targeted disclosure rendering for FL, CA, etc.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StateSpecificDisclaimer } from "./StateSpecificDisclaimer";

describe("StateSpecificDisclaimer", () => {
  it("renders the FL-specific disclosure (8.7) when propertyState is 'FL'", () => {
    render(<StateSpecificDisclaimer propertyState="FL" />);
    const block = screen.getByTestId("state-disclaimer-FL");
    expect(block.textContent).toContain("Florida Statute Chapter 721");
    expect(block.textContent).toContain("Florida Statute § 721.20");
  });

  it("is case-insensitive on state codes (lowercase 'fl' still renders)", () => {
    render(<StateSpecificDisclaimer propertyState="fl" />);
    expect(screen.getByTestId("state-disclaimer-FL").textContent).toContain(
      "Florida Statute Chapter 721",
    );
  });

  it("renders nothing for states with no registered disclosure (e.g. TX)", () => {
    const { container } = render(<StateSpecificDisclaimer propertyState="TX" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when propertyState is null", () => {
    const { container } = render(<StateSpecificDisclaimer propertyState={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when propertyState is undefined", () => {
    const { container } = render(<StateSpecificDisclaimer propertyState={undefined} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for CA today — placeholder entry intentionally absent until counsel returns text (C10)", () => {
    // STATE_DISCLAIMER_MAP.CA points at "8.7-CA", but the registry intentionally omits that
    // entry. Once counsel returns text, adding the entry to DISCLAIMERS will cause this test
    // to fail (and another test in this file will assert the rendered CA text).
    const { container } = render(<StateSpecificDisclaimer propertyState="CA" />);
    expect(container.firstChild).toBeNull();
  });
});
