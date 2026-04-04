import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMyMembership } from "@/hooks/useMembership";
import { MembershipBadge } from "@/components/MembershipBadge";
import Header from "@/components/Header";
import { usePageMeta } from "@/hooks/usePageMeta";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const queryClient = useQueryClient();
  const { user, isPropertyOwner } = useAuth();
  const { data: membership } = useMyMembership();

  usePageMeta({
    title: "Subscription Activated",
    noindex: true,
  });

  // Invalidate membership cache to pick up the new tier from webhook
  useEffect(() => {
    if (sessionId && user) {
      // Poll a few times to catch the webhook update
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["my-membership", user.id] });
      }, 2000);
      // Stop polling after 15 seconds
      const timeout = setTimeout(() => clearInterval(interval), 15000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [sessionId, user, queryClient]);

  const dashboardLink = isPropertyOwner()
    ? "/owner-dashboard?tab=account"
    : "/account";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background pt-20 pb-16">
        <div className="max-w-lg mx-auto px-4">
          <Card className="text-center">
            <CardHeader className="pb-2">
              <div className="mx-auto mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-2xl">Subscription Activated!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Your subscription is now active. All premium features are available immediately.
              </p>

              {membership?.tier && (
                <div className="flex justify-center">
                  <MembershipBadge tier={membership.tier} />
                </div>
              )}

              <div className="pt-4">
                <Button asChild>
                  <Link to={dashboardLink}>
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default SubscriptionSuccess;
