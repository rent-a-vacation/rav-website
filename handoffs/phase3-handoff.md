---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Phase 3 Handoff: Voice Usage Limits

## Status: COMPLETE

## What Was Built

### Database Layer (`supabase/migrations/008_voice_usage_limits.sql`)
- **voice_search_usage** table with `UNIQUE(user_id, search_date)` constraint
- Indexes for fast lookups by user+date and by date
- PostgreSQL functions:
  - `increment_voice_search_count(_user_id)` — upsert daily counter
  - `get_voice_search_count(_user_id)` — returns today's count
  - `can_use_voice_search(_user_id)` — checks quota (10/day, RAV unlimited)
  - `get_voice_searches_remaining(_user_id)` — returns remaining (999 for RAV)
  - `cleanup_old_voice_usage()` — deletes records >90 days old
- RLS policies: users see own usage, RAV team sees all
- Auto-update trigger for `updated_at`

### Frontend Hooks
- **`src/hooks/useVoiceQuota.ts`** — fetches remaining quota via `get_voice_searches_remaining` RPC
- **`src/hooks/useSystemSettings.ts`** — fetches/updates system settings (approval toggle)
- **`src/hooks/useVoiceSearch.ts`** — modified to:
  - Check `canSearch` before starting VAPI call
  - Show "Daily voice search limit reached" error when quota exhausted
  - Call `increment_voice_search_count` after successful search
  - Expose `quota` object (remaining, isUnlimited, canSearch, loading)

### UI Components
- **`src/components/VoiceQuotaIndicator.tsx`** — badge showing remaining searches
  - Destructive variant at 0, outline at <=3, secondary otherwise
  - Shows infinity icon + "Unlimited searches" for RAV team
  - Skeleton loading state
- **`src/components/admin/SystemSettings.tsx`** — admin settings panel
  - Toggle for "Require admin approval for new users"
  - Display of voice search limit info (10/day, RAV unlimited)

### Admin Dashboard Updates (`src/pages/AdminDashboard.tsx`)
- Added "Settings" tab with gear icon (12th tab, grid-cols-12)
- Renders `SystemSettings` component

### Rentals Page Updates (`src/pages/Rentals.tsx`)
- Added `VoiceQuotaIndicator` below search bar (visible when authenticated)

### Type Updates (`src/types/database.ts`)
- Added `voice_search_usage` table types (Row/Insert/Update)
- Added function types: `increment_voice_search_count`, `get_voice_search_count`, `can_use_voice_search`, `get_voice_searches_remaining`

## Files Created
- `supabase/migrations/008_voice_usage_limits.sql`
- `src/hooks/useVoiceQuota.ts`
- `src/hooks/useSystemSettings.ts`
- `src/components/VoiceQuotaIndicator.tsx`
- `src/components/admin/SystemSettings.tsx`

## Files Modified
- `src/hooks/useVoiceSearch.ts`
- `src/pages/Rentals.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/types/database.ts`

## Deployment Steps
1. `npx supabase link --project-ref oukbxqnlxnkainnligfz`
2. `npx supabase db push --include-all`
3. `npm run build` (verified passing)

## Key Design Decisions
- Daily limit of 10 hardcoded in PostgreSQL functions (not configurable via UI yet — info-only display in admin)
- RAV team returns 999 from `get_voice_searches_remaining` (sentinel value for "unlimited")
- Counter increments only after successful search (not on VAPI call start)
- Quota refreshes automatically after each search via `refreshQuota()`
- Used `update_updated_at_column()` (correct function name from existing migrations, not `update_updated_at()` as in task doc)
