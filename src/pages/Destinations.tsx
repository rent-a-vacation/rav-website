import { Link } from "react-router-dom";
import { useMemo } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useActiveListings } from "@/hooks/useListings";
import { DESTINATIONS } from "@/lib/destinations";
import { ArrowRight, MapPin } from "lucide-react";
import keralaImage from "@/assets/kerala-backwaters.jpg";
import utahImage from "@/assets/utah-arches.jpg";
import yellowstoneImage from "@/assets/yellowstone.jpg";
import jacksonvilleImage from "@/assets/jacksonville-beach.jpg";

// Map destination slugs to images (reusing existing assets)
const DEST_IMAGES: Record<string, string> = {
  hawaii: keralaImage,
  florida: jacksonvilleImage,
  california: utahImage,
  mexico: yellowstoneImage,
  caribbean: keralaImage,
  colorado: yellowstoneImage,
  arizona: utahImage,
  nevada: jacksonvilleImage,
  'south-carolina': keralaImage,
  utah: utahImage,
};

const Destinations = () => {
  usePageMeta({
    title: 'Top Destinations',
    description: 'Explore top vacation destinations with luxury resort stays at up to 70% off retail prices.',
    canonicalPath: '/destinations',
  });

  const { data: allListings } = useActiveListings();

  // Compute dynamic listing counts per destination
  const destCounts = useMemo(() => {
    const counts = new Map<string, number>();
    if (!allListings) return counts;
    for (const dest of DESTINATIONS) {
      const dv = dest.name.toLowerCase();
      const count = allListings.filter((l) => {
        const loc = (l.property?.resort?.location?.city || l.property?.location || '').toLowerCase();
        const state = (l.property?.resort?.location?.state || '').toLowerCase();
        return loc.includes(dv) || state.includes(dv) || (l.property?.resort?.resort_name || '').toLowerCase().includes(dv);
      }).length;
      counts.set(dest.slug, count);
    }
    return counts;
  }, [allListings]);

  const featuredDestinations = DESTINATIONS.filter((d) => d.featured);
  const allDestinations = DESTINATIONS.filter((d) => !d.featured);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-warm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Explore Destinations
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover amazing vacation spots worldwide. From tropical beaches to mountain
            retreats, find your perfect getaway.
          </p>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8">
            Featured Destinations
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDestinations.map((dest) => {
              const count = destCounts.get(dest.slug) || 0;
              return (
                <Link
                  key={dest.slug}
                  to={`/destinations/${dest.slug}`}
                  className="group relative rounded-2xl overflow-hidden"
                  style={{ minHeight: "300px" }}
                >
                  <img
                    src={DEST_IMAGES[dest.slug] || keralaImage}
                    alt={dest.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-1 text-white/70 text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      {dest.region}
                    </div>
                    <h3 className="font-display text-2xl font-bold text-white mb-2">
                      {dest.name}
                    </h3>
                    <p className="text-white/80 mb-3">
                      {count > 0 ? `${count} available listings` : 'Explore this destination'}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {dest.cities.slice(0, 3).map((city) => (
                        <span
                          key={city.slug}
                          className="px-2 py-1 bg-white/20 rounded-full text-xs text-white"
                        >
                          {city.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-white group-hover:text-accent transition-colors">
                      <span className="text-sm font-medium">Explore</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* All Destinations */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8">
            All Destinations
          </h2>
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allDestinations.map((dest) => {
              const count = destCounts.get(dest.slug) || 0;
              return (
                <Link
                  key={dest.slug}
                  to={`/destinations/${dest.slug}`}
                  className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all group"
                >
                  <div className="h-40 overflow-hidden">
                    <img
                      src={DEST_IMAGES[dest.slug] || keralaImage}
                      alt={dest.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
                      <MapPin className="w-3 h-3" />
                      {dest.region}
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {dest.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {count > 0 ? `${count} listings` : 'Coming soon'}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {dest.cities.slice(0, 2).map((city) => (
                        <span
                          key={city.slug}
                          className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
                        >
                          {city.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Resort Brands */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl font-bold text-foreground mb-8">
            Browse by Resort Brand
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              "Marriott Vacation Club",
              "Hilton Grand Vacations",
              "Wyndham Destinations",
              "Disney Vacation Club",
              "Hyatt Residence Club",
              "Diamond Resorts",
              "Bluegreen Vacations",
              "Holiday Inn Club",
              "Worldmark",
              "Shell Vacations",
              "Festiva Hospitality",
              "Silverleaf Resorts",
            ].map((brand, index) => (
              <Link
                key={index}
                to={`/rentals?brand=${encodeURIComponent(brand)}`}
                className="bg-card rounded-lg p-4 text-center shadow-card hover:shadow-card-hover transition-all hover:bg-primary/5"
              >
                <span className="text-sm font-medium text-foreground">{brand}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Destinations;
