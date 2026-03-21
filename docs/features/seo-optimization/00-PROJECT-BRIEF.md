---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# SEO Optimization — Project Brief

**Feature Name:** SEO Optimization (react-helmet-async + Sitemap + JSON-LD)
**Phase:** 19
**Status:** 🟢 ~95% Complete (Sessions 17 + 41)
**Done:** `usePageMeta` hook (extended with canonical/OG/noindex), `useJsonLd` hook, `breadcrumbSchema` utility, JSON-LD structured data (Organization, HowTo, ItemList, FAQPage, BreadcrumbList, Product), dynamic `sitemap.xml` (build-time), `robots.txt`, per-page canonical URLs, per-page OG tags
**Remaining:** Server-side OG tags for social crawlers (Vercel Middleware), destination hero images, migrate legacy JSON-LD pages to useJsonLd hook
**Created:** February 21, 2026
**Migration:** None — frontend only
**Docs:** `docs/features/seo-optimization/`

---

## Problem

The platform is a client-side SPA where every page serves identical meta tags from `index.html`. Google sees the same title ("Rent-A-Vacation | Where Luxury Becomes Affordable") for every route. No sitemap exists. No canonical URLs. Property detail pages can't customize their og:image for social sharing.

**Current SEO Grade: C+** — good homepage meta/OG tags and JSON-LD Organization schema exist, but no per-page differentiation.

---

## What's Already In Place

- Homepage meta tags (title, description, og:*, twitter:*) in `index.html`
- JSON-LD Organization schema in `index.html`
- robots.txt (permissive, allows all crawlers)
- PWA manifest with icons
- Good image alt text coverage (~95%)

---

## What This Phase Delivers

### 1. react-helmet-async — Dynamic Head Tags

Install `react-helmet-async` and add `<HelmetProvider>` to `App.tsx`. Then add per-page `<Helmet>` blocks:

| Page | Title | Description |
|------|-------|-------------|
| `/` (Index) | Rent-A-Vacation \| Where Luxury Becomes Affordable | Name Your Price. Book Your Paradise... |
| `/rentals` | Browse Vacation Rentals \| Rent-A-Vacation | Search timeshare and vacation club rentals... |
| `/property/:id` | {PropertyName} in {Location} \| Rent-A-Vacation | Book {PropertyName} — {bedrooms}BR, sleeps {guests}... |
| `/calculator` | Timeshare Maintenance Fee Calculator \| Rent-A-Vacation | Calculate how many weeks to rent... |
| `/bidding` | Bidding Marketplace \| Rent-A-Vacation | Place bids on vacation rentals... |
| `/how-it-works` | How It Works \| Rent-A-Vacation | Learn how to rent or list... |
| `/destinations` | Vacation Destinations \| Rent-A-Vacation | Browse top vacation destinations... |
| `/faq` | FAQ \| Rent-A-Vacation | Frequently asked questions... |
| `/terms` | Terms of Service \| Rent-A-Vacation | ... |
| `/privacy` | Privacy Policy \| Rent-A-Vacation | ... |
| `/contact` | Contact Us \| Rent-A-Vacation | ... |
| `/user-guide` | User Guide \| Rent-A-Vacation | ... |
| `/login` | Sign In \| Rent-A-Vacation | ... |
| `/signup` | Create Account \| Rent-A-Vacation | ... |

Each page also gets:
- `<link rel="canonical" href="https://rent-a-vacation.com{path}" />`
- Dynamic og:title and og:description matching the page title/description

### 2. Sitemap Generation

Create a static `public/sitemap.xml` with all public routes. Update `robots.txt` to reference it.

### 3. Enhanced JSON-LD Schemas

Add page-level structured data:
- **FAQPage** schema on `/faq`
- **WebApplication** schema on `/calculator`
- **BreadcrumbList** on key pages

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `src/components/SEOHead.tsx` | Reusable Helmet wrapper component |
| `public/sitemap.xml` | Static sitemap for search engines |

### Modified Files
| File | Change |
|------|--------|
| `src/App.tsx` | Wrap with `<HelmetProvider>` |
| `src/pages/Index.tsx` | Add `<SEOHead>` |
| `src/pages/Rentals.tsx` | Add `<SEOHead>` |
| `src/pages/PropertyDetail.tsx` | Add dynamic `<SEOHead>` with property data |
| `src/pages/HowItWorksPage.tsx` | Add `<SEOHead>` |
| `src/pages/Destinations.tsx` | Add `<SEOHead>` |
| `src/pages/FAQ.tsx` | Add `<SEOHead>` + FAQPage JSON-LD |
| `src/pages/Terms.tsx` | Add `<SEOHead>` |
| `src/pages/Privacy.tsx` | Add `<SEOHead>` |
| `src/pages/Contact.tsx` | Add `<SEOHead>` |
| `src/pages/UserGuide.tsx` | Add `<SEOHead>` |
| `src/pages/Login.tsx` | Add `<SEOHead>` |
| `src/pages/Signup.tsx` | Add `<SEOHead>` |
| `src/pages/BiddingMarketplace.tsx` | Add `<SEOHead>` |
| `src/pages/NotFound.tsx` | Add `<SEOHead>` with noindex |
| `public/robots.txt` | Add Sitemap reference |

---

## Success Criteria

- [ ] Each public page has a unique `<title>` tag
- [ ] Each public page has a unique `<meta name="description">`
- [ ] Each public page has matching og:title and og:description
- [ ] `/property/:id` shows dynamic property name in title
- [ ] Canonical URLs set on all public pages
- [ ] sitemap.xml exists with all public routes
- [ ] robots.txt references sitemap.xml
- [ ] `/faq` has FAQPage JSON-LD schema
- [ ] 404 page has `<meta name="robots" content="noindex">`
- [ ] `npm run build` passes
- [ ] All existing tests pass
