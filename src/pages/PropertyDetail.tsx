import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ResortInfoCard } from "@/components/resort/ResortInfoCard";
import { UnitTypeSpecs } from "@/components/resort/UnitTypeSpecs";
import { useTextChat } from "@/hooks/useTextChat";
import { TextChatButton } from "@/components/TextChatButton";
import { TextChatPanel } from "@/components/TextChatPanel";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  Users,
  Bed,
  Bath,
  Check,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Home,
  ArrowLeft,
  Settings,
  Flame,
  Sparkles,
  Clock,
  ShieldCheck,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ListingTypeBadge } from "@/components/marketplace/ListingTypeBadge";
import { useListing, useActiveListings } from "@/hooks/useListings";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useJsonLd } from "@/hooks/useJsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/breadcrumbSchema";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useListingSocialProof, getFreshnessLabel, getPopularityLabel, getDaysAgo } from "@/hooks/useListingSocialProof";
import { BidFormDialog } from "@/components/bidding/BidFormDialog";
import { InspiredTravelRequestDialog } from "@/components/bidding/InspiredTravelRequestDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, DollarSign, MessageCircle, Search } from "lucide-react";
import { isPast } from "date-fns";
import { FairValueCard } from "@/components/fair-value/FairValueCard";
import ReviewList from "@/components/reviews/ReviewList";
import ReviewSummary from "@/components/reviews/ReviewSummary";
import { calculateNights, computeFeeBreakdown } from "@/lib/pricing";
import { CancellationPolicyDetail } from "@/components/CancellationPolicyDetail";
import { OwnerProfileCard } from "@/components/OwnerProfileCard";
import { InquiryDialog } from "@/components/InquiryDialog";
import { useInquiryCount } from "@/hooks/useListingInquiries";
import { trackEvent } from "@/lib/posthog";

const BRAND_LABELS: Record<string, string> = {
  hilton_grand_vacations: "Hilton Grand Vacations",
  marriott_vacation_club: "Marriott Vacation Club",
  disney_vacation_club: "Disney Vacation Club",
  wyndham_destinations: "Wyndham Destinations",
  hyatt_residence_club: "Hyatt Residence Club",
  bluegreen_vacations: "Bluegreen Vacations",
  holiday_inn_club: "Holiday Inn Club",
  worldmark: "Worldmark",
  other: "Other",
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState(0);
  const [guests, setGuests] = useState(1);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [dateProposalOpen, setDateProposalOpen] = useState(false);
  const [inspiredRequestOpen, setInspiredRequestOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);

  // Auth
  const { user } = useAuth();
  const { toast } = useToast();

  // Text chat
  const {
    messages: chatMessages,
    status: chatStatus,
    error: chatError,
    sendMessage: sendChatMessage,
    clearHistory: clearChatHistory,
  } = useTextChat({ context: "property-detail" });

  // Favorites
  const { data: favoriteIds = [] } = useFavoriteIds();
  const toggleFavoriteMutation = useToggleFavorite();
  const isLiked = id ? favoriteIds.includes(id) : false;

  const handleToggleFavorite = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your favorites.",
      });
      return;
    }
    if (id) toggleFavoriteMutation.mutate(id);
  };

  // Real listing data
  const { data: listing, isLoading, error } = useListing(id);
  const { favoritesCount } = useListingSocialProof();

  // Similar listings (same brand, excluding current)
  const { data: allListings = [] } = useActiveListings();

  // Derived data
  const prop = listing?.property;
  const resort = prop?.resort;
  const unitType = prop?.unit_type as unknown as Record<string, string> | undefined;
  const nights = listing ? calculateNights(listing.check_in_date, listing.check_out_date) : 0;

  // Dynamic page meta
  const resortName = (resort as Record<string, unknown> | undefined)?.resort_name as string || 'Resort';
  const resortLoc = (resort as Record<string, unknown> | undefined)?.location as Record<string, string> | undefined;
  const locationStr = resortLoc?.city && resortLoc?.state
    ? `${resortLoc.city}, ${resortLoc.state}`
    : prop?.location || '';
  const unitTypeName = unitType?.name || (prop as Record<string, unknown>)?.unit_type_name as string || 'Unit';
  const pricePerNight = listing?.nightly_rate || (nights > 0 && listing ? Math.round(listing.final_price / nights) : 0);
  const fees = listing ? computeFeeBreakdown(pricePerNight, nights, listing.cleaning_fee || 0) : null;

  // Build image array from property/resort data
  const images: string[] = [];
  if (prop?.images && prop.images.length > 0) images.push(...prop.images);
  if (resort?.main_image_url) images.push(resort.main_image_url);
  if (resort?.additional_images && resort.additional_images.length > 0) images.push(...resort.additional_images);

  const displayName = resort?.resort_name && unitType
    ? `${unitType.unit_type_name} at ${resort.resort_name}`
    : resort?.resort_name || prop?.resort_name || "Vacation Rental";

  const location = resort?.location
    ? `${resort.location.city}, ${resort.location.state}`
    : prop?.location || "";

  const brandLabel = prop ? (BRAND_LABELS[prop.brand] || prop.brand) : "";

  // SEO: page meta, canonical, OG tags
  const pageTitle = listing ? `${resortName} — ${locationStr}` : 'Property Detail';
  const pageDescription = listing
    ? `Book ${unitTypeName} at ${resortName}. Verified timeshare rental at 20-40% off resort rates.`
    : 'View vacation rental property details.';
  usePageMeta({
    title: pageTitle,
    description: pageDescription,
    canonicalPath: id ? `/property/${id}` : undefined,
    ogImage: images[0] || undefined,
    ogType: 'product',
  });

  // Breadcrumb JSON-LD
  useJsonLd(
    'breadcrumb-schema',
    listing
      ? buildBreadcrumbJsonLd([
          { name: 'Home', path: '/' },
          { name: 'Rentals', path: '/rentals' },
          { name: resortName, path: `/property/${id}` },
        ])
      : null,
  );

  // Product JSON-LD
  useJsonLd(
    'product-schema',
    listing
      ? {
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: resortName,
          image: images[0] || undefined,
          description: pageDescription,
          brand: { '@type': 'Brand', name: brandLabel || undefined },
          offers: {
            '@type': 'Offer',
            price: listing.nightly_rate || pricePerNight,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock',
          },
        }
      : null,
  );
  const isOwnListing = user && listing && listing.owner_id === user.id;
  const isBiddable = listing?.open_for_bidding &&
    listing?.bidding_ends_at &&
    !isPast(new Date(listing.bidding_ends_at));

  // Track listing view (fires once per listing load)
  useEffect(() => {
    if (listing && id) {
      const loc = resort?.location
        ? `${resort.location.city}, ${resort.location.state}`
        : prop?.location || "";
      trackEvent("listing_viewed", {
        listing_id: id,
        brand: listing.property?.brand,
        location: loc,
        nightly_rate: listing.nightly_rate,
        nights: calculateNights(listing.check_in_date, listing.check_out_date),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing?.id]);

  // Inquiry count for social proof
  const { data: inquiryCount = 0 } = useInquiryCount(listing?.id);
  const favCount = id ? (favoritesCount.get(id) || 0) : 0;
  const freshnessLabel = listing ? getFreshnessLabel(listing.created_at) : null;
  const popularityLabel = getPopularityLabel(favCount);
  const daysAgo = listing ? getDaysAgo(listing.created_at) : 0;
  const similarListings = listing
    ? allListings
        .filter((l) => l.id !== listing.id && l.property.brand === listing.property.brand)
        .slice(0, 3)
    : [];

  const nextImage = () => {
    if (images.length > 0) setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (images.length > 0) setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleBookNow = () => {
    if (!user) {
      navigate("/login", { state: { from: `/property/${id}` } });
      return;
    }
    if (!listing) return;
    navigate(`/checkout?listing=${listing.id}&guests=${guests}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading property details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error / Not found
  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex flex-col items-center justify-center pt-32 px-4">
          <Home className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Listing Not Found</h1>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            This listing may no longer be available or the link may be invalid.
          </p>
          <Button onClick={() => navigate("/rentals")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Rentals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main id="main-content" className="pt-16 md:pt-20">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/rentals" className="hover:text-foreground">Rentals</Link>
            <span>/</span>
            <span className="text-foreground">{displayName}</span>
          </div>
        </div>

        {/* Image Gallery */}
        <section className="container mx-auto px-4 mb-6 md:mb-8">
          <div className="relative rounded-2xl overflow-hidden shadow-card">
            <div className="aspect-[16/9] md:aspect-[21/9]">
              {images.length > 0 ? (
                <img
                  src={images[currentImage]}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Home className="w-20 h-20 text-muted-foreground" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" role="tablist" aria-label="Image gallery">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      role="tab"
                      aria-selected={index === currentImage}
                      aria-label={`Image ${index + 1} of ${images.length}`}
                      onClick={() => setCurrentImage(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentImage ? "w-8 bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleToggleFavorite}
                aria-label={isLiked ? "Remove from favorites" : "Add to favorites"}
                aria-pressed={isLiked}
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
              >
                <Heart className={`w-5 h-5 ${isLiked ? "fill-accent text-accent" : ""}`} />
              </button>
              <button aria-label="Share this property" className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 pb-16 md:pb-20">
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-10">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4" />
                  {location} {brandLabel && `• ${brandLabel}`}
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
                  {displayName}
                </h1>
                {/* Social proof + type badges */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <ListingTypeBadge type={(listing as { source_type?: "pre_booked" | "wish_matched" })?.source_type ?? "pre_booked"} />
                  {popularityLabel && (
                    <Badge className="bg-orange-500/90 text-white border-0">
                      <Flame className="w-3 h-3 mr-1" />
                      {popularityLabel}
                    </Badge>
                  )}
                  {freshnessLabel && (
                    <Badge className="bg-emerald-500/90 text-white border-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {freshnessLabel}
                    </Badge>
                  )}
                  {favCount > 0 && (
                    <Badge variant="secondary">
                      <Heart className="w-3 h-3 mr-1 fill-rose-400 text-rose-400" />
                      {favCount} {favCount === 1 ? "person" : "people"} saved this
                    </Badge>
                  )}
                  {daysAgo <= 14 && (
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      Listed {daysAgo === 0 ? "today" : daysAgo === 1 ? "yesterday" : `${daysAgo} days ago`}
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {resort?.guest_rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-5 h-5 fill-warning text-warning" />
                      <span className="font-semibold">{resort.guest_rating}</span>
                      <span className="text-muted-foreground">Guest Rating</span>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {unitType ? unitType.max_occupancy : prop?.sleeps} guests
                    </span>
                    <span className="flex items-center gap-1">
                      <Bed className="w-4 h-4" />
                      {unitType
                        ? Number(unitType.bedrooms) === 0
                          ? "Studio"
                          : `${unitType.bedrooms} bedrooms`
                        : `${prop?.bedrooms} bedrooms`
                      }
                    </span>
                    <span className="flex items-center gap-1">
                      <Bath className="w-4 h-4" />
                      {unitType ? unitType.bathrooms : prop?.bathrooms} bathrooms
                    </span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="mb-8 bg-primary/5 rounded-xl p-4">
                <h2 className="font-display text-lg font-semibold text-foreground mb-2">
                  Available Dates
                </h2>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>
                      {new Date(listing.check_in_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <span className="text-muted-foreground">to</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>
                      {new Date(listing.check_out_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <span className="text-muted-foreground">({nights} nights)</span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  About This Property
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {resort?.description || prop?.description || "Experience a wonderful vacation at this resort property."}
                </p>
                {listing.notes && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Owner Notes</p>
                    <p className="text-sm text-muted-foreground">{listing.notes}</p>
                  </div>
                )}
              </div>

              {/* Unit Type Specs */}
              {unitType && (
                <div className="mb-8">
                  <UnitTypeSpecs unitType={unitType as unknown as import("@/types/database").ResortUnitType} />
                </div>
              )}

              {/* Amenities */}
              <div className="mb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                  Amenities
                </h2>
                {resort?.resort_amenities && resort.resort_amenities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {resort.resort_amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Check className="w-5 h-5 text-primary" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : prop?.amenities && prop.amenities.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {prop.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Check className="w-5 h-5 text-primary" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">Contact the owner for amenity details.</p>
                )}
              </div>

              {/* Cancellation Policy */}
              <div className="mb-8">
                <CancellationPolicyDetail
                  policy={listing.cancellation_policy}
                  checkInDate={listing.check_in_date}
                />
              </div>

              {/* Guest Reviews */}
              {listing.property_id && (
                <div className="mb-8">
                  <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                    Guest Reviews
                  </h2>
                  <ReviewList propertyId={listing.property_id} />
                </div>
              )}
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Booking Card */}
                <div className="bg-card rounded-2xl shadow-card-hover p-6">
                  {/* Fee Breakdown */}
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        ${pricePerNight}/night × {nights} nights
                      </span>
                      <span>${fees?.baseAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service fee (15%)</span>
                      <span>${fees?.serviceFee.toLocaleString()}</span>
                    </div>
                    {(listing.cleaning_fee || 0) > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cleaning fee</span>
                        <span>${listing.cleaning_fee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold pt-2 border-t">
                      <span>Total before taxes</span>
                      <span>${fees?.subtotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <FairValueCard listingId={listing.id} viewerRole={isOwnListing ? 'owner' : 'traveler'} />

                  <div className="space-y-4 mb-6">
                    <div>
                      <span className="block text-sm font-medium mb-2">Check-in</span>
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        {new Date(listing.check_in_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div>
                      <span className="block text-sm font-medium mb-2">Check-out</span>
                      <div className="p-3 bg-muted/50 rounded-lg text-sm">
                        {new Date(listing.check_out_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div>
                      <label htmlFor="guest-select" className="block text-sm font-medium mb-2">Guests</label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <select
                          id="guest-select"
                          className="w-full h-10 rounded-md border border-input bg-background pl-10 pr-3"
                          value={guests}
                          onChange={(e) => setGuests(Number(e.target.value))}
                        >
                          {Array.from(
                            { length: Number(unitType?.max_occupancy || prop?.sleeps || 6) },
                            (_, i) => i + 1
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n} guest{n !== 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {isOwnListing ? (
                    <Button
                      className="w-full mb-4"
                      size="lg"
                      variant="outline"
                      onClick={() => navigate("/owner-dashboard?tab=my-listings")}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      This is your listing — Manage in Dashboard
                    </Button>
                  ) : (
                    <>
                      <Button className="w-full" size="lg" onClick={handleBookNow}>
                        {user ? `Book Now — $${fees?.subtotal.toLocaleString()}` : "Sign In to Book"}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground mt-2 mb-4">
                        You won't be charged yet
                      </p>

                      {user && !isOwnListing && (
                        <Collapsible open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            More booking options
                            <ChevronDown className={`w-4 h-4 transition-transform ${moreOptionsOpen ? "rotate-180" : ""}`} />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-1 pt-2">
                            {isBiddable && (
                              <button
                                className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                                onClick={() => setBidDialogOpen(true)}
                              >
                                <DollarSign className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium">Make an Offer</p>
                                  <p className="text-xs text-muted-foreground">Suggest a different price for this listing</p>
                                </div>
                              </button>
                            )}
                            <button
                              className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                              onClick={() => setDateProposalOpen(true)}
                            >
                              <Calendar className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">Request Different Dates</p>
                                <p className="text-xs text-muted-foreground">Propose alternative check-in and check-out dates</p>
                              </div>
                            </button>
                            <button
                              className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                              onClick={() => setInspiredRequestOpen(true)}
                            >
                              <Search className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">Find Something Similar</p>
                                <p className="text-xs text-muted-foreground">Let owners with similar properties reach out to you</p>
                              </div>
                            </button>
                            <button
                              className="flex items-start gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                              onClick={() => setChatOpen(true)}
                            >
                              <MessageCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                              <div>
                                <p className="text-sm font-medium">Questions? Ask RAVIO</p>
                                <p className="text-xs text-muted-foreground">Chat with our AI assistant about this property</p>
                              </div>
                            </button>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {!user && (
                        <Collapsible open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                            More booking options
                            <ChevronDown className={`w-4 h-4 transition-transform ${moreOptionsOpen ? "rotate-180" : ""}`} />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="pt-2">
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Sign in to make offers, request dates, or chat with RAVIO
                            </p>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </>
                  )}
                </div>

                {/* Owner Profile + Ask a Question */}
                {listing.owner_id && !isOwnListing && (
                  <div className="space-y-3">
                    <OwnerProfileCard ownerId={listing.owner_id} />
                    {user && (
                      <div className="bg-card rounded-2xl p-4 shadow-card text-center space-y-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => setInquiryDialogOpen(true)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Ask the Owner a Question
                        </Button>
                        {inquiryCount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {inquiryCount} traveler{inquiryCount !== 1 ? 's' : ''} asked about this listing
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Trust Indicators */}
                <div className="bg-card rounded-2xl p-5 shadow-card space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Verified Platform</p>
                      <p className="text-xs text-muted-foreground">All owners are identity-verified</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Secure Checkout</p>
                      <p className="text-xs text-muted-foreground">Payments via Stripe — never shared with owners</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Quality Guarantee</p>
                      <p className="text-xs text-muted-foreground">Real resort stays at member prices</p>
                    </div>
                  </div>
                </div>

                {/* Review Summary */}
                {listing.property_id && (
                  <ReviewSummary propertyId={listing.property_id} />
                )}

                {/* Resort Information Card */}
                {resort && (
                  <ResortInfoCard resort={resort} />
                )}
              </div>
            </div>
          </div>
        </section>
        {/* Similar Listings */}
        {similarListings.length > 0 && (
          <section className="container mx-auto px-4 pb-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              Similar Properties You May Like
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {similarListings.map((sim) => {
                const simNights = calculateNights(sim.check_in_date, sim.check_out_date);
                const simPricePerNight = simNights > 0 ? Math.round(sim.final_price / simNights) : sim.final_price;
                const simImage = sim.property.images?.[0] || sim.property.resort?.main_image_url || null;
                const simName = sim.property.resort?.resort_name && sim.property.unit_type
                  ? `${(sim.property.unit_type as unknown as Record<string, string>).unit_type_name} at ${sim.property.resort.resort_name}`
                  : sim.property.resort?.resort_name || sim.property.resort_name;
                const simLocation = sim.property.resort?.location
                  ? `${sim.property.resort.location.city}, ${sim.property.resort.location.state}`
                  : sim.property.location;
                const simFavCount = favoritesCount.get(sim.id) || 0;

                return (
                  <Link
                    key={sim.id}
                    to={`/property/${sim.id}`}
                    className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300"
                  >
                    <div className="relative h-44 overflow-hidden">
                      {simImage ? (
                        <img
                          src={simImage}
                          alt={simName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                          <Home className="w-10 h-10 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                        {BRAND_LABELS[sim.property.brand] || sim.property.brand}
                      </span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {simLocation}
                      </div>
                      <h3 className="font-display font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {simName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                        {sim.property.resort?.guest_rating && (
                          <>
                            <Star className="w-3 h-3 fill-warning text-warning" />
                            <span className="font-semibold">{sim.property.resort.guest_rating}</span>
                          </>
                        )}
                        {simFavCount > 0 && (
                          <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                            {simFavCount} saved
                          </span>
                        )}
                      </div>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-lg font-bold">${simPricePerNight}</span>
                          <span className="text-muted-foreground text-sm">/night</span>
                          <span className="text-muted-foreground text-xs"> + fees</span>
                          {simNights > 0 && (
                            <div className="text-muted-foreground text-xs">
                              {simNights} nights
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          <Users className="w-3 h-3 inline mr-1" />
                          {sim.property.sleeps}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Bid Dialog */}
      {listing && isBiddable && (
        <BidFormDialog
          listing={{
            ...listing,
            property: listing.property,
            open_for_bidding: listing.open_for_bidding,
            bidding_ends_at: listing.bidding_ends_at,
            min_bid_amount: listing.min_bid_amount,
            reserve_price: null,
            allow_counter_offers: true,
            created_at: listing.created_at,
            updated_at: new Date().toISOString(),
          }}
          open={bidDialogOpen}
          onOpenChange={setBidDialogOpen}
        />
      )}

      {/* Date Proposal Dialog */}
      {listing && (
        <BidFormDialog
          listing={{
            ...listing,
            property: listing.property,
            open_for_bidding: listing.open_for_bidding,
            bidding_ends_at: listing.bidding_ends_at,
            min_bid_amount: listing.min_bid_amount,
            reserve_price: null,
            allow_counter_offers: true,
            created_at: listing.created_at,
            updated_at: new Date().toISOString(),
          }}
          open={dateProposalOpen}
          onOpenChange={setDateProposalOpen}
          mode="date-proposal"
        />
      )}

      {/* Inspired Travel Request Dialog */}
      {listing && prop && (
        <InspiredTravelRequestDialog
          listing={listing}
          open={inspiredRequestOpen}
          onOpenChange={setInspiredRequestOpen}
        />
      )}

      {/* Inquiry Dialog */}
      {listing && user && !isOwnListing && (
        <InquiryDialog
          open={inquiryDialogOpen}
          onOpenChange={setInquiryDialogOpen}
          listingId={listing.id}
          ownerId={listing.owner_id}
          propertyId={listing.property_id}
          propertyName={displayName}
        />
      )}

      {/* Text Chat Panel */}
      <TextChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        messages={chatMessages}
        status={chatStatus}
        error={chatError}
        context="property-detail"
        onSendMessage={sendChatMessage}
        onClearHistory={clearChatHistory}
      />
    </div>
  );
};

export default PropertyDetail;
