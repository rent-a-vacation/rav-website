/**
 * Build-time sitemap generator.
 * Runs as `postbuild` after `vite build`.
 *
 * Combines:
 * 1. Static routes (public pages)
 * 2. Dynamic destination routes (from destinations.ts)
 * 3. Active listing IDs (from Supabase REST API)
 *
 * Output: dist/sitemap.xml
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const BASE_URL = 'https://rent-a-vacation.com';
const SUPABASE_URL = 'https://xzfllqndrlmhclqfybew.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

interface SitemapEntry {
  loc: string;
  priority: number;
  changefreq?: string;
}

// Static routes with priorities
const STATIC_ROUTES: SitemapEntry[] = [
  { loc: '/', priority: 1.0, changefreq: 'daily' },
  { loc: '/rentals', priority: 0.9, changefreq: 'daily' },
  { loc: '/tools', priority: 0.9, changefreq: 'monthly' },
  { loc: '/calculator', priority: 0.8, changefreq: 'monthly' },
  { loc: '/tools/cost-comparator', priority: 0.8, changefreq: 'monthly' },
  { loc: '/tools/resort-quiz', priority: 0.8, changefreq: 'monthly' },
  { loc: '/tools/budget-planner', priority: 0.8, changefreq: 'monthly' },
  { loc: '/how-it-works', priority: 0.8, changefreq: 'monthly' },
  { loc: '/destinations', priority: 0.8, changefreq: 'weekly' },
  { loc: '/bidding', priority: 0.8, changefreq: 'daily' },
  { loc: '/developers', priority: 0.6, changefreq: 'monthly' },
  { loc: '/faq', priority: 0.7, changefreq: 'monthly' },
  { loc: '/contact', priority: 0.6, changefreq: 'monthly' },
  { loc: '/user-guide', priority: 0.6, changefreq: 'monthly' },
  { loc: '/terms', priority: 0.3, changefreq: 'yearly' },
  { loc: '/privacy', priority: 0.3, changefreq: 'yearly' },
];

// Import destinations at build time via dynamic import (ESM)
async function getDestinationRoutes(): Promise<SitemapEntry[]> {
  // We can't directly import the TS source with path aliases, so inline the data
  // by reading the compiled output. Instead, use a simpler approach: fetch from
  // the destinations module via tsx which resolves aliases.
  try {
    const { DESTINATIONS } = await import('../src/lib/destinations.js');
    const entries: SitemapEntry[] = [];
    for (const dest of DESTINATIONS) {
      entries.push({
        loc: `/destinations/${dest.slug}`,
        priority: 0.7,
        changefreq: 'weekly',
      });
      for (const city of dest.cities) {
        entries.push({
          loc: `/destinations/${dest.slug}/${city.slug}`,
          priority: 0.6,
          changefreq: 'weekly',
        });
      }
    }
    return entries;
  } catch (err) {
    console.warn('Could not import destinations, using static routes only:', err);
    return [];
  }
}

async function getListingRoutes(): Promise<SitemapEntry[]> {
  if (!SUPABASE_ANON_KEY) {
    console.warn('VITE_SUPABASE_ANON_KEY not set, skipping dynamic listing routes');
    return [];
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/listings?select=id&status=eq.active&is_published=eq.true`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    if (!res.ok) {
      console.warn(`Supabase API returned ${res.status}, skipping listing routes`);
      return [];
    }

    const listings: { id: string }[] = await res.json();
    return listings.map((l) => ({
      loc: `/property/${l.id}`,
      priority: 0.7,
      changefreq: 'weekly' as const,
    }));
  } catch (err) {
    console.warn('Could not fetch listings:', err);
    return [];
  }
}

function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) =>
        `  <url>\n    <loc>${BASE_URL}${e.loc}</loc>\n    <priority>${e.priority}</priority>${e.changefreq ? `\n    <changefreq>${e.changefreq}</changefreq>` : ''}\n  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

async function main() {
  console.log('Generating sitemap...');

  const [destinationRoutes, listingRoutes] = await Promise.all([
    getDestinationRoutes(),
    getListingRoutes(),
  ]);

  const allEntries = [...STATIC_ROUTES, ...destinationRoutes, ...listingRoutes];

  const xml = buildSitemapXml(allEntries);
  const outPath = resolve(process.cwd(), 'dist', 'sitemap.xml');
  writeFileSync(outPath, xml, 'utf-8');

  console.log(
    `Sitemap generated: ${allEntries.length} URLs (${STATIC_ROUTES.length} static + ${destinationRoutes.length} destinations + ${listingRoutes.length} listings)`,
  );
}

main().catch((err) => {
  console.error('Sitemap generation failed:', err);
  process.exit(1);
});
