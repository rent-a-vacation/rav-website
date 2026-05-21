import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FinancialModelDashboard from './FinancialModelDashboard';

vi.mock('@/hooks/usePageMeta', () => ({ usePageMeta: () => {} }));
vi.mock('@/components/Header', () => ({ default: () => <header /> }));
vi.mock('@/components/Footer', () => ({ default: () => <footer /> }));
vi.mock('@/components/executive/DashboardTabs', () => ({ DashboardTabs: () => <nav /> }));
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'me' },
    isRavTeam: () => true,
    isLoading: false,
  }),
}));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: vi.fn() }) }));

const ownDirtyScenario = {
  id: 'uuid-own',
  owner_id: 'me',
  name: 'My plan',
  multiplier: 'Base',
  overrides: { gOwnGrowth: 0.35 },
  expense_overrides: [],
  is_shared: false,
  created_at: 't',
  updated_at: 't',
};

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'me' } } }),
    },
    rpc: () =>
      Promise.resolve({
        data: { rate: 12, pro_discount: 2, business_discount: 4 },
        error: null,
      }),
    from: () => ({
      select: () => ({
        order: () => Promise.resolve({ data: [ownDirtyScenario], error: null }),
      }),
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({ data: { ...ownDirtyScenario, id: 'new' }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: ownDirtyScenario, error: null }),
          }),
        }),
      }),
      delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  },
}));

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <FinancialModelDashboard />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe('FinancialModelDashboard integration (#550 PR5) @p0', () => {
  it('renders Base by default (system scenario)', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Scenario: Base/i })).toBeInTheDocument(),
    );
  });

  it('drift banner does NOT show for clean system scenario', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Scenario: Base/i })).toBeInTheDocument(),
    );
    expect(screen.queryByText(/differ from baseline/i)).not.toBeInTheDocument();
  });

  it('Save As button on system scenario opens dialog', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Scenario: Base/i })).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole('button', { name: /save as/i }));
    await waitFor(() =>
      expect(screen.getByRole('dialog')).toBeInTheDocument(),
    );
    expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
  });
});
