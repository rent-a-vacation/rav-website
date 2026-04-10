import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useConversation,
  useConversationThread,
  useMarkConversationRead,
} from '@/hooks/useConversations';
import { getOtherParticipant, getContextBadge } from '@/lib/conversations';
import { ConversationEventBubble } from './ConversationEventBubble';
import { MessageComposer } from './MessageComposer';

interface ConversationThreadProps {
  conversationId: string;
  onBack?: () => void;
}

function formatDateSeparator(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function getContextLink(contextType: string, conversation: Record<string, unknown>): { label: string; to: string } | null {
  const propertyId = conversation.property_id as string | undefined;
  const listingId = conversation.listing_id as string | undefined;

  switch (contextType) {
    case 'booking':
      return { label: 'View Booking', to: '/my-trips?tab=bookings' };
    case 'bid':
      return listingId
        ? { label: 'View Listing', to: `/rentals/${listingId}` }
        : null;
    case 'inquiry':
      return listingId
        ? { label: 'View Property', to: `/rentals/${listingId}` }
        : null;
    case 'travel_request':
      return { label: 'View Requests', to: '/my-trips?tab=offers' };
    default:
      return propertyId ? { label: 'View Property', to: `/rentals/${propertyId}` } : null;
  }
}

export function ConversationThread({ conversationId, onBack }: ConversationThreadProps) {
  const { user } = useAuth();
  const { data: conversation } = useConversation(conversationId);
  const { data: thread, isLoading } = useConversationThread(conversationId);
  const markRead = useMarkConversationRead();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mark conversation read on mount
  useEffect(() => {
    if (conversationId) {
      markRead.mutate(conversationId);
    }
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.length]);

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Loading conversation...
      </div>
    );
  }

  const other = getOtherParticipant(
    conversation as { owner_id: string; traveler_id: string; owner?: { id: string; full_name?: string }; traveler?: { id: string; full_name?: string } },
    user?.id ?? ''
  );
  const badge = getContextBadge(conversation.context_type);
  const contextLink = getContextLink(conversation.context_type, conversation);
  const propertyName = (conversation as Record<string, unknown> & { property?: { resort_name?: string } }).property?.resort_name;

  let lastDateStr = '';

  return (
    <div className="flex flex-col h-full" data-testid="conversation-thread">
      {/* Header */}
      <div className="border-b px-3 py-2 flex items-center gap-2">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden" aria-label="Back to inbox">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            {other.full_name ?? 'Unknown User'}
          </div>
          <div className="text-xs text-muted-foreground truncate">
            {propertyName ?? 'Unknown Property'} · {badge.label}
          </div>
        </div>
        {contextLink && (
          <Button variant="ghost" size="sm" asChild>
            <Link to={contextLink.to}>
              {contextLink.label}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        )}
      </div>

      {/* Thread */}
      <ScrollArea className="flex-1 px-3" ref={scrollRef}>
        <div className="py-3 space-y-1">
          {isLoading && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Loading messages...
            </div>
          )}

          {!isLoading && (!thread || thread.length === 0) && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No messages yet. Start the conversation!
            </div>
          )}

          {thread?.map((item) => {
            const itemDate = new Date(item.created_at).toDateString();
            const showDateSeparator = itemDate !== lastDateStr;
            lastDateStr = itemDate;

            return (
              <div key={item.id}>
                {showDateSeparator && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 border-t" />
                    <span className="text-[11px] text-muted-foreground font-medium">
                      {formatDateSeparator(item.created_at)}
                    </span>
                    <div className="flex-1 border-t" />
                  </div>
                )}

                {item.item_type === 'event' ? (
                  <ConversationEventBubble
                    eventType={item.event_type ?? ''}
                    eventData={(item.event_data as Record<string, unknown>) ?? {}}
                    createdAt={item.created_at}
                  />
                ) : (
                  <div
                    className={`flex mb-2 ${
                      item.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        item.sender_id === user?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{item.body}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          item.sender_id === user?.id
                            ? 'text-primary-foreground/60'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {new Date(item.created_at).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Composer */}
      <MessageComposer conversationId={conversationId} />
    </div>
  );
}
