---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Rent-A-Vacation Setup Guide

## Prerequisites

- Node.js 18+ installed
- Git access to the repository
- Supabase CLI (`npm install -g supabase` or use `npx supabase`)
- Supabase project (dev and prod)
- Vercel project

## Environment Setup

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/rent-a-vacation/rav-website.git
   cd rav-website
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://oukbxqnlxnkainnligfz.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Vercel Deployment

Add these environment variables in your Vercel project settings:

**Development/Preview:**
- `VITE_SUPABASE_URL`: `https://oukbxqnlxnkainnligfz.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: Your dev project anon key

**Production:**
- `VITE_SUPABASE_URL`: `https://xzfllqndrlmhclqfybew.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: Your prod project anon key

---

## Git Branching & Deployment Workflow

```
feature/* (optional)
    | PR
  dev   -->  Vercel Preview Deploy  -->  Supabase DEV
    | PR (release)
  main  -->  Vercel Production      -->  Supabase PROD
```

### Rules

- **`dev`** is the working branch. All new code goes here first.
- **`main`** is the production branch. Requires PR + CI passing to merge.
- **Never push directly to `main`.** Always create a PR from `dev` (or a feature branch).
- Feature branches are optional for small changes but recommended for larger work.
- Local `.env.local` points to **Supabase DEV**.
- Vercel production points to **Supabase PROD**.

### Workflow

1. Work locally on `dev` (or a feature branch off `dev`)
2. Push to `dev` -- Vercel creates a preview deploy -- test against Supabase DEV
3. When ready for production: create PR `dev` -> `main`
4. PR requires: CI passing + approval
5. Merge to `main` -- auto-deploys to Vercel production

### Commit Message Format

```
type(scope): description

feat(auth): add user approval system
fix(voice): correct quota display for tier-based limits
docs(hub): update PROJECT-HUB after session 17
test(booking): add payment flow integration tests
chore(deps): update supabase client to v2.x
```

---

## Database Setup

### Migrations

The project uses 45 migrations covering 30+ tables, managed via the Supabase CLI. Migrations live in `supabase/migrations/`.

**To apply all migrations to a linked Supabase project:**

1. Link to your target project (DEV or PROD):
   ```bash
   npx supabase link --project-ref oukbxqnlxnkainnligfz
   ```

2. Push all migrations:
   ```bash
   npx supabase db push
   ```
   > **Note:** If migrations already exist before the link, add `--include-all` on the first push.

3. After deploying to PROD, always relink back to DEV:
   ```bash
   npx supabase link --project-ref oukbxqnlxnkainnligfz
   ```

> **Important:** `npx supabase db push` does NOT accept `--project-ref` -- it always uses the currently linked project. Always verify which project is linked before pushing.

### Creating Your First Admin

After running the migrations:

1. Sign up via the app (creates a user with 'renter' role by default)
2. Go to Supabase > Table Editor > `auth.users` > Copy your user ID
3. In SQL Editor, run:
   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('YOUR_USER_ID', 'rav_owner')
   ON CONFLICT (user_id, role) DO NOTHING;
   ```

---

## User Roles

| Role | Description | Access |
|------|-------------|--------|
| `rav_owner` | RAV superuser | Full access to everything |
| `rav_admin` | RAV administrator | Full access except role management |
| `rav_staff` | RAV staff member | View/manage listings and bookings (10 operational tabs) |
| `property_owner` | Property owner | Manage own properties and listings |
| `renter` | Renter (default) | Browse and book listings |

---

## Authentication

### Google OAuth Setup

1. Go to Google Cloud Console > APIs & Services > Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized origins:
   - `http://localhost:8080` (local dev)
   - `https://your-vercel-domain.vercel.app`
   - `https://rent-a-vacation.com` (production)
4. Add redirect URLs:
   - `https://oukbxqnlxnkainnligfz.supabase.co/auth/v1/callback` (dev)
   - `https://xzfllqndrlmhclqfybew.supabase.co/auth/v1/callback` (prod)
5. In Supabase Dashboard > Authentication > Providers > Google:
   - Enable Google provider
   - Add Client ID and Client Secret

---

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/            # React contexts (Auth, Booking, etc.)
├── flows/               # Flow manifests for architecture diagrams
├── hooks/               # Custom React hooks
│   ├── admin/           # Admin-specific hooks
│   └── owner/           # Owner-specific hooks
├── lib/                 # Pure utility functions & business logic
├── pages/               # Page components
└── types/
    └── database.ts      # TypeScript database types

supabase/
├── functions/           # 27 Edge Functions (Deno)
│   ├── _shared/         # Shared utilities (CORS, auth, etc.)
│   └── */index.ts       # Individual function handlers
└── migrations/          # 45 SQL migration files

docs/                    # Project documentation
e2e/                     # Playwright E2E tests
```

> For the full project architecture, component hierarchy, and system diagrams, see [docs/ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Database Schema

The database consists of 30+ tables across 45 migrations, including:

- **profiles**: User profile data (linked to auth.users)
- **user_roles**: User role assignments (RBAC)
- **properties / resorts**: Vacation club property and resort data
- **listings / listing_bids**: Available rental periods and bidding
- **bookings / escrow_transactions**: Rental bookings and payment escrow
- **travel_requests**: Traveler demand signals
- **reviews**: Guest and owner reviews
- **messages / listing_inquiries**: Messaging and pre-booking inquiries
- **saved_searches**: Saved search alerts with price tracking
- **referral_codes / referrals**: Referral program
- **api_keys / api_request_log**: Public API key infrastructure
- **voice_search_logs / voice_user_overrides**: Voice assistant tracking
- **cancellation_requests / disputes**: Cancellation and dispute management

### Key Features

- **Row Level Security (RLS)**: All tables have RLS policies
- **Auto-created profiles**: Trigger creates profile on signup
- **Default role**: New users get 'renter' role automatically
- **Security definer functions**: Prevent RLS recursion
- **PostgREST FK pattern**: User-related FK columns reference `profiles(id)` (not `auth.users(id)`)

---

## Testing

The project uses **Vitest** for unit/integration tests and **Playwright** for E2E tests.

### Running Tests

```bash
npm run test              # Vitest unit + integration (watch mode)
npm run test:p0           # 97 critical-path P0 tests (~2s)
npm run test:coverage     # With coverage report
npm run test:e2e          # Playwright E2E
npm run test:e2e:headed   # Playwright with browser visible
```

### Test Stats

- **771 automated tests** across 99 test files
- **97 P0 critical-path tests** tagged for fast CI feedback

### Test File Locations

```
src/lib/*.test.ts              # Unit tests for pure functions
src/hooks/*.test.ts            # Integration tests for hooks
src/hooks/**/__tests__/*.ts    # Integration tests for nested hooks
src/contexts/*.test.tsx        # Integration tests for contexts
e2e/smoke/                     # Playwright E2E smoke tests
e2e/visual/                    # Percy visual regression tests
```

### Test Helpers

```
src/test/fixtures/users.ts        # mockUser(), mockSession(), mockProfile()
src/test/fixtures/listings.ts     # Listing fixtures
src/test/fixtures/memberships.ts  # Membership tier fixtures
src/test/helpers/render.tsx       # createHookWrapper(), renderWithProviders()
src/test/helpers/supabase-mock.ts # createSupabaseMock(), emptyResponse()
```

### Coverage Thresholds (enforced in CI)

- Statements: 25%
- Branches: 25%
- Functions: 30%
- Lines: 25%

---

## Edge Functions — Local Development

The project includes 27 Supabase Edge Functions (Deno runtime).

### Serving Locally

```bash
npx supabase functions serve
```

This starts all edge functions locally. They will be available at `http://localhost:54321/functions/v1/<function-name>`.

### Serving a Single Function

```bash
npx supabase functions serve <function-name> --env-file .env.local
```

### Deploying to Supabase

```bash
npx supabase functions deploy <function-name> --project-ref <ref>
```

### Setting Secrets

```bash
npx supabase secrets set KEY=value --project-ref <ref>
```

> **Note:** Edge function imports use the `npm:` prefix (Deno-native pattern). Do not change these to Node-style imports.

---

## CI/CD Pipeline

```
dev branch  -->  Vercel Preview  -->  Supabase Dev
main branch -->  Vercel Production  -->  Supabase Prod
```

CI triggers on push to `main` and PRs targeting `main`. The pipeline runs:
1. `npm run lint` (must pass or test jobs are skipped)
2. `npm run test` (Vitest)
3. `npm run build` (TypeScript + Vite)

---

## Typst (Document Generation)

[Typst](https://typst.app/) is used to generate branded PDF documents (e.g., QA Playbook).

### Install

```bash
winget install --id Typst.Typst       # Windows
brew install typst                     # macOS
```

### Compile a Document

```bash
typst compile docs/exports/QA-PLAYBOOK.typ docs/exports/QA-PLAYBOOK.pdf
```

### Brand Template

The reusable brand template lives at `docs/exports/rav-brand-template.typ`. Import it in any new Typst document:

```typ
#import "rav-brand-template.typ": *
```

---

## Troubleshooting

### "Missing Supabase environment variables" warning
Ensure your `.env.local` file exists and contains valid Supabase credentials.

### RLS policy errors
Check that you're authenticated and have the correct role for the operation.

### Profile not created after signup
The `on_auth_user_created` trigger should auto-create profiles. Check Supabase logs if issues occur.

### Supabase CLI "migrations already applied" error
If you see this when pushing, the linked project already has those migrations. Use `--include-all` on the first push after linking.
