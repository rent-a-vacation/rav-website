import { useState } from "react";
import { TextChatButton } from "@/components/TextChatButton";
import { TextChatPanel } from "@/components/TextChatPanel";
import { useTextChat } from "@/hooks/useTextChat";
import { cn } from "@/lib/utils";

interface RavioFloatingChatProps {
  className?: string;
}

/**
 * Floating "Ask RAVIO" button + panel for pages that don't have a dedicated
 * inline chat surface. Context is auto-detected from the current route
 * (see `useTextChat` + `detectChatContext`). Drop-in with no props.
 *
 * Phase 22 C2 (#406). For pages that own an explicit context (PropertyDetail,
 * Rentals, BiddingMarketplace, HowItWorksPage), keep the inline mount pattern.
 */
export function RavioFloatingChat({ className }: RavioFloatingChatProps) {
  const [open, setOpen] = useState(false);
  const {
    messages,
    status,
    error,
    sendMessage,
    clearHistory,
    context,
    classifiedContext,
    dismissClassification,
    conversationId,
  } = useTextChat();

  return (
    <>
      <TextChatButton
        onClick={() => setOpen(true)}
        isOpen={open}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40",
          className,
        )}
      />
      <TextChatPanel
        open={open}
        onOpenChange={setOpen}
        messages={messages}
        status={status}
        error={error}
        context={context}
        onSendMessage={sendMessage}
        onClearHistory={clearHistory}
        classifiedContext={classifiedContext}
        onDismissClassification={dismissClassification}
        conversationId={conversationId}
      />
    </>
  );
}
