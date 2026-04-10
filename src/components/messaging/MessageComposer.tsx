import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useSendMessage } from '@/hooks/useConversations';

interface MessageComposerProps {
  conversationId: string;
}

export function MessageComposer({ conversationId }: MessageComposerProps) {
  const [body, setBody] = useState('');
  const sendMessage = useSendMessage();

  const handleSend = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed || sendMessage.isPending) return;

    sendMessage.mutate(
      { conversationId, body: trimmed },
      { onSuccess: () => setBody('') }
    );
  }, [body, conversationId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-3 flex gap-2 items-end">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        className="min-h-[40px] max-h-[120px] resize-none"
        rows={1}
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!body.trim() || sendMessage.isPending}
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
