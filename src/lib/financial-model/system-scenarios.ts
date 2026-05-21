import type { Scenario } from './calc';

/**
 * Virtual system scenarios — NOT seeded as DB rows.
 * Always available, always selectable, cannot be edited or deleted.
 * "Save As..." on a system scenario creates a brand-new owned scenario.
 */
export interface SystemScenario {
  id: `system:${string}`;
  name: string;
  multiplier: Scenario;
  system: true;
}

export const SYSTEM_SCENARIOS: readonly SystemScenario[] = [
  { id: 'system:base',         name: 'Base',         multiplier: 'Base',         system: true },
  { id: 'system:conservative', name: 'Conservative', multiplier: 'Conservative', system: true },
  { id: 'system:optimistic',   name: 'Optimistic',   multiplier: 'Optimistic',   system: true },
] as const;

export const DEFAULT_SCENARIO_ID = 'system:base';

export function isSystemScenarioId(id: string | null | undefined): id is SystemScenario['id'] {
  return typeof id === 'string' && id.startsWith('system:');
}

export function findSystemScenario(id: string): SystemScenario | undefined {
  return SYSTEM_SCENARIOS.find((s) => s.id === id);
}
