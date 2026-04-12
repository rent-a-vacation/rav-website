import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TextChatButton } from "./TextChatButton";

function renderWithTooltip(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <TooltipProvider>{ui}</TooltipProvider>
    </MemoryRouter>
  );
}

describe("TextChatButton", () => {
  it("renders with chat icon and correct aria-label", () => {
    renderWithTooltip(<TextChatButton onClick={() => {}} />);
    const button = screen.getByRole("button", { name: "Chat with RAVIO" });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    renderWithTooltip(<TextChatButton onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Chat with RAVIO" });
    button.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders disabled state with reason", () => {
    renderWithTooltip(
      <TextChatButton
        onClick={() => {}}
        disabled
        disabledReason="Sign in to ask RAVIO"
      />
    );
    const button = screen.getByRole("button", { name: "Sign in to ask RAVIO" });
    expect(button).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    renderWithTooltip(
      <TextChatButton onClick={onClick} disabled disabledReason="Disabled" />
    );
    const button = screen.getByRole("button");
    button.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("applies custom className", () => {
    renderWithTooltip(
      <TextChatButton onClick={() => {}} className="custom-class" />
    );
    const button = screen.getByRole("button");
    expect(button.className).toContain("custom-class");
  });
});
