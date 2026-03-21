---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# AGENT 3: Frontend Developer

**Role:** React + VAPI SDK Integration Specialist  
**Mission:** Build voice search UI components  
**Deliverables:** Voice button, search integration, working demo  
**Estimated Time:** 2-3 hours

---

## Your Responsibilities

You are the **Frontend Developer** on this project. Your job is to:

1. ✅ Install and configure VAPI Web SDK (`@vapi-ai/web`)
2. ✅ Create VoiceSearchButton component
3. ✅ Create useVoiceSearch custom hook
4. ✅ Integrate voice search into `/rentals` page
5. ✅ Handle loading/error states with visual feedback
6. ✅ Test end-to-end voice search flow
7. ✅ Deliver handoff package with component documentation

---

## Context You Need

**Read these documents:**
1. **Project Brief** (`00-PROJECT-BRIEF.md`) - Architecture overview
2. **VAPI Handoff** (from Agent 1) - Assistant ID and configuration
3. **Backend Handoff** (from Agent 2) - Edge Function URL and API contract

**Key Information:**
- **Framework:** React 18 + TypeScript + Vite
- **Existing Page:** `src/pages/Rentals.tsx` (listing browse page)
- **VAPI SDK:** `@vapi-ai/web` (Web SDK for browser)
- **Assistant ID:** Get from VAPI handoff document
- **Edge Function:** Already deployed and tested by Agent 2

---

## What You're Building

```
┌─────────────────────────────────────────────────────────┐
│            VOICE SEARCH USER FLOW                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. User on /rentals page                                │
│  2. Clicks microphone button                             │
│  3. VAPI session starts → "Listening..." indicator       │
│  4. User speaks: "Find beachfront in Maui under $2000"  │
│  5. Processing indicator shows                           │
│  6. Edge Function returns results                        │
│  7. Rentals page updates with search results             │
│  8. Voice says: "I found 3 beachfront condos..."         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### **UI Components**

1. **VoiceSearchButton** - Mic icon, recording animation
2. **VoiceStatusIndicator** - Shows: "Listening...", "Processing...", "Found X results"
3. **Updated Rentals page** - Integrates voice button, displays results

---

## Technical Requirements

### **Dependencies to Install**

```bash
npm install @vapi-ai/web
```

### **Environment Variables**

Add to `.env.local`:
```bash
VITE_VAPI_PUBLIC_KEY=your_public_key_from_vapi_dashboard
VITE_VAPI_ASSISTANT_ID=asst_xxxxx  # From VAPI handoff
VITE_FEATURE_VOICE_ENABLED=true     # Master kill switch for voice features
```

**Feature Flag Behavior:**
- `true` → Voice button visible, feature enabled
- `false` → Voice button hidden site-wide, manual search only
- Missing/undefined → Defaults to `false` (safe default)

### **TypeScript Types**

```typescript
// src/types/voice.ts
export interface VoiceSearchParams {
  destination?: string;
  check_in_date?: string;
  check_out_date?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  property_type?: "condo" | "villa" | "cabin" | "studio" | "any";
  amenities?: string[];
  max_guests?: number;
  open_for_bidding?: boolean;
  flexible_dates?: boolean;
}

export interface SearchResult {
  listing_id: string;
  property_name: string;
  city: string;
  state: string;
  check_in: string;
  check_out: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  property_type: string;
  amenities: string[];
  image_url: string | null;
  open_for_bidding: boolean;
}

export interface VoiceSearchResponse {
  success: boolean;
  results: SearchResult[];
  total_count: number;
  search_params: VoiceSearchParams;
  error?: string;
}

export type VoiceStatus = "idle" | "listening" | "processing" | "success" | "error";
```

---

## Implementation Guide

### **Step 1: Create useVoiceSearch Hook**

**File:** `src/hooks/useVoiceSearch.ts`

```typescript
import { useState, useCallback, useRef } from "react";
import Vapi from "@vapi-ai/web";
import type { VoiceStatus, VoiceSearchResponse, SearchResult } from "@/types/voice";

export const useVoiceSearch = () => {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const vapiRef = useRef<Vapi | null>(null);

  // Initialize VAPI client
  const initVapi = useCallback(() => {
    if (!vapiRef.current) {
      const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error("VAPI public key not configured");
      }
      vapiRef.current = new Vapi(publicKey);
    }
    return vapiRef.current;
  }, []);

  // Start voice search session
  const startVoiceSearch = useCallback(async () => {
    try {
      setStatus("listening");
      setError(null);
      setIsListening(true);
      
      const vapi = initVapi();
      const assistantId = import.meta.env.VITE_VAPI_ASSISTANT_ID;
      
      if (!assistantId) {
        throw new Error("VAPI assistant ID not configured");
      }

      // Start the call
      await vapi.start(assistantId);

      // Listen for function calls from VAPI
      vapi.on("function-call", async (functionCall) => {
        console.log("Function call received:", functionCall);
        
        if (functionCall.functionCall.name === "search_properties") {
          setStatus("processing");
          
          // The Edge Function will be called by VAPI automatically
          // We just need to listen for the results
        }
      });

      // Listen for messages
      vapi.on("message", (message) => {
        console.log("VAPI message:", message);
        
        // Check if this is a function result
        if (message.type === "function-call-result") {
          const result = message.functionCallResult.result as VoiceSearchResponse;
          
          if (result.success) {
            setResults(result.results);
            setStatus("success");
          } else {
            setError(result.error || "Search failed");
            setStatus("error");
          }
        }
      });

      // Listen for call end
      vapi.on("call-end", () => {
        setIsListening(false);
        if (status === "listening" || status === "processing") {
          setStatus("idle");
        }
      });

      // Listen for errors
      vapi.on("error", (error) => {
        console.error("VAPI error:", error);
        setError(error.message || "Voice search failed");
        setStatus("error");
        setIsListening(false);
      });

    } catch (err) {
      console.error("Voice search error:", err);
      setError(err instanceof Error ? err.message : "Failed to start voice search");
      setStatus("error");
      setIsListening(false);
    }
  }, [initVapi, status]);

  // Stop voice search
  const stopVoiceSearch = useCallback(() => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    setIsListening(false);
    setStatus("idle");
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setStatus("idle");
    setResults([]);
    setError(null);
    setIsListening(false);
  }, []);

  return {
    status,
    results,
    error,
    isListening,
    startVoiceSearch,
    stopVoiceSearch,
    reset,
  };
};
```

### **Step 2: Create VoiceSearchButton Component**

**File:** `src/components/VoiceSearchButton.tsx`

```typescript
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceSearchButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  className?: string;
}

export const VoiceSearchButton = ({
  isListening,
  isProcessing,
  onClick,
  className,
}: VoiceSearchButtonProps) => {
  return (
    <Button
      onClick={onClick}
      variant={isListening ? "destructive" : "outline"}
      size="lg"
      className={cn(
        "relative",
        isListening && "animate-pulse",
        className
      )}
      disabled={isProcessing}
    >
      {isListening ? (
        <>
          <MicOff className="h-5 w-5 mr-2" />
          Stop Listening
        </>
      ) : (
        <>
          <Mic className="h-5 w-5 mr-2" />
          Voice Search
        </>
      )}
      
      {/* Recording indicator */}
      {isListening && (
        <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-ping" />
      )}
    </Button>
  );
};
```

### **Step 3: Create VoiceStatusIndicator Component**

**File:** `src/components/VoiceStatusIndicator.tsx`

```typescript
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { VoiceStatus } from "@/types/voice";

interface VoiceStatusIndicatorProps {
  status: VoiceStatus;
  resultCount?: number;
  error?: string | null;
}

export const VoiceStatusIndicator = ({
  status,
  resultCount,
  error,
}: VoiceStatusIndicatorProps) => {
  if (status === "idle") return null;

  return (
    <Alert
      variant={
        status === "error" ? "destructive" :
        status === "success" ? "default" :
        "default"
      }
      className="mb-4"
    >
      {status === "listening" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Listening... Speak your search</AlertDescription>
        </>
      )}
      
      {status === "processing" && (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Processing your search...</AlertDescription>
        </>
      )}
      
      {status === "success" && (
        <>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Found {resultCount} {resultCount === 1 ? "result" : "results"}
          </AlertDescription>
        </>
      )}
      
      {status === "error" && (
        <>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Voice search failed. Please try again."}</AlertDescription>
        </>
      )}
    </Alert>
  );
};
```

### **Step 4: Integrate into Rentals Page**

**File:** `src/pages/Rentals.tsx`

**Modify the existing Rentals page to add voice search:**

```typescript
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { VoiceStatusIndicator } from "@/components/VoiceStatusIndicator";

// ... existing imports

export default function Rentals() {
  // Existing state and hooks
  const [searchFilters, setSearchFilters] = useState({ ... });
  
  // NEW: Feature flag check
  const voiceEnabled = import.meta.env.VITE_FEATURE_VOICE_ENABLED === 'true';
  
  // NEW: Voice search hook (only initialize if enabled)
  const {
    status: voiceStatus,
    results: voiceResults,
    error: voiceError,
    isListening,
    startVoiceSearch,
    stopVoiceSearch,
    reset: resetVoice,
  } = useVoiceSearch();

  // Handle voice search toggle
  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  // Merge voice results with existing results when voice search succeeds
  useEffect(() => {
    if (voiceStatus === "success" && voiceResults.length > 0) {
      // Display voice results
      // Option 1: Replace current results
      // setListings(voiceResults);
      
      // Option 2: Mark them as voice results and show together
      // setVoiceListings(voiceResults);
      
      console.log("Voice search results:", voiceResults);
    }
  }, [voiceStatus, voiceResults]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Browse Rentals</h1>
        
        {/* Voice Search Button - Only show if feature enabled */}
        {voiceEnabled && (
          <VoiceSearchButton
            isListening={isListening}
            isProcessing={voiceStatus === "processing"}
            onClick={handleVoiceToggle}
          />
        )}
      </div>

      {/* Voice Status Indicator - Only show if feature enabled */}
      {voiceEnabled && (
        <VoiceStatusIndicator
          status={voiceStatus}
          resultCount={voiceResults.length}
          error={voiceError}
        />
      )}

      {/* Existing search filters and results */}
      {/* ... rest of component ... */}
    </div>
  );
}
```

### **Step 5: Add Environment Variables**

Tell the user to add these to `.env.local`:

```bash
VITE_VAPI_PUBLIC_KEY=pk_xxxxxxxxxxxxx
VITE_VAPI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
```

(Get values from VAPI handoff document)

---

## Testing Checklist

### **Test 1: Button Renders**
- [ ] Voice Search button appears on /rentals page
- [ ] Button shows mic icon when idle
- [ ] Button shows "Stop Listening" when active

### **Test 2: Start Voice Session**
- [ ] Clicking button triggers microphone permission (browser)
- [ ] Recording indicator (red dot) appears
- [ ] Status changes to "Listening..."

### **Test 3: Voice Query**
- [ ] Speak: "Find me a beachfront condo in Maui"
- [ ] Status changes to "Processing..."
- [ ] Results appear (or error if DB empty)
- [ ] Voice response plays back

### **Test 4: Error Handling**
- [ ] Try without mic permission → Shows error
- [ ] Try with invalid assistant ID → Shows error
- [ ] Network failure → Shows error message

### **Test 5: Stop/Reset**
- [ ] Click "Stop Listening" → Session ends
- [ ] Status returns to idle
- [ ] Can start new session

---

## Deliverables (Handoff Package)

Create `frontend-handoff.md`:

```markdown
# Frontend (Voice UI) - Handoff Package

**Agent:** Frontend Developer  
**Completed:** [Date]  
**Handoff To:** QA Agent

---

## Components Created

### **1. useVoiceSearch Hook**
**File:** `src/hooks/useVoiceSearch.ts`

**Exports:**
- `startVoiceSearch()` - Initiates VAPI session
- `stopVoiceSearch()` - Ends session
- `reset()` - Clears state
- `status` - Current voice state
- `results` - Search results array
- `error` - Error message (if any)
- `isListening` - Boolean flag

### **2. VoiceSearchButton Component**
**File:** `src/components/VoiceSearchButton.tsx`

**Props:**
- `isListening: boolean`
- `isProcessing: boolean`
- `onClick: () => void`
- `className?: string`

### **3. VoiceStatusIndicator Component**
**File:** `src/components/VoiceStatusIndicator.tsx`

**Props:**
- `status: VoiceStatus`
- `resultCount?: number`
- `error?: string | null`

### **4. Updated Rentals Page**
**File:** `src/pages/Rentals.tsx`

**Changes:**
- Added voice search button to header
- Integrated useVoiceSearch hook
- Added status indicator
- Results update on successful voice search

---

## Environment Variables Required

Add to `.env.local`:
\`\`\`
VITE_VAPI_PUBLIC_KEY=pk_xxxxxxxxxxxxx
VITE_VAPI_ASSISTANT_ID=asst_xxxxxxxxxxxxx
\`\`\`

---

## User Flow

1. User visits `/rentals`
2. Clicks "Voice Search" button
3. Browser requests microphone permission
4. User speaks search query
5. VAPI processes and calls Edge Function
6. Results display on page
7. Voice assistant reads results aloud

---

## Test Results

### **Manual Test 1: Basic Voice Search**
**Query:** "Find me something in Maui"  
**Result:** ✅ Button worked, session started  
**Issue:** No results (DB empty) - expected

### **Manual Test 2: Stop Session**
**Action:** Click "Stop Listening" during recording  
**Result:** ✅ Session ended cleanly

[Add 2-3 more test cases]

---

## Known Issues

- Database is empty, so searches return no results (expected)
- Need real listings to test full flow
- Voice response plays even with empty results (VAPI default behavior)

---

## Next Steps for QA Agent

1. Test E2E flow with real data
2. Test edge cases (no mic, network failure, invalid queries)
3. Validate accessibility (keyboard nav, screen reader)
4. Check mobile responsiveness
5. Performance test (session startup time)
6. Create production checklist
```

---

## Success Criteria

Before marking complete:

- ✅ Voice button renders on /rentals page
- ✅ Clicking button starts VAPI session
- ✅ Microphone permission requested
- ✅ Status indicator shows correct states
- ✅ Edge Function called when voice query processed
- ✅ Results update UI (even if empty)
- ✅ Error handling works
- ✅ Code is TypeScript strict (no `any` types)
- ✅ Handoff package created

---

## Resources

- **VAPI Web SDK Docs:** https://docs.vapi.ai/sdks/web
- **React Query Docs:** https://tanstack.com/query/latest
- **Existing Components:** See `src/components/ui/` for shadcn primitives
- **Project Brief:** See `00-PROJECT-BRIEF.md`

---

**Ready to start? Ask the user to confirm you've received all handoff documents (VAPI + Backend), then begin Task 1.**
