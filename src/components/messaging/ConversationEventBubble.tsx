import { formatConversationEvent } from '@/lib/conversations';

interface ConversationEventBubbleProps {
  eventType: string;
  eventData: Record<string, unknown>;
  createdAt: string;
}

export function ConversationEventBubble({ eventType, eventData, createdAt }: ConversationEventBubbleProps) {
  const text = formatConversationEvent(eventType, eventData);
  const time = new Date(createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="flex justify-center my-3">
      <div className="bg-muted/50 rounded-full px-4 py-1.5 text-sm text-muted-foreground italic flex items-center gap-2">
        <span>{text}</span>
        <span className="text-[10px] opacity-60">{time}</span>
      </div>
    </div>
  );
}
