import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createHookWrapper } from '@/test/helpers/render';
import { summarizeCriteria, criteriaToSearchParams, hasActiveFilters } from './useSavedSearches';
import type { SearchCriteria } from './useSavedSearches';

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}));

function createChainMock(resolved: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'insert', 'delete', 'eq', 'order', 'single'];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  chain.then = (resolve: (v: unknown) => void) => Promise.resolve(resolve(resolved));
  return chain;
}

vi.mock('@/lib/supabase', () => {
  mockFrom.mockImplementation(() => createChainMock({ data: [], error: null }));
  return {
    supabase: {
      from: mockFrom,
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

describe('useSavedSearches hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockImplementation(() => createChainMock({ data: [], error: null }));
  });

  it('fetches saved searches for the user', async () => {
    const { useSavedSearches } = await import('./useSavedSearches');
    const { result } = renderHook(() => useSavedSearches(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFrom).toHaveBeenCalledWith('saved_searches');
  });

  it('saves a new search', async () => {
    const mockSaved = { id: 'ss-1', name: 'Hawaii', criteria: { searchQuery: 'Hawaii' } };
    mockFrom.mockImplementation(() => createChainMock({ data: mockSaved, error: null }));

    const { useSaveSearch } = await import('./useSavedSearches');
    const { result } = renderHook(() => useSaveSearch(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate({
      name: 'Hawaii',
      criteria: { searchQuery: 'Hawaii' },
    });

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('saved_searches');
    });
  });

  it('deletes a saved search', async () => {
    mockFrom.mockImplementation(() => createChainMock({ data: null, error: null }));

    const { useDeleteSavedSearch } = await import('./useSavedSearches');
    const { result } = renderHook(() => useDeleteSavedSearch(), {
      wrapper: createHookWrapper(),
    });

    result.current.mutate('ss-1');

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('saved_searches');
    });
  });
});

describe('summarizeCriteria', () => {
  it('summarizes search with all fields', () => {
    const criteria: SearchCriteria = {
      searchQuery: 'Hawaii',
      brandFilter: 'hilton_grand_vacations',
      minPrice: '100',
      maxPrice: '500',
      minGuests: '4',
      minBedrooms: '2',
    };
    const summary = summarizeCriteria(criteria);
    expect(summary).toContain('"Hawaii"');
    expect(summary).toContain('hilton grand vacations');
    expect(summary).toContain('$100–$500');
    expect(summary).toContain('4+ guests');
    expect(summary).toContain('2+ beds');
  });

  it('returns "All listings" when no criteria', () => {
    expect(summarizeCriteria({})).toBe('All listings');
  });

  it('handles min price only', () => {
    expect(summarizeCriteria({ minPrice: '200' })).toBe('$200+');
  });

  it('handles max price only', () => {
    expect(summarizeCriteria({ maxPrice: '300' })).toBe('up to $300');
  });
});

describe('criteriaToSearchParams', () => {
  it('builds URL params from criteria', () => {
    const params = criteriaToSearchParams({
      searchQuery: 'Maui',
      brandFilter: 'marriott',
      minPrice: '100',
    });
    expect(params).toContain('location=Maui');
    expect(params).toContain('brand=marriott');
    expect(params).toContain('minPrice=100');
  });
});

describe('hasActiveFilters', () => {
  it('returns false for empty criteria', () => {
    expect(hasActiveFilters({})).toBe(false);
  });

  it('returns true when any filter is set', () => {
    expect(hasActiveFilters({ searchQuery: 'Hawaii' })).toBe(true);
    expect(hasActiveFilters({ minPrice: '100' })).toBe(true);
    expect(hasActiveFilters({ brandFilter: 'hilton' })).toBe(true);
  });
});
