import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ArrowLeft, Calendar, MapPin, Users, Loader2, XCircle, Mail, Clock, Ban } from "lucide-react";
import { format } from "date-fns";
import type { Booking, Listing, Property } from "@/types/database";
import CancelBookingDialog from "@/components/booking/CancelBookingDialog";
import { computeBookingTimeline } from "@/lib/bookingTimeline";
import { BookingTimeline } from "@/components/booking/BookingTimeline";
import { trackEvent } from "@/lib/posthog";

interface BookingWithDetails extends Booking {
  listing: Listing & { property: Property };
}

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const bookingId = searchParams.get("booking_id");

  useEffect(() => {
    const verifyAndFetchBooking = async () => {
      if (!bookingId || !user) {
        setError("Invalid booking reference");
        setIsLoading(false);
        return;
      }

      try {
        // Verify payment with backend
        setIsVerifying(true);
        const { data: verifyData, error: verifyError } = await supabase.functions.invoke(
          "verify-booking-payment",
          {
            body: { bookingId },
          }
        );

        if (verifyError) {
          console.error("Verification error:", verifyError);
          setError("Failed to verify payment. Please contact support.");
          setIsLoading(false);
          return;
        }

        if (!verifyData.success && verifyData.status !== "confirmed" && verifyData.status !== "completed") {
          setError("Payment verification failed. Please contact support.");
          setIsLoading(false);
          return;
        }

        setIsVerifying(false);

        // Fetch booking details
        const { data, error: fetchError } = await supabase
          .from("bookings")
          .select(`
            *,
            listing:listings(
              *,
              property:properties(*)
            )
          `)
          .eq("id", bookingId)
          .single();

        if (fetchError || !data) {
          setError("Could not load booking details");
        } else {
          setBooking(data as BookingWithDetails);
          trackEvent("booking_completed", {
            booking_id: bookingId,
            total_amount: data.total_amount,
            guest_count: data.guest_count,
            property_location: data.listing?.property?.location,
          });
        }
      } catch (err) {
        console.error("Error:", err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    verifyAndFetchBooking();
  }, [bookingId, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {isVerifying ? "Verifying your payment..." : "Loading booking details..."}
          </p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <XCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {error || "Could not load your booking. Please contact support."}
        </p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 md:pt-24 pb-12 md:pb-16 px-4">
      <div className="container max-w-2xl mx-auto">
        <div className="text-center mb-8 md:mb-10">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your vacation is booked. You'll receive a confirmation email shortly.
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{booking.listing?.property?.resort_name}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {booking.listing?.property?.location}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Check-in</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(booking.listing?.check_in_date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Check-out</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(booking.listing?.check_out_date), "EEEE, MMMM d, yyyy")}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{booking.guest_count} Guest{booking.guest_count !== 1 ? "s" : ""}</p>
              </div>
            </div>

            {booking.special_requests && (
              <div className="pt-4 border-t">
                <p className="font-medium mb-1">Special Requests</p>
                <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Paid</span>
                <span className="text-2xl font-bold">${booking.total_amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Booking Reference</span>
                <span className="font-mono font-semibold tracking-wider">
                  {booking.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Timeline */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Your Booking Journey</CardTitle>
          </CardHeader>
          <CardContent>
            <BookingTimeline
              steps={computeBookingTimeline({
                status: booking.status,
                created_at: booking.created_at,
                check_in_date: booking.listing?.check_in_date,
                check_out_date: booking.listing?.check_out_date,
              })}
            />
          </CardContent>
        </Card>

        {/* Cancel Booking */}
        {booking.status === "confirmed" && (
          <div className="mb-6">
            <Button
              variant="outline"
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => setCancelDialogOpen(true)}
            >
              <Ban className="mr-2 h-4 w-4" />
              Cancel Booking
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button className="flex-1" onClick={() => navigate("/rentals")}>
            Browse More Rentals
          </Button>
        </div>

        {booking.status === "confirmed" && (
          <CancelBookingDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            bookingId={booking.id}
            totalAmount={booking.total_amount}
            checkInDate={booking.listing?.check_in_date}
            cancellationPolicy={booking.listing?.cancellation_policy || "moderate"}
            cancelledBy="renter"
            onCancelled={() => navigate("/")}
          />
        )}
      </div>
      </div>
    </div>
  );
};

export default BookingSuccess;
