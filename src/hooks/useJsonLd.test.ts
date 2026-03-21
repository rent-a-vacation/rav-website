import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useJsonLd } from './useJsonLd';

describe('useJsonLd', () => {
  afterEach(() => {
    document.querySelectorAll('script[type="application/ld+json"]').forEach((el) => el.remove());
  });

  it('@p0 injects a JSON-LD script tag into head', () => {
    const data = { '@type': 'Organization', name: 'Test' };
    renderHook(() => useJsonLd('test-schema', data));
    const script = document.getElementById('test-schema');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('type')).toBe('application/ld+json');
    expect(JSON.parse(script?.textContent || '')).toEqual(data);
  });

  it('removes script tag on unmount', () => {
    const { unmount } = renderHook(() =>
      useJsonLd('cleanup-test', { '@type': 'Thing' }),
    );
    expect(document.getElementById('cleanup-test')).not.toBeNull();
    unmount();
    expect(document.getElementById('cleanup-test')).toBeNull();
  });

  it('does not inject when data is null', () => {
    renderHook(() => useJsonLd('null-test', null));
    expect(document.getElementById('null-test')).toBeNull();
  });

  it('replaces existing script with same ID', () => {
    const { rerender } = renderHook(
      ({ data }) => useJsonLd('replace-test', data),
      { initialProps: { data: { name: 'first' } as object } },
    );
    expect(JSON.parse(document.getElementById('replace-test')?.textContent || '')).toEqual({
      name: 'first',
    });
    rerender({ data: { name: 'second' } });
    expect(JSON.parse(document.getElementById('replace-test')?.textContent || '')).toEqual({
      name: 'second',
    });
  });

  it('handles complex nested objects', () => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home' }],
    };
    renderHook(() => useJsonLd('complex-test', data));
    expect(JSON.parse(document.getElementById('complex-test')?.textContent || '')).toEqual(data);
  });
});
