import type { InputRow } from './data';

export type Overrides = Record<string, number | string>;

/**
 * Returns a new array where any baseline row whose `name` is present in `overrides`
 * has its `value` replaced. Metadata (label, fmt, note) preserved.
 * Baseline NOT mutated. Sparse: keys not in baseline are ignored.
 */
export function applyOverrides(baseline: InputRow[], overrides: Overrides): InputRow[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return baseline.map((r) => ({ ...r }));
  }
  return baseline.map((r) =>
    Object.prototype.hasOwnProperty.call(overrides, r.name)
      ? { ...r, value: overrides[r.name] }
      : { ...r },
  );
}

/**
 * Merge scenario overrides with localStorage draft overrides.
 * Draft wins over scenario for same key.
 */
export function mergeOverrideLayers(
  scenarioOverrides: Overrides,
  draftOverrides: Overrides | null | undefined,
): Overrides {
  if (!draftOverrides || Object.keys(draftOverrides).length === 0) {
    return { ...scenarioOverrides };
  }
  return { ...scenarioOverrides, ...draftOverrides };
}

/**
 * Compare merged overrides against baseline.
 * A key is dirty when its override value differs from baseline.
 * An override value identical to baseline is NOT dirty (no edit-history concept).
 */
export function computeDirtyKeys(baseline: InputRow[], merged: Overrides): Set<string> {
  const out = new Set<string>();
  for (const row of baseline) {
    if (Object.prototype.hasOwnProperty.call(merged, row.name)) {
      if (merged[row.name] !== row.value) {
        out.add(row.name);
      }
    }
  }
  return out;
}
