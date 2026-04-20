import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { usePageMeta } from "@/hooks/usePageMeta";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CancelBookingDialog from "@/components/booking/CancelBookingDialog";
import ReportIssueDialog from "@/components/booking/ReportIssueDialog";
import BookingMessageThread from "@/components/booking/BookingMessageThread";
import ReviewForm from "@/components/reviews/ReviewForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, DollarSign, Ban, ExternalLink, AlertTriangle, MessageCircle, CheckCircle, Clock, RefreshCw, Star, ChevronDown, Plane, KeyRound } from "lucide-react";
import { format } from "date-fns";
import type { Booking, BookingStatus, Listing, Property } from "@/types/database";
import { computeBookingTimeline } from "@/lib/bookingTimeline";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CancellationPolicyDetail } from "@/components/CancellationPolicyDetail";
import { getCheckInCountdown, isImminentCheckIn } from "@/lib/renterDashboard";
import { ListingTypeBadge } from "@/components/marketplace/ListingTypeBadge";

interface DisputeInfo {
  id: string;
  status: string;
  category: string;
  description: string;
  resolution_notes: string | null;
  refund_amount: number | null;
  created_at: string;
  resolved_at: string | null;
}

interface BookingConfirmationInfo {
  resort_confirmation_number: string | null;
  owner_confirmation_status: string | null;
  owner_confirmation_deadline: string | null;
}

interface BookingWithListing extends Booking {
  listing: Listing & { property: Property };
  disputes?: DisputeInfo[];
  booking_confirmations?: BookingConfirmationInfo[];
}

const DISPUTE_STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open: { label: "Submitted", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  investigating: { label: "Under Review", color: "bg-blue-100 text-blue-800", icon: <RefreshCw className="h-3 w-3" /> },
  resolved: { label: "Resolved", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
  refunded: { label: "Refunded", color: "bg-purple-100 text-purple-800", icon: <DollarSign className="h-3 w-3" /> },
  dismissed: { label: "Dismissed", color: "bg-gray-100 text-gray-800", icon: <MessageCircle className="h-3 w-3" /> },
};

const STATUS_COLORS: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-purple-100 text-purple-800",
};

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

const MyBookings = ({ embedded }: { embedded?: boolean }) => {
  usePageMeta("My Bookings", "View and manage your vacation bookings on Rent-A-Vacation.");
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithListing | null>(null);
  const [reportBooking, setReportBooking] = useState<BookingWithListing | null>(null);
  const [messageBooking, setMessageBooking] = useState<BookingWithListing | null>(null);
  const [reviewBooking, setReviewBooking] = useState<BookingWithListing | null>(null);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set());

  const fetchBookings = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("bookings")
        .select(`
          *,
          listing:listings(
            *,
            property:properties(*)
          ),
          disputes(
            id,
            status,
            category,
            description,
            resolution_notes,
            refund_amount,
            created_at,
            resolved_at
          ),
          booking_confirmations(
            resort_confirmation_number,
            owner_confirmation_status,
            owner_confirmation_deadline
          )
        `)
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Failed to load your bookings. Please try again.");
        console.error("Bookings fetch error:", fetchError);
      } else {
        setBookings((data as BookingWithListing[]) || []);
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviewedBookings = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("reviews")
        .select("booking_id")
        .eq("reviewer_id", user.id);
      if (data) {
        setReviewedBookingIds(new Set(data.map((r: { booking_id: string }) => r.booking_id)));
      }
    } catch {
      // Non-critical — button will just show "Write Review" as fallback
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchReviewedBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const now = new Date();

  const upcomingBookings = bookings.filter(
    (b) =>
      (b.status === "pending" || b.status === "confirmed") &&
      new Date(b.listing?.check_in_date) >= now
  );

  const pastBookings = bookings.filter(
    (b) =>
      b.status === "completed" ||
      b.status === "cancelled" ||
      ((b.status === "pending" || b.status === "confirmed") &&
        new Date(b.listing?.check_in_date) < now)
  );

  const handleCancelClick = (booking: BookingWithListing) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleCancelled = () => {
    setCancelDialogOpen(false);
    setSelectedBooking(null);
    fetchBookings();
  };

  const renderBookingCard = (booking: BookingWithListing) => {
    const listing = booking.listing;
    const property = listing?.property;
    const confirmation = booking.booking_confirmations?.[0];

    // Countdown only shown for upcoming bookings (confirmed/pending, check-in still in future)
    const checkInDateStr = listing?.check_in_date;
    const showCountdown =
      checkInDateStr &&
      (booking.status === "confirmed" || booking.status === "pending") &&
      new Date(checkInDateStr + "T00:00:00") >= new Date();
    const countdownText = showCountdown ? getCheckInCountdown(checkInDateStr!) : null;
    const isImminent = countdownText ? isImminentCheckIn(countdownText) : false;

    return (
      <Card key={booking.id} className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg truncate">
                {property?.resort_name || "Vacation Rental"}
              </CardTitle>
              {property?.location && (
                <CardDescription className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{property.location}</span>
                </CardDescription>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge className={STATUS_COLORS[booking.status]}>
                {STATUS_LABELS[booking.status]}
              </Badge>
              <ListingTypeBadge type={booking.source_type ?? "pre_booked"} size="sm" />
              {countdownText && (
                <Badge
                  variant="outline"
                  className={`gap-1 ${isImminent ? "border-primary text-primary bg-primary/5" : "text-muted-foreground"}`}
                >
                  <Plane className="h-3 w-3" />
                  {countdownText}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Dispute Status */}
          {booking.disputes && booking.disputes.length > 0 && (
            <div className="space-y-2">
              {booking.disputes.map((dispute) => {
                const config = DISPUTE_STATUS_CONFIG[dispute.status] || DISPUTE_STATUS_CONFIG.open;
                return (
                  <div key={dispute.id} className="border rounded-lg p-3 bg-muted/30">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Badge className={`${config.color} flex items-center gap-1`}>
                          {config.icon}
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{dispute.category.replace(/_/g, " ")}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(dispute.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{dispute.description}</p>
                    {dispute.resolution_notes && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs font-medium">Resolution:</p>
                        <p className="text-sm text-muted-foreground">{dispute.resolution_notes}</p>
                        {dispute.refund_amount && dispute.refund_amount > 0 && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            Refund: ${dispute.refund_amount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Check-in / Check-out */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <span className="text-muted-foreground">Check-in: </span>
                <span className="font-medium">
                  {listing?.check_in_date
                    ? format(new Date(listing.check_in_date), "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="text-sm">
                <span className="text-muted-foreground">Check-out: </span>
                <span className="font-medium">
                  {listing?.check_out_date
                    ? format(new Date(listing.check_out_date), "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Timeline */}
          {booking.status !== "cancelled" && listing && (
            <div className="py-1">
              <BookingTimeline
                steps={computeBookingTimeline({
                  status: booking.status,
                  created_at: booking.created_at,
                  check_in_date: listing.check_in_date,
                  check_out_date: listing.check_out_date,
                  hasReview: reviewedBookingIds.has(booking.id),
                })}
                compact
              />
            </div>
          )}

          {/* Expandable Booking Details — timeline + fees + cancellation policy */}
          {listing && (
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ChevronDown className="h-3 w-3" />
                Booking details
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-4">
                <BookingTimeline
                  steps={computeBookingTimeline({
                    status: booking.status,
                    created_at: booking.created_at,
                    check_in_date: listing.check_in_date,
                    check_out_date: listing.check_out_date,
                    hasReview: reviewedBookingIds.has(booking.id),
                  })}
                />

                {/* Fee breakdown */}
                <div className="border-t pt-3">
                  <h4 className="text-sm font-medium mb-2">Payment breakdown</h4>
                  <div className="space-y-1 text-sm">
                    {booking.base_amount != null && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Base rate</span>
                        <span>${booking.base_amount.toLocaleString()}</span>
                      </div>
                    )}
                    {booking.service_fee != null && booking.service_fee > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Service fee</span>
                        <span>${booking.service_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {booking.cleaning_fee != null && booking.cleaning_fee > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Cleaning fee</span>
                        <span>${booking.cleaning_fee.toLocaleString()}</span>
                      </div>
                    )}
                    {booking.tax_amount != null && booking.tax_amount > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax</span>
                        <span>${booking.tax_amount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t font-medium">
                      <span>Total</span>
                      <span>${booking.total_amount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Cancellation policy */}
                {listing.cancellation_policy && (
                  <div className="border-t pt-3">
                    <CancellationPolicyDetail
                      policy={listing.cancellation_policy}
                      checkInDate={listing.check_in_date}
                      compact
                    />
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Guest Count & Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm">
                {booking.guest_count} Guest{booking.guest_count !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium">
                ${booking.total_amount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Booking Reference + Resort Confirmation */}
          <div className="flex items-center justify-between pt-3 border-t gap-2 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
              <span>
                Ref: <span className="font-mono font-semibold tracking-wider">{booking.id.slice(0, 8).toUpperCase()}</span>
              </span>
              {confirmation?.resort_confirmation_number && (
                <span className="flex items-center gap-1">
                  <KeyRound className="h-3 w-3" />
                  Resort:{" "}
                  <span className="font-mono font-semibold tracking-wider">
                    {confirmation.resort_confirmation_number}
                  </span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {listing && (
                <Button variant="ghost" size="sm" asChild>
                  <Link to={`/property/${listing.property_id}`}>
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    View Property
                  </Link>
                </Button>
              )}

              {(booking.status === "confirmed" || booking.status === "completed") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMessageBooking(booking)}
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  Message Owner
                </Button>
              )}

              {booking.status === "completed" && (
                reviewedBookingIds.has(booking.id) ? (
                  <Badge variant="outline" className="text-green-600 border-green-200 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Review Written
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:text-primary/80"
                    onClick={() => setReviewBooking(booking)}
                  >
                    <Star className="h-3.5 w-3.5 mr-1" />
                    Write Review
                  </Button>
                )
              )}

              {(booking.status === "confirmed" || booking.status === "completed") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                  onClick={() => {
                    setReportBooking(booking);
                    setReportDialogOpen(true);
                  }}
                >
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  Report Issue
                </Button>
              )}

              {booking.status === "confirmed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => handleCancelClick(booking)}
                >
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderBookingList = (list: BookingWithListing[]) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32 mt-2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">
              You haven't made any bookings yet. Start browsing vacation rentals!
            </p>
            <Button asChild>
              <Link to="/rentals">Browse Rentals</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {list.map(renderBookingCard)}
      </div>
    );
  };

  const content = (
    <>
          {!embedded && (
          <div className="mb-6 md:mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">My Bookings</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your vacation reservations.
            </p>
          </div>
          )}

          {error && (
            <Card className="mb-6 border-destructive">
              <CardContent className="py-4">
                <p className="text-destructive text-sm">{error}</p>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">
                All ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {renderBookingList(bookings)}
            </TabsContent>

            <TabsContent value="upcoming">
              {renderBookingList(upcomingBookings)}
            </TabsContent>

            <TabsContent value="past">
              {renderBookingList(pastBookings)}
            </TabsContent>
          </Tabs>

      {reportBooking && (
        <ReportIssueDialog
          open={reportDialogOpen}
          onOpenChange={(open) => {
            setReportDialogOpen(open);
            if (!open) setReportBooking(null);
          }}
          bookingId={reportBooking.id}
          ownerId={reportBooking.listing?.owner_id}
          resortName={reportBooking.listing?.property?.resort_name}
        />
      )}

      {selectedBooking && (
        <CancelBookingDialog
          open={cancelDialogOpen}
          onOpenChange={(open) => {
            setCancelDialogOpen(open);
            if (!open) setSelectedBooking(null);
          }}
          bookingId={selectedBooking.id}
          totalAmount={selectedBooking.total_amount}
          checkInDate={selectedBooking.listing?.check_in_date}
          cancellationPolicy={selectedBooking.listing?.cancellation_policy || "moderate"}
          cancelledBy="renter"
          onCancelled={handleCancelled}
        />
      )}

      {messageBooking && (
        <BookingMessageThread
          open={!!messageBooking}
          onOpenChange={(open) => {
            if (!open) setMessageBooking(null);
          }}
          bookingId={messageBooking.id}
          bookingRef={messageBooking.id.slice(0, 8).toUpperCase()}
          otherPartyName="Owner"
        />
      )}

      {reviewBooking && (
        <ReviewForm
          open={!!reviewBooking}
          onOpenChange={(open) => {
            if (!open) {
              setReviewBooking(null);
              // Refresh reviewed IDs so the button updates
              fetchReviewedBookings();
            }
          }}
          bookingId={reviewBooking.id}
          listingId={reviewBooking.listing?.id}
          propertyId={reviewBooking.listing?.property_id}
          ownerId={reviewBooking.listing?.owner_id}
          resortName={reviewBooking.listing?.property?.resort_name || "Vacation Rental"}
        />
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 pt-20 md:pt-24 pb-12 px-4">
        <div className="container max-w-4xl mx-auto">
          {content}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyBookings;
