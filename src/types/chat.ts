import type { VoiceSearchResult } from "./voice";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  searchResults?: VoiceSearchResult[];
}

export type ChatStatus = "idle" | "sending" | "streaming" | "error";

export type ChatContext = "rentals" | "property-detail" | "bidding" | "support" | "general";
