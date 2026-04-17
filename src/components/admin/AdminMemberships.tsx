import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Crown, Users, DollarSign, TrendingDown, BarChart3, Settings2, UserCheck } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MembershipBadge } from "@/components/MembershipBadge";
import { AdminMembershipOverride } from "@/components/admin/AdminMembershipOverride";
import { useMembershipTiers } from "@/hooks/useMembership";
import type { MembershipTier } from "@/types/database";
import { format } from "date-fns";

interface MembershipRow {
  id: string;
  user_id: string;
  status: string;
  started_at: string;
  admin_override: boolean;
  admin_notes: string | null;
  tier: MembershipTier;
  user_email?: string;
}

interface SubscriptionMetrics {
  total_mrr_cents: number;
  active_paid_count: number;
  active_free_count: number;
  cancelled_count: number;
  override_count: number;
  tier_breakdown: Array<{
    tier_key: string;
    tier_name: string;
    role_category: string;
    monthly_price_cents: number;
    user_count: number;
    mrr_cents: number;
  }>;
}

export function AdminMemberships() {
  const { data: tiers } = useMembershipTiers();
  const [memberships, setMemberships] = useState<MembershipRow[]>([]);
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [overrideTarget, setOverrideTarget] = useState<MembershipRow | null>(null);

  // Account Manager assignment state
  const [amTarget, setAmTarget] = useState<MembershipRow | null>(null);
  const [staffUsers, setStaffUsers] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [amSaving, setAmSaving] = useState(false);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      // Fetch memberships with admin fields
      const { data, error } = await supabase
        .from("user_memberships")
        .select("id, user_id, status, started_at, admin_override, admin_notes, tier:membership_tiers(*)")
        .order("started_at", { ascending: false });

      if (error) throw error;

      // Fetch user emails
      const rows = (data || []) as Array<MembershipRow>;
      const userIds = rows.map((m) => m.user_id);
      let emailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email")
          .in("id", userIds);
        const profileRows = (profiles || []) as Array<{ id: string; email: string }>;
        emailMap = profileRows.reduce((acc: Record<string, string>, p) => {
          acc[p.id] = p.email;
          return acc;
        }, {});
      }

      setMemberships(
        rows.map((m) => ({
          ...m,
          user_email: emailMap[m.user_id] || "Unknown",
        }))
      );

      // Fetch MRR metrics
      const { data: metricsData, error: metricsError } = await supabase.rpc("get_subscription_metrics");
      if (!metricsError && metricsData) {
        setMetrics(metricsData as SubscriptionMetrics);
      }
    } catch (error) {
      console.error("Error fetching memberships:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter memberships
  const filteredMemberships = memberships.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (roleFilter !== "all" && m.tier?.role_category !== roleFilter) return false;
    return true;
  });

  // Tier distribution from metrics or computed
  const tierCounts = (tiers || []).map((tier) => ({
    tier,
    count: memberships.filter((m) => m.tier?.id === tier.id).length,
  }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totalMrr = metrics ? metrics.total_mrr_cents / 100 : 0;
  const activePaid = metrics?.active_paid_count ?? 0;
  const arpu = activePaid > 0 ? totalMrr / activePaid : 0;
  const totalActive = activePaid + (metrics?.active_free_count ?? 0);
  const cancelled = metrics?.cancelled_count ?? 0;
  const churnRate = totalActive + cancelled > 0
    ? ((cancelled / (totalActive + cancelled)) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Memberships</h2>
        <p className="text-muted-foreground">
          Subscription metrics, tier distribution, and member management
        </p>
      </div>

      {/* MRR Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-teal-600" />
              Monthly Recurring Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">${totalMrr.toFixed(0)}</span>
            <span className="text-muted-foreground text-sm">/mo</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              Active Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{activePaid}</span>
            <p className="text-xs text-muted-foreground">
              + {metrics?.active_free_count ?? 0} free
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
              ARPU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">${arpu.toFixed(2)}</span>
            <p className="text-xs text-muted-foreground">avg revenue per paid user</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-teal-600" />
              Churn Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{churnRate}%</span>
            <p className="text-xs text-muted-foreground">
              {cancelled} cancelled
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier distribution summary */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {tierCounts.map(({ tier, count }) => (
          <Card key={tier.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MembershipBadge tier={tier} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-2xl font-bold">{count}</span>
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {tier.role_category}s
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Memberships table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            All User Memberships
          </CardTitle>
          <CardDescription>
            {filteredMemberships.length} of {memberships.length} memberships
            {metrics?.override_count ? ` (${metrics.override_count} admin overrides)` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="owner">Owners</SelectItem>
                <SelectItem value="traveler">Travelers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredMemberships.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No memberships found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Override</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMemberships.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.user_email}
                    </TableCell>
                    <TableCell>
                      {m.tier && <MembershipBadge tier={m.tier} />}
                    </TableCell>
                    <TableCell className="capitalize">
                      {m.tier?.role_category}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.status === "active" ? "default" : "secondary"}
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {m.admin_override ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Admin Override
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(m.started_at), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOverrideTarget(m)}
                        >
                          <Settings2 className="h-4 w-4" />
                        </Button>
                        {m.tier?.role_category === 'owner' && m.tier?.tier_level === 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Assign Account Manager"
                            onClick={async () => {
                              setAmTarget(m);
                              setSelectedStaffId('');
                              // Fetch staff users
                              const { data } = await supabase
                                .from('user_roles')
                                .select('user_id, profiles:profiles!user_roles_user_id_fkey(id, full_name, email)')
                                .in('role', ['rav_admin', 'rav_staff', 'rav_owner']);
                              if (data) {
                                const staff = data
                                  .map((r: Record<string, unknown>) => r.profiles as { id: string; full_name: string; email: string } | null)
                                  .filter(Boolean) as Array<{ id: string; full_name: string; email: string }>;
                                // Deduplicate by id
                                const unique = [...new Map(staff.map((s) => [s.id, s])).values()];
                                setStaffUsers(unique);
                              }
                            }}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Override Dialog */}
      {overrideTarget && (
        <AdminMembershipOverride
          membership={overrideTarget}
          open={!!overrideTarget}
          onOpenChange={(open) => {
            if (!open) setOverrideTarget(null);
          }}
          onSaved={() => {
            setOverrideTarget(null);
            fetchData();
          }}
        />
      )}

      {/* Account Manager Assignment Dialog */}
      <Dialog open={!!amTarget} onOpenChange={(open) => { if (!open) setAmTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Account Manager</DialogTitle>
            <DialogDescription>
              {amTarget?.user_email} (Business owner)
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffUsers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.full_name || s.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAmTarget(null)}>Cancel</Button>
            <Button
              disabled={!selectedStaffId || amSaving}
              onClick={async () => {
                if (!amTarget || !selectedStaffId) return;
                setAmSaving(true);
                try {
                  const { error } = await supabase
                    .from('profiles')
                    .update({ account_manager_id: selectedStaffId })
                    .eq('id', amTarget.user_id);
                  if (error) throw error;
                  toast({ title: 'Account manager assigned' });
                  setAmTarget(null);
                } catch {
                  toast({ title: 'Error', description: 'Failed to assign account manager.', variant: 'destructive' });
                } finally {
                  setAmSaving(false);
                }
              }}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
