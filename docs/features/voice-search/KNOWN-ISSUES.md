---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Voice Search: Known Issues

**Last Updated:** 2026-02-20

---

## Issue 1: Assistant Interruption (Talks Over User)

**Severity:** Medium
**Status:** Fixed (2026-02-16)
**First Observed:** VAPI integration testing (Session 1)

### Description

The voice assistant sometimes begins speaking (or fires `search_properties`) before the user has finished their query. This results in:
- The assistant talking over the user mid-sentence
- Function calls executing with incomplete parameters
- Duplicate `search_properties` calls fired in quick succession

### Observed Behavior

From test logs:
- **Test 2 (Orlando):** `search_properties` fired twice at nearly the same timestamp — possible race condition when user speech overlaps with assistant response
- **Test 3 (Smoky Mountains):** User tried to provide a check-in date *after* the function had already fired — assistant didn't wait long enough

### Root Cause Analysis

Likely a combination of:
1. **VAPI silence detection** — Deepgram's end-of-speech detection may trigger too early on natural pauses
2. **LLM eagerness** — GPT-4o-mini calls the function as soon as it has minimum required params (`destination`), without waiting for the user to finish
3. **No debounce** — No delay between detecting end-of-speech and executing the function call

### Investigation Steps

1. **Check VAPI assistant settings:**
   - Review `silenceTimeoutSeconds` (currently 30s) — this is for full silence, not mid-speech pauses
   - Check if VAPI has an `endpointing` or `speechTimeout` setting that controls how long to wait after a pause before considering speech "final"
   - Look for `responsePunctuationBehavior` or similar settings

2. **Adjust Deepgram transcriber config:**
   ```json
   {
     "transcriber": {
       "provider": "deepgram",
       "model": "nova-2",
       "language": "en",
       "endpointing": 500
     }
   }
   ```
   Increasing `endpointing` (milliseconds of silence before considering speech final) from the default (~300ms) to 500-800ms may help.

3. **Update VAPI assistant system prompt:**
   Add instructions to wait for complete input:
   ```
   IMPORTANT: Before calling search_properties, pause briefly to make sure the user
   has finished speaking. If they seem to be mid-sentence or hesitating, wait for them
   to complete their thought. Only call the function when you have a natural pause
   indicating the user is done.
   ```

4. **Consider adding `backchanneling`:**
   VAPI may support backchanneling settings that prevent the assistant from jumping in during pauses.

5. **Test with longer utterances:**
   Record test sessions where the user deliberately pauses mid-sentence to measure how aggressive the interruption is.

### Fix Applied (2026-02-16)

Two changes applied via `assistantOverrides` in `src/hooks/useVoiceSearch.ts`:

1. **Deepgram endpointing increased from 10ms (default) to 500ms (max)**
   - This gives the user more time to pause mid-sentence without the transcriber declaring end-of-speech
   - Configured in `ASSISTANT_OVERRIDES.transcriber.endpointing`

2. **System prompt updated with explicit listening instructions**
   - Added "IMPORTANT — Listening behavior" section telling the LLM to wait for complete input
   - Instructs the assistant to ask a clarifying question instead of immediately searching when unsure

### VAPI Dashboard

- Assistant ID: `af9159c9-d480-42c4-ad20-9b38431531e7`
- Base config managed on VAPI, overrides applied at call start via SDK
- Override source: `src/hooks/useVoiceSearch.ts` → `ASSISTANT_OVERRIDES`

---

## Issue 2: Budget Assumption ($1500 Before User Provides)

**Severity:** Medium
**Status:** Fixed (2026-02-16)
**First Observed:** VAPI integration testing (Session 1, Test 1)

### Description

The assistant sometimes assumes a budget of $1500 even when the user explicitly states a different amount. In Test 1, the user said "under $2000" but the assistant reported searching for "$1500."

### Observed Behavior

From test logs:
- **Test 1 (Maui):** User said "under 2000 dollars" but assistant's response mentioned "$1500" — the function call may have used the wrong `max_price`
- The system prompt contains the guideline: *"If the user says 'cheap' or 'affordable', assume max_price = 1500"*
- The LLM appears to be over-applying this rule even when the user provides an explicit price

### Root Cause Analysis

1. **System prompt bleed:** The guideline about "cheap/affordable = 1500" may be influencing the LLM to default to $1500 in ambiguous situations
2. **Transcription error:** Deepgram may have transcribed "2000" as something the LLM misinterpreted
3. **LLM hallucination:** GPT-4o-mini may be conflating the system prompt guideline with the user's actual stated price

### Investigation Steps

1. **Review VAPI call logs:**
   - Check the actual `search_properties` function call parameters — did `max_price` contain 1500 or 2000?
   - If the function params were correct (2000) but the assistant *said* 1500, it's a response generation issue
   - If the function params were wrong (1500), it's a parameter extraction issue

2. **Refine the system prompt:**
   Make the $1500 rule more explicit and narrow:
   ```
   Price guidelines:
   - ONLY use max_price=1500 when the user literally says "cheap" or "affordable"
     without providing a specific number
   - If the user states ANY specific dollar amount, ALWAYS use their exact number
   - Never override an explicit user price with the default
   ```

3. **Consider removing the default entirely:**
   The $1500 default may cause more confusion than it solves. Alternative approach:
   ```
   If the user says "cheap" or "affordable" without a specific price, ask them:
   "What's your budget range?" instead of assuming $1500.
   ```

4. **Test with explicit prices:**
   Run voice tests with clear price statements ($500, $1000, $2000, $3000) and verify the function call parameters match.

5. **Check Deepgram transcription:**
   Review raw transcripts in VAPI logs to confirm "2000" was correctly transcribed.

### Fix Applied (2026-02-16)

System prompt updated via `assistantOverrides` in `src/hooks/useVoiceSearch.ts`:

1. **Price guideline made explicit and narrow:**
   - Changed from broad "cheap/affordable = 1500" rule to: "ONLY default to 1500 when user literally says 'cheap' or 'affordable' without a number"
   - Added: "If the user states a specific dollar amount, ALWAYS use their exact number. Never override it."
   - Added: If user says budget-friendly without a number, ask "What's your budget range?" instead of assuming

2. **Function parameter description updated:**
   - The `max_price` field description in the VAPI function schema still says `'cheap' = 1500` — this is on VAPI's side and reinforces the narrowed rule. If issues persist, this description should also be updated via the VAPI API.

### VAPI System Prompt Location

The system prompt is now version-controlled in `src/hooks/useVoiceSearch.ts` as `VOICE_SEARCH_SYSTEM_PROMPT`.
It is applied via `ASSISTANT_OVERRIDES` passed to `vapi.start()`, overriding the base prompt on VAPI's side.

---

## Other Known Issues (Non-blocking)

| Issue | Severity | Description | Status |
|-------|----------|-------------|--------|
| Deepgram transcription quality | Low | Fragmented/hesitant speech garbled ("0 4 and, uh, 1 with") | ✅ Fixed (2026-02-20) — Nova-3 upgrade |
| Duplicate function calls | Low | `search_properties` fires twice in quick succession | ✅ Fixed (2026-02-20) |
| No AbortController on fetch | Low | Edge Function fetch continues after user stops voice search | ✅ Fixed (2026-02-20) |
| Voice result cards not clickable | Low | Results use `<div>` not `<Link>` — can't click through to property | ✅ Fixed (2026-02-20) |
| CORS wildcard | Low | Edge Function allows `*` origin — tighten for production | ✅ Fixed (2026-02-20) |
| No rate limiting | Low | Edge Function has no request rate limiting | ✅ Fixed (2026-02-20) |

---

## Resolution Priority

1. **Budget assumption** — ✅ Fixed (2026-02-16) — System prompt updated with explicit price rules
2. **Interruption** — ✅ Fixed (2026-02-16) — Endpointing 500ms + system prompt listening instructions
3. **Duplicate function calls** — ✅ Fixed (2026-02-20) — 2-second dedup window in `useVoiceSearch.ts` message handler
4. **AbortController** — ✅ Fixed (2026-02-20) — Abort in-flight fetch on stop/reset/unmount/new-search
5. **Voice result cards** — ✅ Fixed (2026-02-20) — Changed `<div>` to `<Link to={/property/:id}>` with hover effects
6. **CORS tightening** — ✅ Fixed (2026-02-20) — Dynamic origin check (exact domains + Vercel pattern + localhost)
7. **Rate limiting** — ✅ Fixed (2026-02-20) — Per-IP sliding window (30 req/min) in edge function
8. **Deepgram transcription** — ✅ Fixed (2026-02-20) — Upgraded to Nova-3 (54% better WER), keyword boosting for travel terms

## Voice Track B: Quality Tuning (2026-02-20)

All changes applied via `ASSISTANT_OVERRIDES` in `src/hooks/useVoiceSearch.ts`:

**B1 — Endpointing optimized:**
- Reduced from 500ms to 300ms (Nova-3's better accuracy allows faster response)
- Added LiveKit smart endpointing (`startSpeakingPlan.smartEndpointingPlan`) for audio+text turn detection
- Added `startSpeakingPlan.waitSeconds: 0.6` (vs default 0.4) for less interruption

**B2 — Anti-interruption (replaces deprecated backchannelingEnabled):**
- `stopSpeakingPlan.numWords: 2` — user must say 2+ words to interrupt assistant
- `stopSpeakingPlan.backoffSeconds: 1.5` — longer pause before assistant resumes after interruption
- `backgroundSpeechDenoisingPlan.smartDenoisingPlan.enabled: true` — Krisp AI denoising
- Built-in acknowledgement phrases ("uh-huh", "okay", "right") won't trigger interruption

**B3 — Transcription model upgraded:**
- `nova-2` → `nova-3` (54.3% streaming WER reduction, multilingual codeswitching)
- Added `keywords` array: 16 travel-specific terms (resort brands, destinations, unit types)

**Bonus — Call duration cap:**
- `maxDurationSeconds: 120` (2 min) vs default 600 (10 min) — prevents runaway VAPI costs

## Fix Implementation Notes

### Issues 1 & 2 (2026-02-16)

Both fixes were implemented by passing `assistantOverrides` to `vapi.start()` in `src/hooks/useVoiceSearch.ts`:
- **Advantage:** System prompt is now version-controlled in our codebase (not just on VAPI dashboard)
- **Advantage:** No VAPI private API key needed for updates
- **Advantage:** Changes deploy with normal frontend deploys
- **Note:** The base assistant on VAPI still has the original prompt/config — our overrides take precedence at call start

### Issues 3-8 (2026-02-20)

**Duplicate calls** (`src/hooks/useVoiceSearch.ts`):
- Added `lastSearchTimestampRef` — suppresses `search_properties` calls within 2 seconds of each other
- Logs suppressed calls for debugging

**AbortController** (`src/hooks/useVoiceSearch.ts`):
- Added `abortControllerRef` — abort any in-flight fetch before starting a new search
- Aborts on: stop, reset, unmount, and new search
- `AbortError` is caught and ignored (not shown as error to user)

**Voice result cards** (`src/pages/Rentals.tsx`):
- Changed voice result `<div>` to `<Link to={/property/${result.listing_id}}>`
- Added `group-hover:scale-105` on images and `group-hover:text-primary` on titles (matching regular listing cards)

**CORS** (`supabase/functions/voice-search/index.ts`):
- Replaced `"*"` wildcard with dynamic origin check via `getCorsHeaders(req)`
- Allowed: exact production domains, Vercel preview pattern (`/^https:\/\/rentavacation[a-z0-9-]*\.vercel\.app$/`), localhost
- Falls back to production domain for unknown origins

**Rate limiting** (`supabase/functions/voice-search/index.ts`):
- Per-IP sliding window: 30 requests per 60-second window
- Uses `cf-connecting-ip` or `x-forwarded-for` headers for IP identification
- Returns HTTP 429 with JSON error message when exceeded
- Stale entries cleaned each request to prevent memory leaks
- Note: Per-isolate only (Deno Deploy) — provides burst protection, not global rate limiting
