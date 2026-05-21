import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScenarioDraft, draftKey } from './useScenarioDraft';

beforeEach(() => {
  localStorage.clear();
});

describe('useScenarioDraft (#550 PR3) @p0', () => {
  it('starts with empty draft when no localStorage value', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    expect(result.current.draft.overrides).toEqual({});
    expect(result.current.isDirty).toBe(false);
  });

  it('setField adds to draft + persists to localStorage', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    act(() => result.current.setField('gOwnGrowth', 0.4));
    expect(result.current.draft.overrides).toEqual({ gOwnGrowth: 0.4 });
    const stored = localStorage.getItem(draftKey('system:base'));
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).overrides).toEqual({ gOwnGrowth: 0.4 });
  });

  it('resetField removes one key', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    act(() => {
      result.current.setField('gOwnGrowth', 0.4);
    });
    act(() => {
      result.current.setField('gMix0', 0.6);
    });
    act(() => result.current.resetField('gOwnGrowth'));
    expect(result.current.draft.overrides).toEqual({ gMix0: 0.6 });
  });

  it('resetSection removes all keys in the section list', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    act(() => {
      result.current.setField('gOwnGrowth', 0.4);
    });
    act(() => {
      result.current.setField('gMix0', 0.6);
    });
    act(() => {
      result.current.setField('pAvgBooking', 2500);
    });
    act(() => result.current.resetSection(['gOwnGrowth', 'gMix0']));
    expect(result.current.draft.overrides).toEqual({ pAvgBooking: 2500 });
  });

  it('clear empties the draft + removes localStorage entry', () => {
    const { result } = renderHook(() => useScenarioDraft('system:base'));
    act(() => result.current.setField('gOwnGrowth', 0.4));
    act(() => result.current.clear());
    expect(result.current.draft.overrides).toEqual({});
    expect(localStorage.getItem(draftKey('system:base'))).toBeNull();
  });

  it('survives remount on the same scenario id', () => {
    {
      const { result } = renderHook(() => useScenarioDraft('uuid-1'));
      act(() => result.current.setField('gOwnGrowth', 0.99));
    }
    const { result } = renderHook(() => useScenarioDraft('uuid-1'));
    expect(result.current.draft.overrides).toEqual({ gOwnGrowth: 0.99 });
  });

  it('drafts for different scenario ids are isolated', () => {
    const a = renderHook(() => useScenarioDraft('uuid-a'));
    act(() => a.result.current.setField('x', 1));
    const b = renderHook(() => useScenarioDraft('uuid-b'));
    expect(b.result.current.draft.overrides).toEqual({});
  });

  it('isDirty true when any override or expenseOverride present', () => {
    const { result } = renderHook(() => useScenarioDraft('s1'));
    expect(result.current.isDirty).toBe(false);
    act(() => result.current.setField('x', 1));
    expect(result.current.isDirty).toBe(true);
  });

  it('setExpenseAmount + resetExpense cycle', () => {
    const { result } = renderHook(() => useScenarioDraft('s1'));
    act(() => result.current.setExpenseAmount('Marketing & Launch', 'Conference exhibitor / booth fee', 3000));
    expect(result.current.draft.expenseOverrides).toHaveLength(1);
    expect(result.current.draft.expenseOverrides[0].amount).toBe(3000);
    act(() => result.current.resetExpense('Marketing & Launch', 'Conference exhibitor / booth fee'));
    expect(result.current.draft.expenseOverrides).toHaveLength(0);
  });
});
