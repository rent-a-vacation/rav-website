import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

vi.mock('@/hooks/useSavedSearches', () => ({
  useSaveSearch: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  hasActiveFilters: vi.fn().mockImplementation((c) => !!c.searchQuery),
  summarizeCriteria: vi.fn().mockReturnValue('"Hawaii"'),
}));

import { SaveSearchButton } from './SaveSearchButton';

function renderButton(criteria = { searchQuery: 'Hawaii' }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SaveSearchButton criteria={criteria} />
    </QueryClientProvider>
  );
}

describe('SaveSearchButton', () => {
  it('renders save button when filters are active', () => {
    renderButton({ searchQuery: 'Hawaii' });
    expect(screen.getByText('Save Search')).toBeInTheDocument();
  });

  it('does not render when no filters are active', () => {
    renderButton({});
    expect(screen.queryByText('Save Search')).not.toBeInTheDocument();
  });
});
