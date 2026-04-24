import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface CancelListingDialogProps {
  listingId: string;
  listingSummary: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancelled?: () => void;
}

interface ImpactPreview {
  pendingBids: number;
  activeBookings: number;
  refundTotal: number;
  loading: boolean;
}

/**
 * Owner-facing cancel-listing flow (#377). Previews the downstream impact
 * (bids that will be rejected, bookings that will be refunded, total dollars
 * refunded) before asking for a reason and confirmation. Submit calls the
 * `cancel-listing` edge function which orchestrates the cascade atomically
 * (bids → bookings → notifications → cancellation_count bump).
 */
export function CancelListingDialog({
  listingId,
  listingSummary,
  open,
  onOpenChange,
  onCancelled,
}: CancelListingDialogProps) {
  const [reason, setReason] = useState("");
  const [preview, setPreview] = useState<ImpactPreview>({
    pendingBids: 0,
    activeBookings: 0,
    refundTotal: 0,
    loading: true,
  });
  const [submitting, setSubmitting] = useState(false);

  // Load impact preview when the dialog opens.
  useEffect(() => {
    if (!open) return;
    setReason("");
    setPreview({ pendingBids: 0, activeBookings: 0, refundTotal: 0, loading: true });

    (async () => {
      try {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const [{ count: bidCount }, bookingsResp] = await Promise.all([
          (supabase as any)
            .from("listing_bids")
            .select("id", { count: "exact", head: true })
            .eq("listing_id", listingId)
            .eq("status", "pending"),
          (supabase as any)
            .from("bookings")
            .select("id, total_amount, status")
            .eq("listing_id", listingId)
            .in("status", ["confirmed", "pending"]),
        ]);
        /* eslint-enable @typescript-eslint/no-explicit-any */
        const bookings = ((bookingsResp?.data ?? []) as Array<{ total_amount: number }>);
        const refundTotal = bookings.reduce((sum, b) => sum + (b.total_amount ?? 0), 0);
        setPreview({
          pendingBids: bidCount ?? 0,
          activeBookings: bookings.length,
          refundTotal,
          loading: false,
        });
      } catch (err) {
        console.error("Impact preview failed:", err);
        setPreview({ pendingBids: 0, activeBookings: 0, refundTotal: 0, loading: false });
      }
    })();
  }, [open, listingId]);

  const reasonTooShort = reason.trim().length > 0 && reason.trim().length < 4;
  const canSubmit = reason.trim().length >= 4 && !submitting;

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-listing", {
        body: { listingId, reason: reason.trim() },
      });
      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error ?? "Cancellation failed");
      }

      const pieces: string[] = [];
      if (data.cancelledBidsCount > 0) {
        pieces.push(`${data.cancelledBidsCount} Offer${data.cancelledBidsCount === 1 ? "" : "s"} rejected`);
      }
      if (data.cancelledBookingsCount > 0) {
        pieces.push(`${data.cancelledBookingsCount} booking${data.cancelledBookingsCount === 1 ? "" : "s"} refunded`);
      }
      toast.success(
        pieces.length > 0
          ? `Listing cancelled — ${pieces.join(", ")}.`
          : "Listing cancelled.",
      );
      if ((data.refundFailures ?? []).length > 0) {
        toast.warning(
          `Some refunds could not be processed automatically. Admin has been alerted.`,
        );
      }
      onOpenChange(false);
      onCancelled?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            Cancel this Listing?
          </DialogTitle>
          <DialogDescription>
            {listingSummary}. This will end the listing, reject any pending Offers, and
            refund any confirmed bookings. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Impact preview */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Impact</p>
          {preview.loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          ) : (
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">{preview.pendingBids}</span>
                {" "}pending Offer{preview.pendingBids === 1 ? "" : "s"} will be rejected
              </p>
              <p>
                <span className="font-medium">{preview.activeBookings}</span>
                {" "}confirmed booking{preview.activeBookings === 1 ? "" : "s"} will be cancelled
              </p>
              {preview.activeBookings > 0 && (
                <p>
                  <span className="font-medium">${preview.refundTotal.toLocaleString()}</span>
                  {" "}total in refunds will be processed (via Stripe)
                </p>
              )}
              {preview.pendingBids === 0 && preview.activeBookings === 0 && (
                <p className="text-muted-foreground">No active bids or bookings — safe to cancel.</p>
              )}
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <Label htmlFor="cancel-reason" className="text-sm font-medium">
            Reason for cancellation
          </Label>
          <Textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Resort cancelled my reservation; I changed plans."
            rows={3}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Affected travelers see this reason in their notification — write it plainly.
          </p>
          {reasonTooShort && (
            <p className="text-xs text-destructive mt-1 flex items-start gap-1">
              <AlertTriangle className="w-3 h-3 mt-0.5" />
              <span>A few more words — at least 4 characters.</span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Keep Listing
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canSubmit}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Listing
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
