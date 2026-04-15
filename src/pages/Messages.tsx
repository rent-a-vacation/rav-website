import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
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
    <div className="min-h-screen flex flex-col" data-testid="messages-page">
      <Header />

      <main id="main-content" className="flex-1 pt-16 md:pt-20">
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
          {/* Page heading */}
          <div className="mb-5 md:mb-6">
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-primary" />
              Messages
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Your conversations with owners and travelers.
            </p>
          </div>

          {/* Two-panel layout */}
          <div className="border rounded-lg overflow-hidden bg-card h-[calc(100vh-14rem)] md:h-[calc(100vh-16rem)] flex flex-col md:flex-row">
            {/* Inbox panel — hidden on mobile when conversation is selected */}
            <div
              className={`w-full md:w-[360px] md:flex-shrink-0 md:border-r ${
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
              className={`flex-1 ${
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
      </main>

      <Footer />
    </div>
  );
}
