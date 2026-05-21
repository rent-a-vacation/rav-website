import type { InputRow } from '@/lib/financial-model/data';
import {
  PLATFORM,
  SUBSCRIPTIONS,
  GROWTH,
  SCENARIOS,
  HORIZON,
  RESERVES,
  HIRING,
  UNIT_ECON,
} from '@/lib/financial-model/data';

export type InputSectionId =
  | 'platform'
  | 'subscriptions'
  | 'growth'
  | 'scenarios'
  | 'horizon'
  | 'reserves'
  | 'hiring'
  | 'unitEcon';

export interface InputSectionMeta {
  id: InputSectionId;
  title: string;
  description: string;
  baseline: InputRow[];
  /** Category-A (live-config) rows — render read-only with a System Settings link. */
  liveConfigKeys?: string[];
}

export const INPUT_SECTIONS: InputSectionMeta[] = [
  {
    id: 'platform',
    title: 'Platform Parameters',
    description: 'Booking economics + Stripe fees. Commission rate is live from System Settings.',
    baseline: PLATFORM,
    liveConfigKeys: ['pCommBase', 'pProDisc', 'pBizDisc'],
  },
  {
    id: 'subscriptions',
    title: 'Subscription Pricing',
    description: 'Owner + traveler monthly tier prices.',
    baseline: SUBSCRIPTIONS,
  },
  {
    id: 'growth',
    title: 'Growth Assumptions',
    description: 'Launch, starting counts, MoM growth, booking mix.',
    baseline: GROWTH,
  },
  {
    id: 'scenarios',
    title: 'Scenario Multipliers',
    description: 'Conservative/Base/Optimistic booking & growth multipliers.',
    baseline: SCENARIOS,
  },
  {
    id: 'horizon',
    title: 'Planning Horizon',
    description: 'Model length + Month 1 label.',
    baseline: HORIZON,
  },
  {
    id: 'reserves',
    title: 'Tax, Cash & Reserves',
    description: 'Starting cash, funding inflow, founder comp.',
    baseline: RESERVES,
  },
  {
    id: 'hiring',
    title: 'Hiring Plan',
    description: 'Engineer / support / BD hire months + burdened cost.',
    baseline: HIRING,
  },
  {
    id: 'unitEcon',
    title: 'Unit Economics',
    description: 'Cohort ramp, lifetimes, voice overage.',
    baseline: UNIT_ECON,
  },
];

/** All editable Category-B input keys across the 8 sections (excludes liveConfigKeys). */
export function allEditableKeys(): Set<string> {
  const out = new Set<string>();
  for (const section of INPUT_SECTIONS) {
    const live = new Set(section.liveConfigKeys ?? []);
    for (const row of section.baseline) {
      if (!live.has(row.name)) out.add(row.name);
    }
  }
  return out;
}

/** All input keys belonging to a section (used for 'Reset section' + dirty-count). */
export function sectionKeys(sectionId: InputSectionId): string[] {
  const section = INPUT_SECTIONS.find((s) => s.id === sectionId);
  return section ? section.baseline.map((r) => r.name) : [];
}
