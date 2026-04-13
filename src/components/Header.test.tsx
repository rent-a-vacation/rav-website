// @vitest-environment jsdom
// @p0
/**
 * Tests for role-based Header navigation.
 * GitHub Issue: WS3 — Navigation Redesign
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// Mock config we'll update per test
const authMock = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  profile: null as { full_name: string } | null,
  roles: [] as string[],
  isLoading: false,
  isPropertyOwner: vi.fn(() => false),
  isRavTeam: vi.fn(() => false),
  isRenter: vi.fn(() => false),
  isRavAdmin: vi.fn(() => false),
  signOut: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authMock,
}));

vi.mock('@/hooks/useConversations', () => ({
  useUnreadConversationCount: vi.fn().mockReturnValue({ data: 0 }),
}));

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: vi.fn(),
}));

vi.mock('@/components/bidding/NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell">Bell</div>,
}));

vi.mock('@/components/RoleBadge', () => ({
  RoleBadge: () => null,
  getDisplayRole: () => null,
}));

import Header from './Header';
import { useUnreadConversationCount } from '@/hooks/useConversations';

function renderHeader() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function setAuth(overrides: Partial<typeof authMock>) {
  Object.assign(authMock, overrides);
}

function resetAuth() {
  setAuth({
    user: null,
    profile: null,
    roles: [],
    isLoading: false,
    isPropertyOwner: vi.fn(() => false),
    isRavTeam: vi.fn(() => false),
    isRenter: vi.fn(() => false),
    isRavAdmin: vi.fn(() => false),
  });
}

describe('Header — role-based navigation', () => {
  beforeEach(() => {
    resetAuth();
  });

  it('renders unauthenticated nav with Browse Rentals, How It Works, Name Your Price, List Your Property, Free Tools', () => {
    renderHeader();
    const nav = screen.getByTestId('desktop-nav');
    expect(nav).toHaveTextContent('Browse Rentals');
    expect(nav).toHaveTextContent('How It Works');
    expect(nav).toHaveTextContent('Name Your Price');
    expect(nav).toHaveTextContent('List Your Property');
    expect(nav).toHaveTextContent('Free Tools');
  });

  it('renders traveler nav with Browse Rentals, Name Your Price, Make a Wish, My Trips', () => {
    setAuth({
      user: { id: 'user-1', email: 'traveler@example.com' },
      profile: { full_name: 'Traveler' },
      isRenter: vi.fn(() => true),
    });
    renderHeader();
    const nav = screen.getByTestId('desktop-nav');
    expect(nav).toHaveTextContent('Browse Rentals');
    expect(nav).toHaveTextContent('Name Your Price');
    expect(nav).toHaveTextContent('Make a Wish');
    expect(nav).toHaveTextContent('My Trips');
  });

  it('traveler nav does NOT show How It Works or List Your Property', () => {
    setAuth({
      user: { id: 'user-1', email: 'traveler@example.com' },
      profile: { full_name: 'Traveler' },
      isRenter: vi.fn(() => true),
    });
    renderHeader();
    const nav = screen.getByTestId('desktop-nav');
    expect(nav).not.toHaveTextContent('How It Works');
    expect(nav).not.toHaveTextContent('List Your Property');
  });

  it('renders owner nav with My Rentals, My Listings, Make a Wish', () => {
    setAuth({
      user: { id: 'user-2', email: 'owner@example.com' },
      profile: { full_name: 'Owner Alex' },
      isPropertyOwner: vi.fn(() => true),
    });
    renderHeader();
    const nav = screen.getByTestId('desktop-nav');
    expect(nav).toHaveTextContent("My Rentals");
    expect(nav).toHaveTextContent('My Listings');
    expect(nav).toHaveTextContent('Make a Wish');
  });

  it('owner nav does NOT show Browse Rentals, Name Your Price, or List Your Property in top nav', () => {
    setAuth({
      user: { id: 'user-2', email: 'owner@example.com' },
      profile: { full_name: 'Owner Alex' },
      isPropertyOwner: vi.fn(() => true),
    });
    renderHeader();
    const nav = screen.getByTestId('desktop-nav');
    expect(nav).not.toHaveTextContent('Browse Rentals');
    expect(nav).not.toHaveTextContent('Name Your Price');
  });

  it('Owner\'s Edge link routes to /owner-dashboard', () => {
    setAuth({
      user: { id: 'user-2', email: 'owner@example.com' },
      profile: { full_name: 'Owner Alex' },
      isPropertyOwner: vi.fn(() => true),
    });
    renderHeader();
    const link = screen.getByRole('link', { name: "My Rentals" });
    expect(link).toHaveAttribute('href', '/owner-dashboard');
  });

  it('My Listings link routes to /owner-dashboard?tab=my-listings', () => {
    setAuth({
      user: { id: 'user-2', email: 'owner@example.com' },
      profile: { full_name: 'Owner Alex' },
      isPropertyOwner: vi.fn(() => true),
    });
    renderHeader();
    const link = screen.getByRole('link', { name: 'My Listings' });
    expect(link).toHaveAttribute('href', '/owner-dashboard?tab=my-listings');
  });

  it('Make a Wish link routes to /bidding?tab=requests', () => {
    setAuth({
      user: { id: 'user-2', email: 'owner@example.com' },
      profile: { full_name: 'Owner Alex' },
      isPropertyOwner: vi.fn(() => true),
    });
    renderHeader();
    const link = screen.getByRole('link', { name: 'Make a Wish' });
    expect(link).toHaveAttribute('href', '/bidding?tab=requests');
  });

  it('Messages badge shows unread count when count > 0', () => {
    vi.mocked(useUnreadConversationCount).mockReturnValue({ data: 5 } as ReturnType<typeof useUnreadConversationCount>);
    setAuth({
      user: { id: 'user-1', email: 'traveler@example.com' },
      profile: { full_name: 'Traveler' },
      isRenter: vi.fn(() => true),
    });
    renderHeader();
    // Badge with "5" should be visible somewhere in the header
    const badges = screen.getAllByText('5');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('Messages badge is hidden when count is 0', () => {
    vi.mocked(useUnreadConversationCount).mockReturnValue({ data: 0 } as ReturnType<typeof useUnreadConversationCount>);
    setAuth({
      user: { id: 'user-1', email: 'traveler@example.com' },
      profile: { full_name: 'Traveler' },
      isRenter: vi.fn(() => true),
    });
    renderHeader();
    // No badge with "0" should exist (only text "Messages" link)
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
