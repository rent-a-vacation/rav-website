import { lazy, Suspense, useMemo, useState } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  BookOpen,
  Gavel,
  Heart,
  Clock,
  Plane,
  ArrowRight,
  CalendarDays,
  Search,
} from 'lucide-react';
import { computeRenterOverview, getCheckInCountdown } from '@/lib/renterDashboard';
import { SavedSearchesList } from '@/components/SavedSearchesList';

// Lazy-load heavy sub-pages
const MyBookings = lazy(() => import('./MyBookings'));
const MyBidsDashboard = lazy(() => import('./MyBidsDashboard'));

const TABS = ['overview', 'bookings', 'offers', 'favorites'] as const;
type TabValue = (typeof TABS)[number];

const RenterDashboard = () => {
  usePageMeta('My Trips', 'Manage your bookings, offers, travel requests, and favorites.');
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabValue) || 'overview';

  // Import hooks conditionally from useBidding via lazy eval
  const [bidsData, setBidsData] = useState<{ bids: unknown[]; requests: unknown[] }>({ bids: [], requests: [] });
  const [bookingsData, setBookingsData] = useState<unknown[]>([]);
  const [favoritesData, setFavoritesData] = useState<string[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load data on mount using dynamic imports to avoid circular deps
  useMemo(() => {
    if (!user || dataLoaded) return;
    import('@/lib/supabase').then(({ supabase }) => {
      // Fetch bookings
      supabase
        .from('bookings')
        .select('status, check_in_date')
        .eq('renter_id', user.id)
        .then(({ data }) => {
          if (data) setBookingsData(data);
        });

      // Fetch bids
      supabase
        .from('listing_bids')
        .select('status')
        .eq('bidder_id', user.id)
        .then(({ data }) => {
          if (data) setBidsData((prev) => ({ ...prev, bids: data }));
        });

      // Fetch travel requests
      supabase
        .from('travel_requests')
        .select('status')
        .eq('requester_id', user.id)
        .then(({ data }) => {
          if (data) setBidsData((prev) => ({ ...prev, requests: data }));
        });

      // Fetch favorites
      supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (data) setFavoritesData(data.map((f: { property_id: string }) => f.property_id));
        });

      setDataLoaded(true);
    });
  }, [user, dataLoaded]);

  const overview = useMemo(
    () =>
      computeRenterOverview(
        bookingsData as { status: string; check_in_date: string }[],
        bidsData.bids as { status: string }[],
        bidsData.requests as { status: string }[],
      ),
    [bookingsData, bidsData],
  );

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="pt-20 md:pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 md:mb-10">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              My Trips
            </h1>
            <p className="text-muted-foreground mt-2">
              Your bookings, offers, and saved properties in one place.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setTab}>
            <TabsList className="mb-6 flex-wrap h-auto">
              <TabsTrigger value="overview" className="gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="bookings" className="gap-1.5">
                <BookOpen className="h-4 w-4" />
                Bookings
                {overview.upcomingCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {overview.upcomingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="offers" className="gap-1.5">
                <Gavel className="h-4 w-4" />
                Offers & Requests
                {overview.activeBidCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {overview.activeBidCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-1.5">
                <Heart className="h-4 w-4" />
                Favorites
                {favoritesData.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {favoritesData.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Next Trip Card */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      Next Trip
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {overview.nextCheckIn ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">
                            {getCheckInCountdown(overview.nextCheckIn)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Check-in: {new Date(overview.nextCheckIn + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setTab('bookings')}>
                          View Details
                          <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground mb-3">No upcoming trips</p>
                        <Button asChild variant="outline" size="sm">
                          <Link to="/rentals">
                            <Search className="h-3.5 w-3.5 mr-1.5" />
                            Browse Rentals
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Offers */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Gavel className="h-4 w-4" />
                      Active Offers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{overview.activeBidCount}</p>
                    <p className="text-sm text-muted-foreground">
                      {overview.activeBidCount === 1 ? 'bid pending' : 'bids pending'}
                    </p>
                  </CardContent>
                </Card>

                {/* Open Requests */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />
                      My Wishes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{overview.openRequestCount}</p>
                    <p className="text-sm text-muted-foreground">
                      {overview.openRequestCount === 1 ? 'Wish open' : 'Wishes open'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                  <CardDescription>Jump right in</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button asChild variant="outline" className="justify-start h-auto py-3">
                      <Link to="/rentals">
                        <Search className="h-4 w-4 mr-2" />
                        Browse Rentals
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-start h-auto py-3">
                      <Link to="/marketplace">
                        <Gavel className="h-4 w-4 mr-2" />
                        Marketplace
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="justify-start h-auto py-3">
                      <Link to="/destinations">
                        <Plane className="h-4 w-4 mr-2" />
                        Explore Destinations
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Saved Searches */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Saved Searches</CardTitle>
                  <CardDescription>Pick up where you left off</CardDescription>
                </CardHeader>
                <CardContent>
                  <SavedSearchesList />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab — reuse MyBookings page content */}
            <TabsContent value="bookings">
              <Suspense fallback={<BookingsLoadingSkeleton />}>
                <MyBookings embedded />
              </Suspense>
            </TabsContent>

            {/* Offers & Requests Tab — reuse MyBidsDashboard */}
            <TabsContent value="offers">
              <Suspense fallback={<BookingsLoadingSkeleton />}>
                <MyBidsDashboard embedded />
              </Suspense>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              {favoritesData.length > 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    You have {favoritesData.length} favorited propert{favoritesData.length === 1 ? 'y' : 'ies'}.
                  </p>
                  <Button asChild>
                    <Link to="/rentals">
                      <Heart className="h-4 w-4 mr-2" />
                      View Your Favorites on Rentals
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No favorites yet</p>
                  <Button asChild variant="outline">
                    <Link to="/rentals">Browse Rentals</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </div>
  );
};

function BookingsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-32 w-full rounded-xl" />
      ))}
    </div>
  );
}

export default RenterDashboard;
