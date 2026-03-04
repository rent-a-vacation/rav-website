import { useNavigate } from 'react-router-dom';
import { useSavedSearches, useDeleteSavedSearch, summarizeCriteria, criteriaToSearchParams } from '@/hooks/useSavedSearches';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Trash2, Bookmark } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export function SavedSearchesList() {
  const navigate = useNavigate();
  const { data: searches, isLoading } = useSavedSearches();
  const deleteMutation = useDeleteSavedSearch();

  const handleSearch = (criteria: Record<string, string | undefined>) => {
    const params = criteriaToSearchParams(criteria);
    navigate(`/rentals${params ? `?${params}` : ''}`);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success('Saved search removed'),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!searches || searches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Bookmark className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No saved searches yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Save a search from the Rentals page to find it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {searches.map((search) => (
        <div
          key={search.id}
          className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {search.name || summarizeCriteria(search.criteria)}
            </p>
            {search.name && (
              <p className="text-xs text-muted-foreground truncate">
                {summarizeCriteria(search.criteria)}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              Saved {format(new Date(search.created_at), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSearch(search.criteria)}
            >
              <Search className="h-3.5 w-3.5 mr-1" />
              Search
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => handleDelete(search.id)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
