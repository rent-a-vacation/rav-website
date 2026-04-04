import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, ExternalLink, AlertTriangle, Loader2, CalendarDays } from "lucide-react";
import { MembershipBadge } from "@/components/MembershipBadge";
import { useMyMembership } from "@/hooks/useMembership";
import { useManageBilling } from "@/hooks/useSubscription";

export function SubscriptionManagement() {
  const { data: membership, isLoading } = useMyMembership();
  const manageBilling = useManageBilling();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-24 flex items-center justify-center text-muted-foreground">
            Loading subscription...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!membership) return null;

  const isPaid = !!membership.stripe_subscription_id;
  const isCancelling = membership.status === "cancelled";
  const isPaymentFailed = membership.status === "pending";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5" />
          Subscription & Billing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current plan */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current Plan</span>
              <MembershipBadge tier={membership.tier} />
              {isPaid && !isCancelling && !isPaymentFailed && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                  Active
                </Badge>
              )}
              {isCancelling && (
                <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50">
                  Cancelling
                </Badge>
              )}
              {isPaymentFailed && (
                <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                  Payment Issue
                </Badge>
              )}
            </div>
            {isPaid && membership.expires_at && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {isCancelling
                  ? `Access until ${new Date(membership.expires_at).toLocaleDateString()}`
                  : `Next billing: ${new Date(membership.expires_at).toLocaleDateString()}`}
              </p>
            )}
            {!isPaid && (
              <p className="text-sm text-muted-foreground">
                Upgrade below to unlock premium features
              </p>
            )}
          </div>

          {isPaid && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => manageBilling.mutate()}
              disabled={manageBilling.isPending}
            >
              {manageBilling.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Manage Billing
            </Button>
          )}
        </div>

        {/* Warning banners */}
        {isCancelling && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your subscription is set to cancel on{" "}
              <strong>{new Date(membership.expires_at!).toLocaleDateString()}</strong>.
              You&apos;ll keep your current benefits until then, after which you&apos;ll be
              moved to the Free plan. You can resubscribe anytime.
            </AlertDescription>
          </Alert>
        )}

        {isPaymentFailed && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Your last payment failed. Please update your payment method to keep your
              subscription active. Stripe will retry automatically, but you can resolve
              this now by clicking &quot;Manage Billing&quot; above.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
