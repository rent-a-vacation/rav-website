import { ChevronRight, Home, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useActiveListings } from "@/hooks/useListings";
import { useListingSocialProof } from "@/hooks/useListingSocialProof";
import { ListingCard } from "@/components/ListingCard";

const FeaturedResorts = () => {
  const { user } = useAuth();
  const { data: favoriteIds = [] } = useFavoriteIds();
  const toggleFavoriteMutation = useToggleFavorite();
  const { toast } = useToast();
  const { data: listings = [], isLoading } = useActiveListings();
  const { favoritesCount } = useListingSocialProof();

  // Show up to 8 featured listings
  const featured = listings.slice(0, 8);

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

  if (isLoading) {
    return (
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        </div>
      </section>
    );
  }

  if (featured.length === 0) {
    return (
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">
              Vacation Rentals Coming Soon
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              We're building a marketplace of amazing vacation club properties.
              Be the first to know when listings go live.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/list-property">
                <Button size="lg">
                  <Home className="w-4 h-4 mr-2" />
                  List Your Property
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-1">
              Explore vacation rentals
            </h2>
            <p className="text-muted-foreground">
              117 resorts from 9 brands — verified owners, protected payments
            </p>
          </div>
          <Link to="/rentals" className="mt-3 md:mt-0">
            <Button variant="outline" size="sm">
              View all rentals
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Listings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((listing, index) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              isFavorited={favoriteIds.includes(listing.id)}
              onToggleFavorite={toggleLike}
              favoritesCount={favoritesCount.get(listing.id) || 0}
              animationDelay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedResorts;
