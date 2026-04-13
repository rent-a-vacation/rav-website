import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Loader2, Calendar, Percent, Shield, FileCheck, XCircle } from "lucide-react";
import { format, addDays, startOfMonth, subMonths, isAfter, differenceInDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Booking, Listing, Property, PayoutStatus, EscrowStatus } from "@/types/database";
import { useOwnerCommission } from "@/hooks/useOwnerCommission";
import StripeConnectBanner from "./StripeConnectBanner";
import { OwnerFeeExplainer } from "./OwnerFeeExplainer";

interface EscrowInfo {
  escrow_status: EscrowStatus;
  escrow_amount: number;
  owner_confirmation_status: string | null;
  escrow_released_at: string | null;
}

interface BookingWithListing extends Booking {
  listing: Listing & { property: Property };
  escrow?: EscrowInfo | null;
}

interface EarningsSummary {
  totalEarnings: number;
  pendingPayouts: number;
  processingPayouts: number;
  completedPayouts: number;
  totalBookings: number;
  averagePerBooking: number;
}

interface MonthlyEarning {
  month: string;
  earnings: number;
  bookings: number;
}

const PAYOUT_PROCESSING_DAYS = 5;

const ESCROW_STEPS = [
  { key: "confirmed", label: "Confirmed" },
  { key: "verified", label: "Verified" },
  { key: "hold", label: "Hold Period" },
  { key: "released", label: "Released" },
] as const;

const getEscrowStep = (escrow: EscrowInfo | null | undefined, checkoutDate: string): number => {
  if (!escrow) return 0;
  switch (escrow.escrow_status) {
    case "released": return 4;
    case "verified": {
      const release = addDays(new Date(checkoutDate), PAYOUT_PROCESSING_DAYS);
      return isAfter(new Date(), release) ? 3 : 2;
    }
    case "confirmation_submitted": return 1;
    case "pending_confirmation": return 0;
    case "refunded": return -1;
    case "disputed": return -2;
    default: return 0;
  }
};

const EscrowStepper = ({ escrow, checkoutDate }: { escrow: EscrowInfo | null | undefined; checkoutDate: string }) => {
  if (!escrow) return null;

  if (escrow.escrow_status === "refunded") {
    return (
      <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
        <XCircle className="h-3 w-3 mr-1" />
        Refunded
      </Badge>
    );
  }
  if (escrow.escrow_status === "disputed") {
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
        <AlertCircle className="h-3 w-3 mr-1" />
        Disputed
      </Badge>
    );
  }

  const step = getEscrowStep(escrow, checkoutDate);
  const releaseDate = addDays(new Date(checkoutDate), PAYOUT_PROCESSING_DAYS);
  const daysLeft = differenceInDays(releaseDate, new Date());

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        {ESCROW_STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                i < step ? "bg-green-500" : i === step ? "bg-blue-500 ring-2 ring-blue-200" : "bg-gray-200"
              }`}
              title={s.label}
            />
            {i < ESCROW_STEPS.length - 1 && (
              <div className={`w-4 h-0.5 ${i < step ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {step < 2 && "Awaiting verification"}
        {step === 2 && daysLeft > 0 && `${daysLeft}d until payout`}
        {step === 2 && daysLeft <= 0 && "Ready for release"}
        {step >= 3 && "Payout released"}
      </p>
    </div>
  );
};

const getPayoutStatusBadge = (booking: BookingWithListing) => {
  const payoutStatus = booking.payout_status || 'pending';
  
  switch (payoutStatus) {
    case 'paid':
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case 'failed':
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default: {
      // For pending, show expected date based on checkout
      const checkoutDate = new Date(booking.listing.check_out_date);
      const expectedPayoutDate = addDays(checkoutDate, PAYOUT_PROCESSING_DAYS);
      const isUpcoming = isAfter(expectedPayoutDate, new Date());

      return (
        <div className="flex flex-col">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
          {isUpcoming && (
            <span className="text-xs text-muted-foreground mt-1">
              Est. {format(expectedPayoutDate, "MMM d")}
            </span>
          )}
        </div>
      );
    }
  }
};

const OwnerEarnings = () => {
  const { user } = useAuth();
  const { effectiveRate, tierDiscount, tierName, loading: commissionLoading } = useOwnerCommission();
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [summary, setSummary] = useState<EarningsSummary>({
    totalEarnings: 0,
    pendingPayouts: 0,
    processingPayouts: 0,
    completedPayouts: 0,
    totalBookings: 0,
    averagePerBooking: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const fetchEarnings = async () => {
    if (!user) return;

    try {
      // Get owner's listing IDs
      const { data: ownerListings } = await supabase
        .from("listings")
        .select("id")
        .eq("owner_id", user.id);

      const listingIds = (ownerListings as { id: string }[] | null)?.map((l) => l.id) || [];

      if (listingIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Fetch bookings with earnings data
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          listing:listings(
            *,
            property:properties(*)
          )
        `)
        .in("listing_id", listingIds)
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;

      const bookingsData = data as BookingWithListing[] || [];

      // Fetch escrow data for these bookings
      const bookingIds = bookingsData.map((b) => b.id);
      if (bookingIds.length > 0) {
        const { data: escrowData } = await supabase
          .from("booking_confirmations")
          .select("booking_id, escrow_status, escrow_amount, owner_confirmation_status, escrow_released_at")
          .in("booking_id", bookingIds);

        if (escrowData) {
          const escrowMap = new Map(
            (escrowData as (EscrowInfo & { booking_id: string })[]).map((e) => [e.booking_id, e])
          );
          for (const booking of bookingsData) {
            booking.escrow = escrowMap.get(booking.id) || null;
          }
        }
      }

      setBookings(bookingsData);

      // Calculate summary with payout status
      const paidBookings = bookingsData.filter((b) => b.payout_status === "paid");
      const processingBookings = bookingsData.filter((b) => b.payout_status === "processing");
      const pendingBookings = bookingsData.filter((b) => 
        !b.payout_status || b.payout_status === "pending"
      );

      const totalEarnings = bookingsData.reduce((sum, b) => sum + b.owner_payout, 0);
      const completedPayouts = paidBookings.reduce((sum, b) => sum + b.owner_payout, 0);
      const processingPayouts = processingBookings.reduce((sum, b) => sum + b.owner_payout, 0);
      const pendingPayouts = pendingBookings.reduce((sum, b) => sum + b.owner_payout, 0);

      setSummary({
        totalEarnings,
        pendingPayouts,
        processingPayouts,
        completedPayouts,
        totalBookings: bookingsData.length,
        averagePerBooking: bookingsData.length > 0 ? totalEarnings / bookingsData.length : 0,
      });
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, [user]);

  // Calculate monthly earnings for chart
  const monthlyData = useMemo(() => {
    const months: MonthlyEarning[] = [];
    const now = new Date();
    
    // Last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = startOfMonth(subMonths(now, i - 1));
      
      const monthBookings = bookings.filter((b) => {
        const bookingDate = new Date(b.created_at);
        return bookingDate >= monthStart && bookingDate < monthEnd;
      });

      months.push({
        month: format(monthStart, "MMM"),
        earnings: monthBookings.reduce((sum, b) => sum + b.owner_payout, 0),
        bookings: monthBookings.length,
      });
    }
    
    return months;
  }, [bookings]);

  // Filter bookings based on tab
  const filteredBookings = useMemo(() => {
    switch (activeTab) {
      case "pending":
        return bookings.filter((b) => !b.payout_status || b.payout_status === "pending");
      case "processing":
        return bookings.filter((b) => b.payout_status === "processing");
      case "paid":
        return bookings.filter((b) => b.payout_status === "paid");
      default:
        return bookings;
    }
  }, [bookings, activeTab]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Earnings & Payouts</h2>
        <p className="text-muted-foreground">
          Track your earnings, payout status, and performance
        </p>
      </div>

      {/* Stripe Connect Setup Banner */}
      <div className="mb-6">
        <StripeConnectBanner />
      </div>

      {/* Fee Transparency */}
      <div className="mb-6">
        <OwnerFeeExplainer />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${summary.totalEarnings.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              From {summary.totalBookings} bookings
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${summary.completedPayouts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully transferred
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${summary.processingPayouts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Being processed now
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              ${summary.pendingPayouts.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting stay completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Chart */}
      {bookings.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Earnings Over Time
            </CardTitle>
            <CardDescription>Your earnings from the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Earnings']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.earnings > 0 ? 'hsl(var(--primary))' : 'hsl(var(--muted))'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Detailed breakdown of all your bookings and payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({bookings.filter((b) => !b.payout_status || b.payout_status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="processing">
                Processing ({bookings.filter((b) => b.payout_status === "processing").length})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Paid ({bookings.filter((b) => b.payout_status === "paid").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {activeTab === "all" ? "No earnings yet" : `No ${activeTab} payouts`}
                  </h3>
                  <p className="text-muted-foreground text-center">
                    {activeTab === "all" 
                      ? "Your completed bookings and payouts will appear here"
                      : `You don't have any payouts with "${activeTab}" status`
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking Date</TableHead>
                      <TableHead>Property</TableHead>
                      <TableHead>Stay Dates</TableHead>
                      <TableHead>Payout Status</TableHead>
                      <TableHead>Escrow</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Your Payout</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {format(new Date(booking.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{booking.listing.property?.resort_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {booking.listing.property?.location}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(booking.listing.check_in_date), "MMM d")} -{" "}
                          {format(new Date(booking.listing.check_out_date), "MMM d")}
                        </TableCell>
                        <TableCell>
                          {getPayoutStatusBadge(booking)}
                          {booking.payout_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Paid {format(new Date(booking.payout_date), "MMM d, yyyy")}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <EscrowStepper
                            escrow={booking.escrow}
                            checkoutDate={booking.listing.check_out_date}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          ${booking.total_amount.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          -${booking.rav_commission.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ${booking.owner_payout.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payout Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">How Payouts Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-semibold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium">Booking Confirmed</p>
                <p className="text-muted-foreground">
                  Renter pays the full amount
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium">Pending</p>
                <p className="text-muted-foreground">
                  Awaiting guest checkout
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Processing</p>
                <p className="text-muted-foreground">
                  Payout being prepared
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Paid</p>
                <p className="text-muted-foreground">
                  Transferred to your account
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Payouts are typically processed within {PAYOUT_PROCESSING_DAYS} business days after guest checkout.
              You'll receive payment via your preferred method (Zelle or bank transfer).
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OwnerEarnings;