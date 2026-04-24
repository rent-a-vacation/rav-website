import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Loader2, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
  hashFile,
  validateProofFile,
  buildProofStoragePath,
  MAX_PROOF_FILE_SIZE_BYTES,
} from "@/lib/listingProof";
import { toast } from "sonner";

interface ReuploadProofDialogProps {
  listingId: string;
  existingConfirmationNumber: string | null;
  rejectedReason: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Re-upload dialog for an owner whose reservation proof was rejected (#376).
 * Updates the existing listing row rather than creating a new one. The admin
 * will see the new proof with proof_status='submitted' back in their queue.
 */
export function ReuploadProofDialog({
  listingId,
  existingConfirmationNumber,
  rejectedReason,
  open,
  onOpenChange,
  onSuccess,
}: ReuploadProofDialogProps) {
  const { user } = useAuth();
  const [confirmationNumber, setConfirmationNumber] = useState(
    existingConfirmationNumber ?? "",
  );
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [attestationAccepted, setAttestationAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (!f) {
      setFile(null);
      setFileError(null);
      return;
    }
    const err = validateProofFile(f);
    if (err) {
      setFile(null);
      setFileError(err.message);
      return;
    }
    setFile(f);
    setFileError(null);
  }

  const canSubmit =
    !!user &&
    confirmationNumber.trim().length >= 4 &&
    file !== null &&
    !fileError &&
    attestationAccepted &&
    !submitting;

  async function handleSubmit() {
    if (!user || !file) return;
    setSubmitting(true);
    try {
      const proofHash = await hashFile(file);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingHashRow } = await (supabase as any)
        .from("listings")
        .select("id")
        .eq("confirmation_proof_hash", proofHash)
        .neq("id", listingId)
        .maybeSingle();
      if (existingHashRow) {
        throw new Error(
          "This proof file has already been used on another listing. Please upload the reservation email for this specific trip.",
        );
      }

      const proofPath = buildProofStoragePath(user.id, listingId, file.name);
      const { error: uploadError } = await supabase.storage
        .from("listing-proofs")
        .upload(proofPath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(`Proof upload failed: ${uploadError.message}`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from("listings")
        .update({
          resort_confirmation_number: confirmationNumber.trim(),
          confirmation_proof_path: proofPath,
          confirmation_proof_hash: proofHash,
          owner_attestation_accepted_at: new Date().toISOString(),
          proof_status: "submitted",
          proof_rejected_reason: null,
        })
        .eq("id", listingId);

      if (updateError) {
        await supabase.storage.from("listing-proofs").remove([proofPath]);
        throw new Error(updateError.message);
      }

      toast.success("Proof resubmitted — our team will review shortly.");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Resubmit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Re-upload Reservation Proof
          </DialogTitle>
          <DialogDescription>
            Update the confirmation number and file, then confirm. Our team will review again within
            a business day.
          </DialogDescription>
        </DialogHeader>

        {rejectedReason && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm">
            <p className="font-medium text-red-800 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Why the previous upload was rejected
            </p>
            <p className="text-red-700">{rejectedReason}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="reupload-number" className="text-sm font-medium">
              Resort Confirmation Number
            </Label>
            <Input
              id="reupload-number"
              type="text"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              placeholder="e.g. HLT-8472291"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The code on your reservation email from the resort.
            </p>
          </div>

          <div>
            <Label htmlFor="reupload-file" className="text-sm font-medium">
              Upload Reservation Email (PDF / JPG / PNG)
            </Label>
            <Input
              id="reupload-file"
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={handleFileChange}
              className="mt-1"
            />
            {fileError ? (
              <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{fileError}</span>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Up to {Math.round(MAX_PROOF_FILE_SIZE_BYTES / 1024 / 1024)}&nbsp;MB. Only RAV staff and you can see this file.
              </p>
            )}
          </div>

          <div className="flex items-start gap-2 pt-1">
            <Checkbox
              id="reupload-attestation"
              checked={attestationAccepted}
              onCheckedChange={(checked) => setAttestationAccepted(!!checked)}
            />
            <Label htmlFor="reupload-attestation" className="text-xs leading-snug">
              I confirm this reservation is genuine and held under my name.
              I understand misrepresenting a reservation may result in account
              suspension and legal action.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Resubmit Proof"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
