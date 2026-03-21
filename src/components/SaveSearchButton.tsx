import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSaveSearch, hasActiveFilters, summarizeCriteria } from '@/hooks/useSavedSearches';
import type { SearchCriteria } from '@/hooks/useSavedSearches';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bookmark, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/posthog';

interface SaveSearchButtonProps {
  criteria: SearchCriteria;
}

export function SaveSearchButton({ criteria }: SaveSearchButtonProps) {
  const { user } = useAuth();
  const saveSearch = useSaveSearch();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  const active = hasActiveFilters(criteria);

  if (!user || !active) return null;

  const handleSave = async () => {
    try {
      await saveSearch.mutateAsync({
        name: name.trim() || undefined,
        criteria,
      });
      setSaved(true);
      trackEvent('search_saved', { has_custom_name: !!name.trim() });
      toast.success('Search saved!');
    } catch {
      toast.error('Failed to save search. Please try again.');
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setTimeout(() => {
      setSaved(false);
      setName('');
    }, 300);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setDialogOpen(true)}
        className="gap-1.5"
      >
        <Bookmark className="h-4 w-4" />
        <span className="hidden sm:inline">Save Search</span>
      </Button>

      <Dialog open={dialogOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          {saved ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Search Saved!
                </DialogTitle>
                <DialogDescription>
                  You can find your saved searches in My Trips.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={handleClose}>Done</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Save This Search</DialogTitle>
                <DialogDescription>
                  {summarizeCriteria(criteria)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2">
                <div className="space-y-2">
                  <Label htmlFor="search-name">Name (optional)</Label>
                  <Input
                    id="search-name"
                    placeholder="e.g., Hawaii Summer Trip"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saveSearch.isPending}>
                  {saveSearch.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Search'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
