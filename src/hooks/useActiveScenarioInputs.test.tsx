import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useActiveScenarioInputs } from './useActiveScenarioInputs';
import { GROWTH } from '@/lib/financial-model/data';

const wrap = (qc: QueryClient) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: () => Promise.resolve({ data: { user: { id: 'me' } } }),
    },
    from: () => ({
      select: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
    }),
  },
}));

beforeEach(() => {
  localStorage.clear();
});

describe('useActiveScenarioInputs (#550 PR3) @p0', () => {
  it('returns canonical baseline when no scenario active, no draft', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useActiveScenarioInputs(), { wrapper: wrap(qc) });
    expect(result.current.dirtyKeys.size).toBe(0);
    expect(result.current.growth.find((r) => r.name === 'gOwnGrowth')!.value).toBe(
      GROWTH.find((r) => r.name === 'gOwnGrowth')!.value,
    );
    expect(result.current.isDirty).toBe(false);
  });

  it('localStorage draft overrides baseline + flags dirtyKeys', () => {
    localStorage.setItem(
      'fms-draft:system:base',
      JSON.stringify({ overrides: { gOwnGrowth: 0.5 }, expenseOverrides: [] }),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useActiveScenarioInputs(), { wrapper: wrap(qc) });
    expect(result.current.dirtyKeys.has('gOwnGrowth')).toBe(true);
    expect(result.current.growth.find((r) => r.name === 'gOwnGrowth')!.value).toBe(0.5);
    expect(result.current.isDirty).toBe(true);
  });

  it('identical-to-baseline override does NOT appear in dirtyKeys', () => {
    const baselineVal = GROWTH.find((r) => r.name === 'gOwnGrowth')!.value;
    localStorage.setItem(
      'fms-draft:system:base',
      JSON.stringify({ overrides: { gOwnGrowth: baselineVal }, expenseOverrides: [] }),
    );
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useActiveScenarioInputs(), { wrapper: wrap(qc) });
    expect(result.current.dirtyKeys.has('gOwnGrowth')).toBe(false);
    expect(result.current.isDirty).toBe(false);
  });

  it('isSystem true for system scenarios', () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { result } = renderHook(() => useActiveScenarioInputs(), { wrapper: wrap(qc) });
    expect(result.current.isSystem).toBe(true);
    expect(result.current.multiplier).toBe('Base');
  });
});
