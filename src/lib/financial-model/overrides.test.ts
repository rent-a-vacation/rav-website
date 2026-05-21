import { describe, it, expect } from 'vitest';
import { applyOverrides, mergeOverrideLayers, computeDirtyKeys } from './overrides';
import { GROWTH } from './data';

describe('applyOverrides (#550 PR3) @p0', () => {
  it('returns baseline unchanged in value when overrides empty', () => {
    const result = applyOverrides(GROWTH, {});
    expect(result).toHaveLength(GROWTH.length);
    GROWTH.forEach((row, i) => expect(result[i].value).toBe(row.value));
  });

  it('replaces only matching keys (sparse)', () => {
    const result = applyOverrides(GROWTH, { gOwnGrowth: 0.5 });
    const baseline = GROWTH.find((r) => r.name === 'gOwnGrowth')!.value;
    const overridden = result.find((r) => r.name === 'gOwnGrowth')!.value;
    expect(baseline).not.toBe(overridden);
    expect(overridden).toBe(0.5);
    expect(result.find((r) => r.name === 'gMix0')!.value).toBe(
      GROWTH.find((r) => r.name === 'gMix0')!.value,
    );
  });

  it('preserves row order, fmt, label, note metadata', () => {
    const result = applyOverrides(GROWTH, { gOwnGrowth: 0.5 });
    GROWTH.forEach((row, i) => {
      expect(result[i].name).toBe(row.name);
      expect(result[i].fmt).toBe(row.fmt);
      expect(result[i].label).toBe(row.label);
      expect(result[i].note).toBe(row.note);
    });
  });

  it('does not mutate the input baseline array', () => {
    const snapshot = GROWTH.map((r) => ({ ...r }));
    applyOverrides(GROWTH, { gOwnGrowth: 0.99 });
    GROWTH.forEach((row, i) => expect(row.value).toBe(snapshot[i].value));
  });

  it('ignores keys not present in baseline', () => {
    const result = applyOverrides(GROWTH, { madeUpKey: 9999 });
    expect(result).toHaveLength(GROWTH.length);
    GROWTH.forEach((row, i) => expect(result[i].value).toBe(row.value));
  });
});

describe('mergeOverrideLayers (#550 PR3) @p0', () => {
  it('returns empty when both layers empty', () => {
    expect(mergeOverrideLayers({}, null)).toEqual({});
  });
  it('scenario overrides win when no draft', () => {
    expect(mergeOverrideLayers({ a: 1 }, null)).toEqual({ a: 1 });
  });
  it('draft wins over scenario for same key', () => {
    expect(mergeOverrideLayers({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });
  it('keys present only in draft are kept', () => {
    expect(mergeOverrideLayers({ a: 1 }, { b: 3 })).toEqual({ a: 1, b: 3 });
  });
});

describe('computeDirtyKeys (#550 PR3) @p0', () => {
  it('returns empty when override layer is empty', () => {
    expect(computeDirtyKeys(GROWTH, {}).size).toBe(0);
  });

  it('flags keys whose merged value differs from baseline', () => {
    const dirty = computeDirtyKeys(GROWTH, { gOwnGrowth: 0.5 });
    expect(dirty.has('gOwnGrowth')).toBe(true);
    expect(dirty.size).toBe(1);
  });

  it('does NOT flag a key whose override value equals baseline', () => {
    const baseline = GROWTH.find((r) => r.name === 'gOwnGrowth')!.value;
    const dirty = computeDirtyKeys(GROWTH, { gOwnGrowth: baseline });
    expect(dirty.has('gOwnGrowth')).toBe(false);
  });

  it('flags multiple keys across a section', () => {
    const dirty = computeDirtyKeys(GROWTH, { gOwnGrowth: 0.5, gMix0: 0.4 });
    expect(dirty.size).toBe(2);
  });
});
