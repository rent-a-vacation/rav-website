import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { OwnerProfileCard } from './OwnerProfileCard';

const mockProfile = {
  first_name: 'Jane',
  avatar_url: null,
  member_since: '2024-01-15T00:00:00Z',
  is_verified: true,
  listing_count: 3,
  review_count: 12,
  avg_rating: 4.5,
  response_time_hours: null,
};

const { mockUseOwnerProfile } = vi.hoisted(() => ({
  mockUseOwnerProfile: vi.fn(),
}));

vi.mock('@/hooks/useOwnerProfile', () => ({
  useOwnerProfile: mockUseOwnerProfile,
}));

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>,
  );
}

describe('OwnerProfileCard', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('shows skeleton while loading', () => {
    mockUseOwnerProfile.mockReturnValue({ data: undefined, isLoading: true });

    renderWithProviders(<OwnerProfileCard ownerId="owner-1" />);
    expect(screen.getByTestId('owner-profile-skeleton')).toBeTruthy();
  });

  it('renders owner name and verified badge', () => {
    mockUseOwnerProfile.mockReturnValue({ data: mockProfile, isLoading: false });

    renderWithProviders(<OwnerProfileCard ownerId="owner-1" />);
    expect(screen.getByText('Jane')).toBeTruthy();
    expect(screen.getByText('Verified')).toBeTruthy();
  });

  it('shows listing count and rating', () => {
    mockUseOwnerProfile.mockReturnValue({ data: mockProfile, isLoading: false });

    renderWithProviders(<OwnerProfileCard ownerId="owner-1" />);
    expect(screen.getByText('3 listings')).toBeTruthy();
    expect(screen.getByText('4.5')).toBeTruthy();
    expect(screen.getByText('(12)')).toBeTruthy();
  });

  it('returns null when no profile data', () => {
    mockUseOwnerProfile.mockReturnValue({ data: null, isLoading: false });

    const { container } = renderWithProviders(<OwnerProfileCard ownerId="owner-1" />);
    expect(container.innerHTML).toBe('');
  });
});
