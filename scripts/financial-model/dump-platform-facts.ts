/**
 * Dump PLATFORM_FACTS + MILESTONES from the financial model data as JSON,
 * for /generate-docs --pitch-brief.
 *
 * Same single source of truth as the .xlsx model.
 *
 * Usage:  npx tsx scripts/financial-model/dump-platform-facts.ts
 * Output: JSON to stdout
 */

import { PLATFORM_FACTS, MILESTONES } from '../../src/lib/financial-model/data.ts';

const dump = {
  generated_at: new Date().toISOString(),
  facts: PLATFORM_FACTS.map(([label, value]) => ({ label, value })),
  milestones: MILESTONES.map(([when, theme, description]) => ({ when, theme, description })),
};

console.log(JSON.stringify(dump, null, 2));
