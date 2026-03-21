import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Search, LayoutDashboard, Gavel, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FeaturedResorts from "@/components/FeaturedResorts";
import HowItWorks from "@/components/HowItWorks";
import TrustBadges from "@/components/TrustBadges";
import TopDestinations from "@/components/TopDestinations";
import Testimonials from "@/components/Testimonials";
import CalculatorCTA from "@/components/CalculatorCTA";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const WelcomeBanner = () => {
  const { profile, isPropertyOwner, isRavTeam } = useAuth();
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="bg-primary/5 border-b border-primary/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Welcome back, {firstName}!
            </h2>
            <p className="text-sm text-muted-foreground">
              Where to next? Pick up where you left off.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/rentals">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Search className="h-3.5 w-3.5" />
                Browse
              </Button>
            </Link>
            <Link to="/my-bids">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Gavel className="h-3.5 w-3.5" />
                My Bids
              </Button>
            </Link>
            {isPropertyOwner() && (
              <Link to="/owner-dashboard">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard
                </Button>
              </Link>
            )}
            {isRavTeam() && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Admin
                </Button>
              </Link>
            )}
            <Link to="/rentals?tab=favorites">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                Favorites
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Index = () => {
  const { user, isLoading } = useAuth();

  usePageMeta({
    title: 'Luxury Vacation Rentals at 50–70% Off',
    description: 'Rent luxury timeshare vacation rentals at up to 70% off retail. Browse 117 resorts from Marriott, Hilton, Disney and more.',
    canonicalPath: '/',
  });

  // Inject Organization JSON-LD structured data
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Rent-A-Vacation',
      url: 'https://rent-a-vacation.com',
      logo: 'https://rent-a-vacation.com/rav-logo.svg',
      description:
        'The open marketplace for vacation rentals. Rent directly from verified timeshare owners at 50-70% off retail prices.',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-800-728-0800',
        contactType: 'customer service',
        email: 'support@rent-a-vacation.com',
        areaServed: 'US',
        availableLanguage: 'English',
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '7874 Chase Meadows Dr W',
        addressLocality: 'Jacksonville',
        addressRegion: 'FL',
        postalCode: '32256',
        addressCountry: 'US',
      },
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'org-schema';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('org-schema');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content">
        <HeroSection />
        {user && !isLoading && <WelcomeBanner />}
        <TrustBadges />
        <FeaturedResorts />
        <HowItWorks />
        <TopDestinations />
        <Testimonials />
        <CalculatorCTA />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
