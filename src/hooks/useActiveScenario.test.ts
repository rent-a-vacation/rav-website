import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useActiveScenario, ACTIVE_KEY } from './useActiveScenario';
import { DEFAULT_SCENARIO_ID } from '@/lib/financial-model/system-scenarios';

beforeEach(() => {
  localStorage.clear();
});

describe('useActiveScenario (#550 PR1) @p0', () => {
  it('defaults to system Base when no localStorage value exists', () => {
    const { result } = renderHook(() => useActiveScenario());
    expect(result.current.activeId).toBe(DEFAULT_SCENARIO_ID);
    expect(result.current.activeId).toBe('system:base');
  });

  it('persists selection to localStorage', () => {
    const { result } = renderHook(() => useActiveScenario());
    act(() => {
      result.current.setActiveId('uuid-123');
    });
    expect(localStorage.getItem(ACTIVE_KEY)).toBe('uuid-123');
    expect(result.current.activeId).toBe('uuid-123');
  });

  it('restores selection on remount', () => {
    localStorage.setItem(ACTIVE_KEY, 'uuid-restored');
    const { result } = renderHook(() => useActiveScenario());
    expect(result.current.activeId).toBe('uuid-restored');
  });

  it('setActiveId(null) clears storage and resets to default', () => {
    localStorage.setItem(ACTIVE_KEY, 'uuid-x');
    const { result } = renderHook(() => useActiveScenario());
    act(() => {
      result.current.setActiveId(null);
    });
    expect(result.current.activeId).toBe(DEFAULT_SCENARIO_ID);
    expect(localStorage.getItem(ACTIVE_KEY)).toBeNull();
  });

  it('handles localStorage throw on read (privacy mode)', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const { result } = renderHook(() => useActiveScenario());
    expect(result.current.activeId).toBe(DEFAULT_SCENARIO_ID);
    spy.mockRestore();
  });
});
