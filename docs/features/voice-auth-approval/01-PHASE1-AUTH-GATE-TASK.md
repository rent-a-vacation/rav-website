---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# PHASE 1: Authentication Gate for Voice Search

**Role:** Frontend Engineer (Voice UI Protection)  
**Duration:** 30-45 minutes  
**Mission:** Gate voice search behind authentication  
**Environment:** Local DEV → Supabase DEV

---

## Your Responsibilities

You are implementing the **first layer of protection** for voice search:

1. ✅ Modify `VoiceSearchButton` to check authentication state
2. ✅ Show disabled button with tooltip for unauthenticated users
3. ✅ Keep existing behavior for authenticated users
4. ✅ Ensure manual search always works (no gating on that)
5. ✅ Test both authenticated and unauthenticated flows
6. ✅ Create handoff document

---

## Context You Need

**Read these documents first:**
1. **Project Brief** - `voice-auth-approval-brief.md` (in this conversation)
2. **Existing Auth System** - `src/contexts/AuthContext.tsx` already exists
3. **Existing Voice Button** - `src/components/VoiceSearchButton.tsx` already exists

**Key Information:**
- Auth hook `useAuth()` provides: `user`, `session`, `isAuthenticated`
- Voice button is already on `/rentals` page
- Feature flag `VITE_FEATURE_VOICE_ENABLED` already gates voice UI
- Manual search filters work for everyone (DO NOT gate these)

---

## What You're Building

### **Before (Current State)**

```typescript
// Anyone can click voice button
<VoiceSearchButton 
  isListening={isListening}
  onClick={handleVoiceToggle}
/>
```

### **After (New Behavior)**

```typescript
// Unauthenticated users see disabled button with tooltip
<VoiceSearchButton 
  isListening={isListening}
  onClick={handleVoiceToggle}
  disabled={!isAuthenticated}  // NEW
  disabledReason="Sign in to use voice search"  // NEW
/>
```

---

## Task Breakdown

### **Task 1: Update VoiceSearchButton Component**

**File:** `src/components/VoiceSearchButton.tsx`

**Current Component (Simplified):**
```typescript
interface VoiceSearchButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  className?: string;
}

export function VoiceSearchButton({ 
  isListening, 
  isProcessing, 
  onClick, 
  className 
}: VoiceSearchButtonProps) {
  // ... existing implementation
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={onClick} disabled={isProcessing}>
            <Mic />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Voice Search</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

**Changes Needed:**

1. **Add new props:**
```typescript
interface VoiceSearchButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  className?: string;
  disabled?: boolean;  // NEW: External disable control
  disabledReason?: string;  // NEW: Reason for being disabled
}
```

2. **Update disabled logic:**
```typescript
const isDisabled = disabled || isProcessing;
```

3. **Update tooltip to show disabled reason:**
```typescript
<TooltipContent>
  {disabled && disabledReason 
    ? disabledReason 
    : isListening 
      ? "Stop voice search" 
      : "Voice Search"
  }
</TooltipContent>
```

4. **Update button to show disabled state visually:**
```typescript
<Button 
  onClick={onClick} 
  disabled={isDisabled}
  variant={isListening ? "destructive" : "outline"}
  className={cn(
    disabled && "opacity-50 cursor-not-allowed",  // NEW
    className
  )}
>
```

---

### **Task 2: Update Rentals Page to Pass Auth State**

**File:** `src/pages/Rentals.tsx`

**Current Voice Button Usage (Simplified):**
```typescript
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";

export default function Rentals() {
  const voiceEnabled = import.meta.env.VITE_FEATURE_VOICE_ENABLED === 'true';
  
  const {
    status: voiceStatus,
    isListening,
    startVoiceSearch,
    stopVoiceSearch,
  } = useVoiceSearch();
  
  const handleVoiceToggle = () => {
    if (isListening) {
      stopVoiceSearch();
    } else {
      startVoiceSearch();
    }
  };

  return (
    <div>
      {voiceEnabled && (
        <VoiceSearchButton
          isListening={isListening}
          isProcessing={voiceStatus === "processing"}
          onClick={handleVoiceToggle}
        />
      )}
    </div>
  );
}
```

**Changes Needed:**

1. **Import useAuth:**
```typescript
import { useAuth } from "@/hooks/useAuth";
```

2. **Get auth state:**
```typescript
const { user } = useAuth();
const isAuthenticated = !!user;
```

3. **Pass auth state to button:**
```typescript
{voiceEnabled && (
  <VoiceSearchButton
    isListening={isListening}
    isProcessing={voiceStatus === "processing"}
    onClick={handleVoiceToggle}
    disabled={!isAuthenticated}  // NEW
    disabledReason={!isAuthenticated ? "Sign in to use voice search" : undefined}  // NEW
  />
)}
```

---

### **Task 3: Test the Implementation**

**Test Case 1: Unauthenticated User**
1. Clear browser session (logout if logged in)
2. Visit `http://localhost:5173/rentals`
3. ✅ Voice button should be visible but grayed out (disabled)
4. ✅ Hover → Tooltip shows "Sign in to use voice search"
5. ✅ Click button → Nothing happens (disabled prevents click)
6. ✅ Manual search filters still work normally

**Test Case 2: Authenticated User**
1. Sign in with test account
2. Visit `/rentals`
3. ✅ Voice button should be enabled (normal appearance)
4. ✅ Hover → Tooltip shows "Voice Search"
5. ✅ Click button → VAPI session starts normally
6. ✅ Voice search works as before

**Test Case 3: Feature Flag OFF**
1. Set `VITE_FEATURE_VOICE_ENABLED=false` in `.env.local`
2. Restart dev server
3. ✅ Voice button hidden completely (existing behavior)
4. ✅ Manual search still works

---

### **Task 4: Edge Cases to Handle**

1. **User logs out while voice session is active**
   - Session should stop immediately
   - Button should become disabled

2. **User logs in while on /rentals page**
   - Button should become enabled without page reload
   - Use `useEffect` to watch `user` state

**Implementation in Rentals.tsx:**
```typescript
useEffect(() => {
  // If user logs out during voice session, stop it
  if (!isAuthenticated && isListening) {
    stopVoiceSearch();
  }
}, [isAuthenticated, isListening, stopVoiceSearch]);
```

---

## Important Notes

### **DO:**
- ✅ Keep all existing voice search functionality unchanged
- ✅ Only add authentication gating
- ✅ Ensure manual search works for everyone
- ✅ Test both auth states thoroughly
- ✅ Use existing `useAuth` hook (don't create new logic)

### **DON'T:**
- ❌ Don't gate manual search filters
- ❌ Don't modify useVoiceSearch hook (not needed for Phase 1)
- ❌ Don't change VAPI integration
- ❌ Don't add any database changes (Phase 2 handles that)
- ❌ Don't add usage limits yet (Phase 3)

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/VoiceSearchButton.tsx` | Modify | Add disabled prop and disabled reason |
| `src/pages/Rentals.tsx` | Modify | Pass auth state to voice button |

**No new files created in Phase 1.**

---

## Deliverables (Handoff Package)

Create TWO files in the handoffs folder:

1. **`handoffs/phase1-handoff.md`** - Detailed technical handoff (see template below)
2. **`handoffs/phase1-hub-template.md`** - Copy-paste template for PROJECT-HUB.md update

---

### File 1: `handoffs/phase1-handoff.md`

```markdown
# Phase 1: Authentication Gate - Handoff Package

**Completed:** [Date]  
**Duration:** [Actual time]  
**Status:** ✅ Complete / ⚠️ Issues found

---

## Changes Made

### **Modified Components**

**1. VoiceSearchButton.tsx**
- Added `disabled` prop (boolean)
- Added `disabledReason` prop (string)
- Updated tooltip to show disabled reason
- Updated button styling for disabled state

**2. Rentals.tsx**
- Imported `useAuth` hook
- Get `isAuthenticated` state
- Pass `disabled` and `disabledReason` to VoiceSearchButton
- Added useEffect to stop voice if user logs out

---

## Test Results

### **Unauthenticated User Flow**
- [✅/❌] Voice button appears disabled
- [✅/❌] Tooltip shows "Sign in to use voice search"
- [✅/❌] Button click does nothing
- [✅/❌] Manual search still works

### **Authenticated User Flow**
- [✅/❌] Voice button appears enabled
- [✅/❌] Voice search starts normally
- [✅/❌] All existing functionality works

### **Edge Cases**
- [✅/❌] Logout during voice session stops recording
- [✅/❌] Login while on page enables button

---

## Known Issues

[List any bugs or quirks discovered]

Example:
- None found ✅
OR
- Tooltip sometimes doesn't show on first hover (requires second hover)

---

## Before/After Screenshots

**Before:** [Optional: Screenshot of old button]
**After - Logged Out:** [Screenshot showing disabled button]
**After - Logged In:** [Screenshot showing enabled button]

---

## Next Steps for Phase 2

Phase 2 will implement the user approval system:
- Database schema changes (approval_status column)
- Pending approval page
- Admin approval dashboard
- Email notifications

**Dependencies:**
- Phase 1 must be deployed before Phase 2 starts
- All tests must pass

---

## Deployment Notes

**Environment Variables:** No changes needed

**Database Changes:** None in Phase 1

**Breaking Changes:** None - fully backward compatible

**Rollback Plan:** 
If issues arise, remove the `disabled` and `disabledReason` props from VoiceSearchButton and Rentals.tsx. Voice button will work for everyone again.

---

## Code Diff Summary

\`\`\`diff
// VoiceSearchButton.tsx
interface VoiceSearchButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
  className?: string;
+ disabled?: boolean;
+ disabledReason?: string;
}

// Rentals.tsx
+ import { useAuth } from "@/hooks/useAuth";

export default function Rentals() {
+ const { user } = useAuth();
+ const isAuthenticated = !!user;

  return (
    <VoiceSearchButton
      isListening={isListening}
      isProcessing={voiceStatus === "processing"}
      onClick={handleVoiceToggle}
+     disabled={!isAuthenticated}
+     disabledReason={!isAuthenticated ? "Sign in to use voice search" : undefined}
    />
  );
}
\`\`\`
```

---

### File 2: `handoffs/phase1-hub-template.md`

```markdown
# PROJECT-HUB.md Update - Phase 1

**Instructions:** Copy the sections below into PROJECT-HUB.md after reviewing phase1-handoff.md

---

## UPDATE: Current Status Section

**Last Deployment:** Phase 1 (Voice Auth Gate) - [Today's Date]
**Working on TODAY:** Phase 2 - User Approval System

---

## UPDATE: Top 3 Priorities Section

### 1. Gate Voice Search Behind Authentication ✅ COMPLETE
**Status:** 🟢 Deployed
**Completed:** [Today's Date]
**Duration:** [Actual time, e.g., "35 minutes"]

**Delivered:**
- ✅ Voice button disabled for unauthenticated users
- ✅ Tooltip shows "Sign in to use voice search"
- ✅ Authenticated users can use voice normally
- ✅ Manual search works for everyone
- ✅ Edge cases handled (logout during session)
- ✅ All tests passed

**Files Modified:**
- `src/components/VoiceSearchButton.tsx` - Added disabled prop
- `src/pages/Rentals.tsx` - Added auth check

**Docs:** `docs/features/voice-auth-approval/handoffs/phase1-handoff.md`

---

### 2. User Approval System (Next - 2 hours)
**Status:** 🟡 Ready to Start
**Priority:** HIGH - Required for beta launch

**Tasks:**
- [ ] Database migration (approval_status column)
- [ ] Pending Approval page
- [ ] Admin approval dashboard
- [ ] Email notifications
- [ ] Route protection

---

[Keep remaining priorities as-is, renumber if needed]
```

---

## Success Criteria

Before marking Phase 1 complete, verify:

- ✅ Unauthenticated users see disabled voice button
- ✅ Tooltip explains why button is disabled
- ✅ Authenticated users can use voice normally
- ✅ Manual search works for everyone
- ✅ No console errors
- ✅ Edge cases handled (logout during session)
- ✅ All tests passed
- ✅ **Both handoff documents created** (phase1-handoff.md AND phase1-hub-template.md)
- ✅ Code committed to git

---

## Git Commit Message Template

```
feat(voice): gate voice search behind authentication

- Add disabled state to VoiceSearchButton component
- Check authentication in Rentals page
- Show tooltip: "Sign in to use voice search"
- Stop voice session if user logs out
- Manual search remains available to all users

Related: Phase 1 of Voice Auth & Approval System
```

---

## Questions to Ask Before Starting

1. Do you want me to create a "Sign in" button next to the disabled voice button?
   - If yes, it could link to `/login` for easy access
   - If no, tooltip alone is enough

2. Should RAV team members see any special messaging?
   - e.g., different tooltip text for admins
   - Or same as regular users?

3. Any specific styling for the disabled button?
   - Current plan: gray out with opacity-50
   - Alternative: different icon or color?

---

**Ready to start? Confirm you've received the Project Brief, then begin Task 1.**
