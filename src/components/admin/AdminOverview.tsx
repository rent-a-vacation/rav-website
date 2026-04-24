import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Calendar,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
} from "lucide-react";
import { ActionNeededSection } from "@/components/dashboard/ActionNeededSection";
import { useAdminPriorityActions } from "@/hooks/usePriorityActions";

interface PlatformStats {
  totalProperties: number;
  totalOwners: number;
  totalRenters: number;
  activeListings: number;
  pendingListings: number;
  totalBookings: number;
  confirmedBookings: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayouts: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<PlatformStats>({
    totalProperties: 0,
    totalOwners: 0,
    totalRenters: 0,
    activeListings: 0,
    pendingListings: 0,
    totalBookings: 0,
    confirmedBookings: 0,
    totalRevenue: 0,
    totalCommission: 0,
    pendingPayouts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { data: priorityActions = [], isLoading: priorityActionsLoading } = useAdminPriorityActions();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all counts in parallel
        const [
          { count: propertiesCount },
          { count: ownersCount },
          { count: rentersCount },
          { count: activeListingsCount },
          { count: pendingListingsCount },
          { data: bookingsData },
        ] = await Promise.all([
          supabase.from("properties").select("*", { count: "exact", head: true }),
          supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "property_owner"),
          supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "renter"),
          supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("listings").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
          supabase.from("bookings").select("total_amount, rav_commission, owner_payout, status"),
        ]);

        const allBookings = bookingsData as { total_amount: number; rav_commission: number; owner_payout: number; status: string }[] || [];
        const confirmedOrCompleted = allBookings.filter(b => b.status === "confirmed" || b.status === "completed");
        
        const totalRevenue = confirmedOrCompleted.reduce((sum, b) => sum + (b.total_amount || 0), 0);
        const totalCommission = confirmedOrCompleted.reduce((sum, b) => sum + (b.rav_commission || 0), 0);
        const pendingPayouts = allBookings
          .filter(b => b.status === "confirmed")
          .reduce((sum, b) => sum + (b.owner_payout || 0), 0);

        setStats({
          totalProperties: propertiesCount || 0,
          totalOwners: ownersCount || 0,
          totalRenters: rentersCount || 0,
          activeListings: activeListingsCount || 0,
          pendingListings: pendingListingsCount || 0,
          totalBookings: allBookings.length,
          confirmedBookings: confirmedOrCompleted.length,
          totalRevenue,
          totalCommission,
          pendingPayouts,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Platform Overview</h2>
        <p className="text-muted-foreground">
          Real-time metrics across all properties and users
        </p>
      </div>

      {/* #381 — decisions that are blocking travelers, owners, or revenue move to the top */}
      <div className="mb-8">
        <ActionNeededSection
          actions={priorityActions}
          isLoading={priorityActionsLoading}
          emptyMessage="All clear — no pending admin actions."
        />
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {stats.confirmedBookings} bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RAV Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${stats.totalCommission.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Platform earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${stats.pendingPayouts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Owed to owners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingListings}
            </div>
            <p className="text-xs text-muted-foreground">
              Listings awaiting review
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProperties}</div>
            <p className="text-xs text-muted-foreground">
              Registered properties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeListings}</div>
            <p className="text-xs text-muted-foreground">
              Available for booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Property Owners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOwners}</div>
            <p className="text-xs text-muted-foreground">
              Registered owners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRenters}</div>
            <p className="text-xs text-muted-foreground">
              Registered renters
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
