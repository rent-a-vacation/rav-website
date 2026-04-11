// @vitest-environment jsdom
// @p0
/**
 * Tests for Signup form — controlled T&C state + audit log write.
 * GitHub Issue: WS2 — Registration T&C Audit
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const mockSignUp = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    signUp: mockSignUp,
    signInWithGoogle: vi.fn(),
    isConfigured: true,
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
    },
  },
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

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: vi.fn(),
}));

vi.mock('@/hooks/useConversations', () => ({
  useUnreadConversationCount: vi.fn().mockReturnValue({ data: 0 }),
}));

vi.mock('@/components/bidding/NotificationBell', () => ({
  NotificationBell: () => null,
}));

vi.mock('@/components/RoleBadge', () => ({
  RoleBadge: () => null,
  getDisplayRole: () => null,
}));

import Signup from './Signup';

function renderSignup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Signup form — T&C acceptance', () => {
  beforeEach(() => {
    mockSignUp.mockClear();
    mockSignUp.mockResolvedValue({ error: null });
  });

  it('renders two separate checkboxes for age and terms', () => {
    renderSignup();
    expect(screen.getByLabelText('I am 18 years or older')).toBeInTheDocument();
    expect(screen.getByLabelText('I accept the Terms of Service and Privacy Policy')).toBeInTheDocument();
  });

  it('submit button is disabled until both checkboxes are checked', () => {
    renderSignup();
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText('I am 18 years or older'));
    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText('I accept the Terms of Service and Privacy Policy'));
    expect(submitButton).not.toBeDisabled();
  });

  it('submit button stays disabled if only age is checked', () => {
    renderSignup();
    fireEvent.click(screen.getByLabelText('I am 18 years or older'));
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });

  it('submit button stays disabled if only terms is checked', () => {
    renderSignup();
    fireEvent.click(screen.getByLabelText('I accept the Terms of Service and Privacy Policy'));
    const submitButton = screen.getByRole('button', { name: /create account/i });
    expect(submitButton).toBeDisabled();
  });
});
