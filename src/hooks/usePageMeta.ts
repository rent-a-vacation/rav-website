import { useEffect } from 'react';

const BASE_URL = 'https://rent-a-vacation.com';
const DEFAULT_TITLE = 'Rent-A-Vacation | Where Luxury Becomes Affordable';
const DEFAULT_DESCRIPTION =
  'Name Your Price. Book Your Paradise. Rent vacation club and timeshare weeks directly from owners at up to 70% off.';
const DEFAULT_OG_IMAGE = `${BASE_URL}/android-chrome-512x512.png`;

export interface PageMetaOptions {
  title: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
}

function setMetaTag(selector: string, attr: string, value: string) {
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    // Set the identifying attribute
    if (selector.startsWith('meta[property=')) {
      const prop = selector.match(/property="([^"]+)"/)?.[1];
      if (prop) el.setAttribute('property', prop);
    } else if (selector.startsWith('meta[name=')) {
      const name = selector.match(/name="([^"]+)"/)?.[1];
      if (name) el.setAttribute('name', name);
    }
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function removeMetaTag(selector: string) {
  document.querySelector(selector)?.remove();
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}

/**
 * Sets document.title, meta description, canonical URL, OG/Twitter tags, and robots directive.
 * Accepts either a title string (backward-compatible) or a PageMetaOptions object.
 * Resets all to defaults on unmount.
 */
export function usePageMeta(titleOrOptions: string | PageMetaOptions, description?: string) {
  const opts: PageMetaOptions =
    typeof titleOrOptions === 'string'
      ? { title: titleOrOptions, description }
      : titleOrOptions;

  useEffect(() => {
    const fullTitle = `${opts.title} — Rent-A-Vacation`;
    document.title = fullTitle;

    // Meta description
    const desc = opts.description || DEFAULT_DESCRIPTION;
    setMetaTag('meta[name="description"]', 'content', desc);

    // Canonical URL
    const canonicalUrl = opts.canonicalPath
      ? `${BASE_URL}${opts.canonicalPath}`
      : BASE_URL + '/';
    setCanonical(canonicalUrl);

    // OG tags
    setMetaTag('meta[property="og:title"]', 'content', fullTitle);
    setMetaTag('meta[property="og:description"]', 'content', desc);
    setMetaTag('meta[property="og:url"]', 'content', canonicalUrl);
    setMetaTag('meta[property="og:image"]', 'content', opts.ogImage || DEFAULT_OG_IMAGE);
    setMetaTag('meta[property="og:type"]', 'content', opts.ogType || 'website');

    // Twitter tags
    setMetaTag('meta[name="twitter:title"]', 'content', fullTitle);
    setMetaTag('meta[name="twitter:description"]', 'content', desc);
    setMetaTag('meta[name="twitter:image"]', 'content', opts.ogImage || DEFAULT_OG_IMAGE);

    // Robots noindex
    if (opts.noindex) {
      setMetaTag('meta[name="robots"]', 'content', 'noindex,nofollow');
    } else {
      removeMetaTag('meta[name="robots"][content="noindex,nofollow"]');
    }

    return () => {
      document.title = DEFAULT_TITLE;
      setMetaTag('meta[name="description"]', 'content', DEFAULT_DESCRIPTION);
      setCanonical(`${BASE_URL}/`);
      setMetaTag('meta[property="og:title"]', 'content', DEFAULT_TITLE);
      setMetaTag('meta[property="og:description"]', 'content', DEFAULT_DESCRIPTION);
      setMetaTag('meta[property="og:url"]', 'content', `${BASE_URL}/`);
      setMetaTag('meta[property="og:image"]', 'content', DEFAULT_OG_IMAGE);
      setMetaTag('meta[property="og:type"]', 'content', 'website');
      setMetaTag('meta[name="twitter:title"]', 'content', DEFAULT_TITLE);
      setMetaTag('meta[name="twitter:description"]', 'content', DEFAULT_DESCRIPTION);
      setMetaTag('meta[name="twitter:image"]', 'content', DEFAULT_OG_IMAGE);
      removeMetaTag('meta[name="robots"][content="noindex,nofollow"]');
    };
  }, [opts.title, opts.description, opts.canonicalPath, opts.ogImage, opts.ogType, opts.noindex]);
}
