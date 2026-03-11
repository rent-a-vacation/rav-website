import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useListing } from "@/hooks/useListings";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  MapPin,
  Calendar,
  Users,
  Bed,
  Bath,
  CreditCard,
  Shield,
  Loader2,
  ArrowLeft,
  Home,
  Check,
  AlertCircle,
  Info,
} from "lucide-react";
import type { Resort, ResortUnitType } from "@/types/database";
import { calculateNights, computeFeeBreakdown } from "@/lib/pricing";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { CancellationPolicyDetail } from "@/components/CancellationPolicyDetail";
import { usePageMeta } from "@/hooks/usePageMeta";
import { trackEvent } from "@/lib/posthog";

const Checkout = () => {
  usePageMeta('Secure Checkout', 'Complete your vacation rental booking securely with PaySafe escrow protection.');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isEmailVerified } = useAuth();

  const listingId = searchParams.get("listing");
  const guestsParam = Number(searchParams.get("guests")) || 1;

  const [guests, setGuests] = useState(guestsParam);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: listing, isLoading, error: listingError } = useListing(listingId || undefined);

  const prop = listing?.property;
  const resort = prop?.resort as Resort | null;
  const unitType = prop?.unit_type as ResortUnitType | null;
  const nights = listing ? calculateNights(listing.check_in_date, listing.check_out_date) : 0;
  const pricePerNight = listing?.nightly_rate || (nights > 0 && listing ? Math.round(listing.final_price / nights) : 0);
  const fees = listing ? computeFeeBreakdown(pricePerNight, nights, listing.cleaning_fee || 0) : null;

  const displayName = resort?.resort_name && unitType
    ? `${unitType.unit_type_name} at ${resort.resort_name}`
    : resort?.resort_name || prop?.resort_name || "Vacation Rental";

  const location = resort?.location
    ? `${resort.location.city}, ${resort.location.state}`
    : prop?.location || "";

  const image = prop?.images?.[0] || resort?.main_image_url || null;

  const handleCheckout = async () => {
    if (!listing || !user) return;

    setIsProcessing(true);
    setError(null);

    trackEvent("checkout_started", {
      listing_id: listing.id,
      total_amount: fees?.subtotal,
      nights,
      guest_count: guests,
    });

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "create-booking-checkout",
        {
          body: {
            listingId: listing.id,
            guestCount: guests,
            specialRequests: specialRequests.trim() || null,
          },
        }
      );

      if (fnError) {
        throw new Error(fnError.message || "Failed to create checkout session");
      }

      if (data?.url) {
        // Redirect to Stripe hosted checkout
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to start checkout. Please try again."
      );
      setIsProcessing(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (listingError || !listing || !listingId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 px-4">
          <Home className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Listing Not Available</h1>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            This listing may no longer be available for booking.
          </p>
          <Button onClick={() => navigate("/rentals")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Rentals
          </Button>
        </div>
      </div>
    );
  }

  // Email verification guard
  if (user && !isEmailVerified()) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24">
          <EmailVerificationBanner blockedAction="book a property" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/rentals" className="hover:text-foreground">Rentals</Link>
            <span>/</span>
            <Link to={`/property/${listing.id}`} className="hover:text-foreground">{displayName}</Link>
            <span>/</span>
            <span className="text-foreground">Checkout</span>
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground mb-8">
            Confirm Your Booking
          </h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Booking Details Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {image ? (
                      <img
                        src={image}
                        alt={displayName}
                        className="w-32 h-24 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-32 h-24 bg-muted rounded-lg flex items-center justify-center">
                        <Home className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{displayName}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                        <MapPin className="w-3.5 h-3.5" />
                        {location}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5" />
                          {unitType
                            ? unitType.bedrooms === 0
                              ? "Studio"
                              : `${unitType.bedrooms} BR`
                            : `${prop?.bedrooms} BR`
                          }
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5" />
                          {unitType ? unitType.bathrooms : prop?.bathrooms} BA
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          Sleeps {unitType?.max_occupancy || prop?.sleeps}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stay Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stay Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Check-in</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(listing.check_in_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">Check-out</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(listing.check_out_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{nights} nights</p>
                </CardContent>
              </Card>

              {/* Guest Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Guest Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Number of Guests</label>
                    <div className="relative w-full max-w-xs">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3"
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                      >
                        {Array.from(
                          { length: unitType?.max_occupancy || prop?.sleeps || 6 },
                          (_, i) => i + 1
                        ).map((n) => (
                          <option key={n} value={n}>
                            {n} guest{n !== 1 ? "s" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Special Requests <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Textarea
                      placeholder="Early check-in, extra towels, accessibility needs..."
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <div className="flex items-center gap-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-5 h-5 text-primary" />
                  PaySafe — funds held in escrow until check-in
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-5 h-5 text-primary" />
                  TrustShield verified property
                </div>
              </div>
            </div>

            {/* Price Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Price Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        ${pricePerNight}/night × {nights} nights
                      </span>
                      <span>${fees?.baseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee (15%)</span>
                      <span>${fees?.serviceFee.toLocaleString()}</span>
                    </div>
                    {(listing.cleaning_fee || 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Cleaning fee</span>
                        <span>${listing.cleaning_fee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxes</span>
                      <span>Calculated at payment</span>
                    </div>
                    {(listing.resort_fee || 0) > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground/70 italic">
                        <span>Resort fee (paid at check-in)</span>
                        <span>${listing.resort_fee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-3 border-t">
                      <span>Total before taxes</span>
                      <span>${fees?.subtotal.toLocaleString()}</span>
                    </div>

                    {/* Tax Disclosure Notice */}
                    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
                      <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>
                          Applicable occupancy taxes and transient lodging taxes
                          {resort?.location?.state
                            ? ` for ${resort.location.state}`
                            : ""}{" "}
                          will be calculated and collected at payment.
                        </p>
                        <p className="mt-1">
                          Rent-A-Vacation collects and remits taxes as a marketplace
                          facilitator where required by law.{" "}
                          <a href="/terms" className="underline hover:text-foreground">
                            Learn more
                          </a>
                        </p>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <Button
                      className="w-full mt-4"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Proceed to Payment
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      You'll be redirected to Stripe for secure payment
                    </p>

                    <div className="pt-3 border-t">
                      <CancellationPolicyDetail
                        policy={listing.cancellation_policy}
                        checkInDate={listing.check_in_date}
                        compact
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
