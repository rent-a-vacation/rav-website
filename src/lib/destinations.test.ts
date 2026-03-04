import { describe, it, expect } from 'vitest';
import {
  DESTINATIONS,
  getDestinationBySlug,
  getCityBySlug,
  getLocationFilterValue,
} from './destinations';

describe('destinations', () => {
  it('getDestinationBySlug returns correct destination', () => {
    const hawaii = getDestinationBySlug('hawaii');
    expect(hawaii).not.toBeNull();
    expect(hawaii!.name).toBe('Hawaii');
    expect(hawaii!.region).toBe('Pacific');
  });

  it('getCityBySlug returns correct city', () => {
    const maui = getCityBySlug('hawaii', 'maui');
    expect(maui).not.toBeNull();
    expect(maui!.name).toBe('Maui');
  });

  it('getLocationFilterValue maps slugs to filter values', () => {
    expect(getLocationFilterValue('hawaii')).toBe('Hawaii');
    expect(getLocationFilterValue('hawaii', 'maui')).toBe('Maui');
    expect(getLocationFilterValue('florida', 'orlando')).toBe('Orlando');
  });

  it('all destination slugs are unique', () => {
    const slugs = DESTINATIONS.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('all destinations have at least one city', () => {
    for (const dest of DESTINATIONS) {
      expect(dest.cities.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('returns null for unknown slug', () => {
    expect(getDestinationBySlug('atlantis')).toBeNull();
    expect(getCityBySlug('hawaii', 'atlantis')).toBeNull();
    expect(getLocationFilterValue('atlantis')).toBeNull();
  });
});
