import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReportIssueDialog, {
  mapCheckinIssueToDisputeCategory,
} from "./ReportIssueDialog";
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

  it("pre-fills category + description when prefill prop is supplied (#467 Gap C)", async () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <ReportIssueDialog
          open={true}
          onOpenChange={vi.fn()}
          bookingId="booking-1"
          prefill={{
            category: "access_issues",
            description: "The lockbox code we were sent does not work.",
            photoNote: "(Verification photo was attached when this issue was first reported.)",
          }}
        />
      </Wrapper>
    );

    await waitFor(() => {
      const textarea = screen.getByLabelText(/Description/) as HTMLTextAreaElement;
      expect(textarea.value).toMatch(/lockbox code/);
      expect(textarea.value).toMatch(/Verification photo was attached/);
    });
  });
});

describe("mapCheckinIssueToDisputeCategory @p0", () => {
  it("maps no_access → access_issues", () => {
    expect(mapCheckinIssueToDisputeCategory("no_access")).toBe("access_issues");
  });
  it("maps wrong_unit + not_as_described + amenities_missing → property_not_as_described", () => {
    expect(mapCheckinIssueToDisputeCategory("wrong_unit")).toBe("property_not_as_described");
    expect(mapCheckinIssueToDisputeCategory("not_as_described")).toBe(
      "property_not_as_described",
    );
    expect(mapCheckinIssueToDisputeCategory("amenities_missing")).toBe(
      "property_not_as_described",
    );
  });
  it("maps cleanliness → cleanliness", () => {
    expect(mapCheckinIssueToDisputeCategory("cleanliness")).toBe("cleanliness");
  });
  it("maps safety_concern → safety_concerns", () => {
    expect(mapCheckinIssueToDisputeCategory("safety_concern")).toBe("safety_concerns");
  });
  it("maps unknown values to 'other' as a safe default", () => {
    expect(mapCheckinIssueToDisputeCategory("definitely-not-real")).toBe("other");
    expect(mapCheckinIssueToDisputeCategory("")).toBe("other");
  });
});
