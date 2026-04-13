import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Loader2, Clock, Tag, Flame, Bookmark, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { useListingSocialProof } from "@/hooks/useListingSocialProof";
import { ListingCard } from "@/components/ListingCard";
import { ListingFairValueBadge } from "@/components/fair-value/ListingFairValueBadge";
import { SaveSearchButton } from "@/components/SaveSearchButton";
import { PostRequestCTA } from "@/components/bidding/PostRequestCTA";
import { useRavDeals, type RavDeal } from "@/hooks/useRavDeals";

const ITEMS_PER_PAGE = 6;

/** Color-coded urgency badge based on days until check-in */
function UrgencyBadges({ deal }: { deal: RavDeal }) {
  const { daysUntilCheckIn, urgencyDiscount, bidCount } = deal;

  // Color by urgency
  let countdownClass = "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (daysUntilCheckIn <= 7) {
    countdownClass = "bg-red-100 text-red-700 border-red-200";
  } else if (daysUntilCheckIn <= 14) {
    countdownClass = "bg-orange-100 text-orange-700 border-orange-200";
  }

  return (
    <div className="flex flex-wrap gap-1">
      {/* Days countdown */}
      <Badge variant="secondary" className={`text-[10px] ${countdownClass}`}>
        <Clock className="w-3 h-3 mr-0.5" />
        {daysUntilCheckIn} {daysUntilCheckIn === 1 ? "day" : "days"} left
      </Badge>

      {/* No offers indicator */}
      {bidCount === 0 && (
        <Badge variant="secondary" className="text-[10px] bg-teal-100 text-teal-700 border-teal-200">
          <Tag className="w-3 h-3 mr-0.5" />
          No offers yet
        </Badge>
      )}

      {/* Urgency discount */}
      {urgencyDiscount < 0 && (
        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 border-green-200">
          <Flame className="w-3 h-3 mr-0.5" />
          Up to {Math.abs(urgencyDiscount)}% below average
        </Badge>
      )}
    </div>
  );
}

const RavDeals = () => {
  usePageMeta({
    title: "RAV Deals — Expiring Vacation Weeks at Your Price",
    description:
      "Browse distressed vacation rental inventory. Expiring weeks from motivated owners — make an offer and save 20-40% compared to resort-direct rates.",
    canonicalPath: "/rav-deals",
  });

  // JSON-LD structured data
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "RAV Deals",
      description: "Curated distressed inventory — expiring vacation weeks from motivated sellers",
      url: "https://rent-a-vacation.com/rav-deals",
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "rav-deals-schema";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.getElementById("rav-deals-schema")?.remove();
    };
  }, []);

  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { toast } = useToast();

  // Favorites
  const { data: favoriteIds = [] } = useFavoriteIds();
  const toggleFavoriteMutation = useToggleFavorite();
  const { favoritesCount } = useListingSocialProof();

  // RAV Deals data
  const { deals, isLoading, error, isEmpty } = useRavDeals();

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(deals.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDeals = deals.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const toggleLike = (id: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your favorites.",
      });
      return;
    }
    toggleFavoriteMutation.mutate(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section id="main-content" className="pt-24 pb-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
              RAV Deals
            </h1>
            <p className="text-lg text-muted-foreground mb-2">
              Expiring Weeks. Motivated Owners. Your Best Price.
            </p>
            <p className="text-sm text-muted-foreground">
              These listings are approaching check-in with few or no offers.
              The closer the date, the bigger the opportunity to name your price.
            </p>
          </div>
          {deals.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                <Flame className="w-3.5 h-3.5 mr-1 text-orange-500" />
                {deals.length} {deals.length === 1 ? "deal" : "deals"} available
              </Badge>
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading RAV Deals...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Unable to load deals
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Something went wrong loading RAV Deals. Please try again.
              </p>
            </div>
          )}

          {/* Empty State */}
          {isEmpty && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Tag className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                No RAV Deals Right Now
              </h3>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                There are no expiring weeks available at the moment. Set up a Saved Search
                to get notified when deals appear, or browse all available rentals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <SaveSearchButton criteria={{ searchQuery: "rav-deals" }} />
                <Link to="/rentals">
                  <Button variant="outline" size="lg">
                    Browse Rentals
                  </Button>
                </Link>
              </div>
              <PostRequestCTA />
            </div>
          )}

          {/* Deals Grid */}
          {!isLoading && !error && deals.length > 0 && (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedDeals.map((deal) => (
                  <ListingCard
                    key={deal.listing.id}
                    listing={deal.listing}
                    isFavorited={favoriteIds.includes(deal.listing.id)}
                    onToggleFavorite={toggleLike}
                    favoritesCount={favoritesCount.get(deal.listing.id) || 0}
                    showDateRange
                    showBedrooms
                    priceExtra={
                      <>
                        <ListingFairValueBadge listingId={deal.listing.id} />
                        <UrgencyBadges deal={deal} />
                      </>
                    }
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <Pagination className="mt-12">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className={safePage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={page === safePage}
                          onClick={() => setCurrentPage(page)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className={safePage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RavDeals;
