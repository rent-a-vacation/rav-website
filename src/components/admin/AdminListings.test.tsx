import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Mock supabase
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();
const mockInvoke = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "RPC not mocked" } }),
    functions: {
      invoke: (...args: unknown[]) => mockInvoke(...args),
    },
  },
  isSupabaseConfigured: () => true,
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-1" },
    hasRole: () => true,
    isRavTeam: () => true,
    isRavAdmin: () => true,
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

function setupMocks(listingData: unknown[] = []) {
  mockFrom.mockReturnValue({
    select: mockSelect.mockReturnValue({
      order: mockOrder.mockResolvedValue({
        data: listingData,
        error: null,
      }),
    }),
    update: mockUpdate.mockReturnValue({
      eq: mockEq.mockResolvedValue({ error: null }),
    }),
  });
  mockInvoke.mockResolvedValue({ data: { success: true }, error: null });
}

describe("AdminListings email notifications", { timeout: 15000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("calls send-approval-email after approving a listing", async () => {
    setupMocks(); // Ensure fresh mocks before dynamic import
    const { default: AdminListings } = await import("./AdminListings");
    const { renderWithProviders } = await import("@/test/helpers/render");

    const listingData = [
      {
        id: "listing-1",
        status: "pending_approval" as const,
        created_at: "2026-02-27T10:00:00Z",
        check_in_date: "2026-04-01",
        check_out_date: "2026-04-07",
        final_price: 1200,
        owner_price: 1000,
        rav_markup: 200,
        nightly_rate: 143,
        owner: { id: "owner-1", full_name: "Test Owner", email: "owner@test.com" },
        property: { resort_name: "Test Resort", location: "Orlando, FL" },
      },
    ];

    setupMocks(listingData);

    const { findByText } = renderWithProviders(<AdminListings />);

    const approveBtn = await findByText("Approve");
    approveBtn.click();

    await vi.waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("send-approval-email", {
        body: {
          user_id: "owner-1",
          action: "approved",
          email_type: "user_approval",
        },
      });
    });
  });

  it("calls send-approval-email after rejecting a listing with reason", async () => {
    setupMocks(); // Ensure fresh mocks before dynamic import
    const { default: AdminListings } = await import("./AdminListings");
    const { renderWithProviders } = await import("@/test/helpers/render");
    const { fireEvent } = await import("@testing-library/react");

    const listingData = [
      {
        id: "listing-2",
        status: "pending_approval" as const,
        created_at: "2026-02-27T10:00:00Z",
        check_in_date: "2026-05-01",
        check_out_date: "2026-05-07",
        final_price: 900,
        owner_price: 750,
        rav_markup: 150,
        nightly_rate: 107,
        owner: { id: "owner-2", full_name: "Another Owner", email: "owner2@test.com" },
        property: { resort_name: "Beach Resort", location: "Miami, FL" },
      },
    ];

    setupMocks(listingData);

    const { findByText, findByPlaceholderText } = renderWithProviders(<AdminListings />);

    // Click Reject to open dialog
    const rejectBtn = await findByText("Reject");
    rejectBtn.click();

    // Wait for dialog to appear and fill in rejection reason
    await vi.waitFor(async () => {
      const textarea = document.querySelector('textarea[placeholder="Enter rejection reason..."]') as HTMLTextAreaElement;
      expect(textarea).toBeTruthy();
      fireEvent.change(textarea, { target: { value: "Pricing appears unrealistic" } });
    });

    // Click confirm reject button in the dialog
    await vi.waitFor(async () => {
      const buttons = document.querySelectorAll("button");
      const confirmBtn = Array.from(buttons).find((b) => b.textContent === "Reject Listing");
      expect(confirmBtn).toBeTruthy();
      confirmBtn!.click();
    });

    await vi.waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("send-approval-email", {
        body: {
          user_id: "owner-2",
          action: "rejected",
          email_type: "user_approval",
        },
      });
    });
  });
});
