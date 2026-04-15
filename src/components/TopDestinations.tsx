import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import keralaImage from "@/assets/kerala-backwaters.jpg";
import utahImage from "@/assets/utah-arches.jpg";
import yellowstoneImage from "@/assets/yellowstone.jpg";
import jacksonvilleImage from "@/assets/jacksonville-beach.jpg";

const destinations = [
  { name: "Florida", image: jacksonvilleImage },
  { name: "Hawaii", image: keralaImage },
  { name: "Utah", image: utahImage },
  { name: "Yellowstone", image: yellowstoneImage },
  { name: "Orlando", image: jacksonvilleImage },
  { name: "Maui", image: keralaImage },
  { name: "Park City", image: utahImage },
  { name: "Hilton Head", image: yellowstoneImage },
];

const TopDestinations = () => {
  return (
    <section className="py-12 md:py-16 bg-background border-t border-border/60">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Popular destinations
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Find your next stay by location.</p>
          </div>
          <Link
            to="/destinations"
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Horizontal Scroll Strip */}
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
          {destinations.map((dest, index) => (
            <Link
              key={index}
              to={`/rentals?location=${encodeURIComponent(dest.name)}`}
              className="flex-shrink-0 snap-start group"
            >
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden mb-2 shadow-card group-hover:shadow-card-hover transition-shadow">
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <p className="text-sm font-medium text-foreground text-center group-hover:text-primary transition-colors">
                {dest.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopDestinations;
