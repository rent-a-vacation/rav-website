import { describe, it, expect } from 'vitest';
import { buildBreadcrumbJsonLd } from './breadcrumbSchema';

describe('buildBreadcrumbJsonLd', () => {
  it('@p0 builds a valid BreadcrumbList schema', () => {
    const result = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Rentals', path: '/rentals' },
    ]);
    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://rent-a-vacation.com/' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Rentals',
          item: 'https://rent-a-vacation.com/rentals',
        },
      ],
    });
  });

  it('handles a single item', () => {
    const result = buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }]);
    expect((result as { itemListElement: unknown[] }).itemListElement).toHaveLength(1);
  });

  it('handles deep paths', () => {
    const result = buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Tools', path: '/tools' },
      { name: 'SmartEarn', path: '/calculator' },
    ]);
    const items = (result as { itemListElement: { position: number; item: string }[] })
      .itemListElement;
    expect(items).toHaveLength(3);
    expect(items[2].position).toBe(3);
    expect(items[2].item).toBe('https://rent-a-vacation.com/calculator');
  });

  it('preserves item order and positions correctly', () => {
    const items = [
      { name: 'Home', path: '/' },
      { name: 'Destinations', path: '/destinations' },
      { name: 'Hawaii', path: '/destinations/hawaii' },
      { name: 'Maui', path: '/destinations/hawaii/maui' },
    ];
    const result = buildBreadcrumbJsonLd(items) as {
      itemListElement: { position: number; name: string }[];
    };
    result.itemListElement.forEach((el, i) => {
      expect(el.position).toBe(i + 1);
      expect(el.name).toBe(items[i].name);
    });
  });
});
