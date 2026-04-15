import { DollarSign, ShieldCheck, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { OwnerDashboardStats } from '@/types/ownerDashboard';

interface OwnerHeadlineStatsProps {
  stats: OwnerDashboardStats | undefined;
  isLoading: boolean;
}

function feesCoverageColor(percent: number | null) {
  if (percent == null) return 'text-muted-foreground';
  if (percent >= 100) return 'text-emerald-600';
  if (percent >= 50) return 'text-amber-600';
  return 'text-red-600';
}

export function OwnerHeadlineStats({ stats, isLoading }: OwnerHeadlineStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Earned */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-2xl font-bold">
              ${(stats?.total_earned_ytd ?? 0).toLocaleString()}
            </div>
          )}
          <p className="text-xs text-muted-foreground">earned this year</p>
        </CardContent>
      </Card>

      {/* Fees Covered */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fees Covered</CardTitle>
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-16" />
          ) : stats?.fees_covered_percent != null ? (
            <div className={`text-2xl font-bold ${feesCoverageColor(stats.fees_covered_percent)}`}>
              {stats.fees_covered_percent}%
            </div>
          ) : (
            <a href="#fees" className="text-sm text-blue-600 hover:underline">
              Enter fees &rarr;
            </a>
          )}
          <p className="text-xs text-muted-foreground">of your annual fees</p>
        </CardContent>
      </Card>

      {/* Active Bids */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Offers</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <div className="text-2xl font-bold">{stats?.active_bids ?? 0}</div>
          )}
          <p className="text-xs text-muted-foreground">Offers awaiting response</p>
        </CardContent>
      </Card>

      {/* Average Rating */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Guest Rating</CardTitle>
          <Star className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Coming soon</div>
          <p className="text-xs text-muted-foreground">guest satisfaction</p>
        </CardContent>
      </Card>
    </div>
  );
}
