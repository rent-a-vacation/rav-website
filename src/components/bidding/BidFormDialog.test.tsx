import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BidFormDialog } from './BidFormDialog';
import type { ListingWithBidding } from '@/types/bidding';

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@example.com' },
    isConfigured: true,
  }),
}));

vi.mock('@/hooks/useBidding', () => ({
  useCreateBid: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children, ...props }: { children: React.ReactNode; to: string }) => (
    <a {...props}>{children}</a>
  ),
}));

const mockListing: ListingWithBidding = {
  id: 'listing-1',
  property_id: 'prop-1',
  owner_id: 'owner-1',
  status: 'active',
  check_in_date: '2026-03-15',
  check_out_date: '2026-03-22',
  owner_price: 1000,
  rav_markup: 150,
  final_price: 1150,
  nightly_rate: 143,
  notes: null,
  cancellation_policy: 'moderate',
  approved_by: null,
  approved_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  property: {
    id: 'prop-1',
    owner_id: 'owner-1',
    brand: 'hilton_grand_vacations',
    resort_name: 'Test Resort',
    location: 'Orlando, FL',
    description: null,
    bedrooms: 2,
    bathrooms: 2,
    sleeps: 6,
    amenities: [],
    images: [],
    resort_id: null,
    unit_type_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    verification_status: 'pending',
  },
  open_for_bidding: true,
  bidding_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  min_bid_amount: 500,
  reserve_price: null,
  allow_counter_offers: true,
};

describe('BidFormDialog @p0', () => {
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders standard bid form by default', () => {
    render(
      <BidFormDialog
        listing={mockListing}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText('Make Your Offer')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Offer Amount ($)')).toBeInTheDocument();
    expect(screen.queryByText('Propose your preferred dates')).not.toBeInTheDocument();
  });

  it('renders date-proposal mode with date pickers', () => {
    render(
      <BidFormDialog
        listing={mockListing}
        open={true}
        onOpenChange={onOpenChange}
        mode="date-proposal"
      />
    );

    expect(screen.getByText('Request Different Dates')).toBeInTheDocument();
    expect(screen.getByText('Propose your preferred dates')).toBeInTheDocument();
    expect(screen.getByLabelText('Check-in')).toBeInTheDocument();
    expect(screen.getByLabelText('Check-out')).toBeInTheDocument();
    expect(screen.getByLabelText('Total Offer Amount ($)')).toBeInTheDocument();
  });

  it('shows nightly rate in listing info when available', () => {
    render(
      <BidFormDialog
        listing={mockListing}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText('$143/night')).toBeInTheDocument();
  });

  it('shows submit proposal button in date-proposal mode', () => {
    render(
      <BidFormDialog
        listing={mockListing}
        open={true}
        onOpenChange={onOpenChange}
        mode="date-proposal"
      />
    );

    expect(screen.getByText('Submit Proposal')).toBeInTheDocument();
  });

  it('shows submit bid button in standard mode', () => {
    render(
      <BidFormDialog
        listing={mockListing}
        open={true}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText('Submit Offer')).toBeInTheDocument();
  });
});
