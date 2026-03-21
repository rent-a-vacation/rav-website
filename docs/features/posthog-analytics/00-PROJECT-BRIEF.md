---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# PostHog Analytics — Project Brief

**Feature Name:** PostHog Analytics Integration
**Phase:** 20
**Status:** ⏸️ Deferred — GA4 (G-G2YCVHNS25) selected as analytics platform instead. PostHog may be revisited post-launch.
**Created:** February 21, 2026
**Migration:** None — frontend only
**Docs:** `docs/features/posthog-analytics/`

---

## Current Status

**GA4 (Measurement ID: G-G2YCVHNS25) was integrated in Session 26** as the production analytics platform, gated behind cookie consent. PostHog was considered during planning but GA4 was selected instead. This feature brief is preserved for reference if PostHog is reconsidered post-launch (e.g., for session recordings or feature flags that GA4 doesn't provide). See GitHub issue #193 for future consideration.

## Original Overview

Integrate PostHog for product analytics, session recording, feature flags, and user behavior tracking. PostHog is open-source, offers a generous free tier (1M events/month), and provides:

- **Event tracking** — page views, button clicks, search queries, bookings
- **Session recordings** — watch real user sessions to find UX issues
- **Funnels** — track search → view → book conversion
- **Feature flags** — replace DB-based feature flags with PostHog (future)
- **Web vitals** — Core Web Vitals (LCP, CLS, FID) automatically captured

---

## Setup Guide (for the owner to do manually)

### Step 1: Create PostHog Account

1. Go to [posthog.com](https://posthog.com) and sign up (free tier: 1M events/month)
2. Create a new project named "Rent-A-Vacation"
3. Choose "US Cloud" for data residency
4. Copy your **Project API Key** (starts with `phc_`)

### Step 2: Add API Key to Environment

For local development, add to `.env.local`:
```
VITE_POSTHOG_KEY=phc_your_key_here
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

For Vercel production:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `VITE_POSTHOG_KEY` = your PostHog project API key
3. Add `VITE_POSTHOG_HOST` = `https://us.i.posthog.com`
4. Redeploy

### Step 3: Verify Installation

After deploying with the code changes below:
1. Visit your site
2. Go to PostHog dashboard → Activity → Live Events
3. You should see `$pageview` events arriving in real-time
4. Click "Session Recordings" to see if recordings appear

---

## What Gets Tracked Automatically

PostHog auto-captures these without custom code:
- **Page views** — every route change
- **Clicks** — button clicks with element context
- **Form submissions** — form interactions
- **Session recordings** — full session replay (configurable)
- **Web vitals** — LCP, CLS, FID automatically

## Custom Events to Add

| Event | Where | Properties |
|-------|-------|------------|
| `search_performed` | Rentals.tsx | `{ query, filters, result_count }` |
| `listing_viewed` | PropertyDetail.tsx | `{ listing_id, brand, price, location }` |
| `booking_started` | Checkout.tsx | `{ listing_id, price }` |
| `booking_completed` | BookingSuccess.tsx | `{ booking_id, price }` |
| `voice_search_used` | useVoiceSearch.ts | `{ result_count, duration }` |
| `text_chat_used` | useTextChat.ts | `{ context, message_count }` |
| `bid_placed` | BiddingMarketplace.tsx | `{ listing_id, bid_amount }` |
| `calculator_used` | MaintenanceFeeCalculator.tsx | `{ brand, unit_type, result }` |
| `favorite_toggled` | Rentals.tsx | `{ listing_id, action: add/remove }` |

## User Identification

When a user logs in, identify them in PostHog:
```tsx
posthog.identify(user.id, {
  email: user.email,
  role: profile?.role,
  approval_status: profile?.approval_status,
});
```

When they log out:
```tsx
posthog.reset();
```

---

## File Structure

### New Files
| File | Purpose |
|------|---------|
| `src/lib/posthog.ts` | PostHog initialization + helper functions |
| `src/components/PostHogProvider.tsx` | React context provider + auto page view tracking |

### Modified Files
| File | Change |
|------|--------|
| `src/App.tsx` | Wrap with PostHogProvider |
| `src/contexts/AuthContext.tsx` | Add posthog.identify on login, posthog.reset on logout |

---

## Implementation Details

### `src/lib/posthog.ts`
```typescript
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.log('[PostHog] No API key configured — analytics disabled');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // We handle this manually in the provider
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,     // Don't record passwords/PII
      maskTextSelector: '.ph-no-capture',
    },
    persistence: 'localStorage+cookie',
    loaded: () => {
      console.log('[PostHog] Initialized');
    },
  });
}

export { posthog };
```

### `src/components/PostHogProvider.tsx`
```tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { posthog } from '@/lib/posthog';

export function PostHogPageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.VITE_POSTHOG_KEY) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
      });
    }
  }, [location.pathname]);

  return null;
}
```

---

## Success Criteria

- [ ] PostHog JS SDK installed (`posthog-js`)
- [ ] Initialization in `src/lib/posthog.ts` with env var guard
- [ ] Page view tracking on route changes
- [ ] User identification on login
- [ ] User reset on logout
- [ ] Session recording enabled (with input masking)
- [ ] Graceful no-op when `VITE_POSTHOG_KEY` is not set
- [ ] No PII captured in session recordings
- [ ] `npm run build` passes
- [ ] All existing tests pass

---

## PostHog Dashboard Setup (Manual)

After code deploys, configure these in PostHog UI:

1. **Funnel: Search → Book**
   - Step 1: `$pageview` on `/rentals`
   - Step 2: `listing_viewed`
   - Step 3: `booking_started`
   - Step 4: `booking_completed`

2. **Dashboard: Key Metrics**
   - Daily active users
   - Searches per day
   - Booking conversion rate
   - Voice vs text chat usage
   - Top destinations searched

3. **Session Recordings**
   - Enable for all users initially
   - Filter to sessions with errors for debugging
