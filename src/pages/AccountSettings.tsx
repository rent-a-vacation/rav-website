import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { RoleBadge } from "@/components/RoleBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useNotificationPreferences,
  useUpdateNotificationPreference,
  NOTIFICATION_CATEGORIES,
  type EmailPrefKey,
} from "@/hooks/useNotificationPreferences";
import {
  useRequestDeletion,
  useCancelDeletion,
  useExportUserData,
} from "@/hooks/useAccountDeletion";
import { User, Mail, Phone, Lock, Shield, Calendar, Save, Loader2, Bell, Download, Trash2, AlertTriangle, XCircle, CreditCard } from "lucide-react";
import { SubscriptionManagement } from "@/components/SubscriptionManagement";
import { MembershipPlans } from "@/components/MembershipPlans";
import { Textarea } from "@/components/ui/textarea";

const AccountSettings = () => {
  usePageMeta("Account Settings", "Manage your Rent-A-Vacation account profile, security, and preferences.");

  const navigate = useNavigate();
  const { user, profile, roles, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notification preferences
  const { data: notifPrefs, isLoading: notifLoading } = useNotificationPreferences();
  const updatePref = useUpdateNotificationPreference();

  // Account deletion & data export
  const requestDeletion = useRequestDeletion();
  const cancelDeletion = useCancelDeletion();
  const exportData = useExportUserData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Sync profile data into form when loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // Redirect if not logged in (after auth finishes loading)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [authLoading, user, navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile information has been saved.",
      });
    } catch (err) {
      toast({
        title: "Failed to update profile",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure both password fields match.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (err) {
      toast({
        title: "Failed to update password",
        description: err instanceof Error ? err.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const firstName = profile?.full_name?.split(" ")[0];
  const avatarLetter = (firstName || user?.email || "U").charAt(0).toUpperCase();
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  // Loading skeleton
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 md:pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-3xl space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-80 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If user is null after loading, the redirect effect handles it
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 md:pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Page heading */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Account Settings
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage your profile, security, and account preferences.
            </p>
          </div>

          <div className="space-y-6">
            {/* ─── Section 1: Profile Information ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal details visible across the platform.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Avatar */}
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold flex-shrink-0">
                      {avatarLetter}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {profile?.full_name || "User"}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        placeholder="Jane Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={user.email || ""}
                        disabled
                        className="pl-10 bg-muted/50"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      To change your email, please{" "}
                      <a href="/contact" className="text-primary hover:underline">
                        contact support
                      </a>
                      .
                    </p>
                  </div>

                  <Button type="submit" disabled={isSavingProfile}>
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* ─── Section 2: Subscription & Billing ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Subscription & Billing
                </CardTitle>
                <CardDescription>
                  Manage your membership plan and billing details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <SubscriptionManagement />
                <Separator />
                <MembershipPlans />
              </CardContent>
            </Card>

            {/* ─── Section 3: Security ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Security
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword} className="space-y-6">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new_password"
                        type="password"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm_password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        minLength={6}
                        required
                      />
                    </div>
                    {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match.</p>
                    )}
                  </div>

                  <Button type="submit" disabled={isUpdatingPassword || !newPassword || !confirmPassword}>
                    {isUpdatingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* ─── Section 3: Notification Preferences ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control which emails you receive from Rent-A-Vacation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notifLoading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  NOTIFICATION_CATEGORIES.map((category) => (
                    <div key={category.label}>
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-foreground">{category.label}</p>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                      <div className="space-y-3 ml-1">
                        {category.prefs.map((pref) => (
                          <div key={pref.key} className="flex items-center justify-between">
                            <label htmlFor={pref.key} className="text-sm text-foreground cursor-pointer">
                              {pref.label}
                            </label>
                            <Switch
                              id={pref.key}
                              checked={notifPrefs?.[pref.key] as boolean ?? true}
                              onCheckedChange={(checked) =>
                                updatePref.mutate({ key: pref.key as EmailPrefKey, value: checked })
                              }
                            />
                          </div>
                        ))}
                      </div>
                      <Separator className="mt-4" />
                    </div>
                  ))
                )}
                <p className="text-xs text-muted-foreground">
                  Transactional emails (password resets, security alerts) cannot be disabled.
                </p>
              </CardContent>
            </Card>

            {/* ─── Section 4: Account Info ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Account Info
                </CardTitle>
                <CardDescription>
                  Your account details and role information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Roles */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Roles</p>
                  {roles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {roles.map((role) => (
                        <RoleBadge key={role} role={role} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No roles assigned.</p>
                  )}
                </div>

                <Separator />

                {/* Member since */}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {memberSince || "Unknown"}
                    </p>
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* ─── Section 5: Data & Privacy ─── */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Data & Privacy
                </CardTitle>
                <CardDescription>
                  Export your data or request account deletion.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Export Data */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Export My Data</p>
                    <p className="text-xs text-muted-foreground">
                      Download all your data as a JSON file (profile, bookings, listings, bids, etc.)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exportData.mutate(undefined, {
                        onSuccess: () =>
                          toast({
                            title: "Data exported",
                            description: "Your data file has been downloaded.",
                          }),
                        onError: (err) =>
                          toast({
                            title: "Export failed",
                            description: err.message,
                            variant: "destructive",
                          }),
                      });
                    }}
                    disabled={exportData.isPending}
                  >
                    {exportData.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </>
                    )}
                  </Button>
                </div>

                <Separator />

                {/* Delete Account */}
                {profile?.deletion_requested_at ? (
                  // Deletion already requested — show cancellation option
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">
                          Account Deletion Scheduled
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          Your account is scheduled for deletion on{" "}
                          <strong>
                            {profile.deletion_scheduled_for
                              ? new Date(profile.deletion_scheduled_for).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })
                              : "the scheduled date"}
                          </strong>
                          . All personal data will be permanently removed. Financial records will be anonymized and retained for tax compliance.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-100"
                      onClick={() => {
                        cancelDeletion.mutate(undefined, {
                          onSuccess: () => {
                            toast({
                              title: "Deletion cancelled",
                              description: "Your account will not be deleted.",
                            });
                            window.location.reload();
                          },
                          onError: (err) =>
                            toast({
                              title: "Failed to cancel",
                              description: err.message,
                              variant: "destructive",
                            }),
                        });
                      }}
                      disabled={cancelDeletion.isPending}
                    >
                      {cancelDeletion.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Cancel Deletion
                    </Button>
                  </div>
                ) : showDeleteConfirm ? (
                  // Deletion confirmation form
                  <div className="border border-destructive/30 rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive">
                          Are you sure you want to delete your account?
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          After a 14-day grace period, your personal data will be permanently deleted.
                          Booking and financial records will be anonymized but retained for tax compliance (7 years).
                          You can cancel this request any time during the grace period.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delete_reason" className="text-xs">
                        Reason for leaving (optional)
                      </Label>
                      <Textarea
                        id="delete_reason"
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        placeholder="Help us improve — why are you deleting your account?"
                        rows={2}
                        className="text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delete_confirm" className="text-xs">
                        Type <strong>DELETE</strong> to confirm
                      </Label>
                      <Input
                        id="delete_confirm"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                        className="text-sm"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText("");
                          setDeleteReason("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={
                          deleteConfirmText !== "DELETE" || requestDeletion.isPending
                        }
                        onClick={() => {
                          requestDeletion.mutate(deleteReason || undefined, {
                            onSuccess: (data) => {
                              toast({
                                title: "Deletion requested",
                                description: `Your account will be deleted on ${
                                  data.scheduled_for
                                    ? new Date(data.scheduled_for).toLocaleDateString()
                                    : "the scheduled date"
                                }. You can cancel this from Account Settings.`,
                              });
                              setShowDeleteConfirm(false);
                              setDeleteConfirmText("");
                              setDeleteReason("");
                              window.location.reload();
                            },
                            onError: (err) =>
                              toast({
                                title: "Failed to request deletion",
                                description: err.message,
                                variant: "destructive",
                              }),
                          });
                        }}
                      >
                        {requestDeletion.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Request Account Deletion
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Default — show delete button
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Delete Account</p>
                      <p className="text-xs text-muted-foreground">
                        Permanently delete your account and personal data (14-day grace period).
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AccountSettings;
