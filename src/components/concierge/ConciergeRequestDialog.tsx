import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Headphones } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateConciergeRequest,
  CONCIERGE_CATEGORIES,
  type ConciergeCategory,
} from '@/hooks/useConcierge';

export function ConciergeRequestDialog() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ConciergeCategory>('general');
  const { toast } = useToast();
  const createRequest = useCreateConciergeRequest();

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;

    try {
      await createRequest.mutateAsync({ subject, description, category });
      toast({
        title: 'Request submitted',
        description: 'Our concierge team will get back to you shortly.',
      });
      setSubject('');
      setDescription('');
      setCategory('general');
      setOpen(false);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Headphones className="h-4 w-4" />
          Contact Concierge
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Your Concierge</DialogTitle>
          <DialogDescription>
            As a Premium member, you have access to dedicated concierge support.
            We'll respond within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="concierge-category">Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ConciergeCategory)}>
              <SelectTrigger id="concierge-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONCIERGE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="concierge-subject">Subject</Label>
            <Input
              id="concierge-subject"
              placeholder="What do you need help with?"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="concierge-description">Details</Label>
            <Textarea
              id="concierge-description"
              placeholder="Describe your request..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createRequest.isPending || !subject.trim() || !description.trim()}
          >
            {createRequest.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
