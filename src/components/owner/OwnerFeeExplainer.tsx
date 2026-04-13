import { useOwnerCommission } from "@/hooks/useOwnerCommission";
import { computeOwnerPayoutBreakdown } from "@/lib/pricing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ShieldCheck, TrendingUp, Info } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * OwnerFeeExplainer — Transparent fee breakdown for property owners.
 * Shows their effective commission rate, a sample calculation, and
 * the key message that Stripe fees never touch their payout.
 */
export function OwnerFeeExplainer() {
  const { effectiveRate, tierDiscount, tierName, loading } = useOwnerCommission();

  if (loading) return null;

  // Sample calculation for illustration ($200/night × 5 nights + $100 cleaning)
  const sample = computeOwnerPayoutBreakdown(200, 5, effectiveRate, 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="w-5 h-5 text-primary" />
          How Your Fees Work
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rate summary */}
        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
          <div>
            <p className="text-sm font-semibold text-foreground">Your Commission Rate</p>
            <p className="text-xs text-muted-foreground">
              {tierDiscount > 0
                ? `15% base − ${tierDiscount}% ${tierName} discount`
                : "15% base rate"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{effectiveRate}%</p>
            {tierDiscount > 0 && (
              <Badge variant="secondary" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                {tierName} savings
              </Badge>
            )}
          </div>
        </div>

        {/* Key message */}
        <div className="flex gap-2 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-green-800 dark:text-green-200">
              Stripe processing fees never touch your payout
            </p>
            <p className="text-green-700 dark:text-green-300 text-xs mt-0.5">
              Stripe charges 2.9% + $0.30 per transaction. This comes out of our commission — you always receive your full nightly rate + cleaning fee.
            </p>
          </div>
        </div>

        {/* Sample calculation */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Example Booking</p>
          <div className="text-sm space-y-1.5 bg-muted/50 rounded-lg p-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">$200 × 5 nights</span>
              <span>${sample.baseAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cleaning fee</span>
              <span>${sample.cleaningFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">RAV commission ({effectiveRate}%)</span>
              <span className="text-muted-foreground">${sample.ravCommission.toLocaleString()}</span>
            </div>
            <div className="border-t border-border my-1" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guest pays</span>
              <span className="font-medium">${sample.guestTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-primary font-bold">
              <span>You receive</span>
              <span>${sample.ownerPayout.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Stripe fee (from our commission)</span>
              <span>−${sample.stripeFee}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>RAV net revenue</span>
              <span>${sample.ravNetRevenue}</span>
            </div>
          </div>
        </div>

        {/* Tier upgrade nudge (only for Free tier) */}
        {tierDiscount === 0 && (
          <div className="flex items-start gap-2 p-3 bg-accent/5 rounded-lg border border-accent/20">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Reduce your rate:</span>{" "}
              Upgrade to <span className="font-semibold">Pro</span> (13%) or{" "}
              <span className="font-semibold">Business</span> (10%) to keep more of each booking.{" "}
              <Link to="/owner-dashboard?tab=account" className="text-primary hover:underline">
                View plans
              </Link>
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          <Link to="/user-guide#owner-fees-commission" className="text-primary hover:underline">
            Full fee details in our guide
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
