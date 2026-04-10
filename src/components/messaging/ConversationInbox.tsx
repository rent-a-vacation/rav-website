import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useMyConversations } from '@/hooks/useConversations';
import { getContextBadge, getOtherParticipant } from '@/lib/conversations';
import type { ConversationContextType } from '@/lib/conversations';

interface ConversationInboxProps {
  selectedId?: string;
  onSelect: (conversationId: string) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
}

const FILTER_TABS = [
  { value: 'all', label: 'All' },
  { value: 'booking', label: 'Bookings' },
  { value: 'bid', label: 'Bids' },
  { value: 'inquiry', label: 'Inquiries' },
  { value: 'travel_request', label: 'Requests' },
] as const;

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function ConversationInbox({ selectedId, onSelect, filter, onFilterChange }: ConversationInboxProps) {
  const { user } = useAuth();
  const { data: conversations, isLoading } = useMyConversations();

  const filtered = useMemo(() => {
    if (!conversations) return [];
    if (filter === 'all') return conversations;
    return conversations.filter((c: { context_type: string }) => c.context_type === filter);
  }, [conversations, filter]);

  return (
    <div className="flex flex-col h-full" data-testid="conversation-inbox">
      <div className="p-3 border-b">
        <h2 className="text-lg font-semibold mb-2">Messages</h2>
        <Tabs value={filter} onValueChange={onFilterChange}>
          <TabsList className="w-full">
            {FILTER_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs flex-1">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        {isLoading && (
          <div className="p-4 text-center text-muted-foreground text-sm">Loading...</div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No conversations yet
          </div>
        )}

        {filtered.map((conversation: Record<string, unknown>) => {
          const conv = conversation as {
            id: string;
            owner_id: string;
            traveler_id: string;
            context_type: string;
            last_message_at: string | null;
            owner_unread_count: number;
            traveler_unread_count: number;
            owner?: { id: string; full_name?: string; avatar_url?: string };
            traveler?: { id: string; full_name?: string; avatar_url?: string };
            property?: { id: string; resort_name?: string; location?: string };
          };

          const other = getOtherParticipant(conv, user?.id ?? '');
          const badge = getContextBadge(conv.context_type);
          const isSelected = conv.id === selectedId;
          const unreadCount = conv.owner_id === user?.id
            ? conv.owner_unread_count
            : conv.traveler_unread_count;
          const hasUnread = unreadCount > 0;

          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`w-full text-left px-3 py-3 border-b transition-colors hover:bg-muted/50 ${
                isSelected ? 'bg-muted' : ''
              }`}
              data-testid={`inbox-item-${conv.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {hasUnread && (
                    <div className="w-2 h-2 rounded-full bg-destructive flex-shrink-0" />
                  )}
                  <span className="font-medium text-sm truncate">
                    {other.full_name ?? 'Unknown User'}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground flex-shrink-0">
                  {formatRelativeTime(conv.last_message_at)}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 ml-4">
                <span className="text-xs text-muted-foreground truncate">
                  {conv.property?.resort_name ?? 'Unknown Property'}
                </span>
                <Badge variant={badge.variant as 'default' | 'secondary' | 'outline' | 'destructive'} className="text-[10px] px-1.5 py-0 h-4">
                  {badge.label}
                </Badge>
              </div>
            </button>
          );
        })}
      </ScrollArea>
    </div>
  );
}
