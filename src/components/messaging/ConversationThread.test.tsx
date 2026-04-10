// @vitest-environment jsdom
// @p0
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const mockMarkRead = vi.hoisted(() => vi.fn());

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

vi.mock('@/hooks/useConversations', () => ({
  useConversation: vi.fn().mockReturnValue({
    data: {
      id: 'conv-1',
      owner_id: 'user-1',
      traveler_id: 'traveler-1',
      property_id: 'prop-1',
      listing_id: 'lst-1',
      context_type: 'booking',
      status: 'active',
      owner: { id: 'user-1', full_name: 'Alice Owner' },
      traveler: { id: 'traveler-1', full_name: 'Bob Traveler' },
      property: { id: 'prop-1', resort_name: 'Tuscany Village' },
    },
  }),
  useConversationThread: vi.fn().mockReturnValue({
    data: [
      {
        id: 'msg-1',
        item_type: 'message',
        sender_id: 'traveler-1',
        body: 'Is the unit ocean-view?',
        event_type: null,
        event_data: null,
        read_at: null,
        created_at: '2026-06-01T10:31:00Z',
      },
      {
        id: 'msg-2',
        item_type: 'message',
        sender_id: 'user-1',
        body: 'Yes, Building 3 faces the ocean',
        event_type: null,
        event_data: null,
        read_at: null,
        created_at: '2026-06-01T10:45:00Z',
      },
      {
        id: 'evt-1',
        item_type: 'event',
        sender_id: null,
        body: null,
        event_type: 'booking_confirmed',
        event_data: { booking_id: 'bk-1', total: 1850, check_in: '2026-06-01' },
        read_at: null,
        created_at: '2026-06-01T11:00:00Z',
      },
    ],
    isLoading: false,
  }),
  useMarkConversationRead: vi.fn().mockReturnValue({
    mutate: mockMarkRead,
  }),
  useSendMessage: vi.fn().mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: vi.fn(),
}));

import { ConversationThread } from './ConversationThread';

function renderThread(props = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ConversationThread conversationId="conv-1" {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ConversationThread', () => {
  it('renders the thread container', () => {
    renderThread();
    expect(screen.getByTestId('conversation-thread')).toBeInTheDocument();
  });

  it('displays the other participant name in header', () => {
    renderThread();
    expect(screen.getByText('Bob Traveler')).toBeInTheDocument();
  });

  it('displays property name and context label in header', () => {
    renderThread();
    expect(screen.getByText(/Tuscany Village/)).toBeInTheDocument();
    expect(screen.getByText(/· Booking/)).toBeInTheDocument();
  });

  it('renders message bubbles', () => {
    renderThread();
    expect(screen.getByText('Is the unit ocean-view?')).toBeInTheDocument();
    expect(screen.getByText('Yes, Building 3 faces the ocean')).toBeInTheDocument();
  });

  it('renders system events', () => {
    renderThread();
    expect(screen.getByText(/Booking confirmed/)).toBeInTheDocument();
  });

  it('calls markConversationRead on mount', () => {
    renderThread();
    expect(mockMarkRead).toHaveBeenCalledWith('conv-1');
  });

  it('shows context link for booking', () => {
    renderThread();
    expect(screen.getByText('View Booking')).toBeInTheDocument();
  });

  it('shows message composer', () => {
    renderThread();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });
});
