import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useInquiryMessages, useSendInquiryMessage } from '@/hooks/useListingInquiries';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface InquiryThreadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inquiryId: string;
  subject: string;
  otherPartyName: string;
}

export function InquiryThread({
  open,
  onOpenChange,
  inquiryId,
  subject,
  otherPartyName,
}: InquiryThreadProps) {
  const { user } = useAuth();
  const { data: messages, isLoading } = useInquiryMessages(open ? inquiryId : undefined);
  const sendMessage = useSendInquiryMessage();
  const [body, setBody] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
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
      { inquiry_id: inquiryId, body: trimmed },
      { onSuccess: () => setBody('') },
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-md p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Inquiry</SheetTitle>
          <SheetDescription>
            {subject} &mdash; {otherPartyName}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div ref={scrollRef} className="py-4 space-y-3">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
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
                  <div key={msg.id} className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[75%] rounded-lg px-3 py-2',
                      isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted',
                    )}>
                      <p className="text-xs font-medium mb-1 opacity-80">
                        {isOwn ? 'You' : msg.sender?.full_name || otherPartyName}
                      </p>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.body}</p>
                      <p className={cn(
                        'text-[10px] mt-1',
                        isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground',
                      )}>
                        {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground text-sm">No messages yet</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <form onSubmit={handleSubmit} className="border-t px-4 py-3 flex items-end gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            rows={2}
            className="resize-none flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" size="icon" disabled={!body.trim() || sendMessage.isPending}>
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
}
