import { useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRateSupportConversation } from "@/hooks/useSupportConversations";

interface RavioChatRatingProps {
  conversationId: string | null;
  className?: string;
}

/**
 * Thumbs up/down prompt shown at the bottom of the RAVIO support chat panel.
 * Phase 22 D2 (#411). Renders only when a support conversation_id is bound
 * and remains visible once the user picks; picking flips the pill to a quiet
 * "Thanks for the feedback" acknowledgement.
 */
export function RavioChatRating({ conversationId, className }: RavioChatRatingProps) {
  const [submitted, setSubmitted] = useState<1 | -1 | null>(null);
  const rate = useRateSupportConversation();

  if (!conversationId) return null;

  if (submitted !== null) {
    return (
      <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
        <Check className="h-3.5 w-3.5" />
        <span>Thanks for the feedback.</span>
      </div>
    );
  }

  const handleRate = (rating: 1 | -1) => {
    setSubmitted(rating);
    rate.mutate(
      { conversationId, rating },
      {
        onError: () => setSubmitted(null),
      },
    );
  };

  return (
    <div className={cn("flex items-center gap-3 text-xs text-muted-foreground", className)}>
      <span>Was this helpful?</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleRate(1)}
          className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors"
          aria-label="Rate this conversation helpful"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleRate(-1)}
          className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-muted transition-colors"
          aria-label="Rate this conversation not helpful"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
