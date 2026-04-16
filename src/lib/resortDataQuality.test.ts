import { describe, it, expect } from 'vitest';
import { generateDescription } from '../../scripts/generate-resort-descriptions';
import { normaliseTime, COUNTRY_MAP, STATE_MAP } from '../../scripts/normalise-resort-data';

describe('generateDescription', () => {
  const base = {
    resort_name: 'Test Resort',
    brand: 'hilton_grand_vacations',
    location: { city: 'Orlando', state: 'Florida', country: 'United States' },
    resort_amenities: ['Pool', 'Fitness Center', 'Spa'],
    policies: { check_in: '4:00 PM', check_out: '10:00 AM' },
    unitTypes: [
      { bedrooms: 1, max_occupancy: 4, unit_type_name: '1BR' },
      { bedrooms: 2, max_occupancy: 8, unit_type_name: '2BR' },
    ],
  };

  it('produces a description between 40 and 200 words', () => {
    const { description } = generateDescription(base);
    const wordCount = description.split(/\s+/).filter(Boolean).length;
    expect(wordCount).toBeGreaterThanOrEqual(40);
    expect(wordCount).toBeLessThanOrEqual(200);
  });

  it('does not contain template phrases', () => {
    const { description } = generateDescription(base);
    expect(description).not.toContain('spacious accommodations');
    expect(description).not.toContain('world-class amenities');
    expect(description).not.toContain('premium vacation');
  });

  it('does not use superlatives', () => {
    const { description } = generateDescription(base);
    expect(description.toLowerCase()).not.toContain('luxury');
    expect(description.toLowerCase()).not.toContain('world-class');
    expect(description.toLowerCase()).not.toContain('premium');
  });

  it('uses third-person voice', () => {
    const { description } = generateDescription(base);
    expect(description).toContain('Guests');
    expect(description).not.toMatch(/\b(you|your|we|our)\b/i);
  });

  it('includes the resort name and brand', () => {
    const { description } = generateDescription(base);
    expect(description).toContain('Test Resort');
    expect(description).toContain('Hilton Grand Vacations');
  });

  it('includes unit type range', () => {
    const { description } = generateDescription(base);
    expect(description).toContain('1-bedroom');
    expect(description).toContain('2-bedroom');
    expect(description).toContain('8 guests');
  });

  it('flags resorts with missing city as needing review', () => {
    const { needsReview, reviewReason } = generateDescription({
      ...base,
      location: { city: '', state: 'FL' },
    });
    expect(needsReview).toBe(true);
    expect(reviewReason).toContain('Missing city');
  });

  it('handles resort with no unit types', () => {
    const { description, needsReview } = generateDescription({
      ...base,
      unitTypes: [],
    });
    expect(description).not.toContain('accommodation types');
    expect(needsReview).toBe(false);
  });

  it('handles studio units (0 bedrooms)', () => {
    const { description } = generateDescription({
      ...base,
      unitTypes: [{ bedrooms: 0, max_occupancy: 2, unit_type_name: 'Studio' }],
    });
    expect(description).toContain('studio');
  });
});

describe('normaliseTime', () => {
  it('converts 4:00 PM to 16:00', () => {
    expect(normaliseTime('4:00 PM')).toBe('16:00');
  });

  it('converts 10:00 AM to 10:00', () => {
    expect(normaliseTime('10:00 AM')).toBe('10:00');
  });

  it('converts 12:00 PM to 12:00', () => {
    expect(normaliseTime('12:00 PM')).toBe('12:00');
  });

  it('converts 12:00 AM to 00:00', () => {
    expect(normaliseTime('12:00 AM')).toBe('00:00');
  });

  it('returns input unchanged if not matching AM/PM pattern', () => {
    expect(normaliseTime('16:00')).toBe('16:00');
    expect(normaliseTime('Not specified')).toBe('Not specified');
  });
});

describe('COUNTRY_MAP', () => {
  it('maps common variants to ISO codes', () => {
    expect(COUNTRY_MAP['United States']).toBe('US');
    expect(COUNTRY_MAP['United States of America']).toBe('US');
    expect(COUNTRY_MAP['USA']).toBe('US');
    expect(COUNTRY_MAP['Canada']).toBe('CA');
    expect(COUNTRY_MAP['Mexico']).toBe('MX');
    expect(COUNTRY_MAP['Japan']).toBe('JP');
    expect(COUNTRY_MAP['United Kingdom']).toBe('GB');
  });
});

describe('STATE_MAP', () => {
  it('maps full state names to abbreviations', () => {
    expect(STATE_MAP['Florida']).toBe('FL');
    expect(STATE_MAP['California']).toBe('CA');
    expect(STATE_MAP['Hawaii']).toBe('HI');
    expect(STATE_MAP['Nevada']).toBe('NV');
    expect(STATE_MAP['South Carolina']).toBe('SC');
  });

  it('maps island names to state abbreviations', () => {
    expect(STATE_MAP['Oahu']).toBe('HI');
    expect(STATE_MAP['Maui']).toBe('HI');
  });
});
