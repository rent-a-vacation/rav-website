// @p0
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ListingTypeBadge } from "./ListingTypeBadge";

describe("ListingTypeBadge", () => {
  it("renders 'Pre-Booked Stay' for pre_booked", () => {
    render(<ListingTypeBadge type="pre_booked" />);
    expect(screen.getByText("Pre-Booked Stay")).toBeInTheDocument();
  });

  it("renders 'Wish-Matched Stay' for wish_matched", () => {
    render(<ListingTypeBadge type="wish_matched" />);
    expect(screen.getByText("Wish-Matched Stay")).toBeInTheDocument();
  });

  it("renders a descriptive tooltip (title attribute) for pre_booked", () => {
    render(<ListingTypeBadge type="pre_booked" />);
    const badge = screen.getByText("Pre-Booked Stay").closest("[title]");
    expect(badge?.getAttribute("title")).toContain("Owner has the resort reservation");
  });

  it("renders a descriptive tooltip for wish_matched", () => {
    render(<ListingTypeBadge type="wish_matched" />);
    const badge = screen.getByText("Wish-Matched Stay").closest("[title]");
    expect(badge?.getAttribute("title")).toContain("traveler's Wish");
  });

  it("applies size=sm with smaller text", () => {
    const { container } = render(<ListingTypeBadge type="pre_booked" size="sm" />);
    expect(container.querySelector(".text-\\[10px\\]")).toBeInTheDocument();
  });

  it("accepts additional className", () => {
    const { container } = render(
      <ListingTypeBadge type="pre_booked" className="ml-2" />,
    );
    expect(container.querySelector(".ml-2")).toBeInTheDocument();
  });
});
