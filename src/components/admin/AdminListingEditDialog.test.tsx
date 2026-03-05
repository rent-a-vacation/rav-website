import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminListingEditDialog from "./AdminListingEditDialog";
import type { Listing, Property, CancellationPolicy, ListingStatus, VacationClubBrand } from "@/types/database";

const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockToast = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({
      update: (data: Record<string, unknown>) => {
        mockUpdate(data);
        return { eq: mockEq };
      },
    }),
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-123" },
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

interface ListingForEdit extends Listing {
  property?: Property;
}

const makeProperty = (): Property => ({
  id: "prop-1",
  owner_id: "owner-1",
  brand: "hilton_grand_vacations" as VacationClubBrand,
  resort_name: "Hilton Orlando",
  location: "Orlando, FL",
  bedrooms: 2,
  bathrooms: 2,
  sleeps: 6,
  description: null,
  amenities: null,
  images: null,
  resort_id: null,
  unit_type_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
});

const makeListing = (overrides: Partial<ListingForEdit> = {}): ListingForEdit => ({
  id: "listing-1",
  property_id: "prop-1",
  owner_id: "owner-1",
  check_in_date: "2025-06-01",
  check_out_date: "2025-06-08",
  nightly_rate: 200,
  owner_price: 1400,
  rav_markup: 210,
  final_price: 1610,
  cleaning_fee: 50,
  resort_fee: null,
  cancellation_policy: "moderate" as CancellationPolicy,
  status: "active" as ListingStatus,
  notes: "Test notes",
  open_for_bidding: false,
  allow_counter_offers: false,
  min_bid_amount: null,
  reserve_price: null,
  bidding_ends_at: null,
  approved_by: null,
  approved_at: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  property: makeProperty(),
  ...overrides,
});

describe("AdminListingEditDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it("renders nothing when listing is null", () => {
    const { container } = render(
      <AdminListingEditDialog
        listing={null}
        open={true}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders form fields when open with listing", () => {
    render(
      <AdminListingEditDialog
        listing={makeListing()}
        open={true}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Check-In Date")).toHaveValue("2025-06-01");
    expect(screen.getByLabelText("Check-Out Date")).toHaveValue("2025-06-08");
    expect(screen.getByLabelText("Nightly Rate ($)")).toHaveValue(200);
    expect(screen.getByLabelText("Cleaning Fee ($)")).toHaveValue(50);
    expect(screen.getByLabelText("Listing Notes")).toHaveValue("Test notes");
  });

  it("shows live price calculation", () => {
    render(
      <AdminListingEditDialog
        listing={makeListing()}
        open={true}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    // 7 nights × $200 = $1400 owner, $210 markup, $1610 total
    expect(screen.getByText("7 nights × $200/night")).toBeInTheDocument();
    expect(screen.getByText("$1,610")).toBeInTheDocument();
  });

  it("disables form for booked listings", () => {
    render(
      <AdminListingEditDialog
        listing={makeListing({ status: "booked" as ListingStatus })}
        open={true}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    expect(screen.getByText(/cannot be edited/)).toBeInTheDocument();
    expect(screen.getByLabelText("Check-In Date")).toBeDisabled();
    expect(screen.getByText("Save Changes")).toBeDisabled();
  });

  it("saves listing and calls onSaved on submit", async () => {
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <AdminListingEditDialog
        listing={makeListing()}
        open={true}
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />
    );

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          nightly_rate: 200,
          last_edited_by: "admin-123",
        })
      );
    });

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("shows error toast on save failure", async () => {
    mockEq.mockResolvedValueOnce({ error: { message: "DB error" } });

    render(
      <AdminListingEditDialog
        listing={makeListing()}
        open={true}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ variant: "destructive" })
      );
    });
  });

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <AdminListingEditDialog
        listing={makeListing()}
        open={true}
        onOpenChange={onOpenChange}
        onSaved={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
