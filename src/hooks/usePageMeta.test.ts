import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageMeta } from './usePageMeta';

const BASE_URL = 'https://rent-a-vacation.com';
const DEFAULT_TITLE = 'Rent-A-Vacation | Where Luxury Becomes Affordable';

function getMetaContent(selector: string): string | null {
  return document.querySelector(selector)?.getAttribute('content') ?? null;
}

function getCanonical(): string | null {
  return (document.querySelector('link[rel="canonical"]') as HTMLLinkElement)?.href ?? null;
}

describe('usePageMeta', () => {
  beforeEach(() => {
    // Ensure baseline meta tags exist (mirrors index.html)
    document.title = DEFAULT_TITLE;
    const ensureMeta = (attr: string, attrValue: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${attrValue}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, attrValue);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    ensureMeta('name', 'description', 'default desc');
    ensureMeta('property', 'og:title', DEFAULT_TITLE);
    ensureMeta('property', 'og:description', 'default desc');
    ensureMeta('property', 'og:url', `${BASE_URL}/`);
    ensureMeta('property', 'og:image', `${BASE_URL}/android-chrome-512x512.png`);
    ensureMeta('property', 'og:type', 'website');
    ensureMeta('name', 'twitter:title', DEFAULT_TITLE);
    ensureMeta('name', 'twitter:description', 'default desc');
    ensureMeta('name', 'twitter:image', `${BASE_URL}/android-chrome-512x512.png`);
  });

  afterEach(() => {
    // Clean up robots meta if injected
    document.querySelector('meta[name="robots"][content="noindex,nofollow"]')?.remove();
  });

  it('@p0 sets document title with string argument', () => {
    const { unmount } = renderHook(() => usePageMeta('Test Page'));
    expect(document.title).toBe('Test Page — Rent-A-Vacation');
    unmount();
    expect(document.title).toBe(DEFAULT_TITLE);
  });

  it('sets meta description with string arguments', () => {
    const { unmount } = renderHook(() => usePageMeta('Title', 'My description'));
    expect(getMetaContent('meta[name="description"]')).toBe('My description');
    unmount();
  });

  it('sets canonical URL from canonicalPath', () => {
    const { unmount } = renderHook(() =>
      usePageMeta({ title: 'Rentals', canonicalPath: '/rentals' }),
    );
    expect(getCanonical()).toBe(`${BASE_URL}/rentals`);
    unmount();
    expect(getCanonical()).toBe(`${BASE_URL}/`);
  });

  it('sets OG tags from options object', () => {
    const { unmount } = renderHook(() =>
      usePageMeta({
        title: 'Property',
        description: 'A nice property',
        canonicalPath: '/property/123',
        ogImage: 'https://example.com/img.jpg',
        ogType: 'product',
      }),
    );
    expect(getMetaContent('meta[property="og:title"]')).toBe('Property — Rent-A-Vacation');
    expect(getMetaContent('meta[property="og:description"]')).toBe('A nice property');
    expect(getMetaContent('meta[property="og:url"]')).toBe(`${BASE_URL}/property/123`);
    expect(getMetaContent('meta[property="og:image"]')).toBe('https://example.com/img.jpg');
    expect(getMetaContent('meta[property="og:type"]')).toBe('product');
    unmount();
  });

  it('sets Twitter tags', () => {
    renderHook(() =>
      usePageMeta({ title: 'Test', description: 'desc', ogImage: 'https://img.com/a.jpg' }),
    );
    expect(getMetaContent('meta[name="twitter:title"]')).toBe('Test — Rent-A-Vacation');
    expect(getMetaContent('meta[name="twitter:description"]')).toBe('desc');
    expect(getMetaContent('meta[name="twitter:image"]')).toBe('https://img.com/a.jpg');
  });

  it('adds noindex meta when noindex is true', () => {
    const { unmount } = renderHook(() =>
      usePageMeta({ title: 'Not Found', noindex: true }),
    );
    expect(getMetaContent('meta[name="robots"]')).toBe('noindex,nofollow');
    unmount();
    expect(document.querySelector('meta[name="robots"][content="noindex,nofollow"]')).toBeNull();
  });

  it('does not add robots meta when noindex is false', () => {
    renderHook(() => usePageMeta({ title: 'Public Page' }));
    expect(document.querySelector('meta[name="robots"][content="noindex,nofollow"]')).toBeNull();
  });

  it('defaults canonical to base URL when no canonicalPath provided', () => {
    renderHook(() => usePageMeta('Simple'));
    expect(getCanonical()).toBe(`${BASE_URL}/`);
  });

  it('defaults OG image to site logo when none provided', () => {
    renderHook(() => usePageMeta({ title: 'No Image' }));
    expect(getMetaContent('meta[property="og:image"]')).toBe(
      `${BASE_URL}/android-chrome-512x512.png`,
    );
  });

  it('resets all tags on unmount', () => {
    const { unmount } = renderHook(() =>
      usePageMeta({
        title: 'Custom',
        description: 'Custom desc',
        canonicalPath: '/custom',
        ogImage: 'https://img.com/custom.jpg',
        ogType: 'article',
        noindex: true,
      }),
    );
    unmount();
    expect(document.title).toBe(DEFAULT_TITLE);
    expect(getCanonical()).toBe(`${BASE_URL}/`);
    expect(getMetaContent('meta[property="og:type"]')).toBe('website');
    expect(document.querySelector('meta[name="robots"][content="noindex,nofollow"]')).toBeNull();
  });
});
