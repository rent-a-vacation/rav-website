import { Star, MapPin, ChevronRight, Heart, Home, Loader2, Users, Flame, Sparkles, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useActiveListings, type ActiveListing } from "@/hooks/useListings";
import { useListingSocialProof, getFreshnessLabel, getPopularityLabel, getDaysAgo } from "@/hooks/useListingSocialProof";
import { calculateNights } from "@/lib/pricing";

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

function getDisplayName(listing: ActiveListing): string {
  const prop = listing.property;
  if (prop.resort?.resort_name && prop.unit_type) {
    return `${(prop.unit_type as unknown as Record<string, string>).unit_type_name} at ${prop.resort.resort_name}`;
  }
  if (prop.resort?.resort_name) return prop.resort.resort_name;
  return prop.resort_name;
}

function getLocation(listing: ActiveListing): string {
  const prop = listing.property;
  if (prop.resort?.location) {
    return `${prop.resort.location.city}, ${prop.resort.location.state}`;
  }
  return prop.location;
}

function getImage(listing: ActiveListing): string | null {
  if (listing.property.images?.length > 0) return listing.property.images[0];
  if (listing.property.resort?.main_image_url) return listing.property.resort.main_image_url;
  return null;
}

const FeaturedResorts = () => {
  const { user } = useAuth();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const toggleFavoriteMutation = useToggleFavorite();
  const { toast } = useToast();
  const { data: listings = [], isLoading } = useActiveListings();
  const { favoritesCount } = useListingSocialProof();

  // Show up to 4 featured listings
  const featured = listings.slice(0, 4);

  const toggleLike = (id: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your favorites.",
      });
      return;
    }
    toggleFavoriteMutation.mutate(id);
  };

  // Don't render section if loading or no listings
  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </section>
    );
  }

  if (featured.length === 0) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Vacation Rentals Coming Soon
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              We're building a marketplace of amazing timeshare and vacation club properties.
              Be the first to know when listings go live.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/list-property">
                <Button size="lg">
                  <Home className="w-4 h-4 mr-2" />
                  List Your Property
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline" size="lg">
                  Learn How It Works
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              Exclusive Deals at Top Resorts
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Hand-picked vacation properties from verified timeshare owners
            </p>
          </div>
          <Link to="/rentals">
            <Button variant="outline">
              View All Resorts
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Resort Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((listing, index) => {
            const nights = calculateNights(listing.check_in_date, listing.check_out_date);
            const pricePerNight = listing.nightly_rate || (nights > 0 ? Math.round(listing.final_price / nights) : 0);
            const image = getImage(listing);
            const displayName = getDisplayName(listing);
            const location = getLocation(listing);
            const brandLabel = BRAND_LABELS[listing.property.brand] || listing.property.brand;
            const rating = listing.property.resort?.guest_rating;
            const favCount = favoritesCount.get(listing.id) || 0;
            const freshnessLabel = getFreshnessLabel(listing.created_at);
            const popularityLabel = getPopularityLabel(favCount);
            const daysAgo = getDaysAgo(listing.created_at);

            return (
              <Link
                to={`/property/${listing.id}`}
                key={listing.id}
                className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  {image ? (
                    <img
                      src={image}
                      alt={displayName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/20 flex items-center justify-center">
                      <Home className="w-12 h-12 text-primary/40" />
                    </div>
                  )}
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  {/* Brand Badge */}
                  <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                    {brandLabel}
                  </span>
                  {/* Freshness / Popularity Badge */}
                  {(freshnessLabel || popularityLabel) && (
                    <Badge
                      variant="secondary"
                      className={`absolute bottom-3 left-3 text-xs font-medium ${
                        popularityLabel
                          ? "bg-orange-500/90 text-white border-0"
                          : "bg-emerald-500/90 text-white border-0"
                      }`}
                    >
                      {popularityLabel ? (
                        <><Flame className="w-3 h-3 mr-1" />{popularityLabel}</>
                      ) : (
                        <><Sparkles className="w-3 h-3 mr-1" />{freshnessLabel}</>
                      )}
                    </Badge>
                  )}
                  {/* Like Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleLike(listing.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        favoriteIds.includes(listing.id)
                          ? "fill-accent text-accent"
                          : "text-foreground"
                      }`}
                    />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      {location}
                    </div>
                    {daysAgo <= 14 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                    {displayName}
                  </h3>
                  <div className="flex items-center gap-3 mb-3">
                    {rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="font-semibold text-sm">{rating}</span>
                      </div>
                    )}
                    {favCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                        {favCount} saved
                      </span>
                    )}
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-foreground">
                        <span className="text-xl font-bold">${pricePerNight}</span>
                        <span className="text-muted-foreground text-sm">/night</span>
                        <span className="text-muted-foreground text-xs"> + fees</span>
                      </div>
                      {nights > 0 && (
                        <span className="text-muted-foreground text-xs">
                          {nights} nights
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      <Users className="w-3 h-3 inline mr-1" />
                      {listing.property.sleeps}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturedResorts;
