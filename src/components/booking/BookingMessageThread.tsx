// @deprecated — Replaced by ConversationThread (src/components/messaging/ConversationThread.tsx)
// This component is kept for backward compatibility during the transition.
// New writes go to conversation_messages via the unified conversation layer.
// TODO: Remove this file and update MyBookings + OwnerBookings to use /messages links.

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useBookingMessages,
  useSendBookingMessage,
  useMarkMessagesRead,
} from "@/hooks/useBookingMessages";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BookingMessageThreadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  bookingRef: string;
  otherPartyName: string;
}

const BookingMessageThread = ({
  open,
  onOpenChange,
  bookingId,
  bookingRef,
  otherPartyName,
}: BookingMessageThreadProps) => {
  const { user } = useAuth();
  const { data: messages, isLoading } = useBookingMessages(open ? bookingId : undefined);
  const sendMessage = useSendBookingMessage();
  const markRead = useMarkMessagesRead();
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Realtime: instant message updates via Supabase Realtime
  useRealtimeSubscription({
    table: 'booking_messages',
    event: 'INSERT',
    filter: `booking_id=eq.${bookingId}`,
    invalidateKeys: [['booking-messages', bookingId], ['unread-messages']],
    enabled: open && !!bookingId,
  });

  // Mark messages as read when the sheet opens
  useEffect(() => {
    if (open && bookingId && user) {
      markRead.mutate(bookingId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bookingId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed || !user) return;

    sendMessage.mutate(
      { booking_id: bookingId, sender_id: user.id, body: trimmed },
      {
        onSuccess: () => setBody(""),
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex flex-col w-full sm:max-w-md p-0"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Messages</SheetTitle>
          <SheetDescription>
            Booking {bookingRef} &mdash; {otherPartyName}
          </SheetDescription>
        </SheetHeader>

        {/* Message area */}
        <ScrollArea className="flex-1 px-4">
          <div ref={scrollRef} className="py-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex",
                      i % 2 === 0 ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className="space-y-1 max-w-[75%]">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-12 w-48 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((msg) => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      isOwn ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-lg px-3 py-2",
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <p className="text-xs font-medium mb-1 opacity-80">
                        {isOwn ? "You" : msg.sender?.full_name || otherPartyName}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.body}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] mt-1",
                          isOwn
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground"
                        )}
                      >
                        {format(new Date(msg.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="border-t px-4 py-3 flex items-end gap-2"
        >
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!body.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default BookingMessageThread;
