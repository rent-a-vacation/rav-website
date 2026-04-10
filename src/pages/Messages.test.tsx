// @vitest-environment jsdom
// @p0
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

vi.mock('@/hooks/useConversations', () => ({
  useMyConversations: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useConversation: vi.fn().mockReturnValue({ data: null }),
  useConversationThread: vi.fn().mockReturnValue({ data: [], isLoading: false }),
  useMarkConversationRead: vi.fn().mockReturnValue({ mutate: vi.fn() }),
  useSendMessage: vi.fn().mockReturnValue({ mutate: vi.fn(), isPending: false }),
  useUnreadConversationCount: vi.fn().mockReturnValue({ data: 0 }),
}));

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: vi.fn(),
}));

vi.mock('@/hooks/usePageMeta', () => ({
  usePageMeta: vi.fn(),
}));

vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="header">Header</div>,
}));

vi.mock('@/components/Footer', () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

import Messages from './Messages';

function renderPage(path = '/messages') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:conversationId" element={<Messages />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Messages page', () => {
  it('renders the messages page container', () => {
    renderPage();
    expect(screen.getByTestId('messages-page')).toBeInTheDocument();
  });

  it('shows page heading', () => {
    renderPage();
    const headings = screen.getAllByRole('heading', { name: /Messages/ });
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('shows empty state when no conversation selected', () => {
    renderPage();
    expect(screen.getByText('Select a conversation to start messaging')).toBeInTheDocument();
  });

  it('shows no conversations message when list is empty', () => {
    renderPage();
    expect(screen.getByText('No conversations yet')).toBeInTheDocument();
  });

  it('renders filter tabs', () => {
    renderPage();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Bookings')).toBeInTheDocument();
    expect(screen.getByText('Bids')).toBeInTheDocument();
  });

  it('renders inbox component', () => {
    renderPage();
    expect(screen.getByTestId('conversation-inbox')).toBeInTheDocument();
  });
});
