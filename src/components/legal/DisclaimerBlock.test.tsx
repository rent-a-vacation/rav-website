// @vitest-environment jsdom
// @p0
/**
 * Tests for <DisclaimerBlock /> — the central component that renders all
 * legally-required disclaimers from the registry.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DisclaimerBlock } from "./DisclaimerBlock";
import { DISCLAIMERS } from "@/lib/disclaimers/registry";

describe("DisclaimerBlock rendering", () => {
  it("renders verbatim registry text for the requested id (default compact variant)", () => {
    render(<DisclaimerBlock id="8.1" />);
    const block = screen.getByTestId("disclaimer-8.1");
    expect(block.textContent).toContain(DISCLAIMERS["8.1"].text);
    expect(block.textContent).toContain(DISCLAIMERS["8.1"].title);
  });

  it("renders the title in `full` variant", () => {
    render(<DisclaimerBlock id="8.6" variant="full" />);
    const block = screen.getByTestId("disclaimer-8.6");
    expect(block.querySelector("h3")?.textContent).toContain("Limitation of Liability");
  });

  it("renders only the text in `minimal` variant (no title heading)", () => {
    render(<DisclaimerBlock id="8.2" variant="minimal" />);
    const block = screen.getByTestId("disclaimer-8.2");
    expect(block.tagName).toBe("P");
    expect(block.textContent).toContain(DISCLAIMERS["8.2"].text);
    expect(block.textContent).not.toContain(DISCLAIMERS["8.2"].title);
  });

  it("sets data-disclaimer-id for analytics / e2e selectors", () => {
    render(<DisclaimerBlock id="8.8" />);
    const block = screen.getByTestId("disclaimer-8.8");
    expect(block.getAttribute("data-disclaimer-id")).toBe("8.8");
  });

  it("returns null for an unknown id", () => {
    // @ts-expect-error — intentionally bypassing the type to test the runtime guard
    const { container } = render(<DisclaimerBlock id="99.99" />);
    expect(container.firstChild).toBeNull();
  });

  it("8.8 escrow notice rendered through the component names BOTH 'Stripe' and 'Pay Safe'", () => {
    render(<DisclaimerBlock id="8.8" />);
    const block = screen.getByTestId("disclaimer-8.8");
    expect(block.textContent).toContain("Stripe");
    expect(block.textContent).toContain("Pay Safe");
    expect(block.textContent).toContain("does not act as an escrow agent");
  });

  it("trademark disclaimer rendered through the component names all 8 vacation-club brands", () => {
    render(<DisclaimerBlock id="trademark" variant="minimal" />);
    const block = screen.getByTestId("disclaimer-trademark");
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
      expect(block.textContent).toContain(brand);
    }
  });

  it("custom className is appended to the block", () => {
    render(<DisclaimerBlock id="8.1" className="my-custom-class" />);
    const block = screen.getByTestId("disclaimer-8.1");
    expect(block.className).toContain("my-custom-class");
  });
});
