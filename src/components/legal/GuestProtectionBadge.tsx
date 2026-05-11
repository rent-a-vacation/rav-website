import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface GuestProtectionBadgeProps {
  /**
   * `badge` — compact inline pill suitable for the trust-badges row on PropertyDetail.
   * `banner` — full-width row with explanatory copy + CTA, for placement above the Pay button on Checkout.
   */
  variant?: "badge" | "banner";
  className?: string;
}

/**
 * Surfaces the RAV Guest Protection promise (full refund within 5 business days
 * for Host cancellations within 30 days of check-in) at the points where it
 * matters to the Guest: the listing page and the checkout flow. The underlying
 * policy text is Legal Dossier § 8.5; this component is the product surface
 * required by Compliance Brief § 3.6 / compliance-gap-analysis item P-12.
 */
export function GuestProtectionBadge({
  variant = "badge",
  className,
}: GuestProtectionBadgeProps) {
  if (variant === "banner") {
    return (
      <Link
        to="/guest-protection"
        data-testid="guest-protection-banner"
        className={cn(
          "flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 transition-colors hover:bg-primary/10",
          className,
        )}
      >
        <ShieldCheck className="h-5 w-5 mt-0.5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            RAV Guest Protection
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
            If the Host cancels within 30 days of check-in, you receive a full refund
            within 5 business days. Click for details.
          </p>
        </div>
      </Link>
    );
  }

  // Default compact badge
  return (
    <Link
      to="/guest-protection"
      data-testid="guest-protection-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10",
        className,
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      RAV Guest Protection
    </Link>
  );
}
