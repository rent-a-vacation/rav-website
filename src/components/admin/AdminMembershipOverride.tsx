import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMembershipTiers } from "@/hooks/useMembership";
import type { MembershipTier } from "@/types/database";

interface MembershipRowData {
  id: string;
  user_id: string;
  tier: MembershipTier;
  user_email?: string;
  admin_override?: boolean;
  admin_notes?: string | null;
}

interface AdminMembershipOverrideProps {
  membership: MembershipRowData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export function AdminMembershipOverride({
  membership,
  open,
  onOpenChange,
  onSaved,
}: AdminMembershipOverrideProps) {
  const { data: allTiers } = useMembershipTiers();
  const [selectedTierId, setSelectedTierId] = useState(membership.tier.id);
  const [adminNotes, setAdminNotes] = useState(membership.admin_notes || "");
  const [isSaving, setIsSaving] = useState(false);

  // Filter to same role category (owner tiers for owners, traveler for travelers)
  const availableTiers = allTiers?.filter(
    (t) => t.role_category === membership.tier.role_category
  ) ?? [];

  const selectedTier = availableTiers.find((t) => t.id === selectedTierId);
  const hasChanged = selectedTierId !== membership.tier.id;

  const handleSave = async () => {
    if (!adminNotes.trim()) {
      toast.error("Admin notes are required when overriding a tier");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_memberships")
        .update({
          tier_id: selectedTierId,
          admin_override: true,
          admin_notes: adminNotes.trim(),
        } as never)
        .eq("id", membership.id);

      if (error) throw error;

      toast.success(`Tier updated to ${selectedTier?.tier_name || "new tier"}`);
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error overriding membership:", error);
      toast.error("Failed to update membership tier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearOverride = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("user_memberships")
        .update({
          admin_override: false,
          admin_notes: null,
        } as never)
        .eq("id", membership.id);

      if (error) throw error;

      toast.success("Admin override cleared — Stripe webhook will manage this membership");
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error clearing override:", error);
      toast.error("Failed to clear override");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Override Membership Tier</DialogTitle>
          <DialogDescription>
            {membership.user_email || membership.user_id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Current Tier</Label>
            <p className="text-sm font-medium">
              {membership.tier.tier_name} ({membership.tier.role_category})
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="override-tier">New Tier</Label>
            <Select value={selectedTierId} onValueChange={setSelectedTierId}>
              <SelectTrigger id="override-tier">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTiers.map((tier) => (
                  <SelectItem key={tier.id} value={tier.id}>
                    {tier.tier_name} — ${(tier.monthly_price_cents / 100).toFixed(0)}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Notes (required)</Label>
            <Textarea
              id="admin-notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Reason for override (e.g., VIP customer, promotional deal)"
              rows={3}
            />
          </div>

          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Setting an override prevents Stripe webhooks from changing this user's tier.
              The override must be manually cleared for Stripe billing to resume control.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          {membership.admin_override && (
            <Button
              variant="outline"
              onClick={handleClearOverride}
              disabled={isSaving}
              className="sm:mr-auto"
            >
              Clear Override
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanged || !adminNotes.trim()}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
