import { useMemo } from 'react';
import {
  PLATFORM,
  SUBSCRIPTIONS,
  GROWTH,
  SCENARIOS,
  HORIZON,
  RESERVES,
  HIRING,
  UNIT_ECON,
  EXPENSES,
  type InputRow,
} from '@/lib/financial-model/data';
import {
  applyOverrides,
  mergeOverrideLayers,
  computeDirtyKeys,
  type Overrides,
} from '@/lib/financial-model/overrides';
import { useActiveScenario } from './useActiveScenario';
import {
  useFinancialModelScenarios,
  type ExpenseOverride,
  type FinancialModelScenario,
} from './useFinancialModelScenarios';
import { useScenarioDraft } from './useScenarioDraft';
import { isSystemScenarioId } from '@/lib/financial-model/system-scenarios';
import type { ModelInputs, Scenario } from '@/lib/financial-model/calc';

export interface ActiveScenarioInputs extends ModelInputs {
  multiplier: Scenario;
  active: FinancialModelScenario | null;
  isSystem: boolean;
  expenseOverrides: ExpenseOverride[];
  dirtyKeys: Set<string>;
  dirtyExpenseKeys: Set<string>;
  isDirty: boolean;
  /** The merged overrides layer (scenario + draft), exposed for diff dialogs. */
  mergedOverrides: Overrides;
}

const SECTION_BASELINES: ReadonlyArray<InputRow[]> = [
  PLATFORM,
  SUBSCRIPTIONS,
  GROWTH,
  SCENARIOS,
  HORIZON,
  RESERVES,
  HIRING,
  UNIT_ECON,
];

export function useActiveScenarioInputs(): ActiveScenarioInputs {
  const { activeId } = useActiveScenario();
  const { scenarios } = useFinancialModelScenarios();
  const { draft } = useScenarioDraft(activeId);

  const isSystem = isSystemScenarioId(activeId);
  const active = scenarios.find((s) => s.id === activeId) ?? null;

  return useMemo(() => {
    const scenarioOverrides: Overrides = active?.overrides ?? {};
    const merged = mergeOverrideLayers(scenarioOverrides, draft.overrides);

    const platformRows = applyOverrides(PLATFORM, merged);
    const subscriptionsRows = applyOverrides(SUBSCRIPTIONS, merged);
    const growthRows = applyOverrides(GROWTH, merged);
    const scenariosRows = applyOverrides(SCENARIOS, merged);
    const horizonRows = applyOverrides(HORIZON, merged);
    const reservesRows = applyOverrides(RESERVES, merged);
    const hiringRows = applyOverrides(HIRING, merged);
    const unitEconRows = applyOverrides(UNIT_ECON, merged);

    // Merge expense overrides: scenario layer first, draft overlays per (category, item)
    const expenseScenarioMap = new Map(
      (active?.expense_overrides ?? []).map((e) => [`${e.category}|${e.item}`, e]),
    );
    const expenseDraftMap = new Map(
      draft.expenseOverrides.map((e) => [`${e.category}|${e.item}`, e]),
    );
    const mergedExpenseMap = new Map([...expenseScenarioMap, ...expenseDraftMap]);
    const expenseOverrides = Array.from(mergedExpenseMap.values());

    const expensesRows = EXPENSES.map((e) => {
      const key = `${e.category}|${e.item}`;
      const override = mergedExpenseMap.get(key);
      return override?.amount !== undefined ? { ...e, amount: override.amount } : { ...e };
    });

    const dirtyKeys = new Set<string>();
    for (const baseline of SECTION_BASELINES) {
      const sectionDirty = computeDirtyKeys(baseline, merged);
      for (const k of sectionDirty) dirtyKeys.add(k);
    }

    const dirtyExpenseKeys = new Set<string>();
    for (const ov of expenseOverrides) {
      const baseline = EXPENSES.find((e) => e.category === ov.category && e.item === ov.item);
      if (baseline && ov.amount !== undefined && ov.amount !== baseline.amount) {
        dirtyExpenseKeys.add(`${ov.category}|${ov.item}`);
      }
    }

    const multiplier: Scenario = (active?.multiplier ?? 'Base') as Scenario;

    return {
      platform: platformRows,
      subscriptions: subscriptionsRows,
      growth: growthRows,
      scenarios: scenariosRows,
      horizon: horizonRows,
      reserves: reservesRows,
      hiring: hiringRows,
      unitEcon: unitEconRows,
      expenses: expensesRows,
      multiplier,
      active,
      isSystem,
      expenseOverrides,
      dirtyKeys,
      dirtyExpenseKeys,
      isDirty: dirtyKeys.size > 0 || dirtyExpenseKeys.size > 0,
      mergedOverrides: merged,
    };
  }, [active, draft, isSystem]);
}
