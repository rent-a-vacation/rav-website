import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, Users, TrendingUp, Gift, Share2 } from "lucide-react";
import { useReferralCode, useReferralStats, useReferralList } from "@/hooks/useReferral";
import { buildReferralLink, referralConversionRate, formatRewardText } from "@/lib/referral";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function ReferralDashboard() {
  const { data: code, isLoading: codeLoading } = useReferralCode();
  const { data: stats, isLoading: statsLoading } = useReferralStats();
  const { data: referrals = [], isLoading: listLoading } = useReferralList();
  const [copied, setCopied] = useState(false);

  const referralLink = code ? buildReferralLink(code) : "";

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Referral link copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const isLoading = codeLoading || statsLoading;

  return (
    <div className="space-y-6">
      {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link with other timeshare owners. When they sign up and complete a booking, you earn a reward.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex gap-2">
              <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm font-mono truncate">
                {referralLink}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
          )}
          {code && (
            <p className="text-xs text-muted-foreground mt-2">
              Your code: <span className="font-mono font-medium">{code}</span>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Skeleton className="h-7 w-8" /> : stats?.totalReferrals ?? 0}
                </p>
                <p className="text-xs text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {statsLoading ? <Skeleton className="h-7 w-8" /> : `${referralConversionRate(stats!)}%`}
                </p>
                <p className="text-xs text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {statsLoading ? (
                    <Skeleton className="h-7 w-16" />
                  ) : (
                    formatRewardText(stats?.rewardType ?? "commission_discount", stats?.totalReward ?? 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral List */}
      <Card>
        <CardHeader>
          <CardTitle>Referral History</CardTitle>
          <CardDescription>
            People who signed up using your referral link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No referrals yet. Share your link to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Referral #{r.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.status === "converted" && (
                      <span className="text-xs text-emerald-600 font-medium">
                        {formatRewardText(r.reward_type, r.reward_amount)}
                      </span>
                    )}
                    <Badge
                      variant={r.status === "converted" ? "default" : "secondary"}
                    >
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
