// Vacation Marketplace - Browse listings open for bidding and post travel requests

import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useAuth } from '@/contexts/AuthContext';
import { useTextChat } from '@/hooks/useTextChat';
import { TextChatPanel } from '@/components/TextChatPanel';
import { useListingsOpenForBidding, useOpenTravelRequests } from '@/hooks/useBidding';
import { TravelRequestForm } from '@/components/bidding/TravelRequestForm';
import { TravelRequestCard } from '@/components/bidding/TravelRequestCard';
import { BidFormDialog } from '@/components/bidding/BidFormDialog';
import { VerifiedOwnerBadge, RenterBadge } from '@/components/RoleBadge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Gavel, 
  Store,
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  TrendingUp,
  ArrowRight,
  Send,
} from 'lucide-react';
import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import type { ListingWithBidding } from '@/types/bidding';

const BiddingMarketplace = () => {
  usePageMeta({
    title: 'Name Your Price Marketplace',
    description: 'Bid on vacation rentals and negotiate directly with verified owners. Place offers at your price.',
    canonicalPath: '/bidding',
  });

  const { user, isRenter, isPropertyOwner } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { data: biddableListings, isLoading: listingsLoading } = useListingsOpenForBidding();
  const { data: travelRequests, isLoading: requestsLoading } = useOpenTravelRequests();

  // Pre-fill support from PostRequestCTA on /rentals
  const prefill = searchParams.get('prefill') === 'true';
  const prefillDestination = searchParams.get('destination') ?? '';
  const prefillCheckin = searchParams.get('checkin') ?? '';
  const prefillCheckout = searchParams.get('checkout') ?? '';
  const defaultTab = searchParams.get('tab') || 'listings';

  const [selectedListing, setSelectedListing] = useState<ListingWithBidding | null>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const {
    messages: chatMessages,
    status: chatStatus,
    error: chatError,
    sendMessage: sendChatMessage,
    clearHistory: clearChatHistory,
  } = useTextChat({ context: "bidding" });

  const handleBidClick = (listing: ListingWithBidding) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to make an offer on this listing.",
      });
      return;
    }
    setSelectedListing(listing);
    setBidDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="pt-20 md:pt-24 pb-10 md:pb-12 bg-gradient-warm border-b border-border/60">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-3 bg-accent text-accent-foreground">
              <Store className="h-3 w-3 mr-1" />
              Direct from Owners
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
              Name Your Price
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              The flexible pricing marketplace for vacation rentals. Make an offer on owner-listed properties
              or post your travel plans and let verified owners compete for your booking.
            </p>
            {user && isRenter() && (
              <TravelRequestForm defaultValues={prefill ? { destination: prefillDestination, checkIn: prefillCheckin, checkOut: prefillCheckout } : undefined} />
            )}
            {!user && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg">
                  <Link to="/login">Sign in to make an offer</Link>
                </Button>
              </div>
            )}
            {user && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setChatOpen(true)}
                  className="gap-2"
                >
                  <img src="/ravio-v2.png" alt="" className="h-6 w-6" />
                  Ask RAVIO
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-10 md:py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue={defaultTab} className="space-y-6 md:space-y-8">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="listings" className="gap-2">
                <Gavel className="h-4 w-4" />
                Listings
              </TabsTrigger>
              <TabsTrigger value="requests" className="gap-2">
                <Send className="h-4 w-4" />
                RAV Wishes
              </TabsTrigger>
            </TabsList>

            {/* Listings Open for Bidding */}
            <TabsContent value="listings" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Flexible Pricing Listings</h2>
                  <p className="text-muted-foreground">
                    Submit your best offer directly to verified property owners
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2 flex-shrink-0">
                  {biddableListings?.length || 0} available
                </Badge>
              </div>

              {listingsLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-48 w-full" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : biddableListings && biddableListings.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {biddableListings.map((listing) => (
                    <BiddableListingCard
                      key={listing.id}
                      listing={listing}
                      onBidClick={() => handleBidClick(listing)}
                      canBid={!isPropertyOwner() || isRenter()}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No flexible pricing listings yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Check back soon or browse our regular listings
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/rentals">Browse All Rentals</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Travel Requests */}
            <TabsContent value="requests" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">Open RAV Wishes</h2>
                  <p className="text-muted-foreground">
                    Renters looking for vacation rentals - submit your proposal!
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2 flex-shrink-0">
                  {travelRequests?.length || 0} requests
                </Badge>
              </div>

              {requestsLoading ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-20 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : travelRequests && travelRequests.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {travelRequests.map((request) => (
                    <TravelRequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <Send className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No vacation wishes yet</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      Be the first to post your travel needs and get offers from owners!
                    </p>
                    {user ? (
                      <TravelRequestForm defaultValues={prefill ? { destination: prefillDestination, checkIn: prefillCheckin, checkOut: prefillCheckout } : undefined} />
                    ) : (
                      <Button asChild>
                        <Link to="/login">Sign in to post a request</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* How the Marketplace Works */}
      <section className="py-14 md:py-16 bg-muted/40 border-t border-border/60">
        <div className="container mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-tight text-center mb-10 md:mb-12">How the Marketplace Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-4xl mx-auto">
            {/* Renter Flow */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">For Renters</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
                  <div>
                    <p className="font-medium">Make a RAV Offer</p>
                    <p className="text-sm text-muted-foreground">Browse flexible pricing listings and submit your best offer</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
                  <div>
                    <p className="font-medium">Or Post Your Needs</p>
                    <p className="text-sm text-muted-foreground">Describe your ideal vacation and let owners come to you</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
                  <div>
                    <p className="font-medium">Compare & Book</p>
                    <p className="text-sm text-muted-foreground">Review offers, accept the best one, and book your stay</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Owner Flow */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-bold">For Property Owners</h3>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">1</div>
                  <div>
                    <p className="font-medium">Enable Flexible Pricing</p>
                    <p className="text-sm text-muted-foreground">Allow offers on your listings to attract more interest</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">2</div>
                  <div>
                    <p className="font-medium">Browse RAV Wishes</p>
                    <p className="text-sm text-muted-foreground">Find renters looking for properties like yours</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">3</div>
                  <div>
                    <p className="font-medium">Submit Proposals</p>
                    <p className="text-sm text-muted-foreground">Send competitive offers directly to interested renters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Bid Dialog */}
      {selectedListing && (
        <BidFormDialog
          listing={selectedListing}
          open={bidDialogOpen}
          onOpenChange={setBidDialogOpen}
        />
      )}

      {/* Text Chat Panel */}
      <TextChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        messages={chatMessages}
        status={chatStatus}
        error={chatError}
        context="bidding"
        onSendMessage={sendChatMessage}
        onClearHistory={clearChatHistory}
      />
    </div>
  );
};

// Biddable Listing Card Component
interface BiddableListingCardProps {
  listing: ListingWithBidding;
  onBidClick: () => void;
  canBid: boolean;
}

function BiddableListingCard({ listing, onBidClick, canBid }: BiddableListingCardProps) {
  const stayDuration = differenceInDays(
    new Date(listing.check_out_date), 
    new Date(listing.check_in_date)
  );

  const timeRemaining = listing.bidding_ends_at 
    ? formatDistanceToNow(new Date(listing.bidding_ends_at), { addSuffix: true })
    : null;

  const isEndingSoon = listing.bidding_ends_at 
    ? differenceInDays(new Date(listing.bidding_ends_at), new Date()) <= 1
    : false;

  return (
    <Card className="overflow-hidden group hover:shadow-card-hover transition-all">
      {/* Image Placeholder */}
      <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 relative">
        {listing.property?.images?.[0] ? (
          <img 
            src={listing.property.images[0]} 
            alt={listing.property.resort_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Gavel className="h-12 w-12 text-primary/50" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge className="bg-accent text-accent-foreground">
            <Gavel className="h-3 w-3 mr-1" />
            Flexible Pricing
          </Badge>
        </div>
        
        {timeRemaining && (
          <Badge 
            variant={isEndingSoon ? 'destructive' : 'secondary'}
            className="absolute top-3 right-3"
          >
            <Clock className="h-3 w-3 mr-1" />
            Ends {timeRemaining}
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg line-clamp-1">
              {listing.property?.resort_name}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {listing.property?.location}
            </CardDescription>
          </div>
          <VerifiedOwnerBadge />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Dates */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(new Date(listing.check_in_date), 'MMM d')} - 
            {format(new Date(listing.check_out_date), 'MMM d, yyyy')}
          </span>
          <Badge variant="outline" className="ml-auto">
            {stayDuration} nights
          </Badge>
        </div>

        {/* Property Info */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{listing.property?.bedrooms} BR</span>
          <span>•</span>
          <span>Sleeps {listing.property?.sleeps}</span>
        </div>

        {/* Pricing Info */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Listed at</p>
            <p className="font-bold text-lg">${listing.final_price.toLocaleString()}</p>
          </div>
          <div className="text-right">
            {listing.min_bid_amount && (
              <p className="text-xs text-muted-foreground">
                Minimum offer: ${listing.min_bid_amount.toLocaleString()}
              </p>
            )}
            {listing.bid_count !== undefined && listing.bid_count > 0 && (
              <p className="text-xs font-medium text-accent">
                {listing.bid_count} offer{listing.bid_count > 1 ? 's' : ''} placed
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        {canBid ? (
          <Button onClick={onBidClick} className="w-full group-hover:bg-accent group-hover:text-accent-foreground">
            <Gavel className="h-4 w-4 mr-2" />
            Make a RAV Offer
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button variant="outline" className="w-full" asChild>
            <Link to={`/property/${listing.id}`}>
              View Listing Details
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default BiddingMarketplace;
