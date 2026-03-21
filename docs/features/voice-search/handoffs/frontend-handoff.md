---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Frontend (Voice UI) - Handoff Package

**Agent:** Frontend Developer (Agent Session 3 of 4)
**Completed:** 2026-02-11
**Handoff To:** QA Agent (Agent Session 4)

---

## Summary

Voice search UI has been integrated into the `/rentals` page. Users can click a microphone button next to the search bar to start a VAPI voice session, speak a natural language query, and see search results displayed on the page.

---

## Files Created

| File | Purpose |
|------|---------|
| `src/types/voice.ts` | TypeScript types for voice search (params, results, response, status) |
| `src/hooks/useVoiceSearch.ts` | Custom hook managing VAPI SDK lifecycle and Edge Function calls |
| `src/components/VoiceSearchButton.tsx` | Mic icon button with recording/processing states |
| `src/components/VoiceStatusIndicator.tsx` | Status alert showing listening/processing/success/error |
| `.env.local` | Environment variables (VAPI keys, Supabase config, feature flag) |

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/Rentals.tsx` | Added voice search button, status indicator, and voice results section |
| `package.json` | Added `@vapi-ai/web` dependency |

---

## Components

### 1. `useVoiceSearch` Hook

**File:** `src/hooks/useVoiceSearch.ts`

**Returns:**
| Property | Type | Description |
|----------|------|-------------|
| `status` | `VoiceStatus` | `"idle"` \| `"listening"` \| `"processing"` \| `"success"` \| `"error"` |
| `results` | `VoiceSearchResult[]` | Array of search results from Edge Function |
| `error` | `string \| null` | Error message if something failed |
| `transcript` | `string` | The user's spoken query (final transcript) |
| `isCallActive` | `boolean` | Whether a VAPI call is currently active |
| `startVoiceSearch` | `() => Promise<void>` | Start a new voice search session |
| `stopVoiceSearch` | `() => void` | Stop the current session |
| `reset` | `() => void` | Clear all state back to idle |

**How it works:**
1. Initializes VAPI Web SDK with the public key on mount
2. Registers event listeners for `call-start`, `call-end`, `message`, `error`
3. When `startVoiceSearch()` is called, starts a VAPI call with the assistant ID
4. VAPI handles speech-to-text, LLM processing, and voice response
5. When the LLM triggers a `search_properties` function call, the hook:
   - Sets status to `"processing"`
   - Calls the Edge Function directly from the frontend (parallel to VAPI's server-side call)
   - Sets results and status to `"success"` (or `"error"`)
6. On `call-end`, keeps `"success"` status so results remain visible

### 2. `VoiceSearchButton` Component

**File:** `src/components/VoiceSearchButton.tsx`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `status` | `VoiceStatus` | Current voice search status |
| `isCallActive` | `boolean` | Whether call is active |
| `onStart` | `() => void` | Handler to start voice search |
| `onStop` | `() => void` | Handler to stop voice search |
| `className?` | `string` | Optional CSS class |

**States:**
- **Idle:** Outline icon button with `Mic` icon, tooltip "Voice Search"
- **Listening:** Destructive button with `MicOff` icon, pulsing recording indicator
- **Processing:** Destructive button with `Loader2` spinner, disabled

**Design notes:**
- Uses `Button` from `@/components/ui/button` (variant `"outline"` / `"destructive"`)
- Uses `Tooltip` from `@/components/ui/tooltip` (TooltipProvider is in App.tsx)
- Uses Lucide icons: `Mic`, `MicOff`, `Loader2`
- Recording indicator uses `animate-ping` for pulsing dot

### 3. `VoiceStatusIndicator` Component

**File:** `src/components/VoiceStatusIndicator.tsx`

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `status` | `VoiceStatus` | Current status |
| `transcript?` | `string` | User's spoken query |
| `resultCount?` | `number` | Number of results found |
| `error?` | `string \| null` | Error message |
| `onDismiss?` | `() => void` | Handler to dismiss the indicator |

**States:**
- **Idle:** Hidden (returns null)
- **Listening:** Pulsing mic icon + "Listening... Speak your search query"
- **Processing:** Spinning loader + "Searching properties for '{transcript}'..."
- **Success:** Check icon + "Found X results for '{transcript}'" + dismiss button
- **Error:** Alert icon + error message + dismiss button

**Design notes:**
- Uses `Alert` / `AlertDescription` from `@/components/ui/alert`
- Uses `animate-fade-in` from the existing animation system
- Error state uses `variant="destructive"`

### 4. Rentals Page Integration

**File:** `src/pages/Rentals.tsx`

**Changes:**
- Voice button placed next to the Search button in the search bar
- Status indicator appears below the search bar (inside the card)
- Voice results section appears above the main listings grid when results exist
- A separator divides voice results from regular listings
- All voice UI is gated behind the `VITE_FEATURE_VOICE_ENABLED` feature flag

**Voice results display:**
- Same card layout as existing listings (grid/list view supported)
- Shows: property name, location, brand badge, dates, price/week, sleeps, bedrooms
- Placeholder icon shown when `image_url` is null
- Brand name formatted (underscores replaced with spaces)

---

## Environment Variables

**File:** `.env.local`

```bash
VITE_VAPI_PUBLIC_KEY=pk_152f910f-c138-4496-b29a-8334a100ed04
VITE_VAPI_ASSISTANT_ID=af9159c9-d480-42c4-ad20-9b38431531e7
VITE_FEATURE_VOICE_ENABLED=true
VITE_SUPABASE_URL=https://oukbxqnlxnkainnligfz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...  (full key in .env.local)
```

**Feature Flag:**
- `VITE_FEATURE_VOICE_ENABLED=true` → Voice button visible
- `VITE_FEATURE_VOICE_ENABLED=false` or missing → Voice button hidden

---

## Architecture / Data Flow

```
User clicks Mic → VAPI.start(assistantId) → Browser mic permission
                                          → VAPI connects
                                          → "Hi! I'm here to help..."

User speaks → Deepgram transcribes → GPT-4o-mini extracts params
           → VAPI sends function-call message to client
           → Frontend calls Edge Function (for UI data)
           → VAPI calls Edge Function server-side (for voice response)
           → Frontend displays results as listing cards
           → VAPI voice says "I found X results..."

User or VAPI ends call → Results stay visible → User can dismiss
```

**Important:** The frontend calls the Edge Function independently from VAPI's server-side call. This ensures:
1. The UI gets raw data to display as cards
2. The voice response works via VAPI's server-side flow
3. If one path fails, the other still works

---

## Schema Note

The backend response uses the **actual** database columns, not the project brief:

| Response Field | DB Source | Notes |
|---------------|-----------|-------|
| `property_name` | `properties.resort_name` | Property display name |
| `location` | `properties.location` | Single string (e.g., "Lahaina, HI") |
| `brand` | `properties.brand` | VacationClubBrand enum (e.g., "hilton_grand_vacations") |
| `sleeps` | `properties.sleeps` | Max occupancy |
| `price` | `listings.final_price` | Total price travelers pay |
| `image_url` | First entry in `properties.images` text[] | May be null |

---

## Testing Instructions

### Prerequisites
1. Run `npm install` (installs @vapi-ai/web)
2. Ensure `.env.local` has all variables set
3. Start dev server: `npm run dev` (opens at http://localhost:8080)

### Test 1: Voice Button Renders
- [ ] Navigate to `/rentals`
- [ ] Voice Search mic icon button appears next to the Search button
- [ ] Button has outline style with mic icon
- [ ] Hovering shows "Voice Search" tooltip

### Test 2: Start Voice Session
- [ ] Click the mic button
- [ ] Browser requests microphone permission (allow it)
- [ ] Button changes to red/destructive with MicOff icon
- [ ] Pulsing red dot appears on the button
- [ ] Status indicator shows "Listening... Speak your search query"
- [ ] VAPI assistant speaks: "Hi! I'm here to help you find the perfect vacation rental..."

### Test 3: Voice Query
- [ ] Speak: "Find me a beachfront condo in Maui"
- [ ] Status changes to "Searching properties for 'beachfront condo in Maui'..."
- [ ] Button shows spinner (disabled)
- [ ] After processing, status shows "Found X results" (or "No results found")
- [ ] Voice assistant speaks the results summary
- [ ] If results found, listing cards appear in the "Voice Search Results" section

### Test 4: Stop Session
- [ ] During listening, click the stop (MicOff) button
- [ ] Session ends
- [ ] Status returns to idle (unless results were already found)

### Test 5: Dismiss Results
- [ ] After getting results, click the X dismiss button on the status indicator
- [ ] Status resets to idle
- [ ] Voice results section disappears

### Test 6: Error Handling
- [ ] Deny microphone permission → Should show error
- [ ] Set `VITE_VAPI_PUBLIC_KEY` to invalid value → Should show error on start

### Test 7: Feature Flag
- [ ] Set `VITE_FEATURE_VOICE_ENABLED=false` in `.env.local`
- [ ] Restart dev server
- [ ] Voice button should NOT appear on the page
- [ ] No voice-related UI visible anywhere

### Expected: Empty Results
The database currently has no listing data. Voice searches will return 0 results. This is expected. The VAPI assistant should gracefully suggest adjusting filters or nearby destinations.

---

## Known Issues

1. **Empty database:** All searches return 0 results (expected for beta — no listings data yet)
2. **VAPI server URL:** If not configured in VAPI dashboard to point to the Edge Function, the voice response won't include search data (the frontend UI will still work since it calls the Edge Function independently)
3. **Dual Edge Function calls:** Both VAPI (server-side) and the frontend call the Edge Function. This is intentional for reliability but means each voice search triggers 2 Edge Function invocations
4. **No image fallback:** Voice results with null `image_url` show a placeholder MapPin icon instead of a property image
5. **Brand display:** Brand values like `hilton_grand_vacations` are formatted with underscores replaced by spaces. A proper display name mapping could be added later

---

## Next Steps for QA Agent (Session 4)

1. **E2E Testing:** Test the full voice flow (mic → speech → results → voice response)
2. **Edge Cases:** Test with unclear queries, no destination, very specific dates
3. **Error Scenarios:** Mic denied, network failure, invalid config, VAPI timeout
4. **Accessibility:** Keyboard navigation, screen reader announcements, ARIA labels
5. **Mobile:** Test on mobile browsers (mic permission flow differs)
6. **Performance:** Measure VAPI session startup time, Edge Function response time
7. **Browser Compatibility:** Test Chrome, Firefox, Safari, Edge
8. **Feature Flag:** Verify flag correctly hides/shows all voice UI
9. **Production Checklist:** Review env vars, CORS config, error logging
10. **VAPI Server URL:** Verify the VAPI assistant has the Edge Function URL configured as server URL for function calls
