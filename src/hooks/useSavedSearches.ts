import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export interface SearchCriteria {
  searchQuery?: string;
  minPrice?: string;
  maxPrice?: string;
  minGuests?: string;
  minBedrooms?: string;
  brandFilter?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string | null;
  criteria: SearchCriteria;
  notify_email: boolean;
  last_notified_at: string | null;
  created_at: string;
}

/** Fetch user's saved searches */
export function useSavedSearches() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['saved-searches', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as SavedSearch[];
    },
    enabled: !!user,
  });
}

/** Save current search criteria */
export function useSaveSearch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: { name?: string; criteria: SearchCriteria; notify_email?: boolean }) => {
      const { data, error } = await supabase
        .from('saved_searches')
        .insert({
          user_id: user!.id,
          name: params.name || null,
          criteria: params.criteria,
          notify_email: params.notify_email ?? true,
        } as never)
        .select()
        .single();
      if (error) throw error;
      return data as SavedSearch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

/** Delete a saved search */
export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchId: string) => {
      const { error } = await supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
    },
  });
}

/** Build a human-readable summary of search criteria */
export function summarizeCriteria(criteria: SearchCriteria): string {
  const parts: string[] = [];

  if (criteria.searchQuery) parts.push(`"${criteria.searchQuery}"`);
  if (criteria.brandFilter) parts.push(criteria.brandFilter.replace(/_/g, ' '));
  if (criteria.minPrice && criteria.maxPrice) {
    parts.push(`$${criteria.minPrice}–$${criteria.maxPrice}`);
  } else if (criteria.minPrice) {
    parts.push(`$${criteria.minPrice}+`);
  } else if (criteria.maxPrice) {
    parts.push(`up to $${criteria.maxPrice}`);
  }
  if (criteria.minGuests) parts.push(`${criteria.minGuests}+ guests`);
  if (criteria.minBedrooms) parts.push(`${criteria.minBedrooms}+ beds`);
  if (criteria.dateFrom) parts.push(`from ${criteria.dateFrom}`);

  return parts.length > 0 ? parts.join(', ') : 'All listings';
}

/** Build URL search params from criteria */
export function criteriaToSearchParams(criteria: SearchCriteria): string {
  const params = new URLSearchParams();
  if (criteria.searchQuery) params.set('location', criteria.searchQuery);
  if (criteria.brandFilter) params.set('brand', criteria.brandFilter);
  if (criteria.minPrice) params.set('minPrice', criteria.minPrice);
  if (criteria.maxPrice) params.set('maxPrice', criteria.maxPrice);
  if (criteria.minGuests) params.set('minGuests', criteria.minGuests);
  if (criteria.minBedrooms) params.set('minBedrooms', criteria.minBedrooms);
  return params.toString();
}

/** Check if any filters are active */
export function hasActiveFilters(criteria: SearchCriteria): boolean {
  return !!(
    criteria.searchQuery ||
    criteria.minPrice ||
    criteria.maxPrice ||
    criteria.minGuests ||
    criteria.minBedrooms ||
    criteria.brandFilter ||
    criteria.dateFrom
  );
}
