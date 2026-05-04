import { useEffect, useState } from "react";
import { useSubmitDispute } from "@/hooks/useSubmitDispute";
import { useDisputeEvidence } from "@/hooks/useDisputeEvidence";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import EvidenceUpload from "./EvidenceUpload";
import type { Database } from "@/types/database";

type DisputeCategory = Database["public"]["Enums"]["dispute_category"];

interface ReportIssueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  ownerId?: string;
  resortName?: string;
  role?: "renter" | "owner";
  /**
   * Pre-fill the dispute form from a check-in issue report (#467 / Gap C).
   * Mapped from the renter's earlier `issueType` + `issueDescription` so they
   * don't have to retype. Photo evidence is referenced via path; renter can
   * still add additional evidence in the dialog.
   */
  prefill?: {
    category?: DisputeCategory;
    description?: string;
    photoNote?: string;
  };
}

// Map check-in issue types (TravelerCheckin) to dispute categories.
const CHECKIN_TO_DISPUTE_CATEGORY: Record<string, DisputeCategory> = {
  no_access: "access_issues",
  wrong_unit: "property_not_as_described",
  not_as_described: "property_not_as_described",
  cleanliness: "cleanliness",
  amenities_missing: "property_not_as_described",
  safety_concern: "safety_concerns",
  other: "other",
};

export function mapCheckinIssueToDisputeCategory(issueType: string): DisputeCategory {
  return CHECKIN_TO_DISPUTE_CATEGORY[issueType] ?? "other";
}

const RENTER_CATEGORIES: { value: DisputeCategory; label: string }[] = [
  { value: "property_not_as_described", label: "Property not as described" },
  { value: "access_issues", label: "Cannot access property" },
  { value: "safety_concerns", label: "Safety concerns" },
  { value: "cleanliness", label: "Cleanliness issues" },
  { value: "owner_no_show", label: "Owner did not provide access" },
  { value: "cancellation_dispute", label: "Cancellation / refund dispute" },
  { value: "payment_dispute", label: "Payment issue" },
  { value: "other", label: "Other" },
];

const OWNER_CATEGORIES: { value: string; label: string }[] = [
  { value: "renter_damage", label: "Property damage by renter" },
  { value: "renter_no_show", label: "Renter no-show" },
  { value: "unauthorized_guests", label: "Unauthorized guests" },
  { value: "rule_violation", label: "Rule violation" },
  { value: "late_checkout", label: "Late checkout" },
  { value: "cancellation_dispute", label: "Cancellation / refund dispute" },
  { value: "payment_dispute", label: "Payment issue" },
  { value: "other", label: "Other" },
];

const ReportIssueDialog = ({
  open,
  onOpenChange,
  bookingId,
  ownerId,
  resortName,
  role = "renter",
  prefill,
}: ReportIssueDialogProps) => {
  const { toast } = useToast();
  const submitDispute = useSubmitDispute();
  const evidence = useDisputeEvidence();

  const [category, setCategory] = useState<DisputeCategory | "">("");
  const [description, setDescription] = useState("");

  // Apply prefill when the dialog opens (#467 / Gap C — issue→dispute pre-fill).
  // Re-applied on every open so the check-in issue path always lands users at
  // the right state without leaking stale data between independent opens.
  useEffect(() => {
    if (!open) return;
    if (prefill?.category) setCategory(prefill.category);
    if (prefill?.description !== undefined) {
      const note = prefill.photoNote ? `\n\n${prefill.photoNote}` : "";
      setDescription(`${prefill.description}${note}`);
    }
  }, [open, prefill?.category, prefill?.description, prefill?.photoNote]);

  const categories = role === "owner" ? OWNER_CATEGORIES : RENTER_CATEGORIES;

  const handleSubmit = () => {
    if (!category || !description.trim()) return;

    submitDispute.mutate(
      {
        bookingId,
        category: category as DisputeCategory,
        description: description.trim(),
        reportedUserId: ownerId,
        evidenceUrls: evidence.getEvidenceUrls(),
      },
      {
        onSuccess: () => {
          toast({
            title: "Issue reported",
            description:
              "Our team will review your report and get back to you within 24 hours.",
          });
          setCategory("");
          setDescription("");
          evidence.resetFiles();
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: "Failed to submit report",
            description: error.message,
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Report an Issue
          </DialogTitle>
          <DialogDescription>
            {role === "owner"
              ? "Report a problem with a renter or their stay."
              : resortName
                ? `Report a problem with your stay at ${resortName}.`
                : "Report a problem with your booking."}{" "}
            Our team will investigate and respond within 24 hours.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Issue Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DisputeCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an issue type" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dispute_description">Description</Label>
            <Textarea
              id="dispute_description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail. Include dates, what happened, and what you expected."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Be as specific as possible. You may be contacted for additional information.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Evidence (optional)</Label>
            <EvidenceUpload
              uploadedFiles={evidence.uploadedFiles}
              isUploading={evidence.isUploading}
              onUpload={evidence.uploadFiles}
              onRemove={evidence.removeFile}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!category || !description.trim() || submitDispute.isPending}
            >
              {submitDispute.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportIssueDialog;
