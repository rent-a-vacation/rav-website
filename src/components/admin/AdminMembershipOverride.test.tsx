import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { AdminMembershipOverride } from "./AdminMembershipOverride";
import { mockOwnerFreeTier, mockOwnerProTier, mockOwnerBusinessTier } from "@/test/fixtures/memberships";

const mockUpdate = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return { eq: (...eqArgs: unknown[]) => { mockEq(...eqArgs); return Promise.resolve({ error: null }); } };
      },
    })),
  },
}));

vi.mock("@/hooks/useMembership", () => ({
  useMembershipTiers: () => ({
    data: [mockOwnerFreeTier(), mockOwnerProTier(), mockOwnerBusinessTier()],
  }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const baseMembership = {
  id: "mem-1",
  user_id: "user-1",
  tier: mockOwnerFreeTier(),
  user_email: "owner@test.com",
  admin_override: false,
  admin_notes: null,
};

function renderOverride(
  props: Partial<React.ComponentProps<typeof AdminMembershipOverride>> = {}
) {
  const defaultProps = {
    membership: baseMembership,
    open: true,
    onOpenChange: vi.fn(),
    onSaved: vi.fn(),
    ...props,
  };
  return render(<AdminMembershipOverride {...defaultProps} />);
}

describe("AdminMembershipOverride", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders current tier and user email", () => {
    renderOverride();
    expect(screen.getByText("Free (owner)")).toBeInTheDocument();
    expect(screen.getByText("owner@test.com")).toBeInTheDocument();
  });

  it("shows override warning alert", () => {
    renderOverride();
    expect(screen.getByText(/prevents Stripe webhooks/)).toBeInTheDocument();
  });

  it("disables save when notes are empty", () => {
    renderOverride();
    const saveButton = screen.getByText("Apply Override");
    expect(saveButton).toBeDisabled();
  });

  it("does not show clear override button when not overridden", () => {
    renderOverride();
    expect(screen.queryByText("Clear Override")).not.toBeInTheDocument();
  });

  it("shows clear override button when admin_override is true", () => {
    renderOverride({
      membership: { ...baseMembership, admin_override: true, admin_notes: "VIP" },
    });
    expect(screen.getByText("Clear Override")).toBeInTheDocument();
  });
});
