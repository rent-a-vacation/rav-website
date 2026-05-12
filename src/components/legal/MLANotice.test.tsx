// @vitest-environment jsdom
// @p0
/**
 * Tests for <MLANotice /> (#490) — payment-flow notice for self-identified
 * active-duty servicemembers. Steines v. Westgate Palace, 11th Cir. (2024).
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MLANotice } from "./MLANotice";

describe("MLANotice", () => {
  it("renders with the MLA citation + protections summary", () => {
    render(<MLANotice />);
    const el = screen.getByTestId("mla-notice");
    expect(el.textContent).toContain("Military Lending Act");
    expect(el.textContent).toMatch(/10 U\.S\.C\. § 987/);
  });

  it("states that arbitration is not enforceable against the servicemember", () => {
    render(<MLANotice />);
    const el = screen.getByTestId("mla-notice");
    expect(el.textContent).toMatch(/not enforceable as to you/i);
  });

  it("affirms the right to pursue disputes in court", () => {
    render(<MLANotice />);
    const el = screen.getByTestId("mla-notice");
    expect(el.textContent).toMatch(/pursue any dispute arising out of this booking in a court of competent jurisdiction/i);
  });

  it("has the correct ARIA role and label for screen readers", () => {
    render(<MLANotice />);
    const el = screen.getByTestId("mla-notice");
    expect(el.getAttribute("role")).toBe("note");
    expect(el.getAttribute("aria-label")).toBe("Military Lending Act notice");
  });

  it("accepts a className override", () => {
    render(<MLANotice className="my-custom-class" />);
    const el = screen.getByTestId("mla-notice");
    expect(el.className).toContain("my-custom-class");
  });
});
