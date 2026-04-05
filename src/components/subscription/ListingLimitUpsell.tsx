import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ArrowUpCircle, Crown } from "lucide-react";
import { useOwnerTiers } from "@/hooks/useMembership";
import { useNavigate } from "react-router-dom";
import type { MembershipTier } from "@/types/database";

interface ListingLimitUpsellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  maxListings: number;
  tierName: string;
}

export function ListingLimitUpsell({
  open,
  onOpenChange,
  currentCount,
  maxListings,
  tierName,
}: ListingLimitUpsellProps) {
  const { data: ownerTiers } = useOwnerTiers();
  const navigate = useNavigate();

  // Show tiers above current tier level
  const currentTier = ownerTiers?.find((t) => t.tier_name === tierName);
  const upgradeTiers = ownerTiers?.filter(
    (t) => t.tier_level > (currentTier?.tier_level ?? 0)
  ) ?? [];

  const handleViewPlans = () => {
    onOpenChange(false);
    navigate("/owner-dashboard?tab=account");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Listing Limit Reached
          </DialogTitle>
          <DialogDescription>
            You&apos;ve used {currentCount} of {maxListings} listings on your{" "}
            <strong>{tierName}</strong> plan. Upgrade to list more properties.
          </DialogDescription>
        </DialogHeader>

        {upgradeTiers.length > 0 && (
          <div className="space-y-3 py-2">
            {upgradeTiers.map((tier) => (
              <UpgradeTierOption key={tier.id} tier={tier} />
            ))}
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleViewPlans}>
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            View Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpgradeTierOption({ tier }: { tier: MembershipTier }) {
  const listingLabel =
    tier.max_active_listings === null
      ? "Unlimited listings"
      : `Up to ${tier.max_active_listings} listings`;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Crown className="h-5 w-5 text-teal-600" />
        <div>
          <div className="font-medium">{tier.tier_name}</div>
          <div className="text-sm text-muted-foreground">{listingLabel}</div>
        </div>
      </div>
      <Badge variant="secondary">
        ${(tier.monthly_price_cents / 100).toFixed(0)}/mo
      </Badge>
    </div>
  );
}
