---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# PHASE 3: Voice Usage Limits & Admin Toggle

**Role:** Full-Stack Engineer (Usage Tracking + Admin Controls)  
**Duration:** 2-3 hours  
**Mission:** Implement voice search quotas and admin system settings  
**Dependencies:** Phase 1 and Phase 2 must be complete  
**Environment:** Supabase DEV → Production

---

## Your Responsibilities

You are implementing the **third layer of protection** - usage limits:

1. ✅ Add voice_search_usage table to track daily searches
2. ✅ Create database functions for quota management
3. ✅ Update useVoiceSearch hook to check quota before starting
4. ✅ Add quota indicator in UI ("X searches remaining")
5. ✅ Create SystemSettings admin component
6. ✅ Add admin toggle to enable/disable approval requirement
7. ✅ Test quota limits and reset logic
8. ✅ Test admin toggle functionality
9. ✅ Create handoff document

---

## Context You Need

**Read these documents first:**
1. **Project Brief** - Master architecture document
2. **Phase 1 Handoff** - Authentication gate is in place
3. **Phase 2 Handoff** - User approval system is working

**Key Information:**
- Voice search costs ~$0.10 per search (VAPI)
- Quota: 10 searches per day per user
- Resets at midnight UTC
- RAV team gets unlimited searches (bypass quota)
- Admin can toggle approval requirement ON/OFF

---

## Task Breakdown

### **Task 1: Database Schema for Usage Tracking**

**File:** `supabase/migrations/008_voice_usage_limits.sql`

```sql
-- ============================================================
-- VOICE USAGE LIMITS
-- Migration 008
-- ============================================================

-- ============================================================
-- 1. CREATE VOICE SEARCH USAGE TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS voice_search_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  search_date DATE NOT NULL DEFAULT CURRENT_DATE,
  search_count INTEGER DEFAULT 0 CHECK (search_count >= 0),
  last_search_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, search_date)
);

COMMENT ON TABLE voice_search_usage IS 'Tracks daily voice search usage per user for quota enforcement';
COMMENT ON COLUMN voice_search_usage.search_count IS 'Number of voice searches used today';
COMMENT ON COLUMN voice_search_usage.last_search_at IS 'Timestamp of most recent voice search';

-- ============================================================
-- 2. CREATE INDEXES FOR FAST LOOKUPS
-- ============================================================

CREATE INDEX idx_voice_search_usage_user_date 
  ON voice_search_usage(user_id, search_date);

CREATE INDEX idx_voice_search_usage_date 
  ON voice_search_usage(search_date DESC);

-- ============================================================
-- 3. CREATE QUOTA MANAGEMENT FUNCTIONS
-- ============================================================

-- Function to increment voice search count
CREATE OR REPLACE FUNCTION increment_voice_search_count(_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO voice_search_usage (user_id, search_date, search_count, last_search_at)
  VALUES (_user_id, CURRENT_DATE, 1, NOW())
  ON CONFLICT (user_id, search_date)
  DO UPDATE SET
    search_count = voice_search_usage.search_count + 1,
    last_search_at = NOW(),
    updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION increment_voice_search_count IS 'Increments daily voice search counter for a user';

-- Function to get today's search count
CREATE OR REPLACE FUNCTION get_voice_search_count(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(search_count, 0)
  FROM voice_search_usage
  WHERE user_id = _user_id AND search_date = CURRENT_DATE;
$$;

COMMENT ON FUNCTION get_voice_search_count IS 'Returns number of voice searches used today by a user';

-- Function to check if user can make voice search
CREATE OR REPLACE FUNCTION can_use_voice_search(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_limit INTEGER := 10;
  current_count INTEGER;
  user_is_rav_team BOOLEAN;
BEGIN
  -- RAV team has unlimited access
  user_is_rav_team := public.is_rav_team(_user_id);
  IF user_is_rav_team THEN
    RETURN TRUE;
  END IF;
  
  -- Check quota
  current_count := public.get_voice_search_count(_user_id);
  RETURN current_count < daily_limit;
END;
$$;

COMMENT ON FUNCTION can_use_voice_search IS 'Checks if user has remaining voice search quota for today';

-- Function to get voice searches remaining
CREATE OR REPLACE FUNCTION get_voice_searches_remaining(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  daily_limit INTEGER := 10;
  current_count INTEGER;
  user_is_rav_team BOOLEAN;
BEGIN
  -- RAV team has unlimited
  user_is_rav_team := public.is_rav_team(_user_id);
  IF user_is_rav_team THEN
    RETURN 999;  -- Show "unlimited"
  END IF;
  
  -- Calculate remaining
  current_count := public.get_voice_search_count(_user_id);
  RETURN GREATEST(0, daily_limit - current_count);
END;
$$;

COMMENT ON FUNCTION get_voice_searches_remaining IS 'Returns number of voice searches remaining today';

-- ============================================================
-- 4. AUTO-UPDATE TRIGGER FOR updated_at
-- ============================================================

CREATE TRIGGER update_voice_search_usage_updated_at
  BEFORE UPDATE ON voice_search_usage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- 5. ROW LEVEL SECURITY FOR VOICE_SEARCH_USAGE
-- ============================================================

ALTER TABLE voice_search_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own voice search usage"
  ON voice_search_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RAV team can view all usage (for analytics)
CREATE POLICY "RAV team can view all voice search usage"
  ON voice_search_usage FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));

-- Only functions can insert/update (via SECURITY DEFINER)
-- No direct INSERT/UPDATE policies needed

-- ============================================================
-- 6. CLEANUP FUNCTION (Optional - for old data)
-- ============================================================

-- Function to clean up old usage records (>90 days)
CREATE OR REPLACE FUNCTION cleanup_old_voice_usage()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM voice_search_usage
  WHERE search_date < CURRENT_DATE - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_voice_usage IS 'Deletes voice usage records older than 90 days';

-- Note: Set up a CRON job in Supabase to run this weekly
```

**Deploy Migration:**
```bash
npx supabase db push --project-ref oukbxqnlxnkainnligfz
```

---

### **Task 2: Create useVoiceQuota Custom Hook**

**File:** `src/hooks/useVoiceQuota.ts`

```typescript
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface VoiceQuota {
  remaining: number;
  isUnlimited: boolean;
  canSearch: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useVoiceQuota(): VoiceQuota {
  const { user, isRavTeam } = useAuth();
  const [remaining, setRemaining] = useState<number>(10);
  const [loading, setLoading] = useState(true);

  const fetchQuota = async () => {
    if (!user) {
      setRemaining(0);
      setLoading(false);
      return;
    }

    try {
      // RAV team has unlimited
      if (isRavTeam()) {
        setRemaining(999);
        setLoading(false);
        return;
      }

      // Fetch remaining searches
      const { data, error } = await supabase.rpc("get_voice_searches_remaining", {
        _user_id: user.id,
      });

      if (error) {
        console.error("Error fetching voice quota:", error);
        setRemaining(0);
      } else {
        setRemaining(data || 0);
      }
    } catch (error) {
      console.error("Voice quota fetch error:", error);
      setRemaining(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, [user]);

  return {
    remaining,
    isUnlimited: remaining === 999,
    canSearch: remaining > 0,
    loading,
    refresh: fetchQuota,
  };
}
```

---

### **Task 3: Update useVoiceSearch Hook with Quota Check**

**File:** `src/hooks/useVoiceSearch.ts`

**Modify the existing hook to add quota checking:**

```typescript
import { useVoiceQuota } from "./useVoiceQuota";
import { toast } from "sonner";

export function useVoiceSearch() {
  // ... existing state ...
  const { user } = useAuth();
  const { remaining, canSearch, refresh: refreshQuota } = useVoiceQuota();

  const startVoiceSearch = async () => {
    if (!user) {
      setStatus("error");
      setError("Please sign in to use voice search");
      return;
    }

    // NEW: Check quota before starting
    if (!canSearch) {
      setStatus("error");
      setError("Daily voice search limit reached (10 searches). Try again tomorrow!");
      toast.error("Daily limit reached", {
        description: "You've used all 10 voice searches today. Reset at midnight UTC.",
      });
      return;
    }

    try {
      // ... existing VAPI start logic ...
      
      // After successful search completes, increment counter
      await supabase.rpc("increment_voice_search_count", {
        _user_id: user.id,
      });

      // Refresh quota display
      await refreshQuota();
      
    } catch (error) {
      // ... existing error handling ...
    }
  };

  return {
    // ... existing returns ...
    voiceQuotaRemaining: remaining,
    voiceQuotaRefresh: refreshQuota,
  };
}
```

---

### **Task 4: Create VoiceQuotaIndicator Component**

**File:** `src/components/VoiceQuotaIndicator.tsx`

```typescript
import { useVoiceQuota } from "@/hooks/useVoiceQuota";
import { Badge } from "@/components/ui/badge";
import { Mic, Infinity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function VoiceQuotaIndicator() {
  const { remaining, isUnlimited, loading } = useVoiceQuota();

  if (loading) {
    return <Skeleton className="h-5 w-32" />;
  }

  if (isUnlimited) {
    return (
      <Badge variant="secondary" className="text-xs">
        <Infinity className="w-3 h-3 mr-1" />
        Unlimited searches
      </Badge>
    );
  }

  const variant = remaining === 0 
    ? "destructive" 
    : remaining <= 3 
      ? "warning" 
      : "secondary";

  return (
    <Badge variant={variant} className="text-xs">
      <Mic className="w-3 h-3 mr-1" />
      {remaining} {remaining === 1 ? "search" : "searches"} remaining today
    </Badge>
  );
}
```

---

### **Task 5: Update Rentals Page with Quota Indicator**

**File:** `src/pages/Rentals.tsx`

**Add the quota indicator near the voice search button:**

```typescript
import { VoiceQuotaIndicator } from "@/components/VoiceQuotaIndicator";

export default function Rentals() {
  // ... existing code ...

  return (
    <div>
      {/* Search bar with voice button */}
      <div className="flex items-center gap-3">
        {voiceEnabled && (
          <>
            <VoiceSearchButton
              isListening={isListening}
              isProcessing={voiceStatus === "processing"}
              onClick={handleVoiceToggle}
              disabled={!isAuthenticated}
              disabledReason={!isAuthenticated ? "Sign in to use voice search" : undefined}
            />
            {isAuthenticated && <VoiceQuotaIndicator />}
          </>
        )}
      </div>
      
      {/* Rest of page */}
    </div>
  );
}
```

---

### **Task 6: Create useSystemSettings Hook**

**File:** `src/hooks/useSystemSettings.ts`

```typescript
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";

interface SystemSettings {
  requireUserApproval: boolean;
  loading: boolean;
  updateSetting: (key: string, value: any) => Promise<void>;
}

export function useSystemSettings(): SystemSettings {
  const { isRavTeam } = useAuth();
  const [requireUserApproval, setRequireUserApproval] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_value")
        .eq("setting_key", "require_user_approval")
        .single();

      if (error) throw error;

      setRequireUserApproval(data.setting_value.enabled);
    } catch (error) {
      console.error("Error fetching system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isRavTeam()) {
      fetchSettings();
    }
  }, [isRavTeam]);

  const updateSetting = async (key: string, value: any) => {
    if (!isRavTeam()) {
      throw new Error("Only RAV team can update system settings");
    }

    try {
      const { error } = await supabase
        .from("system_settings")
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
        })
        .eq("setting_key", key);

      if (error) throw error;

      // Refresh local state
      await fetchSettings();
    } catch (error) {
      console.error("Error updating system setting:", error);
      throw error;
    }
  };

  return {
    requireUserApproval,
    loading,
    updateSetting,
  };
}
```

---

### **Task 7: Create SystemSettings Admin Component**

**File:** `src/components/admin/SystemSettings.tsx`

```typescript
import { useState } from "react";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SystemSettings() {
  const { requireUserApproval, loading, updateSetting } = useSystemSettings();
  const [localApprovalSetting, setLocalApprovalSetting] = useState(requireUserApproval);
  const [saving, setSaving] = useState(false);

  // Sync local state when loaded
  useEffect(() => {
    setLocalApprovalSetting(requireUserApproval);
  }, [requireUserApproval]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSetting("require_user_approval", { enabled: localApprovalSetting });
      toast.success("System settings updated successfully");
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast.error("Failed to update settings");
      // Revert local state
      setLocalApprovalSetting(requireUserApproval);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = localApprovalSetting !== requireUserApproval;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <CardTitle>System Settings</CardTitle>
        <CardDescription>
          Configure platform-wide settings and behavior
        </CardDescription>
      </CardHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-base">User Registration</CardTitle>
              <CardDescription className="text-sm">
                Control how new users are onboarded
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-approval" className="text-base">
                Require approval for new users
              </Label>
              <p className="text-sm text-gray-600">
                When enabled, new signups must be approved by RAV admin before they can access the platform
              </p>
            </div>
            <Switch
              id="require-approval"
              checked={localApprovalSetting}
              onCheckedChange={setLocalApprovalSetting}
            />
          </div>

          {localApprovalSetting ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Approval Mode Active</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• New users will see "Pending Approval" page after signup</li>
                <li>• Admins must manually approve each new user</li>
                <li>• Approval notifications sent via email</li>
                <li>• Existing users and RAV team are unaffected</li>
              </ul>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-amber-900 mb-2">Open Registration Active</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• New users get instant access after signup</li>
                <li>• No admin approval required</li>
                <li>• Use this for public launch</li>
              </ul>
            </div>
          )}

          {hasChanges && (
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocalApprovalSetting(requireUserApproval)}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Future settings can be added here as new cards */}
    </div>
  );
}
```

---

### **Task 8: Add System Settings Tab to Admin Dashboard**

**File:** `src/pages/AdminDashboard.tsx`

```typescript
import { SystemSettings } from "@/components/admin/SystemSettings";

export default function AdminDashboard() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="pending-approvals">Pending Approvals</TabsTrigger>
        {/* ... other tabs ... */}
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      {/* ... other tab content ... */}

      <TabsContent value="settings">
        <SystemSettings />
      </TabsContent>
    </Tabs>
  );
}
```

---

### **Task 9: Test Complete System**

**Test Case 1: Voice Quota Enforcement**
1. Login as regular user (not RAV team)
2. Visit `/rentals`
3. ✅ See "10 searches remaining today" badge
4. Use voice search 10 times
5. ✅ Badge updates: "9 remaining", "8 remaining", etc.
6. After 10th search:
   - ✅ Badge shows "0 searches remaining today"
   - ✅ Voice button disabled with error message
   - ✅ Toast: "Daily limit reached"
7. Try clicking voice button
   - ✅ Nothing happens (disabled)

**Test Case 2: Quota Reset**
1. Change system date to tomorrow (or wait until midnight UTC)
2. Refresh page
3. ✅ Badge shows "10 searches remaining today" again
4. ✅ Voice button enabled

**Test Case 3: RAV Team Unlimited**
1. Login as RAV admin
2. Visit `/rentals`
3. ✅ Badge shows "Unlimited searches" with infinity icon
4. Use voice search multiple times
5. ✅ Badge stays "Unlimited"
6. ✅ No quota enforcement

**Test Case 4: Admin Toggle - Turn OFF Approval**
1. Login as RAV admin
2. Visit `/admin` → "Settings" tab
3. Toggle "Require approval for new users" to OFF
4. ✅ Warning message appears about open registration
5. Click "Save Changes"
6. ✅ Success toast
7. Logout and create new test user
8. ✅ New user gets instant access (no pending page)
9. ✅ New user has approval_status = 'approved' in database

**Test Case 5: Admin Toggle - Turn ON Approval**
1. Admin toggles back to ON
2. ✅ Save succeeds
3. Create another new user
4. ✅ New user gets approval_status = 'pending_approval'
5. ✅ Redirected to pending approval page

**Test Case 6: Quota at Limit Edge Case**
1. User with 9 searches used
2. Start voice search
3. ✅ Search completes successfully
4. ✅ Badge updates to "0 remaining"
5. ✅ Button becomes disabled immediately
6. Try starting another search
7. ✅ Error: "Daily limit reached"

---

## Deliverables (Handoff Package)

Create TWO files in the handoffs folder:

1. **`handoffs/phase3-handoff.md`** - Detailed technical handoff
2. **`handoffs/phase3-hub-template.md`** - Copy-paste template for PROJECT-HUB.md update

---

### File 1: `handoffs/phase3-handoff.md`

```markdown
# Phase 3: Usage Limits & Admin Toggle - Handoff Package

**Completed:** [Date]  
**Duration:** [Actual time]  
**Status:** ✅ Complete / ⚠️ Issues found

---

## Changes Made

### **Database**

**Migration File:** `supabase/migrations/008_voice_usage_limits.sql`

**Changes:**
- Created voice_search_usage table
- Added quota management functions:
  - increment_voice_search_count()
  - get_voice_search_count()
  - can_use_voice_search()
  - get_voice_searches_remaining()
- Added RLS policies
- Created cleanup_old_voice_usage() function

### **Frontend Hooks**

**New Hooks:**
1. `src/hooks/useVoiceQuota.ts` - Manages voice search quota state
2. `src/hooks/useSystemSettings.ts` - Manages system-wide settings

**Modified Hooks:**
1. `src/hooks/useVoiceSearch.ts` - Added quota checking before starting

### **Frontend Components**

**New Components:**
1. `src/components/VoiceQuotaIndicator.tsx` - Shows remaining searches
2. `src/components/admin/SystemSettings.tsx` - Admin settings panel

**Modified Files:**
1. `src/pages/Rentals.tsx` - Added quota indicator
2. `src/pages/AdminDashboard.tsx` - Added "Settings" tab

---

## Test Results

### **Quota Enforcement**
- [✅/❌] Users see remaining searches
- [✅/❌] Counter decrements after each search
- [✅/❌] Button disabled at 0 remaining
- [✅/❌] Error message shows at limit
- [✅/❌] Quota resets at midnight UTC

### **RAV Team Bypass**
- [✅/❌] RAV team sees "Unlimited"
- [✅/❌] No quota enforcement for RAV team
- [✅/❌] Counter not incremented for RAV team

### **Admin Toggle**
- [✅/❌] Toggle switches between ON/OFF
- [✅/❌] Warning messages display correctly
- [✅/❌] Save button works
- [✅/❌] New users respect current setting

### **Edge Cases**
- [✅/❌] User at 9 searches can complete 10th
- [✅/❌] Multiple tabs don't bypass quota
- [✅/❌] Quota refresh after search

---

## Known Issues

[List any bugs discovered]

Example:
- None found ✅
OR
- Quota indicator sometimes takes 1-2 seconds to update after search
- Midnight UTC reset needs confirmation (couldn't test date change)

---

## Database Verification

```sql
-- Check usage records
SELECT user_id, search_date, search_count 
FROM voice_search_usage 
ORDER BY search_date DESC 
LIMIT 10;

-- Test quota functions
SELECT get_voice_search_count('user-uuid-here');
SELECT get_voice_searches_remaining('user-uuid-here');
SELECT can_use_voice_search('user-uuid-here');

-- Check system setting
SELECT * FROM system_settings WHERE setting_key = 'require_user_approval';
```

---

## Cost Savings Analysis

**Before Protection (Worst Case):**
- 100 users × 100 searches/day = 10,000 searches
- Cost: 10,000 × $0.10 = $1,000/day ($30K/month)

**After Phase 3 (Realistic):**
- 100 users × 10 searches/day = 1,000 searches
- Cost: 1,000 × $0.10 = $100/day ($3K/month)

**Savings:** $27K/month or 90% cost reduction ✅

---

## Performance Metrics

**Average Response Times:**
- `get_voice_searches_remaining()`: ~15ms
- `increment_voice_search_count()`: ~25ms
- `can_use_voice_search()`: ~20ms

**Database Impact:**
- voice_search_usage table: ~2 KB per user per day
- 100 users × 365 days = ~73 MB per year (negligible)

---

## Next Steps (Post-MVP)

**Potential Future Enhancements:**
- [ ] Analytics dashboard for usage patterns
- [ ] Weekly quota option (70 searches/week)
- [ ] Paid tiers (Pro: 100 searches/day, Unlimited: $X/month)
- [ ] Grace period (1 extra search after limit)
- [ ] Email notification when quota reached
- [ ] CRON job to auto-cleanup old usage data (>90 days)

---

## Deployment Notes

**Environment Variables:** No new variables needed

**Database Changes:**
- Migration 008 must be applied

**Breaking Changes:** None - gracefully adds quota system

**Rollback Plan:**
- Set all users' quota to 999 (unlimited)
- OR drop voice_search_usage table
- Existing functionality unaffected

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Phase 1 deployed and tested
- [ ] Phase 2 deployed and tested
- [ ] Phase 3 migrations applied to PROD database
- [ ] All test cases passed
- [ ] Cost monitoring set up
- [ ] Admin has tested toggle in PROD
- [ ] Documentation updated
- [ ] Users notified of quota limits (if public)

---

## Screenshots

[Add screenshots of:]
1. Quota indicator showing "10 remaining"
2. Quota indicator at 0 (limit reached)
3. RAV team "Unlimited" badge
4. Admin settings page with toggle
5. Warning messages for ON/OFF states
```

---

### File 2: `handoffs/phase3-hub-template.md`

```markdown
# PROJECT-HUB.md Update - Phase 3

**Instructions:** Copy the sections below into PROJECT-HUB.md after reviewing phase3-handoff.md

---

## UPDATE: Current Status Section

**Last Deployment:** Phase 3 (Voice Usage Limits) - [Today's Date]
**Working on TODAY:** UI Fixes & Content Polish

---

## MOVE TO: Completed Phases Section

### Phase 4.1: Voice Auth & Approval System ✅
**Completed:** [Today's Date]
**Status:** LIVE in production
**Docs:** `docs/features/voice-auth-approval/`

**Three-Phase Rollout:**
- **Phase 1:** Authentication gate for voice search (35 min)
- **Phase 2:** Admin-controlled user approval system (2.5 hours)
- **Phase 3:** Voice usage limits + system settings toggle (2.5 hours)

**Delivered:**
- ✅ Voice button disabled for unauthenticated users
- ✅ New signups require admin approval
- ✅ Pending Approval page + email notifications
- ✅ Admin approval dashboard with approve/reject
- ✅ 10 voice searches per day quota
- ✅ Real-time quota indicator in UI
- ✅ System Settings page with approval toggle
- ✅ RAV team bypasses all restrictions

**Impact:**
- **API Cost Protection:** $27K/month savings (90% reduction) 💰
- **Voice abuse prevention:** QUOTA ENFORCED ✅
- **Beta access control:** FULL ADMIN CONTROL ✅
- **User experience:** SEAMLESS (tooltips, quotas, notifications) ✅

**Technical Implementation:**
- 3 database migrations (007, 008)
- 1 Edge Function (send-approval-email)
- 6 new components (PendingApproval, PendingApprovals, SystemSettings, VoiceQuotaIndicator, + modified VoiceSearchButton)
- 4 new hooks (useVoiceQuota, useSystemSettings, + modified useVoiceSearch + useAuth enhancements)
- Comprehensive test coverage (all 3 phases)

**Cost Analysis:**
- Before: $30K/month (worst case, no limits)
- After: $3K/month (realistic with quotas)
- **Savings: $27K/month or 90%** 🎯

**Known Issues:** None - all tests passed ✅

---

## UPDATE: Top 3 Priorities Section

[Remove Voice Auth items 1-3, they're done]

### 1. Fix Broken UI Elements (Next - 2-3 hours)
**Status:** 🔴 Not Started
**Priority:** HIGH

**Issues to fix:**
- [ ] "I am flexible" calendar - Currently non-functional
- [ ] Pagination on "All Resorts" - Static links
- [ ] Favorites functionality - Missing save capability

---

### 2. Replace Placeholder Content (1-2 hours)
[Keep as-is]

---

### 3. [Next priority item]
[Add if applicable]
```

---

## Success Criteria

Before marking Phase 3 complete, verify:

- ✅ Database migration deployed successfully
- ✅ voice_search_usage table created
- ✅ Quota functions working correctly
- ✅ Quota indicator shows in UI
- ✅ Voice button disabled at limit
- ✅ RAV team bypasses quota
- ✅ Admin settings page created
- ✅ Toggle works correctly
- ✅ All test cases passed
- ✅ Cost savings validated
- ✅ **Both handoff documents created** (phase3-handoff.md AND phase3-hub-template.md)
- ✅ Code committed to git

---

## Git Commit Message Template

```
feat(voice): implement usage limits and admin controls

Database:
- Add voice_search_usage table
- Create quota management functions
- Add RLS policies for usage tracking

Frontend:
- Create useVoiceQuota hook
- Create VoiceQuotaIndicator component
- Add quota checking to useVoiceSearch
- Create SystemSettings admin component
- Update AdminDashboard with Settings tab

Features:
- 10 voice searches per day per user
- Quota resets at midnight UTC
- RAV team gets unlimited searches
- Admin toggle for approval requirement
- Real-time quota display in UI

Cost Impact: Reduces worst-case cost from $30K/month to $3K/month

Related: Phase 3 of Voice Auth & Approval System
```

---

**Ready to start? Confirm you've received the Project Brief, Phase 1 handoff, and Phase 2 handoff, then begin Task 1.**
