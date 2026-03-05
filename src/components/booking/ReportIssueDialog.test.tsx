import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportIssueDialog from "./ReportIssueDialog";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock hooks
const mockMutate = vi.fn();

vi.mock("@/hooks/useSubmitDispute", () => ({
  useSubmitDispute: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

vi.mock("@/hooks/useDisputeEvidence", () => ({
  useDisputeEvidence: () => ({
    uploadedFiles: [],
    isUploading: false,
    uploadFiles: vi.fn(),
    removeFile: vi.fn(),
    resetFiles: vi.fn(),
    getEvidenceUrls: () => [],
  }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("ReportIssueDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders renter categories by default", () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <ReportIssueDialog
          open={true}
          onOpenChange={vi.fn()}
          bookingId="booking-1"
        />
      </Wrapper>
    );

    expect(screen.getByText("Report an Issue")).toBeInTheDocument();
    expect(screen.getByText(/Report a problem with your booking/)).toBeInTheDocument();
  });

  it("renders owner description when role is owner", () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <ReportIssueDialog
          open={true}
          onOpenChange={vi.fn()}
          bookingId="booking-1"
          role="owner"
        />
      </Wrapper>
    );

    expect(screen.getByText(/Report a problem with a renter/)).toBeInTheDocument();
  });

  it("shows evidence upload section", () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <ReportIssueDialog
          open={true}
          onOpenChange={vi.fn()}
          bookingId="booking-1"
        />
      </Wrapper>
    );

    expect(screen.getByText("Evidence (optional)")).toBeInTheDocument();
    expect(screen.getByText("Attach Evidence")).toBeInTheDocument();
  });

  it("submit button is disabled without category and description", () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <ReportIssueDialog
          open={true}
          onOpenChange={vi.fn()}
          bookingId="booking-1"
        />
      </Wrapper>
    );

    const submitBtn = screen.getByRole("button", { name: "Submit Report" });
    expect(submitBtn).toBeDisabled();
  });

  it("calls onOpenChange(false) when Cancel is clicked", () => {
    const onOpenChange = vi.fn();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <ReportIssueDialog
          open={true}
          onOpenChange={onOpenChange}
          bookingId="booking-1"
        />
      </Wrapper>
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
