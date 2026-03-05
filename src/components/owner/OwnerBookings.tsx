import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Users, DollarSign, Clock, CheckCircle, XCircle, Mail, Ban, MessageCircle, Download, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import type { Booking, BookingStatus, Property, Listing, Profile } from "@/types/database";
import CancelBookingDialog from "@/components/booking/CancelBookingDialog";
import BookingMessageThread from "@/components/booking/BookingMessageThread";
import ReportIssueDialog from "@/components/booking/ReportIssueDialog";
import { Button } from "@/components/ui/button";
import { useOwnerCalendarExport } from "@/hooks/useOwnerCalendarExport";

interface BookingWithDetails extends Booking {
  listing: Listing & { property: Property };
  renter: Profile;
}

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-yellow-500",
  confirmed: "bg-green-500",
  cancelled: "bg-red-500",
  completed: "bg-purple-500",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const OwnerBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"all" | "upcoming" | "past">("all");
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [messageBookingId, setMessageBookingId] = useState<string | null>(null);
  const [reportBookingId, setReportBookingId] = useState<string | null>(null);
  const { exportCalendar, isExporting } = useOwnerCalendarExport();

  // Fetch bookings for owner's listings
  const fetchBookings = async () => {
    if (!user) return;

    try {
      // First get all owner's listing IDs
      const { data: ownerListings } = await supabase
        .from("listings")
        .select("id")
        .eq("owner_id", user.id);

      const listingIds = (ownerListings as { id: string }[] | null)?.map((l) => l.id) || [];

      if (listingIds.length === 0) {
        setBookings([]);
        setIsLoading(false);
        return;
      }

      // Fetch bookings for those listings
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          listing:listings(
            *,
            property:properties(*)
          ),
          renter:profiles(*)
        `)
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookings(data as BookingWithDetails[] || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    const checkInDate = new Date(booking.listing.check_in_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (activeFilter === "upcoming") {
      return checkInDate >= today && booking.status !== "cancelled";
    } else if (activeFilter === "past") {
      return checkInDate < today || booking.status === "completed";
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Bookings</h2>
          <p className="text-muted-foreground">
            View bookings on your properties
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={exportCalendar}
          disabled={isExporting}
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export Calendar"}
        </Button>
      </div>

      <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming ({bookings.filter((b) => {
              const checkIn = new Date(b.listing.check_in_date);
              return checkIn >= new Date() && b.status !== "cancelled";
            }).length})
          </TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter}>
          {filteredBookings.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bookings yet</h3>
                <p className="text-muted-foreground text-center">
                  {activeFilter === "all"
                    ? "When renters book your listings, they'll appear here"
                    : activeFilter === "upcoming"
                    ? "No upcoming bookings"
                    : "No past bookings"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={STATUS_COLORS[booking.status]}>
                            {STATUS_LABELS[booking.status]}
                          </Badge>
                          {booking.paid_at && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Paid
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">
                          {booking.listing.property?.resort_name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {booking.listing.property?.location}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Your Payout</p>
                        <p className="text-xl font-bold text-green-600">
                          ${booking.owner_payout.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Dates */}
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">
                            {format(new Date(booking.listing.check_in_date), "MMM d")} -{" "}
                            {format(new Date(booking.listing.check_out_date), "MMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">Stay dates</p>
                        </div>
                      </div>

                      {/* Guest Info */}
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{booking.renter?.full_name || "Guest"}</p>
                          <p className="text-sm text-muted-foreground">
                            {booking.guest_count} guest{booking.guest_count !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Breakdown */}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Total Paid</p>
                          <p className="font-semibold">${booking.total_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">RAV Commission</p>
                          <p className="font-semibold">${booking.rav_commission.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Your Payout</p>
                          <p className="font-semibold text-green-600">
                            ${booking.owner_payout.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    {booking.special_requests && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium mb-1">Special Requests</p>
                        <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
                      </div>
                    )}

                    {/* Contact */}
                    {booking.renter?.email && (
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${booking.renter.email}`}
                          className="text-primary hover:underline"
                        >
                          {booking.renter.email}
                        </a>
                      </div>
                    )}

                    {/* Actions */}
                    {(booking.status === "confirmed" || booking.status === "completed") && (
                      <div className="mt-4 pt-4 border-t flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setMessageBookingId(booking.id)}
                        >
                          <MessageCircle className="mr-2 h-4 w-4" />
                          Message Renter
                        </Button>

                        {booking.status === "confirmed" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => setCancelBookingId(booking.id)}
                          >
                            <Ban className="mr-2 h-4 w-4" />
                            Cancel Booking
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReportBookingId(booking.id)}
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Report Issue
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Cancel Booking Dialog */}
      {cancelBookingId && (() => {
        const target = bookings.find((b) => b.id === cancelBookingId);
        if (!target) return null;
        return (
          <CancelBookingDialog
            open={!!cancelBookingId}
            onOpenChange={(open) => { if (!open) setCancelBookingId(null); }}
            bookingId={target.id}
            totalAmount={target.total_amount}
            checkInDate={target.listing?.check_in_date}
            cancellationPolicy={target.listing?.cancellation_policy || "moderate"}
            cancelledBy="owner"
            onCancelled={() => {
              setCancelBookingId(null);
              fetchBookings();
            }}
          />
        );
      })()}

      {/* Message Renter Thread */}
      {messageBookingId && (() => {
        const target = bookings.find((b) => b.id === messageBookingId);
        if (!target) return null;
        return (
          <BookingMessageThread
            open={!!messageBookingId}
            onOpenChange={(open) => {
              if (!open) setMessageBookingId(null);
            }}
            bookingId={target.id}
            bookingRef={target.id.slice(0, 8).toUpperCase()}
            otherPartyName={target.renter?.full_name || "Renter"}
          />
        );
      })()}
      {/* Report Issue Dialog */}
      {reportBookingId && (() => {
        const target = bookings.find((b) => b.id === reportBookingId);
        if (!target) return null;
        return (
          <ReportIssueDialog
            open={!!reportBookingId}
            onOpenChange={(open) => { if (!open) setReportBookingId(null); }}
            bookingId={target.id}
            ownerId={target.renter?.id}
            resortName={target.listing?.property?.resort_name}
            role="owner"
          />
        );
      })()}
    </div>
  );
};

export default OwnerBookings;
