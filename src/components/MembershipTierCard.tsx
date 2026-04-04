import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Mic, Crown, Infinity as InfinityIcon, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import type { MembershipTier } from "@/types/database";

interface MembershipTierCardProps {
  tier: MembershipTier;
  isCurrent?: boolean;
  highlighted?: boolean;
  currentTierLevel?: number;
  hasActiveSubscription?: boolean;
  onSelectTier?: (tierKey: string) => void;
  isLoading?: boolean;
}

export function MembershipTierCard({
  tier,
  isCurrent = false,
  highlighted = false,
  currentTierLevel = 0,
  hasActiveSubscription = false,
  onSelectTier,
  isLoading = false,
}: MembershipTierCardProps) {
  const features = Array.isArray(tier.features) ? tier.features : [];
  const priceDisplay =
    tier.monthly_price_cents === 0
      ? "Free"
      : `$${(tier.monthly_price_cents / 100).toFixed(0)}`;

  const isUpgrade = tier.tier_level > currentTierLevel;
  const isDowngrade = tier.tier_level < currentTierLevel;

  return (
    <Card
      className={`relative flex flex-col ${
        highlighted
          ? "border-primary shadow-lg ring-2 ring-primary/20"
          : isCurrent
            ? "border-primary/50"
            : ""
      }`}
    >
      {isCurrent && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
          Current Plan
        </Badge>
      )}

      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2">
          <Crown
            className={`h-8 w-8 ${
              tier.tier_level === 2
                ? "text-amber-500"
                : tier.tier_level === 1
                  ? "text-blue-500"
                  : "text-muted-foreground"
            }`}
          />
        </div>
        <CardTitle className="text-xl">{tier.tier_name}</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold">{priceDisplay}</span>
          {tier.monthly_price_cents > 0 && (
            <span className="text-muted-foreground text-sm">/month</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground text-center mb-4">
          {tier.description}
        </p>

        {/* Key stats */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              Voice searches/day
            </span>
            <span className="font-medium">
              {tier.voice_quota_daily === -1 ? (
                <span className="flex items-center gap-1">
                  <InfinityIcon className="h-3.5 w-3.5" /> Unlimited
                </span>
              ) : (
                tier.voice_quota_daily
              )}
            </span>
          </div>

          {tier.role_category === "owner" && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span>Commission discount</span>
                <span className="font-medium">
                  {tier.commission_discount_pct > 0
                    ? `${tier.commission_discount_pct}%`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Active listings</span>
                <span className="font-medium">
                  {tier.max_active_listings === null ? (
                    <span className="flex items-center gap-1">
                      <InfinityIcon className="h-3.5 w-3.5" /> Unlimited
                    </span>
                  ) : (
                    `Up to ${tier.max_active_listings}`
                  )}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Feature list */}
        <ul className="space-y-2 mb-6 flex-1">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div className="mt-auto">
          {isCurrent ? (
            <Button variant="outline" className="w-full" disabled>
              Current Plan
            </Button>
          ) : isUpgrade && onSelectTier ? (
            <Button
              className="w-full"
              onClick={() => onSelectTier(tier.tier_key)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowUp className="h-4 w-4 mr-2" />
              )}
              Upgrade to {tier.tier_name}
            </Button>
          ) : isDowngrade && onSelectTier ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onSelectTier(tier.tier_key)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-2" />
              )}
              {tier.monthly_price_cents === 0 && hasActiveSubscription
                ? "Downgrade to Free"
                : `Switch to ${tier.tier_name}`}
            </Button>
          ) : tier.monthly_price_cents === 0 ? (
            <Button variant="outline" className="w-full" disabled>
              Free Tier
            </Button>
          ) : (
            <Button variant="outline" className="w-full" disabled>
              Free Tier
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
