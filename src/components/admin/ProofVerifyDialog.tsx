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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Check,
  Download,
  FileText,
  Loader2,
  Phone,
  Shield,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ProofVerifyDialogProps {
  listing: {
    id: string;
    owner_id?: string;
    resort_confirmation_number: string | null;
    confirmation_proof_path: string | null;
    admin_phone_verification_notes: string | null;
    property?: { resort_name?: string | null } | null;
    owner?: { id?: string; full_name?: string | null; email?: string | null } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
  onRejected?: () => void;
}

/**
 * Admin verify/reject dialog for Pre-Booked listing reservation proof (#376).
 *
 * Embedded PDF/image viewer via a signed URL so admins can review without
 * leaving the tab. Supports the documented anti-scam workflow:
 *   - Note which resort-staff member was spoken to during phone verification
 *   - Verify → stamps confirmation_verified_at / _by, flips to 'verified'
 *   - Reject → captures reason, flips to 'rejected', owner gets re-upload cue
 */
export function ProofVerifyDialog({
  listing,
  open,
  onOpenChange,
  onVerified,
  onRejected,
}: ProofVerifyDialogProps) {
  const { user } = useAuth();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [phoneNotes, setPhoneNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && listing?.confirmation_proof_path) {
      setPhoneNotes(listing.admin_phone_verification_notes ?? "");
      setRejectionReason("");
      setShowRejectForm(false);

      // Private bucket — issue a short-lived signed URL for the preview.
      supabase.storage
        .from("listing-proofs")
        .createSignedUrl(listing.confirmation_proof_path, 300)
        .then(({ data, error }) => {
          if (error) {
            console.error("Failed to create signed URL:", error);
            setSignedUrl(null);
            return;
          }
          setSignedUrl(data?.signedUrl ?? null);
        });
    } else {
      setSignedUrl(null);
    }
  }, [open, listing?.confirmation_proof_path, listing?.admin_phone_verification_notes]);

  if (!listing) return null;

  const isPdf = listing.confirmation_proof_path?.toLowerCase().endsWith(".pdf");

  async function handleVerify() {
    if (!user || !listing) return;
    setSubmitting(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("listings")
        .update({
          proof_status: "verified",
          confirmation_verified_at: new Date().toISOString(),
          confirmation_verified_by: user.id,
          admin_phone_verification_notes: phoneNotes.trim() || null,
          proof_rejected_reason: null,
        })
        .eq("id", listing.id);
      if (error) throw error;

      // Notify owner — fire-and-forget; don't block the UI on email failure.
      const ownerId = listing.owner?.id ?? listing.owner_id;
      if (ownerId) {
        supabase.functions
          .invoke("notification-dispatcher", {
            body: {
              type_key: "listing_proof_verified",
              user_id: ownerId,
              payload: {
                title: "Reservation proof verified",
                message: listing.property?.resort_name
                  ? `Your proof for ${listing.property.resort_name} was verified. Your Listing is one step closer to going live.`
                  : "Your reservation proof was verified.",
                listing_id: listing.id,
              },
            },
          })
          .catch((e) => console.error("notification-dispatcher failed:", e));
      }

      toast.success("Proof verified. Owner is notified.");
      onOpenChange(false);
      onVerified?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (!listing || !rejectionReason.trim()) return;
    setSubmitting(true);
    try {
      const reasonText = rejectionReason.trim();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from("listings")
        .update({
          proof_status: "rejected",
          proof_rejected_reason: reasonText,
          admin_phone_verification_notes: phoneNotes.trim() || null,
        })
        .eq("id", listing.id);
      if (error) throw error;

      const ownerId = listing.owner?.id ?? listing.owner_id;
      if (ownerId) {
        supabase.functions
          .invoke("notification-dispatcher", {
            body: {
              type_key: "listing_proof_rejected",
              user_id: ownerId,
              payload: {
                title: "Reservation proof needs another look",
                message: `${reasonText} Please re-upload the correct reservation file from your RAV dashboard.`,
                listing_id: listing.id,
              },
            },
          })
          .catch((e) => console.error("notification-dispatcher failed:", e));
      }

      toast.success("Proof rejected. Owner will be prompted to re-upload.");
      onOpenChange(false);
      onRejected?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verify Reservation Proof
          </DialogTitle>
          <DialogDescription>
            {listing.property?.resort_name} · {listing.owner?.full_name} ({listing.owner?.email})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Resort Confirmation Number</Label>
              <p className="font-mono">{listing.resort_confirmation_number ?? "—"}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Proof File</Label>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="w-3 h-3" />
                {listing.confirmation_proof_path?.split("/").pop() ?? "—"}
                {signedUrl && (
                  <a
                    href={signedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline ml-2 inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> open
                  </a>
                )}
              </p>
            </div>
          </div>

          {/* Embedded preview */}
          <div className="border rounded-md overflow-hidden bg-muted/20">
            {!signedUrl ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading proof…
              </div>
            ) : isPdf ? (
              <iframe
                title="Reservation proof PDF"
                src={signedUrl}
                className="w-full h-96 bg-white"
              />
            ) : (
              <img
                src={signedUrl}
                alt="Reservation proof"
                className="w-full max-h-96 object-contain bg-white"
              />
            )}
          </div>

          {/* Phone verification checklist — anti-scam layer G */}
          <div>
            <Label className="text-sm font-medium flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              Phone Verification Notes
              <span className="text-xs text-muted-foreground font-normal ml-1">— recommended</span>
            </Label>
            <Textarea
              value={phoneNotes}
              onChange={(e) => setPhoneNotes(e.target.value)}
              placeholder="e.g. Called resort front desk 4/24. Reservation confirmed under owner's name for dates."
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional but strongly recommended. Documenting a resort phone-check is our strongest anti-scam signal.
            </p>
          </div>

          {/* Reject form (conditional) */}
          {showRejectForm && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1 text-red-800">
                <AlertTriangle className="w-3.5 h-3.5" />
                Rejection Reason
              </Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain what was wrong — owner will see this in their listing alert."
                rows={3}
              />
              <p className="text-xs text-red-700">
                Written in plain language — the owner will read this verbatim.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Close
          </Button>
          {showRejectForm ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionReason("");
                }}
                disabled={submitting}
              >
                Cancel Reject
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={submitting || !rejectionReason.trim()}
              >
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
                Confirm Reject
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => setShowRejectForm(true)}
                disabled={submitting}
              >
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleVerify} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                Verify &amp; Approve Proof
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
