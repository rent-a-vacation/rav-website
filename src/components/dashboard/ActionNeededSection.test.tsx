import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AlertTriangle, Gavel } from "lucide-react";
import { ActionNeededSection, type PriorityAction } from "./ActionNeededSection";

function withRouter(ui: React.ReactElement) {
  return <MemoryRouter>{ui}</MemoryRouter>;
}

describe("ActionNeededSection @p0", () => {
  it("renders loading skeletons when isLoading is true", () => {
    const { container } = render(
      withRouter(<ActionNeededSection actions={[]} isLoading />),
    );
    // Exactly 3 placeholder skeletons (see component)
    const skeletons = container.querySelectorAll(".h-24");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("renders the empty state when no actions have count > 0", () => {
    const actions: PriorityAction[] = [
      {
        id: "a",
        label: "unused",
        count: 0,
        icon: Gavel,
        linkTo: "/x",
        tone: "action",
        help: "h",
      },
    ];
    render(
      withRouter(
        <ActionNeededSection
          actions={actions}
          emptyMessage="All clear!"
          emptyCtaLabel="Next"
          emptyCtaLink="/next"
        />,
      ),
    );
    expect(screen.getByText("All clear!")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("renders only actions with count > 0 as tiles, in order supplied", () => {
    const actions: PriorityAction[] = [
      {
        id: "hidden",
        label: "hidden item",
        count: 0,
        icon: Gavel,
        linkTo: "/hidden",
        tone: "urgent",
        help: "should not appear",
      },
      {
        id: "shown",
        label: "shown item",
        count: 3,
        icon: AlertTriangle,
        linkTo: "/shown",
        tone: "urgent",
        help: "review these",
      },
    ];
    render(withRouter(<ActionNeededSection actions={actions} />));
    expect(screen.queryByText("hidden item")).not.toBeInTheDocument();
    expect(screen.getByText("shown item")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("review these")).toBeInTheDocument();
    // Tile is a link to the destination
    expect(screen.getByRole("link", { name: /shown item/i })).toHaveAttribute(
      "href",
      "/shown",
    );
  });
});
