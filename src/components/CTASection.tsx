import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Gavel } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 hero-gradient" />
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm mb-6">
            <Gavel className="w-4 h-4 text-accent" />
            <span className="text-white/90 text-sm font-medium">Your Price. Your Paradise.</span>
          </div>

          <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">
            Why Pay Resort Prices When You Can Name Your Own?
          </h2>

          <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
            Rent directly from timeshare owners and save 20-40% vs resort-direct rates. Make an Offer on open Listings
            or post a Wish and let owners come to you with Offers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/marketplace">
              <Button variant="hero" size="xl">
                <Gavel className="w-5 h-5" />
                Open the Marketplace
              </Button>
            </Link>
            <Link to="/rentals">
              <Button variant="hero-outline" size="xl">
                Browse Rentals
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
