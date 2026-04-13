// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock hooks
const mockUseRavDeals = vi.fn();
vi.mock('@/hooks/useRavDeals', () => ({
  useRavDeals: () => mockUseRavDeals(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', email: 'test@example.com' }, isPropertyOwner: () => false, isRavTeam: () => false }),
}));

vi.mock('@/hooks/useFavorites', () => ({
  useFavoriteIds: () => ({ data: [] }),
  useToggleFavorite: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/hooks/useListingSocialProof', () => ({
  useListingSocialProof: () => ({ favoritesCount: new Map() }),
}));

vi.mock('@/hooks/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('@/components/ListingCard', () => ({
  ListingCard: ({ listing }: { listing: { id: string } }) => (
    <div data-testid={`listing-card-${listing.id}`}>Listing Card</div>
  ),
}));

vi.mock('@/components/fair-value/ListingFairValueBadge', () => ({
  ListingFairValueBadge: () => null,
}));

vi.mock('@/components/SaveSearchButton', () => ({
  SaveSearchButton: () => <div data-testid="save-search-btn">Save Search</div>,
}));

vi.mock('@/components/bidding/PostRequestCTA', () => ({
  PostRequestCTA: () => <div data-testid="post-request-cta">Post Request</div>,
}));

import RavDeals from './RavDeals';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/rav-deals']}>
        <Routes>
          <Route path="/rav-deals" element={<RavDeals />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('RavDeals page', () => {
  it('renders hero section with brand copy', () => {
    mockUseRavDeals.mockReturnValue({ deals: [], isLoading: false, error: null, isEmpty: true });
    renderPage();

    expect(screen.getByText('RAV Deals')).toBeInTheDocument();
    expect(screen.getByText(/Expiring Weeks\. Motivated Owners\. Your Best Price\./)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseRavDeals.mockReturnValue({ deals: [], isLoading: true, error: null, isEmpty: false });
    renderPage();

    expect(screen.getByText('Loading RAV Deals...')).toBeInTheDocument();
  });

  it('shows empty state with SaveSearchButton', () => {
    mockUseRavDeals.mockReturnValue({ deals: [], isLoading: false, error: null, isEmpty: true });
    renderPage();

    expect(screen.getByText('No RAV Deals Right Now')).toBeInTheDocument();
    expect(screen.getByTestId('save-search-btn')).toBeInTheDocument();
    expect(screen.getByText('Browse Rentals')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseRavDeals.mockReturnValue({ deals: [], isLoading: false, error: new Error('fail'), isEmpty: false });
    renderPage();

    expect(screen.getByText('Unable to load deals')).toBeInTheDocument();
  });

  it('renders listing cards when deals are available', () => {
    const deal = {
      listing: {
        id: 'deal-1',
        check_in_date: '2026-05-20',
        check_out_date: '2026-05-27',
        final_price: 800,
        nightly_rate: 120,
        property: { brand: 'hilton_grand_vacations', resort_name: 'Test', location: 'Orlando, FL', images: [], bedrooms: 2, bathrooms: 2, sleeps: 6, amenities: [] },
      },
      daysUntilCheckIn: 19,
      urgencyDiscount: -10,
      urgencyLevel: '30d',
      bidCount: 0,
    };
    mockUseRavDeals.mockReturnValue({ deals: [deal], isLoading: false, error: null, isEmpty: false });
    renderPage();

    expect(screen.getByTestId('listing-card-deal-1')).toBeInTheDocument();
    expect(screen.getByText('1 deal available')).toBeInTheDocument();
  });

  it('shows deals count badge for multiple deals', () => {
    const makeDeal = (id: string) => ({
      listing: {
        id,
        check_in_date: '2026-05-20',
        check_out_date: '2026-05-27',
        final_price: 800,
        nightly_rate: 120,
        property: { brand: 'hilton_grand_vacations', resort_name: 'Test', location: 'Orlando, FL', images: [], bedrooms: 2, bathrooms: 2, sleeps: 6, amenities: [] },
      },
      daysUntilCheckIn: 19,
      urgencyDiscount: -10,
      urgencyLevel: '30d' as const,
      bidCount: 0,
    });
    mockUseRavDeals.mockReturnValue({ deals: [makeDeal('a'), makeDeal('b'), makeDeal('c')], isLoading: false, error: null, isEmpty: false });
    renderPage();

    expect(screen.getByText('3 deals available')).toBeInTheDocument();
  });
});
