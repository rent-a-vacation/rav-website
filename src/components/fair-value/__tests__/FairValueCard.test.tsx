import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FairValueCard } from '../FairValueCard';
import * as hook from '@/hooks/useFairValueScore';

vi.mock('@/hooks/useFairValueScore');

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}

const fairValueData: hook.FairValueResult = {
  tier: 'fair_value',
  range_low: 3200,
  range_high: 3800,
  avg_accepted_bid: 3500,
  comparable_count: 12,
  listing_price: 3500,
};

const belowMarketData: hook.FairValueResult = {
  ...fairValueData,
  tier: 'below_market',
  listing_price: 2800,
};

const aboveMarketData: hook.FairValueResult = {
  ...fairValueData,
  tier: 'above_market',
  listing_price: 4200,
};

describe('FairValueCard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows owner messaging when viewerRole is owner', () => {
    vi.mocked(hook.useFairValueScore).mockReturnValue({
      data: fairValueData,
      isLoading: false,
    } as ReturnType<typeof hook.useFairValueScore>);

    render(<FairValueCard listingId="abc" viewerRole="owner" />, { wrapper: Wrapper });
    expect(screen.getByText(/well-aligned with current demand/)).toBeInTheDocument();
  });

  it('shows traveler messaging when viewerRole is traveler', () => {
    vi.mocked(hook.useFairValueScore).mockReturnValue({
      data: fairValueData,
      isLoading: false,
    } as ReturnType<typeof hook.useFairValueScore>);

    render(<FairValueCard listingId="abc" viewerRole="traveler" />, { wrapper: Wrapper });
    expect(screen.getByText(/within the normal range/)).toBeInTheDocument();
  });

  it('returns null for insufficient_data', () => {
    vi.mocked(hook.useFairValueScore).mockReturnValue({
      data: { tier: 'insufficient_data', comparable_count: 1 },
      isLoading: false,
    } as ReturnType<typeof hook.useFairValueScore>);

    const { container } = render(<FairValueCard listingId="abc" viewerRole="traveler" />, { wrapper: Wrapper });
    expect(container.innerHTML).toBe('');
  });

  it('shows market range and comparable count', () => {
    vi.mocked(hook.useFairValueScore).mockReturnValue({
      data: fairValueData,
      isLoading: false,
    } as ReturnType<typeof hook.useFairValueScore>);

    render(<FairValueCard listingId="abc" viewerRole="traveler" />, { wrapper: Wrapper });
    expect(screen.getByText(/\$3,200/)).toBeInTheDocument();
    expect(screen.getByText(/\$3,800/)).toBeInTheDocument();
    expect(screen.getByText(/12 comparable bookings/)).toBeInTheDocument();
  });

  it('shows average accepted bid for below_market tier', () => {
    vi.mocked(hook.useFairValueScore).mockReturnValue({
      data: belowMarketData,
      isLoading: false,
    } as ReturnType<typeof hook.useFairValueScore>);

    render(<FairValueCard listingId="abc" viewerRole="traveler" />, { wrapper: Wrapper });
    expect(screen.getByText(/Average accepted Offer: \$3,500/)).toBeInTheDocument();
  });

  it('shows average accepted bid for above_market tier', () => {
    vi.mocked(hook.useFairValueScore).mockReturnValue({
      data: aboveMarketData,
      isLoading: false,
    } as ReturnType<typeof hook.useFairValueScore>);

    render(<FairValueCard listingId="abc" viewerRole="owner" />, { wrapper: Wrapper });
    expect(screen.getByText(/above the typical range/)).toBeInTheDocument();
    expect(screen.getByText(/Average accepted Offer/)).toBeInTheDocument();
  });

  it('does not show avg bid for fair_value tier', () => {
    vi.mocked(hook.useFairValueScore).mockReturnValue({
      data: fairValueData,
      isLoading: false,
    } as ReturnType<typeof hook.useFairValueScore>);

    render(<FairValueCard listingId="abc" viewerRole="traveler" />, { wrapper: Wrapper });
    expect(screen.queryByText(/Average accepted Offer/)).not.toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    vi.mocked(hook.useFairValueScore).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as ReturnType<typeof hook.useFairValueScore>);

    const { container } = render(<FairValueCard listingId="abc" viewerRole="traveler" />, { wrapper: Wrapper });
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });
});
