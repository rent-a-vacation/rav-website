<p align="center">
  <img src="public/rav-logo.svg" alt="Rent-A-Vacation" width="80" height="80" />
</p>

<h1 align="center">Rent-A-Vacation</h1>

<p align="center">
  <strong>Name Your Price. Book Your Paradise.</strong>
</p>

<p align="center">
  The first AI-powered marketplace for vacation club rentals — connecting timeshare owners with travelers through voice search, competitive bidding, and verified trust.
</p>

<p align="center">
  <a href="https://rent-a-vacation.com"><img src="https://img.shields.io/badge/Production-rent--a--vacation.com-1C7268?style=flat-square" alt="Production" /></a>
  <a href="https://rentavacation.vercel.app"><img src="https://img.shields.io/badge/Preview-rentavacation.vercel.app-6B7B85?style=flat-square" alt="Preview" /></a>
  <img src="https://img.shields.io/badge/version-0.9.0-E8703A?style=flat-square" alt="Version 0.9.0" />
  <img src="https://img.shields.io/badge/tests-574%20passing-1FA66E?style=flat-square" alt="574 Tests Passing" />
  <img src="https://img.shields.io/badge/license-proprietary-1D2E38?style=flat-square" alt="License" />
</p>

---

## Overview

Rent-A-Vacation (RAV) is a full-stack marketplace platform for the **$10.5 billion vacation ownership industry**. Timeshare owners list unused weeks at their price. Travelers search, bid, and book luxury resort stays at **20-40% below resort-direct pricing**. Every owner is verified, every payment is escrowed, and every search can be done by voice.

### The Problem

- **9.9 million U.S. families** own timeshares, paying $1,000-$3,000+/year in maintenance fees for weeks they don't use
- **Travelers** overpay for the same rooms through resort-direct bookings
- The secondary rental market is fragmented, low-trust, and has no technology leader

### The Solution

A two-sided marketplace with AI-powered discovery, competitive pricing, and built-in trust — where **owners earn** and **travelers save**.

---

## Key Features

### RAVIO — AI Vacation Concierge

**R**ent-**A**-**V**acation **I**ntelligent **O**perator. The first voice-powered vacation search in the industry.

- **Ask RAVIO** — Natural language voice search powered by VAPI (Deepgram STT + GPT-4o-mini + ElevenLabs TTS)
- **Chat with RAVIO** — Streaming text chat with clickable property cards via OpenRouter
- Understands destinations, dates, budgets, and resort preferences across **117 resorts**

### Name Your Price

Competitive bidding on any listing. Travelers make offers, owners accept, counter, or decline. Real negotiation, real savings.

### Vacation Wishes

Travelers post their dream trip parameters. Verified owners compete with personalized proposals. The traveler picks the winner — a reverse auction for travel.

### RAV SmartPrice

AI-powered fair value scoring that compares listings against similar properties by resort, unit type, and season. Every listing earns a Fair Value badge.

### RAV SmartEarn

Free public tool that shows timeshare owners exactly how many weeks they need to rent to cover their annual maintenance fees, plus projects annual rental income by brand, unit type, region, and occupancy. No account required.

### TrustShield & PaySafe

- **TrustShield** — Multi-step owner verification (identity + property ownership) before any listing goes live
- **PaySafe** — Stripe-powered escrow holds payment until confirmed check-in

### Owner's Edge

Complete owner dashboard — listings management, booking tracking, earnings analytics, pricing intelligence, portfolio overview, and Stripe Connect payouts.

### RAV Command

Executive-grade business intelligence dashboard with GMV tracking, marketplace health metrics (Liquidity Score, Bid Spread Index), and live industry news.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| **Backend** | Supabase (PostgreSQL + Row Level Security + Edge Functions + Auth) |
| **Payments** | Stripe (Checkout, Connect, Webhooks, Escrow) |
| **Voice AI** | VAPI (Deepgram STT + GPT-4o-mini + ElevenLabs TTS) |
| **Text AI** | OpenRouter (streaming chat completions) |
| **Email** | Resend (transactional + cron-triggered alerts) |
| **Analytics** | Google Analytics 4 + Sentry (error tracking + session replay) |
| **Deployment** | Vercel (frontend) + Supabase (backend + edge functions) |
| **Testing** | Vitest + Playwright + Percy (visual regression) + Qase (test management) |

---

## Platform Stats

| Metric | Count |
|--------|-------|
| Automated tests | 574 (80 test files) |
| Edge functions | 26 |
| Database migrations | 39 |
| Resorts | 117 (Hilton 62, Marriott 40, Disney 15) |
| Vacation club brands | 9 |
| Unit types | 351 |

---

## Architecture

```
src/
├── components/          # React components (shadcn/ui based)
│   ├── bidding/         # Bidding system, notifications
│   ├── booking/         # Booking flow, timeline, messaging
│   ├── owner-dashboard/ # Owner management UI
│   ├── owner/           # Owner-specific components
│   └── ui/              # shadcn/ui primitives
├── contexts/            # React contexts (auth, booking, voice, theme)
├── flows/               # Declarative flow manifests → auto-generated architecture diagrams
├── hooks/               # Custom hooks (data fetching, mutations, subscriptions)
│   ├── admin/           # Admin data hooks
│   └── owner/           # Owner data hooks
├── lib/                 # Pure utility functions (pricing, validation, formatting)
├── pages/               # Route-level page components
├── test/                # Test fixtures, helpers, mocks
└── types/               # TypeScript type definitions

supabase/
├── functions/           # 26 Deno edge functions
│   ├── _shared/         # Shared utilities (CORS, rate limiting, email)
│   └── */index.ts       # Individual functions
└── migrations/          # 39 PostgreSQL migrations (DDL + RLS + RPCs)

docs/
├── PROJECT-HUB.md       # Architectural decisions & session context
├── brand-assets/        # Brand style guide, concepts, creative copy
└── features/            # Feature-specific documentation
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating))
- **Supabase CLI** (for edge function development and migrations)

### Installation

```bash
# Clone the repository
git clone https://github.com/rent-a-vacation/rav-website.git
cd rav-website

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and API keys

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `VITE_VAPI_PUBLIC_KEY` | VAPI voice assistant key |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics 4 measurement ID |
| `VITE_SENTRY_DSN` | Sentry error tracking DSN |

---

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Vite HMR) |
| `npm run build` | Production build with type checking |
| `npm run lint` | ESLint check |
| `npm run test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run test:visual` | Run Percy visual regression tests |

### Branch Strategy

```
dev   →  Vercel Preview  →  Supabase DEV
  ↓ PR
main  →  Vercel Production  →  Supabase PROD
```

- **`dev`** — Working branch. All new code goes here first.
- **`main`** — Production branch. Protected — requires PR + CI passing.
- Never push directly to `main`.

### Commit Convention

```
type(scope): description

feat(auth): add owner verification flow
fix(pricing): correct nightly rate calculation
docs(hub): update PROJECT-HUB after session 34
test(booking): add cancellation policy tests
```

---

## Testing

574 automated tests across unit, integration, and end-to-end layers:

- **Unit tests** — Pure functions in `src/lib/` (pricing, validation, formatting, comparison)
- **Hook tests** — Data fetching and mutation hooks with mocked Supabase
- **Component tests** — Render and interaction tests for key UI components
- **E2E tests** — Playwright browser tests for critical user flows
- **Visual regression** — Percy snapshot comparisons

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run E2E
npm run test:e2e
```

---

## Deployment

### Automatic (via Git)

- Push to `dev` → Vercel creates a preview deployment against Supabase DEV
- Merge PR to `main` → Vercel auto-deploys to production against Supabase PROD

### Database Migrations

```bash
# Link to Supabase project
npx supabase link --project-ref <project-ref>

# Push migrations
npx supabase db push
```

### Edge Functions

```bash
# Deploy a specific function
npx supabase functions deploy <function-name> --project-ref <project-ref>

# Deploy all functions
npx supabase functions deploy --project-ref <project-ref>
```

---

## Brand

| Element | Value |
|---------|-------|
| **Primary Color** | Deep Teal `#1C7268` |
| **Accent Color** | Warm Coral `#E8703A` |
| **Background** | Warm Cream `#F8F6F3` |
| **Foreground** | Dark Navy `#1D2E38` |
| **Font** | [Roboto](https://fonts.google.com/specimen/Roboto) |
| **Tagline** | Name Your Price. Book Your Paradise. |

Full brand guidelines: [`docs/brand-assets/BRAND-STYLE-GUIDE.md`](docs/brand-assets/BRAND-STYLE-GUIDE.md)

---

## Project Status

**Version 0.9.0** — Pre-launch. Platform is fully built and functional. Currently in final testing and business formation phase.

### What's Built
- Complete two-sided marketplace (owner listings + traveler bidding + booking + payments)
- AI voice search and text chat (RAVIO)
- Owner dashboard with earnings, portfolio, and pricing intelligence
- Admin dashboard with approval workflows, dispute resolution, and executive analytics
- Cancellation policies, reviews, messaging, and real-time notifications
- GDPR-compliant account deletion and data export
- Rate limiting, CSP headers, and security hardening

### What's Next
- Business formation (LLC, EIN) and Stripe Tax activation
- Public beta launch
- Mobile app (Capacitor)

---

## Author

**Sujit G** ([@jisujit](https://github.com/jisujit))

Built with vision, discipline, and an obsessive attention to detail.

---

<p align="center">
  <img src="public/rav-logo.svg" alt="RAV" width="32" height="32" />
  <br />
  <sub>Rent-A-Vacation &copy; 2026. All rights reserved.</sub>
</p>
