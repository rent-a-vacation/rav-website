// @vitest-environment jsdom
// @p0
/**
 * Tests for WelcomePage — post-approval onboarding gate.
 * GitHub Issue: #319 (WS2 Story 2)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue({}));

const authState = vi.hoisted(() => ({
  user: { id: 'user-1', email: 'test@example.com' } as { id: string; email: string } | null,
  profile: {
    id: 'user-1',
    full_name: 'Alice Test',
    approval_status: 'approved' as string | null,
    onboarding_completed_at: null as string | null,
  } as Record<string, unknown> | null,
  isRavTeam: vi.fn(() => false),
  isPropertyOwner: vi.fn(() => false),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => authState,
}));

vi.mock('@/hooks/useOnboarding', () => ({
  useCompleteOnboarding: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
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

vi.mock('@/hooks/useRealtimeSubscription', () => ({
  useRealtimeSubscription: vi.fn(),
}));

vi.mock('@/hooks/useConversations', () => ({
  useUnreadConversationCount: vi.fn().mockReturnValue({ data: 0 }),
}));

import WelcomePage from './WelcomePage';

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function resetAuth() {
  authState.user = { id: 'user-1', email: 'test@example.com' };
  authState.profile = {
    id: 'user-1',
    full_name: 'Alice Test',
    approval_status: 'approved',
    onboarding_completed_at: null,
  };
  authState.isRavTeam = vi.fn(() => false);
  authState.isPropertyOwner = vi.fn(() => false);
}

describe('WelcomePage', () => {
  beforeEach(() => {
    resetAuth();
    mockNavigate.mockClear();
    mockMutateAsync.mockClear();
    mockMutateAsync.mockResolvedValue({});
  });

  it('renders Step 1 with welcome message and user first name', () => {
    renderPage();
    expect(screen.getByText(/Welcome to Rent-A-Vacation, Alice!/)).toBeInTheDocument();
    expect(screen.getByText(/Your account has been approved/)).toBeInTheDocument();
  });

  it('Continue button is disabled until both checkboxes are checked', () => {
    renderPage();
    const continueButton = screen.getByRole('button', { name: /Continue/i });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/I accept the Terms of Service version 1\.0/));
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy version 1\.0/));
    expect(continueButton).not.toBeDisabled();
  });

  it('clicking Continue calls useCompleteOnboarding mutation', async () => {
    renderPage();
    fireEvent.click(screen.getByLabelText(/I accept the Terms of Service version 1\.0/));
    fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy version 1\.0/));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  it('advances to Step 2 after successful Continue', async () => {
    renderPage();
    fireEvent.click(screen.getByLabelText(/I accept the Terms of Service version 1\.0/));
    fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy version 1\.0/));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/You're set up as a Traveler/)).toBeInTheDocument();
    });
  });

  it('Step 2 shows owner-specific CTAs for property owners', async () => {
    authState.isPropertyOwner = vi.fn(() => true);
    renderPage();
    fireEvent.click(screen.getByLabelText(/I accept the Terms of Service version 1\.0/));
    fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy version 1\.0/));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/You're set up as a Property Owner/)).toBeInTheDocument();
    });
    expect(screen.getByText('List Your First Property')).toBeInTheDocument();
    expect(screen.getAllByText(/Go to My Rentals/).length).toBeGreaterThan(0);
    expect(screen.getByText('Browse RAV Wishes')).toBeInTheDocument();
  });

  it('Step 2 shows traveler-specific CTAs for renters', async () => {
    renderPage();
    fireEvent.click(screen.getByLabelText(/I accept the Terms of Service version 1\.0/));
    fireEvent.click(screen.getByLabelText(/I accept the Privacy Policy version 1\.0/));
    fireEvent.click(screen.getByRole('button', { name: /Continue/i }));

    await waitFor(() => {
      expect(screen.getByText('Start Exploring')).toBeInTheDocument();
    });
    expect(screen.getByText('Name Your Price')).toBeInTheDocument();
    expect(screen.getByText('Post a RAV Wish')).toBeInTheDocument();
  });

  it('redirects to /pending-approval if user is not yet approved', () => {
    authState.profile = { ...authState.profile, approval_status: 'pending_approval' };
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/pending-approval');
  });

  it('redirects RAV team members away from /welcome', () => {
    authState.isRavTeam = vi.fn(() => true);
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/rentals');
  });

  it('redirects already-onboarded users to /my-trips', () => {
    authState.profile = {
      ...authState.profile,
      onboarding_completed_at: '2026-04-05T00:00:00Z',
    };
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/my-trips');
  });

  it('redirects already-onboarded owners to /owner-dashboard', () => {
    authState.profile = {
      ...authState.profile,
      onboarding_completed_at: '2026-04-05T00:00:00Z',
    };
    authState.isPropertyOwner = vi.fn(() => true);
    renderPage();
    expect(mockNavigate).toHaveBeenCalledWith('/owner-dashboard');
  });
});
