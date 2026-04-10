// @vitest-environment jsdom
// @p0
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

const mockConversations = vi.hoisted(() => [
  {
    id: 'conv-1',
    owner_id: 'user-1',
    traveler_id: 'traveler-1',
    context_type: 'booking',
    status: 'active',
    last_message_at: new Date().toISOString(),
    owner_unread_count: 2,
    traveler_unread_count: 0,
    owner: { id: 'user-1', full_name: 'Alice Owner' },
    traveler: { id: 'traveler-1', full_name: 'Bob Traveler' },
    property: { id: 'prop-1', resort_name: 'Tuscany Village', location: 'Orlando' },
  },
  {
    id: 'conv-2',
    owner_id: 'owner-2',
    traveler_id: 'user-1',
    context_type: 'bid',
    status: 'active',
    last_message_at: new Date(Date.now() - 3600000).toISOString(),
    owner_unread_count: 0,
    traveler_unread_count: 1,
    owner: { id: 'owner-2', full_name: 'Carol Owner' },
    traveler: { id: 'user-1', full_name: 'Alice Traveler' },
    property: { id: 'prop-2', resort_name: 'MarBrisa Resort', location: 'Carlsbad' },
  },
]);

vi.mock('@/hooks/useConversations', () => ({
  useMyConversations: vi.fn().mockReturnValue({
    data: mockConversations,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: vi.fn(),
}));

import { ConversationInbox } from './ConversationInbox';

function renderInbox(props = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const defaultProps = {
    onSelect: vi.fn(),
    filter: 'all',
    onFilterChange: vi.fn(),
    ...props,
  };
  return {
    ...render(
      <QueryClientProvider client={qc}>
        <MemoryRouter>
          <ConversationInbox {...defaultProps} />
        </MemoryRouter>
      </QueryClientProvider>
    ),
    onSelect: defaultProps.onSelect,
    onFilterChange: defaultProps.onFilterChange,
  };
}

describe('ConversationInbox', () => {
  it('renders the inbox container', () => {
    renderInbox();
    expect(screen.getByTestId('conversation-inbox')).toBeInTheDocument();
  });

  it('shows Messages heading', () => {
    renderInbox();
    expect(screen.getByText('Messages')).toBeInTheDocument();
  });

  it('renders filter tabs', () => {
    renderInbox();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Bids')).toBeInTheDocument();
    expect(screen.getByText('Inquiries')).toBeInTheDocument();
    expect(screen.getByText('Requests')).toBeInTheDocument();
  });

  it('displays conversation items with participant names', () => {
    renderInbox();
    expect(screen.getByText('Bob Traveler')).toBeInTheDocument();
    expect(screen.getByText('Carol Owner')).toBeInTheDocument();
  });

  it('displays property names', () => {
    renderInbox();
    expect(screen.getByText('Tuscany Village')).toBeInTheDocument();
    expect(screen.getByText('MarBrisa Resort')).toBeInTheDocument();
  });

  it('displays context badges', () => {
    renderInbox();
    expect(screen.getByText('Booking')).toBeInTheDocument();
    expect(screen.getByText('Bid')).toBeInTheDocument();
  });

  it('calls onSelect when clicking a conversation', () => {
    const { onSelect } = renderInbox();
    fireEvent.click(screen.getByTestId('inbox-item-conv-1'));
    expect(onSelect).toHaveBeenCalledWith('conv-1');
  });

  it('highlights the selected conversation', () => {
    renderInbox({ selectedId: 'conv-1' });
    const item = screen.getByTestId('inbox-item-conv-1');
    expect(item.className).toContain('bg-muted');
  });
});
