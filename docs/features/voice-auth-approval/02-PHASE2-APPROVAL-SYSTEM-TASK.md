---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# PHASE 2: User Approval System

**Role:** Full-Stack Engineer (Backend + Frontend + Admin UI)  
**Duration:** 2-3 hours  
**Mission:** Implement admin-controlled user approval system  
**Dependencies:** Phase 1 must be complete  
**Environment:** Supabase DEV → Production

---

## Your Responsibilities

You are implementing the **second layer of protection** - user approval:

1. ✅ Create database migration for approval system
2. ✅ Update signup trigger to set approval_status = 'pending_approval'
3. ✅ Create `/pending-approval` page for users awaiting approval
4. ✅ Add route protection middleware
5. ✅ Create admin "Pending Approvals" tab in AdminDashboard
6. ✅ Implement approve/reject actions
7. ✅ Create email notification Edge Function
8. ✅ Test complete approval flow
9. ✅ Create handoff document

---

## Context You Need

**Read these documents first:**
1. **Project Brief** - The master architecture document
2. **Phase 1 Handoff** - Authentication gate is now in place
3. **Existing Admin Dashboard** - `src/pages/AdminDashboard.tsx` has tabs already

**Key Information:**
- Profiles table already exists with trigger that creates profile on signup
- RAV team role check function `is_rav_team()` already exists
- Admin dashboard uses shadcn tabs component
- Email system uses Resend via Edge Functions (see `send-email` function)

---

## Task Breakdown

### **Task 1: Database Migration**

**File:** `supabase/migrations/007_voice_auth_approval.sql`

Create this new migration file with:

```sql
-- ============================================================
-- VOICE AUTH & APPROVAL SYSTEM
-- Migration 007
-- ============================================================

-- ============================================================
-- 1. ADD APPROVAL COLUMNS TO PROFILES TABLE
-- ============================================================

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_approval' 
  CHECK (approval_status IN ('pending_approval', 'approved', 'rejected'));

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN profiles.approval_status IS 'User approval status for platform access';
COMMENT ON COLUMN profiles.approved_by IS 'RAV team member who approved/rejected the user';
COMMENT ON COLUMN profiles.approved_at IS 'Timestamp when user was approved';
COMMENT ON COLUMN profiles.rejection_reason IS 'Optional reason for rejection';

-- ============================================================
-- 2. CREATE INDEXES FOR APPROVAL QUERIES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_profiles_approval_status 
  ON profiles(approval_status);

CREATE INDEX IF NOT EXISTS idx_profiles_approved_at 
  ON profiles(approved_at DESC);

-- ============================================================
-- 3. MIGRATE EXISTING USERS TO 'APPROVED' STATUS
-- ============================================================

-- Approve all existing users (they signed up before this system)
UPDATE profiles 
SET approval_status = 'approved', 
    approved_at = NOW() 
WHERE approval_status = 'pending_approval';

-- ============================================================
-- 4. UPDATE SIGNUP TRIGGER TO SET PENDING STATUS
-- ============================================================

-- Modify existing handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'pending_approval'  -- NEW: Default to pending
  );
  
  -- Default role: renter
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'renter');
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- 5. CREATE SYSTEM SETTINGS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default setting: Approval required = ON
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES (
  'require_user_approval',
  '{"enabled": true}'::jsonb,
  'When enabled, new user signups must be approved by RAV admin before they can access the platform'
)
ON CONFLICT (setting_key) DO NOTHING;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key 
  ON system_settings(setting_key);

-- ============================================================
-- 6. CREATE HELPER FUNCTIONS
-- ============================================================

-- Function to check if user can access platform
CREATE OR REPLACE FUNCTION can_access_platform(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approval_required BOOLEAN;
  user_status TEXT;
  user_is_rav_team BOOLEAN;
BEGIN
  -- Check if approval is required
  SELECT (setting_value->>'enabled')::boolean INTO approval_required
  FROM system_settings
  WHERE setting_key = 'require_user_approval';
  
  -- If approval not required, everyone can access
  IF approval_required IS NULL OR NOT approval_required THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is RAV team (they always have access)
  user_is_rav_team := public.is_rav_team(_user_id);
  IF user_is_rav_team THEN
    RETURN TRUE;
  END IF;
  
  -- Check user approval status
  SELECT approval_status INTO user_status
  FROM profiles
  WHERE id = _user_id;
  
  RETURN user_status = 'approved';
END;
$$;

-- Function to approve user
CREATE OR REPLACE FUNCTION approve_user(
  _user_id UUID,
  _approved_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify approver is RAV team
  IF NOT public.is_rav_team(_approved_by) THEN
    RAISE EXCEPTION 'Only RAV team members can approve users';
  END IF;
  
  -- Update user status
  UPDATE profiles
  SET 
    approval_status = 'approved',
    approved_by = _approved_by,
    approved_at = NOW(),
    rejection_reason = NULL
  WHERE id = _user_id;
  
  RETURN FOUND;
END;
$$;

-- Function to reject user
CREATE OR REPLACE FUNCTION reject_user(
  _user_id UUID,
  _rejected_by UUID,
  _reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify rejector is RAV team
  IF NOT public.is_rav_team(_rejected_by) THEN
    RAISE EXCEPTION 'Only RAV team members can reject users';
  END IF;
  
  -- Update user status
  UPDATE profiles
  SET 
    approval_status = 'rejected',
    approved_by = _rejected_by,
    approved_at = NOW(),
    rejection_reason = _reason
  WHERE id = _user_id;
  
  RETURN FOUND;
END;
$$;

-- ============================================================
-- 7. ROW LEVEL SECURITY FOR SYSTEM SETTINGS
-- ============================================================

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read system settings
CREATE POLICY "Anyone can read system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only RAV team can update system settings
CREATE POLICY "Only RAV team can update system settings"
  ON system_settings FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- ============================================================
-- 8. UPDATE PROFILES RLS TO ALLOW APPROVAL STATUS QUERIES
-- ============================================================

-- RAV team can see all profiles (for approval dashboard)
-- This policy may already exist, but let's ensure it
CREATE POLICY IF NOT EXISTS "RAV team can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_rav_team(auth.uid()));
```

**Deploy Migration:**
```bash
# IMPORTANT: Use npx supabase (Windows requirement)
npx supabase db push --project-ref oukbxqnlxnkainnligfz
```

---

### **Task 2: Create Edge Function for Approval Emails**

**File:** `supabase/functions/send-approval-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ApprovalEmailRequest {
  user_id: string;
  action: "approved" | "rejected";
  rejection_reason?: string;
}

serve(async (req) => {
  // CORS handling
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { user_id, action, rejection_reason }: ApprovalEmailRequest = await req.json();

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user_id)
      .single();

    if (profileError || !profile) {
      throw new Error("User not found");
    }

    // Prepare email based on action
    let subject: string;
    let html: string;

    if (action === "approved") {
      subject = "Your Rent-A-Vacation account has been approved! 🎉";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              background: #3b82f6; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px;
              margin: 20px 0;
            }
            .features { list-style: none; padding: 0; }
            .features li { padding: 8px 0; }
            .features li:before { content: "✓ "; color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Rent-A-Vacation!</h1>
            </div>
            <div class="content">
              <p>Hi ${profile.full_name || "there"},</p>
              
              <p><strong>Great news!</strong> Your account has been approved and you now have full access to Rent-A-Vacation.</p>
              
              <h3>You can now:</h3>
              <ul class="features">
                <li>Browse and book vacation rentals</li>
                <li>Use voice search to find properties</li>
                <li>Create bids and travel requests</li>
                <li>List your own timeshare properties</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="https://rent-a-vacation.com/rentals" class="button">Start Browsing Rentals</a>
              </div>
              
              <p>If you have any questions, just reply to this email or visit our <a href="https://rent-a-vacation.com/faq">FAQ page</a>.</p>
              
              <p>Happy travels!<br>
              The Rent-A-Vacation Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      subject = "Update on your Rent-A-Vacation account";
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Account Update</h1>
            </div>
            <div class="content">
              <p>Hi ${profile.full_name || "there"},</p>
              
              <p>Thank you for your interest in Rent-A-Vacation.</p>
              
              <p>Unfortunately, we're unable to approve your account at this time.</p>
              
              ${rejection_reason ? `<p><strong>Reason:</strong> ${rejection_reason}</p>` : ""}
              
              <p>If you believe this is an error or have questions, please reply to this email and we'll be happy to help.</p>
              
              <p>Best regards,<br>
              The Rent-A-Vacation Team</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rent-A-Vacation <noreply@rent-a-vacation.com>",
        to: [profile.email],
        subject,
        html,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Resend API error: ${error}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: true,
        action,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("[APPROVAL-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
```

**Deploy Edge Function:**
```bash
# Deploy to DEV
npx supabase functions deploy send-approval-email --project-ref oukbxqnlxnkainnligfz

# Test with curl
curl -X POST \
  "https://oukbxqnlxnkainnligfz.supabase.co/functions/v1/send-approval-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ANON_KEY>" \
  -d '{"user_id": "test-uuid", "action": "approved"}'
```

---

### **Task 3: Create Pending Approval Page**

**File:** `src/pages/PendingApproval.tsx`

```typescript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Mail, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingApproval() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is approved or not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (profile?.approval_status === "approved") {
      navigate("/rentals");
    }
  }, [user, profile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account is currently being reviewed by our team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-sm">Why the wait?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We're currently in beta and carefully reviewing all new accounts to ensure the best experience for our community.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-sm">What happens next?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  You'll receive an email at <strong>{profile?.email}</strong> within 24 hours once your account is approved.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Questions? Contact us at{" "}
              <a href="mailto:support@rent-a-vacation.com" className="text-blue-600 hover:underline">
                support@rent-a-vacation.com
              </a>
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => signOut()}
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### **Task 4: Add Route Protection**

**File:** `src/App.tsx`

Update the router to protect routes and redirect pending users:

```typescript
import { useAuth } from "@/hooks/useAuth";
import PendingApproval from "@/pages/PendingApproval";
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Create a ProtectedRoute component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isRavTeam } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // RAV team always has access
    if (isRavTeam()) {
      return;
    }

    // Check approval status
    if (profile?.approval_status === "pending_approval") {
      navigate("/pending-approval");
    }
  }, [user, profile, isRavTeam, navigate, location]);

  // Show nothing while checking (prevents flash of content)
  if (!user || (!isRavTeam() && profile?.approval_status !== "approved")) {
    return null;
  }

  return <>{children}</>;
}

// In your routes, wrap protected pages:
<Route path="/rentals" element={<ProtectedRoute><Rentals /></ProtectedRoute>} />
<Route path="/list-property" element={<ProtectedRoute><ListProperty /></ProtectedRoute>} />
<Route path="/bidding" element={<ProtectedRoute><BiddingMarketplace /></ProtectedRoute>} />
<Route path="/my-bids" element={<ProtectedRoute><MyBidsDashboard /></ProtectedRoute>} />
<Route path="/owner-dashboard" element={<ProtectedRoute><OwnerDashboard /></ProtectedRoute>} />

// Add pending approval route (NOT protected)
<Route path="/pending-approval" element={<PendingApproval />} />
```

---

### **Task 5: Create Admin Pending Approvals Component**

**File:** `src/components/admin/PendingApprovals.tsx`

```typescript
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  approval_status: string;
}

export function PendingApprovals() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; userId: string | null }>({
    open: false,
    userId: null,
  });
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending users
  const fetchPendingUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at, approval_status")
      .eq("approval_status", "pending_approval")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching pending users:", error);
      toast.error("Failed to load pending users");
    } else {
      setPendingUsers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Approve user
  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    try {
      // Call the approve_user function
      const { error: approveError } = await supabase.rpc("approve_user", {
        _user_id: userId,
        _approved_by: user?.id,
      });

      if (approveError) throw approveError;

      // Send approval email
      const { error: emailError } = await supabase.functions.invoke("send-approval-email", {
        body: { user_id: userId, action: "approved" },
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        toast.warning("User approved, but email notification failed");
      }

      toast.success("User approved successfully");
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error("Approval error:", error);
      toast.error("Failed to approve user");
    } finally {
      setActionLoading(null);
    }
  };

  // Reject user
  const handleReject = async () => {
    if (!rejectDialog.userId) return;

    setActionLoading(rejectDialog.userId);
    try {
      // Call the reject_user function
      const { error: rejectError } = await supabase.rpc("reject_user", {
        _user_id: rejectDialog.userId,
        _rejected_by: user?.id,
        _reason: rejectionReason || null,
      });

      if (rejectError) throw rejectError;

      // Send rejection email
      const { error: emailError } = await supabase.functions.invoke("send-approval-email", {
        body: {
          user_id: rejectDialog.userId,
          action: "rejected",
          rejection_reason: rejectionReason,
        },
      });

      if (emailError) {
        console.error("Email send error:", emailError);
        toast.warning("User rejected, but email notification failed");
      }

      toast.success("User rejected");
      setRejectDialog({ open: false, userId: null });
      setRejectionReason("");
      fetchPendingUsers(); // Refresh list
    } catch (error) {
      console.error("Rejection error:", error);
      toast.error("Failed to reject user");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">All caught up!</h3>
          <p className="text-sm text-gray-600">No pending user approvals at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle>Pending User Approvals</CardTitle>
        <CardDescription>
          Review and approve new user signups ({pendingUsers.length} pending)
        </CardDescription>
      </CardHeader>

      <div className="space-y-3">
        {pendingUsers.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{user.full_name || "No name provided"}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(user.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApprove(user.id)}
                  disabled={actionLoading !== null}
                >
                  {actionLoading === user.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setRejectDialog({ open: true, userId: user.id })}
                  disabled={actionLoading !== null}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog({ open, userId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject User</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this user? They will be notified via email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="rejection-reason">Reason (optional)</Label>
            <Textarea
              id="rejection-reason"
              placeholder="e.g., Suspicious activity, incomplete information, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, userId: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading !== null}>
              {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

### **Task 6: Add Pending Approvals Tab to Admin Dashboard**

**File:** `src/pages/AdminDashboard.tsx`

Find the existing tabs list and add the new tab:

```typescript
import { PendingApprovals } from "@/components/admin/PendingApprovals";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const [pendingCount, setPendingCount] = useState(0);

  // Fetch pending count for badge
  useEffect(() => {
    const fetchPendingCount = async () => {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("approval_status", "pending_approval");
      
      setPendingCount(count || 0);
    };

    fetchPendingCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="users">Users</TabsTrigger>
        <TabsTrigger value="pending-approvals">
          Pending Approvals
          {pendingCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingCount}
            </Badge>
          )}
        </TabsTrigger>
        {/* ... other tabs ... */}
      </TabsList>

      {/* ... other tab content ... */}

      <TabsContent value="pending-approvals">
        <PendingApprovals />
      </TabsContent>
    </Tabs>
  );
}
```

---

### **Task 7: Test the Complete Flow**

**Test Case 1: New User Signup**
1. Logout completely
2. Visit `/signup` and create a new account
3. ✅ After signup, should redirect to `/pending-approval` page
4. ✅ Page shows "Account Pending Approval" message
5. ✅ Try visiting `/rentals` → Should redirect back to `/pending-approval`

**Test Case 2: Admin Approval**
1. Login as RAV admin
2. Visit `/admin` → "Pending Approvals" tab
3. ✅ See the new user in the list
4. ✅ Click "Approve" button
5. ✅ Success toast appears
6. ✅ User disappears from pending list
7. ✅ Check user's email for approval notification

**Test Case 3: Approved User Access**
1. Login as the newly approved user
2. ✅ Should automatically redirect to `/rentals` (no pending page)
3. ✅ Can access all protected routes
4. ✅ Can use voice search (if Phase 1 is deployed)

**Test Case 4: User Rejection**
1. Create another test user
2. As admin, click "Reject" button
3. ✅ Dialog appears asking for reason
4. ✅ Enter reason: "Test rejection"
5. ✅ Confirm rejection
6. ✅ User disappears from pending list
7. ✅ Check user's email for rejection notification
8. ✅ Try logging in as rejected user → Should stay on pending page

**Test Case 5: RAV Team Bypass**
1. Login as RAV admin/staff
2. ✅ Can access all routes regardless of approval status
3. ✅ No approval required for team members

---

## Deliverables (Handoff Package)

Create TWO files in the handoffs folder:

1. **`handoffs/phase2-handoff.md`** - Detailed technical handoff
2. **`handoffs/phase2-hub-template.md`** - Copy-paste template for PROJECT-HUB.md update

---

### File 1: `handoffs/phase2-handoff.md`

```markdown
# Phase 2: User Approval System - Handoff Package

**Completed:** [Date]  
**Duration:** [Actual time]  
**Status:** ✅ Complete / ⚠️ Issues found

---

## Changes Made

### **Database**

**Migration File:** `supabase/migrations/007_voice_auth_approval.sql`

**Changes:**
- Added approval_status, approved_by, approved_at, rejection_reason columns to profiles
- Created system_settings table
- Created helper functions: can_access_platform(), approve_user(), reject_user()
- Added RLS policies for system_settings
- Migrated existing users to 'approved' status

### **Edge Functions**

**New Function:** `send-approval-email`
- Sends approval/rejection notifications
- Uses Resend API
- HTML email templates included

### **Frontend Components**

**New Pages:**
1. `src/pages/PendingApproval.tsx` - Pending users see this
2. `src/components/admin/PendingApprovals.tsx` - Admin approval dashboard

**Modified Files:**
1. `src/App.tsx` - Added ProtectedRoute wrapper and /pending-approval route
2. `src/pages/AdminDashboard.tsx` - Added "Pending Approvals" tab with badge

---

## Test Results

### **Signup Flow**
- [✅/❌] New user gets approval_status = 'pending_approval'
- [✅/❌] Redirected to /pending-approval page
- [✅/❌] Blocked from protected routes

### **Admin Approval**
- [✅/❌] Admin sees pending users list
- [✅/❌] Approve button works
- [✅/❌] Reject dialog works
- [✅/❌] Email notifications sent
- [✅/❌] Badge shows correct count

### **Approved User Access**
- [✅/❌] Approved user can access /rentals
- [✅/❌] No longer sees pending page
- [✅/❌] All protected routes accessible

### **Edge Cases**
- [✅/❌] RAV team bypasses approval
- [✅/❌] Existing users still work (migrated to 'approved')
- [✅/❌] Rejected users stay blocked

---

## Known Issues

[List any bugs discovered]

Example:
- Email notifications sometimes delayed (Resend queue)
- Badge count doesn't update immediately (requires page refresh)

---

## Database Verification

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

## Next Steps for Phase 3

Phase 3 will implement:
- Voice usage limits (10 searches/day)
- Admin toggle to turn approval ON/OFF
- Voice quota indicator in UI

**Dependencies:**
- Phase 2 must be tested and deployed
- All pending user tests must pass

---

## Deployment Notes

**Environment Variables:** 
- Ensure `RESEND_API_KEY` is set in Supabase Edge Function secrets

**Database Changes:**
- Migration 007 must be applied before deploying frontend

**Breaking Changes:**
- New signups now require approval (unless system setting is OFF)

**Rollback Plan:**
- Set all pending users to 'approved'
- Update system_settings to enabled=false
- Remove ProtectedRoute wrapper

---

## Screenshots

[Add screenshots of:]
1. Pending approval page
2. Admin dashboard with pending users
3. Approval confirmation
4. Email notification
```

---

### File 2: `handoffs/phase2-hub-template.md`

```markdown
# PROJECT-HUB.md Update - Phase 2

**Instructions:** Copy the sections below into PROJECT-HUB.md after reviewing phase2-handoff.md

---

## UPDATE: Current Status Section

**Last Deployment:** Phase 2 (User Approval System) - [Today's Date]
**Working on TODAY:** Phase 3 - Voice Usage Limits & Admin Toggle

---

## UPDATE: Top 3 Priorities Section

### 1. Gate Voice Search Behind Authentication ✅ COMPLETE
[Keep Phase 1 summary as-is]

---

### 2. User Approval System ✅ COMPLETE
**Status:** 🟢 Deployed
**Completed:** [Today's Date]
**Duration:** [Actual time, e.g., "2.5 hours"]

**Delivered:**
- ✅ Database schema with approval_status column
- ✅ New signups require admin approval by default
- ✅ Pending Approval page for waiting users
- ✅ Admin dashboard with approval/reject actions
- ✅ Email notifications (approved/rejected)
- ✅ Route protection middleware
- ✅ Existing users auto-approved (migration)

**Impact:**
- Beta access control: **ENABLED** ✅
- Admin review workflow: **WORKING** ✅
- Email notifications: **SENT VIA RESEND** ✅

**Files Created:**
- Migration: `007_voice_auth_approval.sql`
- Edge Function: `send-approval-email/index.ts`
- Page: `PendingApproval.tsx`
- Component: `PendingApprovals.tsx`

**Docs:** `docs/features/voice-auth-approval/handoffs/phase2-handoff.md`

---

### 3. Voice Usage Limits & Admin Toggle (Next - 2 hours)
**Status:** 🟡 Ready to Start
**Priority:** HIGH - Cost protection

**Tasks:**
- [ ] voice_search_usage table & quota functions
- [ ] useVoiceQuota hook
- [ ] Quota indicator (10 searches/day)
- [ ] System Settings admin component
- [ ] Toggle for approval ON/OFF

**Expected Impact:** $27K/month cost savings (90% reduction)

---

[Keep remaining priorities as-is]
```

---

## Success Criteria

Before marking Phase 2 complete, verify:

- ✅ Database migration deployed successfully
- ✅ Edge Function deployed and tested
- ✅ New signups get `pending_approval` status
- ✅ Pending users see `/pending-approval` page
- ✅ Pending users blocked from protected routes
- ✅ Admin dashboard shows pending users
- ✅ Approve/reject actions work
- ✅ Email notifications sent correctly
- ✅ Approved users get full access
- ✅ RAV team bypasses approval
- ✅ All tests passed
- ✅ **Both handoff documents created** (phase2-handoff.md AND phase2-hub-template.md)
- ✅ Code committed to git

---

## Git Commit Message Template

```
feat(auth): implement user approval system

Database:
- Add approval_status column to profiles
- Create system_settings table
- Add approval helper functions
- Migrate existing users to 'approved'

Backend:
- Create send-approval-email Edge Function
- Email templates for approval/rejection

Frontend:
- Add PendingApproval page
- Create admin PendingApprovals component
- Add ProtectedRoute wrapper
- Update AdminDashboard with new tab

Related: Phase 2 of Voice Auth & Approval System
```

---

**Ready to start? Confirm you've received the Project Brief and Phase 1 handoff, then begin Task 1.**
