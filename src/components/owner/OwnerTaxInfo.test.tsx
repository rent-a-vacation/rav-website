import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { OwnerTaxInfo } from "./OwnerTaxInfo";

// Mock auth
const mockUser = { id: "user-1", email: "test@test.com" };
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: mockUser }),
}));

// Mock toast
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

// Mock supabase
const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    single: vi.fn().mockResolvedValue({
      data: {
        tax_id_type: null,
        tax_id_last4: null,
        w9_submitted_at: null,
        tax_business_name: null,
        tax_address_line1: null,
        tax_address_line2: null,
        tax_city: null,
        tax_state: null,
        tax_zip: null,
      },
      error: null,
    }),
  }),
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: () => ({ select: mockSelect }),
  },
}));

function renderTaxInfo() {
  return render(<OwnerTaxInfo />);
}

describe("OwnerTaxInfo", () => {
  it("renders the tax info card", async () => {
    renderTaxInfo();
    expect(await screen.findByText("Tax Information (W-9)")).toBeTruthy();
  });

  it("shows Incomplete badge when W-9 not submitted", async () => {
    renderTaxInfo();
    expect(await screen.findByText("Incomplete")).toBeTruthy();
  });

  it("shows SSN and EIN radio options", async () => {
    renderTaxInfo();
    expect(await screen.findByText("Social Security Number (SSN)")).toBeTruthy();
    expect(screen.getByText("Employer Identification Number (EIN)")).toBeTruthy();
  });

  it("shows tax ID input with mask prefix", async () => {
    renderTaxInfo();
    expect(await screen.findByText("***-**-")).toBeTruthy();
    expect(screen.getByPlaceholderText("0000")).toBeTruthy();
  });

  it("shows address fields", async () => {
    renderTaxInfo();
    expect(await screen.findByPlaceholderText("Address line 1")).toBeTruthy();
    expect(screen.getByPlaceholderText("City")).toBeTruthy();
    expect(screen.getByPlaceholderText("ZIP")).toBeTruthy();
  });

  it("shows W-9 certification checkbox", async () => {
    renderTaxInfo();
    expect(await screen.findByText(/W-9 Certification/)).toBeTruthy();
  });

  it("shows security note about last 4 digits", async () => {
    renderTaxInfo();
    expect(await screen.findByText(/only store the last 4 digits/)).toBeTruthy();
  });

  it("shows $600 threshold info", async () => {
    renderTaxInfo();
    const matches = await screen.findAllByText(/\$600 or more/);
    expect(matches.length).toBeGreaterThan(0);
  });

  it("shows submit button", async () => {
    renderTaxInfo();
    expect(await screen.findByText("Submit W-9 Information")).toBeTruthy();
  });
});

describe("OwnerTaxInfo with submitted data", () => {
  beforeEach(() => {
    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            tax_id_type: "ssn",
            tax_id_last4: "1234",
            w9_submitted_at: "2026-03-15T00:00:00Z",
            tax_business_name: null,
            tax_address_line1: "123 Main St",
            tax_address_line2: null,
            tax_city: "Orlando",
            tax_state: "FL",
            tax_zip: "32801",
          },
          error: null,
        }),
      }),
    });
  });

  it("shows W-9 Submitted badge", async () => {
    renderTaxInfo();
    expect(await screen.findByText("W-9 Submitted")).toBeTruthy();
  });

  it("shows Update button instead of Submit", async () => {
    renderTaxInfo();
    expect(await screen.findByText("Update Tax Information")).toBeTruthy();
  });

  it("shows last submitted date", async () => {
    renderTaxInfo();
    expect(await screen.findByText(/Last submitted:/)).toBeTruthy();
  });
});
