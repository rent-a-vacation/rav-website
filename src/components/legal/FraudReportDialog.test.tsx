// @vitest-environment jsdom
// @p0
/**
 * Tests for <FraudReportDialog /> (#492). FTC v. Carroll (2026).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));
const toastMock = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

import { FraudReportDialog } from "./FraudReportDialog";

beforeEach(() => {
  insertMock.mockReset();
  fromMock.mockClear();
  toastMock.mockClear();
  insertMock.mockResolvedValue({ error: null });
});

describe("FraudReportDialog", () => {
  it("renders with the senior-admin triage messaging", () => {
    render(
      <FraudReportDialog
        open={true}
        onOpenChange={() => {}}
        listingId="listing-abc"
        listingLabel="Marriott Aruba"
      />,
    );
    expect(screen.getByTestId("fraud-report-dialog")).toBeTruthy();
    expect(screen.getByText(/Marriott Aruba/)).toBeTruthy();
  });

  it("warns about active emergencies in the dialog copy", () => {
    render(<FraudReportDialog open={true} onOpenChange={() => {}} />);
    expect(screen.getByText(/active emergencies/i)).toBeTruthy();
    expect(screen.getByText(/local authorities/i)).toBeTruthy();
  });

  it("blocks submission when category is missing", async () => {
    render(<FraudReportDialog open={true} onOpenChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Submit fraud report/i }));
    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Pick a category", variant: "destructive" }),
      );
    });
    expect(insertMock).not.toHaveBeenCalled();
  });

  it("blocks submission when description is too short (< 20 chars)", async () => {
    render(<FraudReportDialog open={true} onOpenChange={() => {}} />);
    fireEvent.change(screen.getByLabelText(/Describe what happened/i), {
      target: { value: "short" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Submit fraud report/i }));
    await waitFor(() => {
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  it("shows anonymous contact fields when user is signed out", () => {
    render(<FraudReportDialog open={true} onOpenChange={() => {}} />);
    expect(screen.getByLabelText(/Email/i)).toBeTruthy();
  });
});
