import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface MLANoticeProps {
  className?: string;
}

/**
 * Military Lending Act notice displayed in the payment flow for accounts that
 * have self-identified as active-duty servicemembers (profiles.is_active_duty_military
 * = TRUE). The protection itself applies by law regardless of self-identification —
 * the Terms-of-Service carve-out in Section 9 is universal — but this in-product
 * notice provides explicit acknowledgement at the highest-stakes point in the flow.
 *
 * @see docs/legal/_extracted_legal_dossier.txt § VI (Steines v. Westgate Palace)
 * @see compliance-gap-analysis.md item P-13
 * @see GitHub issue #490
 */
export function MLANotice({ className }: MLANoticeProps) {
  return (
    <div
      data-testid="mla-notice"
      role="note"
      aria-label="Military Lending Act notice"
      className={cn(
        "rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-start gap-3",
        className,
      )}
    >
      <Shield className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
      <div className="text-sm">
        <p className="font-semibold text-foreground mb-1">
          Military Lending Act notice
        </p>
        <p className="text-muted-foreground leading-relaxed">
          Federal law provides important protections to active-duty members of the U.S. Armed Forces
          and their dependents under the Military Lending Act (10 U.S.C. § 987). Any agreement that
          would otherwise require you to resolve disputes through binding arbitration is{" "}
          <strong>not enforceable as to you</strong>. You may pursue any dispute arising out of this
          booking in a court of competent jurisdiction. Thank you for your service.
        </p>
      </div>
    </div>
  );
}
