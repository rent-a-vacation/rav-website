import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Send, X, Trash2, MapPin, Users, AlertCircle, ArrowLeftCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ChatMessage, ChatStatus, ChatContext } from "@/types/chat";
import type { VoiceSearchResult } from "@/types/voice";
import { cn } from "@/lib/utils";

const CONTEXT_LABELS: Record<ChatContext, string> = {
  rentals: "Property Search",
  "property-detail": "Property Help",
  bidding: "Marketplace",
  support: "Support",
  general: "Platform Help",
};

const SUGGESTED_PROMPTS: Record<ChatContext, string[]> = {
  rentals: [
    "Find condos in Orlando under $1500",
    "What's available in Maui for Spring Break?",
    "Show me 2-bedroom properties with a pool",
  ],
  "property-detail": [
    "What amenities does this have?",
    "How do Offers work on this Listing?",
    "Are there similar properties nearby?",
  ],
  bidding: [
    "How do I submit an Offer?",
    "What is a Wish?",
  ],
  support: [
    "Where's my refund?",
    "How do I cancel my booking?",
    "I'm having a problem with my stay",
    "How do I file a dispute?",
  ],
  general: [
    "How does Rent-A-Vacation work?",
    "How do I list my property?",
  ],
};

interface TextChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: ChatMessage[];
  status: ChatStatus;
  error: string | null;
  context: ChatContext;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
  /** Phase 22 C3 (#407) — server-classified context; when set and different
   *  from `context`, renders the "Switched to X — [back]" chip. */
  classifiedContext?: ChatContext | null;
  /** Dismisses the classifier chip and tells the hook to suppress future
   *  classifications for this session. */
  onDismissClassification?: () => void;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function SearchResultCard({ result }: { result: VoiceSearchResult }) {
  return (
    <Link
      to={`/property/${result.listing_id}`}
      className="flex gap-3 p-2 rounded-lg bg-background hover:bg-muted/50 transition-colors border"
    >
      <div className="w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted">
        {result.image_url ? (
          <img src={result.image_url} alt={result.property_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <MapPin className="w-4 h-4 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{result.property_name}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />{result.location}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm font-bold text-foreground">${result.price.toLocaleString()}</span>
          <span className="text-xs text-muted-foreground">
            <Users className="w-3 h-3 inline mr-0.5" />{result.sleeps} · {result.bedrooms}BR
          </span>
        </div>
      </div>
    </Link>
  );
}

export function TextChatPanel({
  open,
  onOpenChange,
  messages,
  status,
  error,
  context,
  onSendMessage,
  onClearHistory,
  classifiedContext,
  onDismissClassification,
}: TextChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status]);

  // Focus input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || status === "sending" || status === "streaming") return;
    onSendMessage(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isBusy = status === "sending" || status === "streaming";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md w-full flex flex-col p-0 [&>button.absolute]:hidden">
        {/* Header */}
        <SheetHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/ravio-v2.png" alt="RAVIO" className="h-7 w-7" />
              <SheetTitle className="text-base">RAVIO</SheetTitle>
              <Badge variant="secondary" className="text-xs">
                {CONTEXT_LABELS[context]}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onClearHistory}
                  aria-label="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Classifier chip — only when server swapped the context on an
            ambiguous route. Keeps the swap discoverable and reversible. */}
        {classifiedContext && classifiedContext !== context && onDismissClassification && (
          <div className="px-4 py-2 border-b bg-muted/30 shrink-0">
            <button
              type="button"
              onClick={onDismissClassification}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label={`Dismiss ${CONTEXT_LABELS[classifiedContext]} context and go back to general help`}
            >
              <ArrowLeftCircle className="h-3.5 w-3.5" />
              <span>
                Switched to <strong className="text-foreground">{CONTEXT_LABELS[classifiedContext]}</strong> — back to general help
              </span>
            </button>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {/* Empty state with suggested prompts */}
            {messages.length === 0 && (
              <div className="text-center py-8">
                <img src="/ravio-v2.png" alt="RAVIO" className="h-16 w-16 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  Ask RAVIO anything about vacation rentals!
                </p>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_PROMPTS[context].map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => onSendMessage(prompt)}
                      disabled={isBusy}
                      className="text-left text-sm px-3 py-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message bubbles */}
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "mr-auto bg-muted text-foreground",
                  )}
                >
                  {msg.content || (status === "streaming" && msg.role === "assistant" && <TypingIndicator />)}
                </div>

                {/* Inline search results */}
                {msg.searchResults && msg.searchResults.length > 0 && (
                  <div className="mt-2 space-y-2 max-w-[95%]">
                    {msg.searchResults.slice(0, 5).map((result) => (
                      <SearchResultCard key={result.listing_id} result={result} />
                    ))}
                    {msg.searchResults.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{msg.searchResults.length - 5} more results
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Streaming indicator for "sending" state (before SSE starts) */}
            {status === "sending" && (
              <div className="mr-auto bg-muted rounded-2xl px-4 py-2.5">
                <TypingIndicator />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="px-4 py-3 border-t shrink-0">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Ask RAVIO..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isBusy}
              className="flex-1"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isBusy}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
