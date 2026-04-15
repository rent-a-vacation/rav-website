---
last_updated: "2026-04-15T11:10:55"
change_ref: "bc1bafd"
change_type: "session-48-docs-refresh"
status: "active"
---
# Rent-A-Vacation Brand Style Guide

> Use this guide to maintain consistent branding across all marketing materials,
> slide decks, social media, Canva templates, Figma designs, and Opal campaigns.

---

## Brand Identity

| Element | Value |
|---------|-------|
| **Brand Name** | Rent-A-Vacation |
| **Short Name** | RAV |
| **Tagline** | Name Your Price. Book Your Paradise. |
| **Domain** | rent-a-vacation.com |
| **Category** | Travel / Vacation Rental Marketplace |

---

## Logo

### Primary Logo
- **File:** `public/rav-logo.svg` (vector, scalable)
- **Design:** Stylized letter **"R"** in white on a teal rounded-rectangle background
- **Background shape color:** `#1C7268` (Deep Teal)
- **Letter color:** `#FFFFFF` (White)
- **Dark accent detail:** `#1D2E38` (Dark Navy)

### Logo Usage Rules
- Minimum clear space: equal to the height of the "R" letter stroke
- Minimum size: 32px height for digital, 0.5 inch for print
- Always use the SVG version for digital; export PNG at 2x for print
- Never stretch, rotate, or recolor the logo
- On dark backgrounds, the teal background provides sufficient contrast
- On teal backgrounds, use a white-only version of the "R" without the background shape

### App Icons (pre-generated)
| Size | File | Use |
|------|------|-----|
| 16x16 | `public/favicon-16x16.png` | Browser tab |
| 32x32 | `public/favicon-32x32.png` | Browser tab (retina) |
| 180x180 | `public/apple-touch-icon.png` | iOS home screen |
| 192x192 | `public/android-chrome-192x192.png` | Android home screen |
| 512x512 | `public/android-chrome-512x512.png` | Android splash / PWA |
| ICO | `public/favicon.ico` | Legacy browsers |

---

## Color Palette

### Primary Colors

| Role | Name | HEX | RGB | HSL | Tailwind Token |
|------|------|-----|-----|-----|----------------|
| **Primary** | Deep Teal | `#1C7268` | 28, 114, 104 | 175, 60%, 28% | `primary` |
| **Accent** | Warm Coral | `#E8703A` | 232, 112, 58 | 18, 85%, 58% | `accent` |
| **Background** | Warm Cream | `#F8F6F3` | 248, 246, 243 | 45, 25%, 97% | `background` |
| **Foreground** | Dark Navy | `#1D2E38` | 29, 46, 56 | 200, 25%, 15% | `foreground` |

### Secondary Colors

| Role | Name | HEX | RGB | HSL | Tailwind Token |
|------|------|-----|-----|-----|----------------|
| **Secondary** | Soft Sand | `#F0EBE3` | 240, 235, 227 | 40, 30%, 94% | `secondary` |
| **Muted** | Warm Gray | `#EAE8E4` | 234, 232, 228 | 45, 15%, 92% | `muted` |
| **Muted Text** | Slate | `#6B7B85` | 107, 123, 133 | 200, 10%, 45% | `muted-foreground` |

### Status Colors

| Role | Name | HEX | RGB | HSL | Use |
|------|------|-----|-----|-----|-----|
| **Success** | Emerald | `#1FA66E` | 31, 166, 110 | 160, 60%, 40% | Confirmations, approvals |
| **Warning** | Amber | `#F59E0B` | 245, 158, 11 | 38, 92%, 50% | Alerts, pending states |
| **Destructive** | Red | `#E53E3E` | 229, 62, 62 | 0, 84%, 60% | Errors, deletions |
| **White** | Pure White | `#FFFFFF` | 255, 255, 255 | 0, 0%, 100% | Cards, overlays |

### Gradients

| Name | CSS | Use |
|------|-----|-----|
| **Hero Gradient** | `linear-gradient(135deg, #1C7268E6 0%, #1A3340D9 100%)` | Hero sections, headers |
| **Hero Overlay** | `linear-gradient(180deg, #0000004D 0%, #00000080 100%)` | Text readability on images |

### Color Pairing Guidelines
- **Primary + White:** Navigation bars, CTAs, headers
- **Accent + White:** Action buttons, highlights, badges
- **Background + Foreground:** Body text on page background
- **Primary + Accent:** Use sparingly — accent for emphasis within teal layouts
- **Never:** Primary on Accent directly (poor contrast)

---

## Typography

### Font Family
- **Primary Font:** [Roboto](https://fonts.google.com/specimen/Roboto)
- **Fallback:** `sans-serif`
- **Google Fonts import:** `Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900`

### Type Scale

| Element | Weight | Size | Use |
|---------|--------|------|-----|
| **H1 / Hero Title** | Bold (700) | 48px / 3rem | Landing page hero |
| **H2 / Section Title** | Bold (700) | 36px / 2.25rem | Section headers |
| **H3 / Card Title** | Medium (500) | 24px / 1.5rem | Card headings |
| **H4 / Subtitle** | Medium (500) | 20px / 1.25rem | Subsections |
| **Body** | Regular (400) | 16px / 1rem | Paragraphs |
| **Body Small** | Regular (400) | 14px / 0.875rem | Captions, metadata |
| **Button** | Medium (500) | 16px / 1rem | CTA buttons |
| **Label** | Medium (500) | 12px / 0.75rem | Form labels, tags |

### Line Heights
- **Headings:** 1.2 (tight)
- **Body:** 1.6 (comfortable reading)
- **UI elements:** 1.4

---

## Spacing & Layout

| Token | Value | Use |
|-------|-------|-----|
| **Border radius** | 12px (0.75rem) | Cards, buttons, inputs |
| **Container max-width** | 1400px | Page content area |
| **Container padding** | 32px (2rem) | Side padding |
| **Card shadow** | `0 4px 20px -4px rgba(29,46,56,0.1)` | Default card |
| **Card shadow (hover)** | `0 12px 40px -8px rgba(29,46,56,0.15)` | Hovered card |

---

## Design Tokens for Canva / Figma

### Quick-Copy Color Codes (for Canva color picker)

```
Primary Teal:    #1C7268
Accent Coral:    #E8703A
Background:      #F8F6F3
Dark Navy:       #1D2E38
Soft Sand:       #F0EBE3
Success Green:   #1FA66E
Warning Amber:   #F59E0B
White:           #FFFFFF
```

### Figma Variables (recommended setup)

```
Brand/Primary         → #1C7268
Brand/Accent          → #E8703A
Brand/Background      → #F8F6F3
Brand/Foreground      → #1D2E38
Brand/Secondary       → #F0EBE3
Brand/Muted           → #EAE8E4
Brand/MutedText       → #6B7B85
Status/Success        → #1FA66E
Status/Warning        → #F59E0B
Status/Error          → #E53E3E
```

---

## Photography & Imagery

### Style
- **Warm, inviting** — natural lighting, golden hour preferred
- **Aspirational but authentic** — real vacation properties, not overly staged
- **People optional** — when included, show diverse travelers enjoying experiences
- **Color temperature:** Warm tones that complement the teal/coral palette

### Image Sources
- Unsplash (currently used for property images)
- Prioritize images featuring: beaches, resorts, pools, tropical settings, family travel

### Overlay Treatment
- Apply hero gradient overlay on full-bleed images for text readability
- Use `rgba(0,0,0,0.3)` to `rgba(0,0,0,0.5)` overlays on background images

---

## Voice & Tone

| Context | Tone | Example |
|---------|------|---------|
| **Headlines** | Bold, aspirational | "Name Your Price. Book Your Paradise." |
| **Body copy** | Friendly, helpful | "Browse hundreds of vacation rentals..." |
| **CTAs** | Direct, action-oriented | "Start Browsing", "List Your Property" |
| **Error messages** | Empathetic, solution-focused | "We couldn't find that page. Try searching instead." |
| **Success messages** | Celebratory, warm | "Your booking request has been sent!" |

### Key Phrases
- "Name Your Price" — the bidding/negotiation value proposition (primary differentiator)
- "Book Your Paradise" — the end goal for travelers
- "Rent-A-Vacation" — always hyphenated, title case
- "RAV" — acceptable abbreviation in informal contexts

### Session 52 Marketplace Terminology Lock (April 15, 2026)

The marketplace uses **three nouns only** in all user-facing copy: **Listing**, **Wish**, **Offer**. "Offer" replaces both "Bid" and "Proposal" in UI. The "RAV" prefix is dropped from transactional nouns and CTAs. See `BRAND-LOCK.md` Sections 8 + 9 for the full naming framework.

| Old Name | Canonical Name | Notes |
|----------|---------------|-------|
| Vacation Wishes / RAV Wishes | **Wish / Wishes** | Drop "RAV" prefix; hashtag is `#PostAWish` |
| Bid / Proposal (UI) | **Offer** | Single noun in UI for both directions; DB tables (`listing_bids`, `travel_proposals`) unchanged |
| Make a RAV Offer | **Make an Offer** | Transactional CTAs use plain language |
| Make a Wish / Make a RAV Wish | **Post a Wish** | Consistent verb; no RAV prefix |
| Name Your Price + Make a Wish (separate nav links) | **Marketplace** (single nav link) | Role-aware default tab inside (renter→Listings, owner→Wishes) |
| /bidding (route) | **/marketplace** | /bidding redirects |
| Owner's Edge / RAV Edge | **My Rentals** | Owner dashboard nav (mirrors "My Trips" for renters) |
| RAV Command | **RAV Insights** | Executive dashboard — self-descriptive BI |
| Admin Dashboard | **RAV Ops** | Admin operations — self-descriptive |
| Browse Deals | **Browse RAV Deals** | New `RAV Deals` distressed-inventory surface (platform-branded — keeps RAV) |
| Explore (nav) | **Browse Rentals** | Plain-language nav |

**Naming rule:** RAV-prefix for platform-branded surfaces (RAV Insights, RAV Ops, RAV Smart[X], RAV Deals, RAVIO); plain nouns for marketplace mechanics (Listing, Wish, Offer, Marketplace); plain language for customer nav (Marketplace, My Trips, My Rentals, Browse Rentals); CompoundName for trust layer (TrustShield, PaySafe, ResortIQ).

**The brand slogan "Name Your Price. Book Your Paradise."** remains the master hero tagline (it describes the *mechanic* — you name a price via an Offer). It is no longer a header nav label.

### Messaging Authority
> **All messaging claims, feature ordering, savings numbers, and feature names must align with `docs/brand-assets/BRAND-LOCK.md`.** When in doubt, the Brand Lock is the source of truth.

---

## Slide Deck Guidelines

### Slide Backgrounds
1. **Title slides:** Deep Teal (`#1C7268`) background, white text
2. **Content slides:** Warm Cream (`#F8F6F3`) background, Dark Navy text
3. **Accent slides:** White background with teal header bar
4. **Image slides:** Full-bleed photo with gradient overlay

### Slide Layout Principles
- Logo in top-left or bottom-right corner
- Max 6 bullet points per slide
- Use Accent Coral for emphasis/highlights only
- Charts/graphs use Primary Teal as the main data color, Coral for secondary

---

## Asset Checklist for New Marketing Materials

When creating any new branded material, ensure:

- [ ] Logo present (SVG or high-res PNG)
- [ ] Primary Teal (`#1C7268`) used for headers/CTAs
- [ ] Accent Coral (`#E8703A`) used sparingly for emphasis
- [ ] Background is Warm Cream (`#F8F6F3`) or White
- [ ] Font is Roboto (or closest available equivalent)
- [ ] Tagline included where appropriate
- [ ] Photography has warm color treatment
- [ ] Sufficient contrast (4.5:1 minimum for body text)
