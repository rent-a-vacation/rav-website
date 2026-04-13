import { Link } from "react-router-dom";
import {
  Star,
  MapPin,
  Heart,
  Home,
  Users,
  Flame,
  Sparkles,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type ActiveListing } from "@/hooks/useListings";
import { getFreshnessLabel, getPopularityLabel, getDaysAgo } from "@/hooks/useListingSocialProof";
import { calculateNights } from "@/lib/pricing";

// --- Shared helpers (formerly duplicated in FeaturedResorts + Rentals) ---

export const BRAND_LABELS: Record<string, string> = {
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

export function getDisplayName(listing: ActiveListing): string {
  const prop = listing.property;
  if (prop.resort?.resort_name && prop.unit_type) {
    return `${(prop.unit_type as unknown as Record<string, string>).unit_type_name} at ${prop.resort.resort_name}`;
  }
  if (prop.resort?.resort_name) return prop.resort.resort_name;
  return prop.resort_name;
}

export function getLocation(listing: ActiveListing): string {
  const prop = listing.property;
  if (prop.resort?.location) {
    return `${prop.resort.location.city}, ${prop.resort.location.state}`;
  }
  return prop.location;
}

export function getImage(listing: ActiveListing): string | null {
  if (listing.property.images?.length > 0) return listing.property.images[0];
  if (listing.property.resort?.main_image_url) return listing.property.resort.main_image_url;
  return null;
}

export function getBrandLabel(listing: ActiveListing): string {
  return BRAND_LABELS[listing.property.brand] || listing.property.brand;
}

// --- ListingCard component ---

interface ListingCardProps {
  listing: ActiveListing;
  isFavorited: boolean;
  onToggleFavorite: (id: string) => void;
  favoritesCount: number;
  /** Grid or list layout (default: grid) */
  viewMode?: "grid" | "list";
  /** Show check-in/check-out date range (Rentals page) */
  showDateRange?: boolean;
  /** Show bedroom count alongside guests (Rentals page) */
  showBedrooms?: boolean;
  /** Staggered animation delay in ms */
  animationDelay?: number;
  /** Render slot for extra content below price (e.g., FairValueBadge, PriceDropped) */
  priceExtra?: React.ReactNode;
  /** Render slot for extra overlay content (e.g., compare checkbox) */
  imageOverlay?: React.ReactNode;
}

export function ListingCard({
  listing,
  isFavorited,
  onToggleFavorite,
  favoritesCount,
  viewMode = "grid",
  showDateRange = false,
  showBedrooms = false,
  animationDelay,
  priceExtra,
  imageOverlay,
}: ListingCardProps) {
  const nights = calculateNights(listing.check_in_date, listing.check_out_date);
  const pricePerNight = listing.nightly_rate || (nights > 0 ? Math.round(listing.final_price / nights) : 0);
  const image = getImage(listing);
  const displayName = getDisplayName(listing);
  const location = getLocation(listing);
  const brandLabel = getBrandLabel(listing);
  const rating = listing.property.resort?.guest_rating;
  const freshnessLabel = getFreshnessLabel(listing.created_at);
  const popularityLabel = getPopularityLabel(favoritesCount);
  const daysAgo = getDaysAgo(listing.created_at);

  return (
    <Link
      to={`/property/${listing.id}`}
      className={`group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ${
        viewMode === "list" ? "flex" : ""
      } ${animationDelay !== undefined ? "animate-fade-in" : ""}`}
      style={animationDelay !== undefined ? { animationDelay: `${animationDelay}ms` } : undefined}
    >
      {/* Image */}
      <div
        className={`relative overflow-hidden ${
          viewMode === "list" ? "w-full sm:w-72 h-48" : "h-52"
        }`}
      >
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
        {/* Gradient overlay */}
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
        {/* Image overlay slot (compare checkbox, etc.) */}
        {imageOverlay}
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite(listing.id);
          }}
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorited}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorited ? "fill-accent text-accent" : "text-foreground"
            }`}
          />
        </button>
      </div>

      {/* Content */}
      <div className={`p-4 ${viewMode === "list" ? "flex-1" : ""}`}>
        <div className="flex items-center justify-between mb-1">
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
        <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {displayName}
        </h3>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          {rating && (
            <>
              <Star className="w-3 h-3 fill-warning text-warning" />
              <span className="font-semibold">{rating}</span>
              <span className="mx-1">&middot;</span>
            </>
          )}
          {favoritesCount > 0 && (
            <>
              <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
              <span>{favoritesCount} saved</span>
              <span className="mx-1">&middot;</span>
            </>
          )}
          {showDateRange && (
            <>
              {new Date(listing.check_in_date).toLocaleDateString()} — {new Date(listing.check_out_date).toLocaleDateString()}
            </>
          )}
          {!showDateRange && nights > 0 && (
            <span>{nights} nights</span>
          )}
        </p>
        {showDateRange && nights > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-muted-foreground">{nights} nights</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-foreground">
              <span className="font-display text-xl font-bold">${pricePerNight}</span>
              <span className="text-muted-foreground text-sm">/night</span>
              <span className="text-muted-foreground text-xs"> + fees</span>
            </div>
            {nights > 0 && !showDateRange && (
              <span className="text-muted-foreground text-xs">{nights} nights</span>
            )}
            {priceExtra}
          </div>
          <div className="text-xs text-muted-foreground">
            <Users className="w-3 h-3 inline mr-1" />
            {listing.property.sleeps}{showBedrooms ? ` guests • ${listing.property.bedrooms} BR` : ""}
          </div>
        </div>
      </div>
    </Link>
  );
}
