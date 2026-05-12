import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Send, Loader2 } from "lucide-react";

export type ListingAccuracyCategory =
  | "photos"
  | "description"
  | "amenities"
  | "pricing"
  | "availability"
  | "location"
  | "cancellation_policy"
  | "other";

const CATEGORY_LABELS: Record<ListingAccuracyCategory, string> = {
  photos: "Photos don't match the property",
  description: "Description is inaccurate",
  amenities: "Amenities are missing or misrepresented",
  pricing: "Pricing or fees are misleading",
  availability: "Availability shown isn't real",
  location: "Location is wrong or misleading",
  cancellation_policy: "Cancellation policy is unclear or inconsistent",
  other: "Something else",
};

interface ListingAccuracyReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  /** Optional pre-fill for resort name to give the user confidence they're reporting the right listing. */
  listingLabel?: string;
}

/**
 * Pre-booking listing-accuracy reporting (#491). Distinct from the post-booking
 * dispute system: no booking_id, no auth required. Palmer v. FantaSea Resorts
 * (NJ App. Div. 2025) — platforms that don't accept inaccuracy complaints
 * inherit liability for misrepresentations.
 */
export function ListingAccuracyReportDialog({
  open,
  onOpenChange,
  listingId,
  listingLabel,
}: ListingAccuracyReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState<ListingAccuracyCategory | "">("");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthed = !!user;

  function reset() {
    setCategory("");
    setDescription("");
    setReporterName("");
    setReporterEmail("");
  }

  function close(open: boolean) {
    if (!open) reset();
    onOpenChange(open);
  }

  async function submit() {
    if (!category) {
      toast({ title: "Pick a category", description: "Tell us what kind of inaccuracy this is.", variant: "destructive" });
      return;
    }
    if (description.trim().length < 10) {
      toast({
        title: "Tell us more",
        description: "Please describe the inaccuracy in at least 10 characters so our team can investigate.",
        variant: "destructive",
      });
      return;
    }
    if (!isAuthed && !reporterEmail.trim()) {
      toast({
        title: "Email needed",
        description: "Please leave an email so we can follow up if needed.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      listing_id: listingId,
      reporter_id: user?.id ?? null,
      reporter_email: isAuthed ? null : reporterEmail.trim() || null,
      reporter_name: isAuthed ? null : reporterName.trim() || null,
      category,
      description: description.trim(),
    };

    const { error } = await supabase.from("listing_accuracy_reports").insert(payload);
    setIsSubmitting(false);
    if (error) {
      toast({
        title: "Couldn't submit",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Report received",
      description:
        "Thanks — our team will investigate and may follow up. You can keep browsing while we look into it.",
    });
    close(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg" data-testid="listing-accuracy-report-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Report a listing inaccuracy
          </DialogTitle>
          <DialogDescription>
            {listingLabel
              ? `Help us keep "${listingLabel}" accurate.`
              : "Help us keep this listing accurate."}{" "}
            Pre-booking reports go to our team for investigation. You can stay anonymous —
            providing an email just helps us follow up if we need more detail.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="lir-category" className="text-sm font-medium">
              What's inaccurate?
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as ListingAccuracyCategory)}>
              <SelectTrigger id="lir-category" className="mt-1">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as ListingAccuracyCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="lir-description" className="text-sm font-medium">
              Describe the inaccuracy
            </Label>
            <Textarea
              id="lir-description"
              className="mt-1"
              placeholder="e.g. 'Photos show an ocean view but the unit faces the parking lot'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={5000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/5000 characters · 10 minimum
            </p>
          </div>

          {!isAuthed && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">
                Contact info <span className="font-normal text-muted-foreground">(name optional, email needed for follow-up)</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="lir-name" className="text-xs">
                    Name <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="lir-name"
                    className="mt-1"
                    placeholder="Optional"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lir-email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="lir-email"
                    type="email"
                    className="mt-1"
                    placeholder="you@example.com"
                    value={reporterEmail}
                    onChange={(e) => setReporterEmail(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
