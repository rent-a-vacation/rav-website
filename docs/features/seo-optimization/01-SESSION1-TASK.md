---
last_updated: "2026-04-03T15:20:24"
change_ref: "fd388ad"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 1: SEO Optimization — Build It

**Feature:** SEO Optimization
**Session:** 1 of 1
**Agent Role:** Frontend Engineer
**Duration:** ~2 hours
**Prerequisites:** Read `00-PROJECT-BRIEF.md` before writing code

---

## Task 1: Install react-helmet-async

```bash
npm install react-helmet-async
```

---

## Task 2: Create SEOHead Component

Create `src/components/SEOHead.tsx`:

```tsx
import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
}

const SITE_NAME = "Rent-A-Vacation";
const BASE_URL = "https://rent-a-vacation.com";

export function SEOHead({ title, description, path, ogImage, noindex, jsonLd }: SEOHeadProps) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = `${BASE_URL}${path}`;
  const image = ogImage || `${BASE_URL}/rav-logo.png`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
```

---

## Task 3: Wrap App with HelmetProvider

In `src/App.tsx`, add the provider:

```tsx
import { HelmetProvider } from "react-helmet-async";

// Wrap the entire app:
const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      {/* ... rest of app ... */}
    </QueryClientProvider>
  </HelmetProvider>
);
```

---

## Task 4: Add SEOHead to All Public Pages

Add `<SEOHead>` as the first child inside each page's return JSX. Here are the exact values for each page:

### Index.tsx
```tsx
<SEOHead
  title="Rent-A-Vacation | Where Luxury Becomes Affordable"
  description="Name Your Price. Book Your Paradise. Rent vacation club and timeshare weeks directly from owners at 20-40% off resort rates."
  path="/"
/>
```

### Rentals.tsx
```tsx
<SEOHead
  title="Browse Vacation Rentals"
  description="Search and book timeshare and vacation club rental weeks from verified owners. Hilton, Marriott, Disney, Wyndham and more."
  path="/rentals"
/>
```

### PropertyDetail.tsx (DYNAMIC — use property data)
```tsx
<SEOHead
  title={`${displayName} in ${location}`}
  description={`Book ${displayName} — ${property.bedrooms} bedroom, sleeps ${property.sleeps}. ${nights} nights from $${listing.final_price.toLocaleString()}.`}
  path={`/property/${id}`}
  ogImage={primaryImage || undefined}
/>
```
Note: Extract these values from the existing component state/props. The exact variable names depend on how PropertyDetail.tsx structures its data — read the file first and use whatever variable names are already in scope.

### HowItWorksPage.tsx
```tsx
<SEOHead
  title="How It Works"
  description="Learn how Rent-A-Vacation connects timeshare owners with travelers. List your property or find luxury vacation rentals at 20-40% off resort rates."
  path="/how-it-works"
/>
```

### Destinations.tsx
```tsx
<SEOHead
  title="Vacation Destinations"
  description="Browse top vacation destinations with timeshare and vacation club rentals. Find your perfect getaway in Hawaii, Florida, Mexico and more."
  path="/destinations"
/>
```

### FAQ.tsx
```tsx
<SEOHead
  title="Frequently Asked Questions"
  description="Get answers about renting vacation club and timeshare weeks on Rent-A-Vacation. Booking, payments, cancellations, and more."
  path="/faq"
  jsonLd={{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [] // Populate with actual FAQ Q&A pairs if available in the component
  }}
/>
```

### BiddingMarketplace.tsx
```tsx
<SEOHead
  title="Bidding Marketplace"
  description="Place bids on vacation rentals or post travel requests. Find the best deals through our unique bidding system."
  path="/bidding"
/>
```

### Terms.tsx
```tsx
<SEOHead title="Terms of Service" description="Terms of Service for using the Rent-A-Vacation platform." path="/terms" />
```

### Privacy.tsx
```tsx
<SEOHead title="Privacy Policy" description="Privacy Policy for Rent-A-Vacation. How we collect, use, and protect your data." path="/privacy" />
```

### Contact.tsx
```tsx
<SEOHead title="Contact Us" description="Get in touch with the Rent-A-Vacation team. We're here to help with questions about renting or listing vacation properties." path="/contact" />
```

### UserGuide.tsx
```tsx
<SEOHead title="User Guide" description="Complete guide to using Rent-A-Vacation. Learn how to search, book, list properties, and manage your account." path="/user-guide" />
```

### Login.tsx
```tsx
<SEOHead title="Sign In" description="Sign in to your Rent-A-Vacation account to manage bookings, listings, and favorites." path="/login" />
```

### Signup.tsx
```tsx
<SEOHead title="Create Account" description="Join Rent-A-Vacation to book luxury vacation rentals or list your timeshare weeks." path="/signup" />
```

### NotFound.tsx
```tsx
<SEOHead title="Page Not Found" description="The page you're looking for doesn't exist." path="/404" noindex />
```

### MaintenanceFeeCalculator.tsx (if it exists by this point)
```tsx
<SEOHead
  title="Timeshare Maintenance Fee Calculator"
  description="Calculate how many weeks you need to rent your timeshare to cover annual maintenance fees. Free tool for Hilton, Marriott, Disney, Wyndham owners."
  path="/calculator"
/>
```

---

## Task 5: Create Sitemap

Create `public/sitemap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://rent-a-vacation.com/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://rent-a-vacation.com/rentals</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://rent-a-vacation.com/bidding</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>https://rent-a-vacation.com/destinations</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://rent-a-vacation.com/how-it-works</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://rent-a-vacation.com/calculator</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://rent-a-vacation.com/faq</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>
  <url><loc>https://rent-a-vacation.com/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://rent-a-vacation.com/user-guide</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>https://rent-a-vacation.com/terms</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>https://rent-a-vacation.com/privacy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
</urlset>
```

---

## Task 6: Update robots.txt

Update `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://rent-a-vacation.com/sitemap.xml
```

---

## Deliverables Checklist

- [ ] `react-helmet-async` installed
- [ ] `SEOHead` component created
- [ ] `HelmetProvider` wrapping App
- [ ] 15+ pages have unique `<SEOHead>` with title + description
- [ ] PropertyDetail has dynamic title from property data
- [ ] Canonical URLs on all pages
- [ ] NotFound has noindex meta
- [ ] FAQ has FAQPage JSON-LD (at minimum the schema structure)
- [ ] `sitemap.xml` created in public/
- [ ] `robots.txt` updated with Sitemap reference
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] All existing tests pass

## Handoff

Create `docs/features/seo-optimization/handoffs/session1-handoff.md`:
- List of all pages updated with SEOHead
- Any pages skipped and why
- Build/test results
