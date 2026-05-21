import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFinancialModelScenarios } from './useFinancialModelScenarios';

const mockUserId = 'user-rav-1';
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: mockUserId } } }),
    },
    from: () => ({
      select: () => ({ order: () => mockSelect() }),
      insert: (rows: unknown) => ({ select: () => ({ single: () => mockInsert(rows) }) }),
      update: (rows: unknown) => ({ eq: (col: string, id: unknown) => ({ select: () => ({ single: () => mockUpdate(rows, col, id) }) }) }),
      delete: () => ({ eq: (col: string, id: unknown) => mockDelete(col, id) }),
    }),
  },
}));

function wrap(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useFinancialModelScenarios (#550 PR1) @p0', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    mockSelect.mockReset();
    mockInsert.mockReset();
    mockUpdate.mockReset();
    mockDelete.mockReset();
  });

  it('list returns the rows the query returns (own + shared after RLS filtering)', async () => {
    mockSelect.mockResolvedValue({
      data: [
        { id: 's1', owner_id: mockUserId, name: 'Sujit Q3', multiplier: 'Base', overrides: {}, expense_overrides: [], is_shared: false, created_at: 't', updated_at: 't' },
        { id: 's2', owner_id: 'other-user', name: 'Shared plan', multiplier: 'Optimistic', overrides: { gOwnGrowth: 0.25 }, expense_overrides: [], is_shared: true, created_at: 't', updated_at: 't' },
      ],
      error: null,
    });

    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.scenarios).toHaveLength(2));
    expect(result.current.scenarios[0].id).toBe('s1');
    expect(result.current.scenarios[1].is_shared).toBe(true);
  });

  it('create returns the inserted row', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockInsert.mockResolvedValue({
      data: { id: 'new-1', owner_id: mockUserId, name: 'New', multiplier: 'Base', overrides: {}, expense_overrides: [], is_shared: false, created_at: 't', updated_at: 't' },
      error: null,
    });

    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const inserted = await act(async () =>
      result.current.create({ name: 'New', multiplier: 'Base', overrides: {}, expense_overrides: [], is_shared: false })
    );
    expect(inserted?.id).toBe('new-1');
  });

  it('update sends partial fields', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockUpdate.mockResolvedValue({
      data: { id: 's1', owner_id: mockUserId, name: 'renamed', multiplier: 'Base', overrides: {}, expense_overrides: [], is_shared: true, created_at: 't', updated_at: 't' },
      error: null,
    });

    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const updated = await act(async () => result.current.update('s1', { name: 'renamed', is_shared: true }));
    expect(updated?.name).toBe('renamed');
    expect(mockUpdate).toHaveBeenCalledWith(
      { name: 'renamed', is_shared: true },
      'id',
      's1',
    );
  });

  it('delete returns success', async () => {
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockDelete.mockResolvedValue({ error: null });

    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const ok = await act(async () => result.current.remove('s1'));
    expect(ok).toBe(true);
    expect(mockDelete).toHaveBeenCalledWith('id', 's1');
  });

  it('select returning an error surfaces empty list + error', async () => {
    mockSelect.mockResolvedValue({ data: null, error: { message: 'rls', code: '42501' } });
    const { result } = renderHook(() => useFinancialModelScenarios(), { wrapper: wrap(queryClient) });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.scenarios).toEqual([]);
    expect(result.current.error).toBeTruthy();
  });
});
