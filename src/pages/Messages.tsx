import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { ConversationInbox } from '@/components/messaging/ConversationInbox';
import { ConversationThread } from '@/components/messaging/ConversationThread';
import { MessageSquare } from 'lucide-react';

export default function Messages() {
  usePageMeta('Messages', 'Manage your conversations with owners and travelers');

  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  const handleSelect = useCallback(
    (id: string) => {
      navigate(`/messages/${id}`);
    },
    [navigate]
  );

  const handleBack = useCallback(() => {
    navigate('/messages');
  }, [navigate]);

  return (
    <div className="pt-16 md:pt-20 min-h-screen bg-background" data-testid="messages-page">
      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)] flex flex-col md:flex-row">
        {/* Inbox panel — hidden on mobile when conversation is selected */}
        <div
          className={`w-full md:w-[360px] md:flex-shrink-0 border-r h-full ${
            conversationId ? 'hidden md:flex md:flex-col' : 'flex flex-col'
          }`}
        >
          <ConversationInbox
            selectedId={conversationId}
            onSelect={handleSelect}
            filter={filter}
            onFilterChange={setFilter}
          />
        </div>

        {/* Thread panel — full screen on mobile, fills remainder on desktop */}
        <div
          className={`flex-1 h-full ${
            conversationId ? 'flex flex-col' : 'hidden md:flex md:flex-col'
          }`}
        >
          {conversationId ? (
            <ConversationThread
              conversationId={conversationId}
              onBack={handleBack}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <MessageSquare className="h-12 w-12 opacity-30" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
