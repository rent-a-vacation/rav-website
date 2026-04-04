import { Skeleton } from "@/components/ui/skeleton";
import { MembershipTierCard } from "@/components/MembershipTierCard";
import { MembershipBadge } from "@/components/MembershipBadge";
import { useMyMembership, useRenterTiers, useOwnerTiers } from "@/hooks/useMembership";
import { useCreateSubscription, useUpdateSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import type { MembershipTier } from "@/types/database";

interface MembershipPlansProps {
  category?: "traveler" | "owner";
}

export function MembershipPlans({ category }: MembershipPlansProps) {
  const { isPropertyOwner } = useAuth();
  const resolvedCategory = category ?? (isPropertyOwner() ? "owner" : "traveler");

  const { data: renterTiers, isLoading: loadingRenter } = useRenterTiers();
  const { data: ownerTiers, isLoading: loadingOwner } = useOwnerTiers();
  const { data: membership, isLoading: loadingMembership } = useMyMembership();

  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();

  const tiers: MembershipTier[] =
    resolvedCategory === "owner" ? ownerTiers || [] : renterTiers || [];
  const isLoading =
    resolvedCategory === "owner" ? loadingOwner : loadingRenter;

  const currentTierLevel = membership?.tier?.tier_level ?? 0;
  const hasActiveSubscription = !!membership?.stripe_subscription_id;
  const isMutating = createSubscription.isPending || updateSubscription.isPending;

  const handleSelectTier = (tierKey: string) => {
    if (hasActiveSubscription) {
      // Already subscribed — upgrade/downgrade/cancel via update
      updateSubscription.mutate(tierKey);
    } else {
      // New subscription — redirect to Stripe Checkout
      createSubscription.mutate(tierKey);
    }
  };

  if (isLoading || loadingMembership) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[420px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current plan summary */}
      {membership && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">Your current plan:</span>
          <MembershipBadge tier={membership.tier} />
          {membership.status === "cancelled" && membership.expires_at && (
            <span className="text-sm text-amber-600">
              — cancelling, active until{" "}
              {new Date(membership.expires_at).toLocaleDateString()}
            </span>
          )}
          {membership.status === "pending" && (
            <span className="text-sm text-red-600">
              — payment issue, please update your card
            </span>
          )}
        </div>
      )}

      {/* Tier cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <MembershipTierCard
            key={tier.id}
            tier={tier}
            isCurrent={membership?.tier_id === tier.id}
            highlighted={tier.tier_level === 1}
            currentTierLevel={currentTierLevel}
            hasActiveSubscription={hasActiveSubscription}
            onSelectTier={handleSelectTier}
            isLoading={isMutating}
          />
        ))}
      </div>
    </div>
  );
}
