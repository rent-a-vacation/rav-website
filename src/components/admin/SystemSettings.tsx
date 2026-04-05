import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useMembershipTiers } from "@/hooks/useMembership";
import { MembershipBadge } from "@/components/MembershipBadge";
import { toast } from "sonner";
import { Infinity as InfinityIcon, Timer, ShieldAlert } from "lucide-react";
import { useConfirmationTimerSettings } from "@/hooks/useOwnerConfirmation";

export function SystemSettings() {
  const {
    platformStaffOnly,
    requireUserApproval,
    autoApproveRoleUpgrades,
    voiceEnabled,
    voiceSearchEnabled,
    voiceListingEnabled,
    voiceBiddingEnabled,
    platformCommissionRate,
    loading,
    updateSetting,
  } = useSystemSettings();
  const { data: tiers } = useMembershipTiers();

  const { data: timerSettings } = useConfirmationTimerSettings();

  const [updatingStaffOnly, setUpdatingStaffOnly] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingVoice, setUpdatingVoice] = useState<string | null>(null);
  const [updatingCommission, setUpdatingCommission] = useState(false);
  const [updatingTimer, setUpdatingTimer] = useState<string | null>(null);

  // Staff-Only Mode confirmation
  const [staffOnlyConfirmOpen, setStaffOnlyConfirmOpen] = useState(false);
  const [staffOnlyPendingValue, setStaffOnlyPendingValue] = useState(false);

  // Commission rate confirmation
  const [pendingCommissionRate, setPendingCommissionRate] = useState<number | null>(null);
  const [commissionConfirmOpen, setCommissionConfirmOpen] = useState(false);

  const handleToggleApproval = async (enabled: boolean) => {
    setUpdating(true);
    try {
      await updateSetting("require_user_approval", { enabled });
      toast.success(
        enabled
          ? "User approval is now required for new signups"
          : "New users will be auto-approved"
      );
    } catch (error) {
      console.error("Failed to update setting:", error);
      toast.error("Failed to update setting");
    } finally {
      setUpdating(false);
    }
  };

  const handleVoiceToggle = async (key: string, enabled: boolean) => {
    setUpdatingVoice(key);
    try {
      await updateSetting(key, { enabled });
      toast.success(`Voice setting updated`);
    } catch (error) {
      console.error("Failed to update voice setting:", error);
      toast.error("Failed to update setting");
    } finally {
      setUpdatingVoice(null);
    }
  };

  const handleCommissionRateChange = async (newRate: number) => {
    if (newRate < 0 || newRate > 100) return;
    setUpdatingCommission(true);
    try {
      await updateSetting("platform_commission_rate", {
        rate: newRate,
        pro_discount: platformCommissionRate.proDiscount,
        business_discount: platformCommissionRate.businessDiscount,
      });
      toast.success(`Commission rate updated to ${newRate}%`);
    } catch (error) {
      console.error("Failed to update commission rate:", error);
      toast.error("Failed to update commission rate");
    } finally {
      setUpdatingCommission(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground">
          Configure platform-wide settings
        </p>
      </div>

      {/* Staff Only Mode */}
      <Card className={platformStaffOnly ? "border-amber-500/50 bg-amber-50/50" : ""}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className={`h-5 w-5 ${platformStaffOnly ? "text-amber-600" : ""}`} />
            Platform Access Mode
          </CardTitle>
          <CardDescription>
            Control who can access the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="staff-only">
                Staff Only Mode (Pre-Launch Lock)
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, only RAV team members can access the platform.
                All other users will see a "Coming Soon" page after login.
                Turn this off when you're ready to go live.
              </p>
            </div>
            <Switch
              id="staff-only"
              checked={platformStaffOnly}
              onCheckedChange={(enabled) => {
                setStaffOnlyPendingValue(enabled);
                setStaffOnlyConfirmOpen(true);
              }}
              disabled={updatingStaffOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* User Registration */}
      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>
            Control how new user signups are handled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="require-approval">
                Require admin approval for new users
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, new signups will need RAV team approval before
                accessing the platform. When disabled, users are auto-approved.
              </p>
            </div>
            <Switch
              id="require-approval"
              checked={requireUserApproval}
              onCheckedChange={handleToggleApproval}
              disabled={updating}
            />
          </div>
        </CardContent>
      </Card>

      {/* Role Upgrade Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Role Upgrade Requests</CardTitle>
          <CardDescription>
            Control how role upgrade requests are handled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-approve-roles">
                Auto-approve role upgrade requests
              </Label>
              <p className="text-sm text-muted-foreground">
                When enabled, role upgrade requests (e.g., renter to property
                owner) are automatically approved without admin review.
              </p>
            </div>
            <Switch
              id="auto-approve-roles"
              checked={autoApproveRoleUpgrades}
              onCheckedChange={async (enabled) => {
                setUpdatingRole(true);
                try {
                  await updateSetting("auto_approve_role_upgrades", { enabled });
                  toast.success(
                    enabled
                      ? "Role upgrades will be auto-approved"
                      : "Role upgrades require admin approval"
                  );
                } catch (error) {
                  console.error("Failed to update setting:", error);
                  toast.error("Failed to update setting");
                } finally {
                  setUpdatingRole(false);
                }
              }}
              disabled={updatingRole}
            />
          </div>
        </CardContent>
      </Card>

      {/* Voice Features */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Features</CardTitle>
          <CardDescription>
            Control voice-powered features across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Master switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="voice-master">Master voice toggle</Label>
              <p className="text-sm text-muted-foreground">
                Kill switch for all voice features. Disabling this turns off
                voice everywhere.
              </p>
            </div>
            <Switch
              id="voice-master"
              checked={voiceEnabled}
              onCheckedChange={(enabled) =>
                handleVoiceToggle("voice_enabled", enabled)
              }
              disabled={updatingVoice === "voice_enabled"}
            />
          </div>

          <div className="border-t pt-4 space-y-4 pl-4">
            {/* Voice Search */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="voice-search">Voice Search</Label>
                <p className="text-sm text-muted-foreground">
                  Voice search on the Rentals page
                </p>
              </div>
              <Switch
                id="voice-search"
                checked={voiceSearchEnabled}
                onCheckedChange={(enabled) =>
                  handleVoiceToggle("voice_search_enabled", enabled)
                }
                disabled={!voiceEnabled || updatingVoice === "voice_search_enabled"}
              />
            </div>

            {/* Voice Listing */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="voice-listing" className="flex items-center gap-2">
                  Voice-Assisted Listing
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Voice-assisted listing creation for property owners
                </p>
              </div>
              <Switch
                id="voice-listing"
                checked={voiceListingEnabled}
                onCheckedChange={(enabled) =>
                  handleVoiceToggle("voice_listing_enabled", enabled)
                }
                disabled={!voiceEnabled || updatingVoice === "voice_listing_enabled"}
              />
            </div>

            {/* Voice Bidding */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="voice-bidding" className="flex items-center gap-2">
                  Voice-Assisted Bidding
                  <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Voice-assisted bidding on traveler requests
                </p>
              </div>
              <Switch
                id="voice-bidding"
                checked={voiceBiddingEnabled}
                onCheckedChange={(enabled) =>
                  handleVoiceToggle("voice_bidding_enabled", enabled)
                }
                disabled={!voiceEnabled || updatingVoice === "voice_bidding_enabled"}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Quotas by Tier */}
      <Card>
        <CardHeader>
          <CardTitle>Voice Quotas by Tier</CardTitle>
          <CardDescription>
            Daily voice search limits based on membership tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tiers && tiers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tier</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Daily Quota</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tiers.map((tier) => (
                  <TableRow key={tier.id}>
                    <TableCell>
                      <MembershipBadge tier={tier} />
                    </TableCell>
                    <TableCell className="capitalize">{tier.role_category}</TableCell>
                    <TableCell className="text-right">
                      {tier.voice_quota_daily === -1 ? (
                        <span className="flex items-center justify-end gap-1">
                          <InfinityIcon className="h-3.5 w-3.5" /> Unlimited
                        </span>
                      ) : (
                        `${tier.voice_quota_daily}/day`
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>
                    <Badge>RAV Team</Badge>
                  </TableCell>
                  <TableCell>Staff</TableCell>
                  <TableCell className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <InfinityIcon className="h-3.5 w-3.5" /> Unlimited
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Membership tiers not configured yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Owner Confirmation Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5" />
            Owner Confirmation Timer
          </CardTitle>
          <CardDescription>
            After a renter pays, owners must confirm they can fulfill the booking within a time window
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="confirmation-window">Confirmation window (minutes)</Label>
            <Input
              id="confirmation-window"
              type="number"
              className="w-24"
              value={timerSettings?.windowMinutes ?? 60}
              onChange={async (e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) return;
                setUpdatingTimer("window");
                try {
                  await updateSetting("owner_confirmation_window_minutes", { value: val });
                  toast.success(`Confirmation window set to ${val} minutes`);
                } catch {
                  toast.error("Failed to update");
                } finally {
                  setUpdatingTimer(null);
                }
              }}
              disabled={updatingTimer === "window"}
              min={1}
            />
          </div>
          <div className="flex items-center gap-4">
            <Label htmlFor="extension-duration">Extension duration (minutes)</Label>
            <Input
              id="extension-duration"
              type="number"
              className="w-24"
              value={timerSettings?.extensionMinutes ?? 30}
              onChange={async (e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 1) return;
                setUpdatingTimer("extension");
                try {
                  await updateSetting("owner_confirmation_extension_minutes", { value: val });
                  toast.success(`Extension duration set to ${val} minutes`);
                } catch {
                  toast.error("Failed to update");
                } finally {
                  setUpdatingTimer(null);
                }
              }}
              disabled={updatingTimer === "extension"}
              min={1}
            />
          </div>
          <div className="flex items-center gap-4">
            <Label htmlFor="max-extensions">Max extensions per booking</Label>
            <Input
              id="max-extensions"
              type="number"
              className="w-24"
              value={timerSettings?.maxExtensions ?? 2}
              onChange={async (e) => {
                const val = parseInt(e.target.value);
                if (isNaN(val) || val < 0) return;
                setUpdatingTimer("max");
                try {
                  await updateSetting("owner_confirmation_max_extensions", { value: val });
                  toast.success(`Max extensions set to ${val}`);
                } catch {
                  toast.error("Failed to update");
                } finally {
                  setUpdatingTimer(null);
                }
              }}
              disabled={updatingTimer === "max"}
              min={0}
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff-Only Mode Confirmation Dialog */}
      <AlertDialog open={staffOnlyConfirmOpen} onOpenChange={setStaffOnlyConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {staffOnlyPendingValue ? "Lock Platform?" : "Unlock Platform?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {staffOnlyPendingValue
                ? "All non-staff users will see a \"Coming Soon\" page immediately. Are you sure?"
                : "All users will have full access immediately. Are you sure?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setStaffOnlyConfirmOpen(false);
                setUpdatingStaffOnly(true);
                try {
                  await updateSetting("platform_staff_only", { enabled: staffOnlyPendingValue });
                  toast.success(
                    staffOnlyPendingValue
                      ? "Platform locked — only RAV team can access"
                      : "Platform unlocked — all approved users can access"
                  );
                } catch (error) {
                  console.error("Failed to update setting:", error);
                  toast.error("Failed to update setting");
                } finally {
                  setUpdatingStaffOnly(false);
                }
              }}
            >
              {staffOnlyPendingValue ? "Lock Platform" : "Unlock Platform"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Commission Rate Confirmation Dialog */}
      <AlertDialog open={commissionConfirmOpen} onOpenChange={setCommissionConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Commission Rate?</AlertDialogTitle>
            <AlertDialogDescription>
              Change commission rate from {platformCommissionRate.rate}% to {pendingCommissionRate}%?
              This affects all future bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                setCommissionConfirmOpen(false);
                if (pendingCommissionRate !== null) {
                  await handleCommissionRateChange(pendingCommissionRate);
                  setPendingCommissionRate(null);
                }
              }}
            >
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Platform Commission */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Commission</CardTitle>
          <CardDescription>
            Commission rate charged to property owners on bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Label htmlFor="commission-rate">Base rate (%)</Label>
            <Input
              id="commission-rate"
              type="number"
              className="w-24"
              value={pendingCommissionRate ?? platformCommissionRate.rate}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setPendingCommissionRate(val);
              }}
              disabled={updatingCommission}
              min={0}
              max={100}
            />
            <Button
              size="sm"
              disabled={
                updatingCommission ||
                pendingCommissionRate === null ||
                pendingCommissionRate === platformCommissionRate.rate
              }
              onClick={() => setCommissionConfirmOpen(true)}
            >
              Save
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Pro tier discount</span>
              <span>{platformCommissionRate.proDiscount}%</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Business tier discount</span>
              <span>{platformCommissionRate.businessDiscount}%</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Effective rates</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Free owners</span>
                <span className="font-medium">{platformCommissionRate.rate}%</span>
              </div>
              <div className="flex justify-between">
                <span>Pro owners</span>
                <span className="font-medium">
                  {platformCommissionRate.rate - platformCommissionRate.proDiscount}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Business owners</span>
                <span className="font-medium">
                  {platformCommissionRate.rate - platformCommissionRate.businessDiscount}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
