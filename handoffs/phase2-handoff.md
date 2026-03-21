---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Phase 2: User Approval System - Handoff Package

**Completed:** 2026-02-11
**Status:** Complete

---

## Changes Made

### Database

**Migration File:** `supabase/migrations/007_voice_auth_approval.sql`

**Changes:**
- Added `approval_status`, `approved_by`, `approved_at`, `rejection_reason` columns to profiles
- Created `system_settings` table with RLS policies
- Created helper functions: `can_access_platform()`, `approve_user()`, `reject_user()`
- Updated `handle_new_user()` trigger to set `approval_status = 'pending_approval'` for new signups
- Migrated existing users to `approved` status
- Added indexes for approval queries

### Edge Functions

**New Function:** `supabase/functions/send-approval-email/index.ts`
- Sends approval/rejection email notifications
- Uses Resend API (same pattern as existing `send-email` function)
- HTML email templates for both approved and rejected states

### Frontend Components

**New Pages:**
1. `src/pages/PendingApproval.tsx` — Users awaiting approval see this page
2. `src/components/admin/PendingApprovals.tsx` — Admin approval dashboard component

**Modified Files:**
1. `src/App.tsx` — Added `ProtectedRoute` wrapper, `/pending-approval` route, wrapped protected routes
2. `src/pages/AdminDashboard.tsx` — Added "Approvals" tab with pending count badge
3. `src/types/database.ts` — Added `ApprovalStatus` type, approval fields to Profile, `system_settings` table, new functions

---

## Route Protection

### Public Routes (no auth required)
- `/` (home), `/how-it-works`, `/property/:id`, `/login`, `/signup`
- `/destinations`, `/faq`, `/terms`, `/privacy`
- `/pending-approval`, `/documentation`, `/user-guide`

### Protected Routes (require approved account)
- `/rentals`, `/list-property`, `/owner-dashboard`
- `/bidding`, `/my-bids`, `/booking-success`, `/checkin`

### Special Routes
- `/admin` — Has its own RAV team check (not wrapped in ProtectedRoute)

### ProtectedRoute Behavior
1. Unauthenticated user → redirected to `/login`
2. Pending approval user → redirected to `/pending-approval`
3. RAV team → always has access (bypasses approval check)
4. Approved user → normal access

---

## Test Checklist

### Signup Flow
- [ ] New user gets `approval_status = 'pending_approval'`
- [ ] Redirected to `/pending-approval` page
- [ ] Blocked from protected routes (`/rentals`, `/bidding`, etc.)
- [ ] Can still access public routes

### Admin Approval
- [ ] Admin sees pending users in "Approvals" tab
- [ ] Badge shows correct pending count
- [ ] Approve button works (calls `approve_user` RPC)
- [ ] Reject dialog works with optional reason
- [ ] Email notifications sent via `send-approval-email`

### Approved User Access
- [ ] Approved user can access `/rentals` and all protected routes
- [ ] No longer sees pending page

### Edge Cases
- [ ] RAV team bypasses approval requirement
- [ ] Existing users migrated to `approved` (migration step 3)
- [ ] Rejected users stay blocked
- [ ] Badge count refreshes every 30 seconds

---

## Database Verification Queries

```sql
-- Check approval statuses
SELECT approval_status, COUNT(*)
FROM profiles
GROUP BY approval_status;

-- Check system setting
SELECT * FROM system_settings WHERE setting_key = 'require_user_approval';

-- Check pending users
SELECT email, full_name, created_at
FROM profiles
WHERE approval_status = 'pending_approval';
```

---

## Deployment Notes

**Environment Variables:**
- Ensure `RESEND_API_KEY` is set in Supabase Edge Function secrets
- Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` available to Edge Functions

**Database Changes:**
- Migration `007_voice_auth_approval.sql` must be applied before deploying frontend
- Run: `npx supabase db push --project-ref <PROJECT_REF>`

**Edge Function Deployment:**
- Deploy: `npx supabase functions deploy send-approval-email --project-ref <PROJECT_REF>`

**Breaking Changes:**
- New signups now require admin approval
- Protected routes now require authentication and approved status
- `/rentals` is no longer publicly accessible (requires login + approval)

**Rollback Plan:**
1. Set all pending users to `approved`: `UPDATE profiles SET approval_status = 'approved' WHERE approval_status = 'pending_approval';`
2. Update `system_settings`: `UPDATE system_settings SET setting_value = '{"enabled": false}' WHERE setting_key = 'require_user_approval';`
3. Remove `ProtectedRoute` wrapper from routes in `App.tsx`

---

## Next Steps for Phase 3

Phase 3 will implement:
- Voice usage limits (searches/day)
- Admin toggle to turn approval ON/OFF
- Voice quota indicator in UI
- `voice_search_usage` tracking table

**Dependencies:**
- Phase 2 must be tested and deployed
- All pending user test cases must pass
