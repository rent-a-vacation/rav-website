import { useCallback, useEffect, useState } from 'react';
import type { ExpenseOverride } from './useFinancialModelScenarios';
import type { Overrides } from '@/lib/financial-model/overrides';

export interface DraftState {
  overrides: Overrides;
  expenseOverrides: ExpenseOverride[];
}

export function draftKey(scenarioId: string): string {
  return `fms-draft:${scenarioId}`;
}

function readDraft(scenarioId: string): DraftState {
  try {
    const raw = localStorage.getItem(draftKey(scenarioId));
    if (!raw) return { overrides: {}, expenseOverrides: [] };
    const parsed = JSON.parse(raw);
    return {
      overrides: parsed?.overrides ?? {},
      expenseOverrides: parsed?.expenseOverrides ?? [],
    };
  } catch {
    return { overrides: {}, expenseOverrides: [] };
  }
}

function writeDraft(scenarioId: string, state: DraftState) {
  try {
    const isEmpty =
      Object.keys(state.overrides).length === 0 && state.expenseOverrides.length === 0;
    if (isEmpty) {
      localStorage.removeItem(draftKey(scenarioId));
    } else {
      localStorage.setItem(draftKey(scenarioId), JSON.stringify(state));
    }
  } catch {
    // ignore — in-memory state still updates
  }
}

export function useScenarioDraft(scenarioId: string) {
  const [draft, setDraft] = useState<DraftState>(() => readDraft(scenarioId));

  useEffect(() => {
    setDraft(readDraft(scenarioId));
  }, [scenarioId]);

  const persist = useCallback(
    (next: DraftState) => {
      setDraft(next);
      writeDraft(scenarioId, next);
    },
    [scenarioId],
  );

  const setField = useCallback(
    (name: string, value: number | string) => {
      persist({ ...draft, overrides: { ...draft.overrides, [name]: value } });
    },
    [draft, persist],
  );

  const resetField = useCallback(
    (name: string) => {
      const next = { ...draft.overrides };
      delete next[name];
      persist({ ...draft, overrides: next });
    },
    [draft, persist],
  );

  const resetSection = useCallback(
    (names: string[]) => {
      const next = { ...draft.overrides };
      for (const n of names) delete next[n];
      persist({ ...draft, overrides: next });
    },
    [draft, persist],
  );

  const setExpenseAmount = useCallback(
    (category: string, item: string, amount: number) => {
      const idx = draft.expenseOverrides.findIndex(
        (e) => e.category === category && e.item === item,
      );
      const next =
        idx >= 0
          ? draft.expenseOverrides.map((e, i) => (i === idx ? { ...e, amount } : e))
          : [...draft.expenseOverrides, { category, item, amount }];
      persist({ ...draft, expenseOverrides: next });
    },
    [draft, persist],
  );

  const resetExpense = useCallback(
    (category: string, item: string) => {
      const next = draft.expenseOverrides.filter(
        (e) => !(e.category === category && e.item === item),
      );
      persist({ ...draft, expenseOverrides: next });
    },
    [draft, persist],
  );

  const clear = useCallback(() => {
    persist({ overrides: {}, expenseOverrides: [] });
  }, [persist]);

  const isDirty =
    Object.keys(draft.overrides).length > 0 || draft.expenseOverrides.length > 0;

  return {
    draft,
    setField,
    resetField,
    resetSection,
    setExpenseAmount,
    resetExpense,
    clear,
    isDirty,
  };
}
