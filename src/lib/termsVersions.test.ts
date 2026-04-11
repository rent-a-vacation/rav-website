import { describe, it, expect } from 'vitest';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from './termsVersions';

describe('termsVersions', () => {
  it('exports CURRENT_TERMS_VERSION as a non-empty string', () => {
    expect(typeof CURRENT_TERMS_VERSION).toBe('string');
    expect(CURRENT_TERMS_VERSION.length).toBeGreaterThan(0);
  });

  it('exports CURRENT_PRIVACY_VERSION as a non-empty string', () => {
    expect(typeof CURRENT_PRIVACY_VERSION).toBe('string');
    expect(CURRENT_PRIVACY_VERSION.length).toBeGreaterThan(0);
  });

  it('version strings match semver-ish format (digits and dots)', () => {
    const semverish = /^\d+\.\d+(\.\d+)?$/;
    expect(CURRENT_TERMS_VERSION).toMatch(semverish);
    expect(CURRENT_PRIVACY_VERSION).toMatch(semverish);
  });
});
