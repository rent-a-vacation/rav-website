---
last_updated: "2026-05-15T00:00:00"
change_ref: "manual-edit"
change_type: "session-68-seo-readme"
status: "active"
---

# SEO Optimization — Feature README

> Technical SEO foundations for organic discovery: dynamic per-page meta tags, JSON-LD structured data, dynamic sitemap generation, and crawler-specific robots.txt rules.

**Status:** ~95% built (Session 41 closed most planned work). Remaining gap: server-side OG-tag rendering for social crawlers.

**Planning brief:** [`00-PROJECT-BRIEF.md`](00-PROJECT-BRIEF.md), [`01-SESSION1-TASK.md`](01-SESSION1-TASK.md).

---

## What's built

### Dynamic per-page meta tags

| Surface | Path |
|---|---|
| Page meta hook | `src/hooks/usePageMeta.ts` (title, description, canonical, OG, Twitter, noindex) |
| Hook tests | `src/hooks/usePageMeta.test.ts` |
| JSON-LD injection hook | `src/hooks/useJsonLd.ts` |
| JSON-LD hook tests | `src/hooks/useJsonLd.test.ts` |

42 of 53 pages call `usePageMeta()`. Canonical URLs auto-set to `https://rent-a-vacation.com{path}`. `noindex` flag available for private pages (AccountSettings, AdminDashboard, ExecutiveDashboard, 404).

### Structured data (JSON-LD)

| Schema | Where |
|---|---|
| `Organization` | `index.html` base template |
| `FAQPage` | `src/pages/FAQ.tsx` |
| `BreadcrumbList` | via `src/lib/breadcrumbSchema.ts` (helper: `buildBreadcrumbJsonLd()`); used on DestinationDetail and property detail |
| Provider schemas (BudgetPlanner, CostComparator, MaintenanceFeeCalculator, ResortQuiz) | embedded for tool credibility |

### Sitemap & robots

- **`scripts/generate-sitemap.ts`** — build-time (runs `postbuild`). Combines: 17 static routes, dynamic destinations (from `src/lib/destinations.js`), active+published listings (from Supabase REST API). Output: `dist/sitemap.xml` (priorities: home 1.0, rentals/bidding/tools 0.8–0.9, faq/contact 0.6–0.7, terms/privacy 0.3).
- **`public/robots.txt`** — sitemap reference + crawler-specific rules: separate Allow blocks for Googlebot/Bingbot/DuckDuckBot/BraveBot, very restrictive default rule per ToS § 7. Disallows: `/admin`, `/owner-dashboard`, `/executive-dashboard`, `/checkout`, `/booking-success`, `/pending-approval`, `/my-bookings`, `/my-bids`, `/account`, `/api`, plus generic-bot blocks on `/listings`, `/resort/`, `/rentals`.

### URL structure

- Public pages use semantic paths: `/`, `/rentals`, `/bidding`, `/destinations`, `/calculator`, `/tools/*`, `/faq`, etc.
- **Destinations**: slug-based (`/destinations/{slug}` and `/destinations/{slug}/{city-slug}`).
- **Properties**: ID-based (`/property/{id}`) — no slug field today.
- **Resort pages**: `/resort/{id}` exists but disallowed in robots.txt for generic crawlers.

## Known gaps

1. **Server-side OG-tag rendering for social crawlers** — Facebook/Twitter/LinkedIn crawlers see only the base `index.html` template, not per-page custom OG images. Needs Vercel Edge Function or pre-rendering. **Largest remaining SEO gap.**
2. **Destination hero images** — dynamic `og:image` per destination not yet implemented.
3. **Property-detail schema** — no `Product` or `Accommodation` JSON-LD on `/property/{id}` pages.
4. **Slug field on properties** — IDs in URLs hurt long-tail SEO. Adding a slug column would enable e.g. `/property/oahu-marriott-ko-olina-2br-week-15`.
5. **JSON-LD coverage uneven** — only 6 pages explicitly call `useJsonLd()`. Most rely on the base Organization schema. Many candidate pages (rentals search, bidding, tools) could add `ItemList` / `Product` / `LocalBusiness` schemas.

## Recent shipped work

```
61e9b91 feat(seo): complete technical SEO gaps — canonical URLs, OG tags, breadcrumbs, dynamic sitemap (#229)
6b00202 docs: update session records with header redesign, tool implementations & SEO work
215e4d4 feat(ux): redesign header nav + SEO enhancements for free tools
bcf1dad feat: RAV Tools hub, Public API layer, brand naming & SEO tune-up
1c8fab9 feat: SEO optimization + calculator discoverability
b2bac10 fix(seo): remove 70% claim from index.html, PWA manifest, and README
```

Issue #229 (Session 41) was the major delivery: canonical URLs, OG tags, breadcrumbs, dynamic sitemap.

## Tests

- `src/hooks/usePageMeta.test.ts`
- `src/hooks/useJsonLd.test.ts`
- `src/lib/breadcrumbSchema.test.ts`

## Operational

- **Vercel deployment** — SPA rewrites (`vercel.json`): all routes → `/index.html`.
- **Security headers** in `vercel.json`: CSP, X-Frame-Options, HSTS, Referrer-Policy, Permissions-Policy.
- **No SSR currently** — pure client-side React + Vite. Vite's prerender plugin is available but not enabled.

## Related docs

- [`../../api/README.md`](../../api/README.md) — public API exposes structured data
- [`../functional-search-bar/README.md`](../functional-search-bar/README.md) — *(currently missing — see follow-up issue)*
- [`../../launch/`](../../launch/) — launch readiness includes SEO checks
