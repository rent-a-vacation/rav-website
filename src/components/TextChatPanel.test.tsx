import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders, screen, fireEvent } from "@/test/helpers/render";
import { TextChatPanel } from "./TextChatPanel";
import type { ChatMessage, ChatStatus, ChatContext } from "@/types/chat";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  messages: [] as ChatMessage[],
  status: "idle" as ChatStatus,
  error: null as string | null,
  context: "rentals" as ChatContext,
  onSendMessage: vi.fn(),
  onClearHistory: vi.fn(),
};

describe("TextChatPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header with title and context badge", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} />);
    expect(screen.getByText("RAVIO")).toBeInTheDocument();
    expect(screen.getByText("Property Search")).toBeInTheDocument();
  });

  it("shows suggested prompts when no messages", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} />);
    expect(screen.getByText("Find condos in Orlando under $1500")).toBeInTheDocument();
    expect(screen.getByText("What's available in Maui for Spring Break?")).toBeInTheDocument();
  });

  it("clicking suggested prompt calls onSendMessage", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} />);
    fireEvent.click(screen.getByText("Find condos in Orlando under $1500"));
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith("Find condos in Orlando under $1500");
  });

  it("renders user and assistant messages", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "Hello!", timestamp: Date.now() },
      { id: "2", role: "assistant", content: "Hi there! How can I help?", timestamp: Date.now() },
    ];
    renderWithProviders(<TextChatPanel {...defaultProps} messages={messages} />);
    expect(screen.getByText("Hello!")).toBeInTheDocument();
    expect(screen.getByText("Hi there! How can I help?")).toBeInTheDocument();
  });

  it("sends message on Enter key", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Ask RAVIO...");
    fireEvent.change(input, { target: { value: "test message" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith("test message");
  });

  it("sends message on send button click", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText("Ask RAVIO...");
    fireEvent.change(input, { target: { value: "test message" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    expect(defaultProps.onSendMessage).toHaveBeenCalledWith("test message");
  });

  it("disables input during streaming", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} status="streaming" />);
    const input = screen.getByPlaceholderText("Ask RAVIO...");
    expect(input).toBeDisabled();
  });

  it("shows error message", () => {
    renderWithProviders(
      <TextChatPanel {...defaultProps} error="Something went wrong" />
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("shows context badge for bidding", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} context="bidding" />);
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
  });

  it("shows context badge for support", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} context="support" />);
    expect(screen.getByText("Support")).toBeInTheDocument();
  });

  it("shows support suggested prompts", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} context="support" />);
    expect(screen.getByText("Where's my refund?")).toBeInTheDocument();
    expect(screen.getByText("How do I cancel my booking?")).toBeInTheDocument();
  });

  it("shows context badge for general", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} context="general" />);
    expect(screen.getByText("Platform Help")).toBeInTheDocument();
  });

  it("shows clear button when messages exist", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "Hello!", timestamp: Date.now() },
    ];
    renderWithProviders(<TextChatPanel {...defaultProps} messages={messages} />);
    const clearBtn = screen.getByRole("button", { name: "Clear chat" });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);
    expect(defaultProps.onClearHistory).toHaveBeenCalled();
  });

  it("does not show clear button when no messages", () => {
    renderWithProviders(<TextChatPanel {...defaultProps} />);
    expect(screen.queryByRole("button", { name: "Clear chat" })).not.toBeInTheDocument();
  });

  it("renders search result cards inline", () => {
    const messages: ChatMessage[] = [
      {
        id: "1",
        role: "assistant",
        content: "Found some results!",
        timestamp: Date.now(),
        searchResults: [
          {
            listing_id: "abc-123",
            property_name: "Orlando Condo",
            location: "Orlando, FL",
            check_in: "2026-03-01",
            check_out: "2026-03-08",
            price: 1200,
            bedrooms: 2,
            bathrooms: 2,
            sleeps: 6,
            brand: "marriott",
            amenities: ["pool"],
            image_url: null,
            resort_name: null,
            resort_rating: null,
            resort_amenities: [],
            unit_type_name: null,
            square_footage: null,
          },
        ],
      },
    ];
    renderWithProviders(<TextChatPanel {...defaultProps} messages={messages} />);
    expect(screen.getByText("Orlando Condo")).toBeInTheDocument();
    expect(screen.getByText("$1,200")).toBeInTheDocument();
  });
});
