import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks before importing component
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn().mockReturnValue({
    user: { id: 'user-1', email: 'test@example.com' },
  }),
}));

vi.mock('@/hooks/useListingInquiries', () => ({
  useCreateInquiry: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/hooks/useConversations', () => ({
  useGetOrCreateConversation: vi.fn().mockReturnValue({
    mutate: vi.fn(),
  }),
  useInsertConversationEvent: vi.fn().mockReturnValue({
    mutate: vi.fn(),
  }),
}));

import { InquiryDialog } from './InquiryDialog';

function renderDialog(open = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <InquiryDialog
        open={open}
        onOpenChange={vi.fn()}
        listingId="lst-1"
        ownerId="owner-1"
        propertyId="prop-1"
        propertyName="Maui Beachfront"
      />
    </QueryClientProvider>
  );
}

describe('InquiryDialog', () => {
  it('renders the dialog with form fields when open', () => {
    renderDialog(true);
    expect(screen.getByText('Ask the Owner')).toBeInTheDocument();
    expect(screen.getByText('Topic')).toBeInTheDocument();
    expect(screen.getByText('Your question')).toBeInTheDocument();
    expect(screen.getByText('Send Question')).toBeInTheDocument();
  });

  it('disables send button when form is incomplete', () => {
    renderDialog(true);
    const sendButton = screen.getByText('Send Question');
    expect(sendButton).toBeDisabled();
  });
});
