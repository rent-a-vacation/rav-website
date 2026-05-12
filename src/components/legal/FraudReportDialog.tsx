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
import { ShieldAlert, Send, Loader2 } from "lucide-react";

export type FraudCategory =
  | "payment_fraud"
  | "identity_fraud"
  | "fake_listing"
  | "phishing"
  | "scam_pattern"
  | "unauthorized_access"
  | "timeshare_exit_scheme"
  | "other";

const CATEGORY_LABELS: Record<FraudCategory, string> = {
  payment_fraud: "Payment fraud — money taken, no service rendered",
  identity_fraud: "Identity fraud — fake host / impersonation",
  fake_listing: "Fake listing — property doesn't exist or isn't theirs",
  phishing: "Phishing — suspicious email/message asking for credentials",
  scam_pattern: "Scam pattern — coordinated suspicious behavior",
  unauthorized_access: "Unauthorized account access (mine or someone else's)",
  timeshare_exit_scheme: "Timeshare-exit scheme being marketed via RAV",
  other: "Something else suspicious",
};

const SEVERITY_LABELS = {
  critical: "Critical — active fraud right now (e.g. payment in progress)",
  high: "High — confident, fraud appears real",
  medium: "Medium — suspicious, want investigation",
  low: "Low — pattern observation",
} as const;

interface FraudReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional — set when reporting against a specific listing (PropertyDetail), omit when filed from Footer. */
  listingId?: string;
  /** Optional — for "more options" menus on listing pages. */
  listingLabel?: string;
}

/**
 * Fraud reporting intake (#492). FTC v. Carroll (2026) made clear the FTC
 * actively enforces in the timeshare space. Compliance brief § 3.6 requires
 * a fraud-reporting mechanism with a documented response protocol.
 *
 * Separate from the post-booking dispute system — fraud reports can be:
 * - filed by anonymous users
 * - tied to a listing OR not (footer-filed reports have no listingId)
 * - higher severity → routes to senior admin queue
 */
export function FraudReportDialog({
  open,
  onOpenChange,
  listingId,
  listingLabel,
}: FraudReportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState<FraudCategory | "">("");
  const [severity, setSeverity] = useState<keyof typeof SEVERITY_LABELS>("high");
  const [description, setDescription] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthed = !!user;

  function reset() {
    setCategory("");
    setSeverity("high");
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
      toast({
        title: "Pick a category",
        description: "Tell us what kind of fraud this is.",
        variant: "destructive",
      });
      return;
    }
    if (description.trim().length < 20) {
      toast({
        title: "Tell us more",
        description: "Please describe the fraud in at least 20 characters so our team can investigate.",
        variant: "destructive",
      });
      return;
    }
    if (!isAuthed && !reporterEmail.trim()) {
      toast({
        title: "Email needed",
        description: "Please leave an email so we can follow up if needed. You can also leave it blank — but we may not be able to update you.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const payload = {
      listing_id: listingId ?? null,
      reporter_id: user?.id ?? null,
      reporter_email: isAuthed ? null : reporterEmail.trim() || null,
      reporter_name: isAuthed ? null : reporterName.trim() || null,
      category,
      severity,
      description: description.trim(),
    };

    const { error } = await supabase.from("fraud_reports").insert(payload);
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
      title: "Fraud report received",
      description:
        "Thanks. A senior member of our team will review and may contact you. If this is an active emergency, also call your local authorities.",
    });
    close(false);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg" data-testid="fraud-report-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Report suspected fraud
          </DialogTitle>
          <DialogDescription>
            {listingLabel
              ? `Reporting against "${listingLabel}".`
              : "Fraud reports go to RAV's senior trust & safety team."}{" "}
            For active emergencies (money being taken from you right now), also call your local
            authorities or your bank's fraud line. You can stay anonymous — email helps us follow up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="fr-category" className="text-sm font-medium">
              What kind of fraud?
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as FraudCategory)}>
              <SelectTrigger id="fr-category" className="mt-1">
                <SelectValue placeholder="Pick a category" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_LABELS) as FraudCategory[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fr-severity" className="text-sm font-medium">
              How urgent?
            </Label>
            <Select
              value={severity}
              onValueChange={(v) => setSeverity(v as keyof typeof SEVERITY_LABELS)}
            >
              <SelectTrigger id="fr-severity" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SEVERITY_LABELS) as Array<keyof typeof SEVERITY_LABELS>).map((s) => (
                  <SelectItem key={s} value={s}>
                    {SEVERITY_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fr-description" className="text-sm font-medium">
              Describe what happened (or what you're seeing)
            </Label>
            <Textarea
              id="fr-description"
              className="mt-1"
              placeholder="What happened, who's involved, when, what evidence you have. Specific details help our team move faster."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              maxLength={10000}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/10000 characters · 20 minimum
            </p>
          </div>

          {!isAuthed && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs font-medium text-foreground">
                Contact info <span className="font-normal text-muted-foreground">(name optional; email recommended)</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="fr-name" className="text-xs">
                    Name <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="fr-name"
                    className="mt-1"
                    placeholder="Optional"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fr-email" className="text-xs">
                    Email
                  </Label>
                  <Input
                    id="fr-email"
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
          <Button variant="destructive" onClick={submit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit fraud report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
