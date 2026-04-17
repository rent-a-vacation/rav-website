import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { calculateNights, computeListingPricing } from "@/lib/pricing";
import type { Listing, Property, CancellationPolicy } from "@/types/database";

const CANCELLATION_OPTIONS: { value: CancellationPolicy; label: string }[] = [
  { value: "flexible", label: "Flexible" },
  { value: "moderate", label: "Moderate" },
  { value: "strict", label: "Strict" },
  { value: "super_strict", label: "Super Strict" },
];

interface ListingForEdit extends Listing {
  property?: Property;
}

interface AdminListingEditDialogProps {
  listing: ListingForEdit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const AdminListingEditDialog = ({
  listing,
  open,
  onOpenChange,
  onSaved,
}: AdminListingEditDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [nightlyRate, setNightlyRate] = useState(0);
  const [cleaningFee, setCleaningFee] = useState(0);
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>("moderate");
  const [notes, setNotes] = useState("");
  const [adminEditNotes, setAdminEditNotes] = useState("");
  const [isExclusiveDeal, setIsExclusiveDeal] = useState(false);

  // Populate form when listing changes or dialog opens
  useEffect(() => {
    if (open && listing) {
      setCheckInDate(listing.check_in_date);
      setCheckOutDate(listing.check_out_date);
      setNightlyRate(listing.nightly_rate);
      setCleaningFee(listing.cleaning_fee || 0);
      setCancellationPolicy(listing.cancellation_policy);
      setNotes(listing.notes || "");
      setAdminEditNotes("");
      setIsExclusiveDeal((listing as Record<string, unknown>).is_exclusive_deal === true);
    }
  }, [open, listing]);

  // Live price calculation
  const nights = checkInDate && checkOutDate ? calculateNights(checkInDate, checkOutDate) : 0;
  const pricing = nights > 0 && nightlyRate > 0 ? computeListingPricing(nightlyRate, nights) : null;

  const isDisabledStatus = listing?.status === "booked" || listing?.status === "completed";

  const handleSave = async () => {
    if (!listing || !user) return;

    setIsSaving(true);
    try {
      const updatedNights = calculateNights(checkInDate, checkOutDate);
      const updatedPricing = computeListingPricing(nightlyRate, updatedNights);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("listings")
        .update({
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          nightly_rate: nightlyRate,
          owner_price: updatedPricing.ownerPrice,
          rav_markup: updatedPricing.ravMarkup,
          final_price: updatedPricing.finalPrice,
          cleaning_fee: cleaningFee || null,
          cancellation_policy: cancellationPolicy,
          is_exclusive_deal: isExclusiveDeal,
          notes: notes || null,
          admin_edit_notes: adminEditNotes || null,
          last_edited_by: user.id,
          last_edited_at: new Date().toISOString(),
        })
        .eq("id", listing.id);

      if (error) throw error;

      toast({
        title: "Listing updated",
        description: `Listing for ${listing.property?.resort_name || "property"} has been updated.`,
      });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating listing:", error);
      toast({
        title: "Error",
        description: "Failed to update listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!listing) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Listing</DialogTitle>
          <DialogDescription>
            {listing.property?.resort_name} — {listing.property?.location}
          </DialogDescription>
        </DialogHeader>

        {isDisabledStatus && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            This listing is {listing.status} and cannot be edited.
          </div>
        )}

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check-in">Check-In Date</Label>
              <Input
                id="check-in"
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                disabled={isDisabledStatus}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-out">Check-Out Date</Label>
              <Input
                id="check-out"
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                disabled={isDisabledStatus}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nightly-rate">Nightly Rate ($)</Label>
              <Input
                id="nightly-rate"
                type="number"
                min={0}
                step={1}
                value={nightlyRate}
                onChange={(e) => setNightlyRate(Number(e.target.value))}
                disabled={isDisabledStatus}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cleaning-fee">Cleaning Fee ($)</Label>
              <Input
                id="cleaning-fee"
                type="number"
                min={0}
                step={1}
                value={cleaningFee}
                onChange={(e) => setCleaningFee(Number(e.target.value))}
                disabled={isDisabledStatus}
              />
            </div>
          </div>

          {pricing && (
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{nights} nights × ${nightlyRate}/night</span>
                <span>${pricing.ownerPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">RAV markup (15%)</span>
                <span>${pricing.ravMarkup.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Total (renter pays)</span>
                <span>${pricing.finalPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="cancellation-policy">Cancellation Policy</Label>
            <Select
              value={cancellationPolicy}
              onValueChange={(v) => setCancellationPolicy(v as CancellationPolicy)}
              disabled={isDisabledStatus}
            >
              <SelectTrigger id="cancellation-policy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCELLATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="exclusive-deal">Premium Exclusive Deal</Label>
              <p className="text-xs text-muted-foreground">
                Only visible to Premium-tier travelers on RAV Deals
              </p>
            </div>
            <Switch
              id="exclusive-deal"
              checked={isExclusiveDeal}
              onCheckedChange={setIsExclusiveDeal}
              disabled={isDisabledStatus}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Listing Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              disabled={isDisabledStatus}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-notes">Admin Edit Notes</Label>
            <Textarea
              id="admin-notes"
              value={adminEditNotes}
              onChange={(e) => setAdminEditNotes(e.target.value)}
              rows={2}
              placeholder="Reason for admin edit (internal only)"
              disabled={isDisabledStatus}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || isDisabledStatus || nights <= 0 || nightlyRate <= 0}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminListingEditDialog;
