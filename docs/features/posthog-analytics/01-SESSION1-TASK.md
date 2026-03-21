---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 1: PostHog Analytics — Build It

**Feature:** PostHog Analytics Integration
**Session:** 1 of 1
**Agent Role:** Frontend Engineer
**Duration:** ~1 hour
**Prerequisites:** Read `00-PROJECT-BRIEF.md`

---

## Task 1: Install PostHog JS SDK

```bash
npm install posthog-js
```

---

## Task 2: Create PostHog Init Module

Create `src/lib/posthog.ts`:

```typescript
import posthog from 'posthog-js';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string) || 'https://us.i.posthog.com';

export function initPostHog() {
  if (!POSTHOG_KEY) {
    console.log('[PostHog] No API key — analytics disabled');
    return;
  }

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '.ph-no-capture',
    },
    persistence: 'localStorage+cookie',
  });
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.capture(event, properties);
}

export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  if (!POSTHOG_KEY) return;
  posthog.identify(userId, traits);
}

export function resetUser() {
  if (!POSTHOG_KEY) return;
  posthog.reset();
}

export { posthog };
```

---

## Task 3: Create Page View Tracker Component

Create `src/components/PostHogPageViewTracker.tsx`:

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

## Task 4: Initialize PostHog in main.tsx

In `src/main.tsx`, add PostHog init before React renders:

```tsx
import { initPostHog } from '@/lib/posthog';

initPostHog();

// ... existing ReactDOM.createRoot(...)
```

---

## Task 5: Add Page View Tracker to App.tsx

In `src/App.tsx`, add the tracker inside BrowserRouter (next to AuthEventHandler):

```tsx
import { PostHogPageViewTracker } from '@/components/PostHogPageViewTracker';

// Inside BrowserRouter:
<BrowserRouter>
  <AuthEventHandler />
  <PostHogPageViewTracker />
  <Routes>
    {/* ... */}
  </Routes>
</BrowserRouter>
```

---

## Task 6: User Identification in AuthContext

In `src/contexts/AuthContext.tsx`, add PostHog identification:

```tsx
import { identifyUser, resetUser } from '@/lib/posthog';

// After successful login / session restore (where user is set):
// Find where `setUser(user)` or `onAuthStateChange` fires with a valid user
// Add:
identifyUser(user.id, {
  email: user.email,
  created_at: user.created_at,
});

// On logout (where signOut is called):
// Add:
resetUser();
```

Important: Read AuthContext.tsx carefully first. Find the exact locations where:
1. A user session is established (onAuthStateChange → SIGNED_IN or INITIAL_SESSION)
2. The user logs out (signOut function)

Add `identifyUser()` and `resetUser()` calls at those exact points.

---

## Task 7: Add Key Custom Events

Add event tracking to these files (import `trackEvent` from `@/lib/posthog`):

### Rentals.tsx — Search performed
In the existing search/filter logic, after filtering:
```tsx
// Inside the filteredListings useMemo or after filter state changes
// Debounce this so it doesn't fire on every keystroke — fire on Search button click
trackEvent('search_performed', {
  query: searchQuery,
  has_date_filter: !!dateRange?.from,
  result_count: filteredListings.length,
});
```

### PropertyDetail.tsx — Listing viewed
```tsx
// On mount or when listing data loads:
useEffect(() => {
  if (listing) {
    trackEvent('listing_viewed', {
      listing_id: listing.id,
      brand: listing.property?.brand,
      price: listing.final_price,
      location: getListingLocation(listing),
    });
  }
}, [listing?.id]);
```

Only add these if it's straightforward — don't over-engineer. The auto-capture + page views cover 80% of analytics needs.

---

## Deliverables Checklist

- [ ] `posthog-js` installed
- [ ] `src/lib/posthog.ts` created with init, trackEvent, identifyUser, resetUser
- [ ] `src/components/PostHogPageViewTracker.tsx` created
- [ ] `initPostHog()` called in main.tsx
- [ ] `PostHogPageViewTracker` added inside BrowserRouter in App.tsx
- [ ] User identified on login in AuthContext
- [ ] User reset on logout in AuthContext
- [ ] Graceful no-op when VITE_POSTHOG_KEY not set (no errors)
- [ ] At least 1 custom event added (search_performed or listing_viewed)
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run build` succeeds
- [ ] All existing tests pass

## Handoff

Create `docs/features/posthog-analytics/handoffs/session1-handoff.md`:
- List of files modified
- How to configure PostHog API key
- Build/test results
