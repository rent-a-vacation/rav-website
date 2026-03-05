import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminPropertyEditDialog from "./AdminPropertyEditDialog";
import type { Property, VacationClubBrand } from "@/types/database";

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

const makeProperty = (overrides: Partial<Property> = {}): Property => ({
  id: "prop-1",
  owner_id: "owner-1",
  brand: "hilton_grand_vacations" as VacationClubBrand,
  resort_name: "Hilton Orlando",
  location: "Orlando, FL",
  bedrooms: 2,
  bathrooms: 2,
  sleeps: 6,
  description: "Nice place",
  amenities: ["Pool", "WiFi"],
  images: null,
  resort_id: null,
  unit_type_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
});

describe("AdminPropertyEditDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEq.mockResolvedValue({ error: null });
  });

  it("renders nothing when property is null", () => {
    const { container } = render(
      <AdminPropertyEditDialog
        property={null}
        open={true}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders form fields when open with property", () => {
    render(
      <AdminPropertyEditDialog
        property={makeProperty()}
        open={true}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Resort Name")).toHaveValue("Hilton Orlando");
    expect(screen.getByLabelText("Location")).toHaveValue("Orlando, FL");
    expect(screen.getByLabelText("Bedrooms")).toHaveValue(2);
    expect(screen.getByLabelText("Bathrooms")).toHaveValue(2);
    expect(screen.getByLabelText("Sleeps")).toHaveValue(6);
    expect(screen.getByLabelText("Description")).toHaveValue("Nice place");
    expect(screen.getByLabelText("Amenities (comma-separated)")).toHaveValue("Pool, WiFi");
  });

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    const onOpenChange = vi.fn();
    render(
      <AdminPropertyEditDialog
        property={makeProperty()}
        open={true}
        onOpenChange={onOpenChange}
        onSaved={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("saves property and calls onSaved on submit", async () => {
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <AdminPropertyEditDialog
        property={makeProperty()}
        open={true}
        onOpenChange={onOpenChange}
        onSaved={onSaved}
      />
    );

    fireEvent.click(screen.getByText("Save Changes"));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          resort_name: "Hilton Orlando",
          location: "Orlando, FL",
          last_edited_by: "admin-123",
        })
      );
    });

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it("disables Save when resort name is empty", () => {
    render(
      <AdminPropertyEditDialog
        property={makeProperty({ resort_name: "" })}
        open={true}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    // Clear the resort name field
    const resortInput = screen.getByLabelText("Resort Name");
    fireEvent.change(resortInput, { target: { value: "" } });
    expect(screen.getByText("Save Changes")).toBeDisabled();
  });

  it("shows error toast on save failure", async () => {
    mockEq.mockResolvedValueOnce({ error: { message: "DB error" } });

    render(
      <AdminPropertyEditDialog
        property={makeProperty()}
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
});
