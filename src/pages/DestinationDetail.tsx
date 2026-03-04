import { useParams, Link, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useActiveListings } from '@/hooks/useListings';
import { getDestinationBySlug, getCityBySlug, getLocationFilterValue } from '@/lib/destinations';
import { MapPin, ChevronRight, Home, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

const DestinationDetail = () => {
  const { destinationSlug, citySlug } = useParams<{
    destinationSlug: string;
    citySlug?: string;
  }>();

  const destination = destinationSlug ? getDestinationBySlug(destinationSlug) : null;
  const city = destinationSlug && citySlug ? getCityBySlug(destinationSlug, citySlug) : null;

  const filterValue = destinationSlug ? getLocationFilterValue(destinationSlug, citySlug) : null;

  const { data: allListings } = useActiveListings();

  // Filter listings that match this destination/city
  const matchingCount = useMemo(() => {
    if (!allListings || !filterValue) return 0;
    return allListings.filter((l) => {
      const location = (l.property?.resort?.location?.city || l.property?.location || '').toLowerCase();
      const state = (l.property?.resort?.location?.state || '').toLowerCase();
      const fv = filterValue.toLowerCase();
      return location.includes(fv) || state.includes(fv) || (l.property?.resort?.resort_name || '').toLowerCase().includes(fv);
    }).length;
  }, [allListings, filterValue]);

  // Count per city
  const cityCounts = useMemo(() => {
    if (!allListings || !destination) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const c of destination.cities) {
      const cv = c.name.toLowerCase();
      const count = allListings.filter((l) => {
        const loc = (l.property?.resort?.location?.city || l.property?.location || '').toLowerCase();
        return loc.includes(cv);
      }).length;
      counts.set(c.slug, count);
    }
    return counts;
  }, [allListings, destination]);

  const pageName = city ? `${city.name}, ${destination?.name}` : destination?.name || 'Destination';
  const pageDesc = city?.description || destination?.description || '';

  usePageMeta(
    `${pageName} Vacation Rentals`,
    `${pageDesc} Browse timeshare rentals in ${pageName} at up to 70% off retail.`,
  );

  if (!destination) {
    return <Navigate to="/destinations" replace />;
  }

  if (citySlug && !city) {
    return <Navigate to={`/destinations/${destinationSlug}`} replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-12 bg-gradient-warm">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link to="/destinations" className="hover:text-foreground transition-colors">
              Destinations
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {city ? (
              <>
                <Link
                  to={`/destinations/${destinationSlug}`}
                  className="hover:text-foreground transition-colors"
                >
                  {destination.name}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-foreground font-medium">{city.name}</span>
              </>
            ) : (
              <span className="text-foreground font-medium">{destination.name}</span>
            )}
          </nav>

          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <MapPin className="w-4 h-4" />
            <span>{destination.region}</span>
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            {city ? `${city.name}, ${destination.name}` : destination.name}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {city?.description || destination.description}
          </p>

          {matchingCount > 0 && (
            <Badge variant="secondary" className="mt-4">
              <Home className="w-3.5 h-3.5 mr-1.5" />
              {matchingCount} available listing{matchingCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </section>

      {/* City or CTA: if no city selected, show city grid */}
      {!city ? (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="font-display text-xl font-semibold text-foreground mb-6">
              Explore {destination.name} by City
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {destination.cities.map((c) => {
                const count = cityCounts.get(c.slug) || 0;
                return (
                  <Link
                    key={c.slug}
                    to={`/destinations/${destinationSlug}/${c.slug}`}
                    className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-all group"
                  >
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      {c.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {c.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {count > 0 ? `${count} listing${count !== 1 ? 's' : ''}` : 'Coming soon'}
                      </span>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Browse all link */}
            <div className="mt-8 text-center">
              <Link
                to={`/rentals?location=${encodeURIComponent(destination.name)}`}
                className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
              >
                View all {destination.name} listings
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-muted-foreground mb-4">
              {matchingCount > 0
                ? `Browse ${matchingCount} available listings in ${city.name}.`
                : `No listings currently available in ${city.name}. Check back soon!`}
            </p>
            <Link
              to={`/rentals?location=${encodeURIComponent(city.name)}`}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Browse {city.name} Listings
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default DestinationDetail;
