import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateInquiry } from '@/hooks/useListingInquiries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const INQUIRY_SUBJECTS = [
  'About the unit',
  'Resort amenities',
  'Check-in details',
  'Pricing',
  'Other',
];

interface InquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  ownerId: string;
  propertyName: string;
}

export function InquiryDialog({
  open,
  onOpenChange,
  listingId,
  ownerId,
  propertyName,
}: InquiryDialogProps) {
  const { user } = useAuth();
  const createInquiry = useCreateInquiry();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !message.trim()) return;

    try {
      await createInquiry.mutateAsync({
        listing_id: listingId,
        owner_id: ownerId,
        subject,
        message: message.trim(),
      });
      setSent(true);
      toast.success('Question sent to the owner!');
    } catch {
      toast.error('Failed to send inquiry. Please try again.');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setSent(false);
      setSubject('');
      setMessage('');
    }, 300);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {sent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Question Sent!
              </DialogTitle>
              <DialogDescription>
                The owner will be notified and can reply directly. You'll see their response in your notifications.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Ask the Owner
              </DialogTitle>
              <DialogDescription>
                Ask a question about {propertyName} before booking.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="inquiry-subject">Topic</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger id="inquiry-subject">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {INQUIRY_SUBJECTS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="inquiry-message">Your question</Label>
                <Textarea
                  id="inquiry-message"
                  placeholder="What would you like to know about this property?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!subject || !message.trim() || createInquiry.isPending}
              >
                {createInquiry.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Question'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
