import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Home,
  Building2,
  Calendar,
  DollarSign,
  Plus,
  ArrowLeft,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Shield,
  FileCheck,
  Crown,
  Percent,
  Wallet,
  BarChart3,
  FileText,
  X,
  Pencil,
} from "lucide-react";
import { usePublishDraft, loadDraft, clearDraft, type ListPropertyDraft } from "@/hooks/usePublishDraft";
import { useToast } from "@/hooks/use-toast";
import type { Property, Listing, Booking, ListingStatus, BookingStatus } from "@/types/database";
import { RoleUpgradeDialog } from "@/components/RoleUpgradeDialog";
import { useLatestRequestForRole } from "@/hooks/useRoleUpgrade";
import OwnerProperties from "@/components/owner/OwnerProperties";
import OwnerListings from "@/components/owner/OwnerListings";
import OwnerBookings from "@/components/owner/OwnerBookings";
import OwnerBookingConfirmations from "@/components/owner/OwnerBookingConfirmations";
import OwnerEarnings from "@/components/owner/OwnerEarnings";
import { OwnerProposals } from "@/components/owner/OwnerProposals";
import { OwnerVerification } from "@/components/owner/OwnerVerification";
import { OwnerPayouts } from "@/components/owner/OwnerPayouts";
import { MembershipPlans } from "@/components/MembershipPlans";
import { useOwnerCommission } from "@/hooks/useOwnerCommission";
import { useOwnerDashboardStats } from "@/hooks/owner/useOwnerDashboardStats";
import { useOwnerEarnings } from "@/hooks/owner/useOwnerEarnings";
import { useOwnerListingsData } from "@/hooks/owner/useOwnerListingsData";
import { useOwnerBidActivity } from "@/hooks/owner/useOwnerBidActivity";
import { OwnerHeadlineStats } from "@/components/owner-dashboard/OwnerHeadlineStats";
import { EarningsTimeline } from "@/components/owner-dashboard/EarningsTimeline";
import { MyListingsTable } from "@/components/owner-dashboard/MyListingsTable";
import { BidActivityFeed } from "@/components/owner-dashboard/BidActivityFeed";
import { PricingIntelligence } from "@/components/owner-dashboard/PricingIntelligence";
import { MaintenanceFeeTracker } from "@/components/owner-dashboard/MaintenanceFeeTracker";
import PortfolioOverview from "@/components/owner-dashboard/PortfolioOverview";

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  pendingBookings: number;
  totalEarnings: number;
  completedBookings: number;
}

const OwnerDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isPropertyOwner, isRavTeam, isLoading: authLoading } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalProperties: 0,
    activeListings: 0,
    pendingBookings: 0,
    totalEarnings: 0,
    completedBookings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const pendingRequest = useLatestRequestForRole('property_owner');
  const { effectiveRate, tierName, loading: commissionLoading } = useOwnerCommission();
  const { publishDraft: publishDraftFn, isPending: isPublishing } = usePublishDraft();
  const { toast } = useToast();

  // Draft banner state
  const [draft, setDraft] = useState<ListPropertyDraft | null>(() => loadDraft());
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  async function handlePublishDraft() {
    if (!user || !draft) return;
    const result = await publishDraftFn(user.id, draft);
    if (result.success) {
      setDraft(null);
      toast({ title: "Listing created!", description: "Your property and listing have been submitted for review." });
      setActiveTab("listings");
    } else {
      toast({ title: "Error", description: result.error || "Failed to publish draft", variant: "destructive" });
    }
  }

  function handleDiscardDraft() {
    clearDraft();
    setDraft(null);
    setShowDiscardConfirm(false);
    toast({ title: "Draft discarded" });
  }

  // Phase 17: Owner Dashboard data hooks
  const { data: dashStats, isLoading: dashStatsLoading } = useOwnerDashboardStats();
  const { data: earningsData, isLoading: earningsLoading } = useOwnerEarnings();
  const { data: ownerListingsData, isLoading: listingsDataLoading } = useOwnerListingsData();
  const { data: bidActivity, isLoading: bidActivityLoading } = useOwnerBidActivity();

  const activeTab = searchParams.get("tab") || "overview";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // Redirect if not authorized
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/owner-dashboard");
    }
  }, [user, authLoading, navigate]);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch properties count
        const { count: propertiesCount } = await supabase
          .from("properties")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id);

        // Fetch active listings count
        const { count: activeListingsCount } = await supabase
          .from("listings")
          .select("*", { count: "exact", head: true })
          .eq("owner_id", user.id)
          .eq("status", "active");

        // Fetch bookings for owner's listings
        const { data: ownerListings } = await supabase
          .from("listings")
          .select("id")
          .eq("owner_id", user.id);

        const listingIds = (ownerListings as { id: string }[] | null)?.map((l) => l.id) || [];

        let pendingBookingsCount = 0;
        let completedBookingsCount = 0;
        let totalEarnings = 0;

        if (listingIds.length > 0) {
          // Pending bookings
          const { count: pending } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .in("listing_id", listingIds)
            .eq("status", "pending");
          pendingBookingsCount = pending || 0;

          // Completed bookings and earnings
          const { data: completedBookings } = await supabase
            .from("bookings")
            .select("owner_payout")
            .in("listing_id", listingIds)
            .eq("status", "completed");

          const bookingsData = completedBookings as { owner_payout: number }[] | null;
          completedBookingsCount = bookingsData?.length || 0;
          totalEarnings = bookingsData?.reduce((sum, b) => sum + (b.owner_payout || 0), 0) || 0;
        }

        setStats({
          totalProperties: propertiesCount || 0,
          activeListings: activeListingsCount || 0,
          pendingBookings: pendingBookingsCount,
          totalEarnings,
          completedBookings: completedBookingsCount,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user has property owner or RAV team role
  const canAccess = isPropertyOwner() || isRavTeam();

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        {pendingRequest?.status === 'pending' ? (
          <>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Your request to become a property owner is under review.
              We'll notify you once it's been approved.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <Button variant="secondary" onClick={() => setUpgradeDialogOpen(true)}>
                <Clock className="mr-2 h-4 w-4" />
                View Request Status
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              You need the property owner role to access this dashboard.
              Request an upgrade to start listing your vacation properties.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
              <Button onClick={() => setUpgradeDialogOpen(true)}>
                Become a Property Owner
              </Button>
            </div>
          </>
        )}

        <RoleUpgradeDialog
          open={upgradeDialogOpen}
          onOpenChange={setUpgradeDialogOpen}
          requestedRole="property_owner"
          context="access the Owner Dashboard and list properties"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Owner Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your properties, listings, and bookings
                </p>
              </div>
            </div>
            <Button onClick={() => setActiveTab("properties")} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto w-full lg:w-auto lg:inline-grid lg:grid-cols-11">
            <TabsTrigger value="overview" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="properties" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Properties</span>
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Listings</span>
            </TabsTrigger>
            <TabsTrigger value="proposals" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Proposals</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="confirmations" className="gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Confirmations</span>
            </TabsTrigger>
            <TabsTrigger value="earnings" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="payouts" className="gap-2">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Payouts</span>
            </TabsTrigger>
            <TabsTrigger value="portfolio" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Portfolio</span>
            </TabsTrigger>
            <TabsTrigger value="verification" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Verification</span>
            </TabsTrigger>
            <TabsTrigger value="membership" className="gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Membership</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Draft publish banner */}
            {draft && draft.resortName && draft.checkInDate && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">You have a draft listing ready to publish</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {draft.resortName} · {draft.checkInDate} — {draft.checkOutDate} · ${draft.nightlyRate}/night
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={handlePublishDraft}
                      disabled={isPublishing}
                    >
                      {isPublishing ? "Publishing..." : "Publish Listing"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/list-property")}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    {showDiscardConfirm ? (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="destructive" onClick={handleDiscardDraft}>
                          Discard
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowDiscardConfirm(false)}>
                          Keep
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setShowDiscardConfirm(true)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section 1: Headline Stats */}
            <OwnerHeadlineStats stats={dashStats} isLoading={dashStatsLoading} />

            {/* Section 2: Earnings Timeline */}
            <EarningsTimeline
              data={earningsData}
              isLoading={earningsLoading}
              annualMaintenanceFees={dashStats?.annual_maintenance_fees ?? null}
            />

            {/* Section 3 + 5: Listings + Pricing in 2-column grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <MyListingsTable listings={ownerListingsData} isLoading={listingsDataLoading} />
              <PricingIntelligence listings={ownerListingsData} isLoading={listingsDataLoading} />
            </div>

            {/* Section 4 + 6: Bid Activity + Fee Tracker in 2-column grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BidActivityFeed events={bidActivity} isLoading={bidActivityLoading} />
              <MaintenanceFeeTracker
                annualFees={dashStats?.annual_maintenance_fees ?? null}
                totalEarnedYtd={dashStats?.total_earned_ytd ?? 0}
              />
            </div>

            {/* Owner Progress Tracker */}
            {!isLoading && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Your Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const progressSteps = [
                      {
                        label: "Account Approved",
                        done: true, // if they're on this page they're approved
                        cta: null,
                      },
                      {
                        label: "Property Added",
                        done: stats.totalProperties > 0,
                        cta: stats.totalProperties === 0 ? { label: "Add Property", action: () => navigate("/list-property") } : null,
                      },
                      {
                        label: "Listing Created",
                        done: (ownerListingsData?.length ?? 0) > 0,
                        cta: (ownerListingsData?.length ?? 0) === 0
                          ? { label: "Create Listing", action: () => setActiveTab("listings") }
                          : null,
                      },
                      {
                        label: "Listing Live",
                        done: stats.activeListings > 0,
                        cta: null,
                      },
                      {
                        label: "First Booking",
                        done: stats.completedBookings > 0 || stats.pendingBookings > 0,
                        cta: null,
                      },
                    ];

                    return (
                      <div className="flex items-center gap-0 overflow-x-auto pb-1">
                        {progressSteps.map((step, i) => (
                          <div key={i} className="flex items-center">
                            <div className="flex flex-col items-center min-w-[80px]">
                              <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                                  step.done
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {step.done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                              </div>
                              <span className="text-[11px] text-muted-foreground mt-1 text-center leading-tight">
                                {step.label}
                              </span>
                              {step.cta && (
                                <button
                                  className="text-[10px] text-primary hover:underline mt-0.5"
                                  onClick={step.cta.action}
                                >
                                  {step.cta.label}
                                </button>
                              )}
                            </div>
                            {i < progressSteps.length - 1 && (
                              <div
                                className={`w-8 h-0.5 mx-0.5 mt-[-20px] ${
                                  step.done ? "bg-primary" : "bg-muted"
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Properties Tab */}
          <TabsContent value="properties" className="mt-6">
            <OwnerProperties />
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-6">
            <OwnerListings />
          </TabsContent>

          {/* Proposals Tab */}
          <TabsContent value="proposals" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Your Proposals</h2>
              <p className="text-muted-foreground">
                Proposals you've submitted for traveler requests
              </p>
            </div>
            <OwnerProposals />
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="mt-6">
            <OwnerBookings />
          </TabsContent>

          {/* Confirmations Tab */}
          <TabsContent value="confirmations" className="mt-6">
            <OwnerBookingConfirmations />
          </TabsContent>

          {/* Earnings Tab */}
          <TabsContent value="earnings" className="mt-6">
            <OwnerEarnings />
          </TabsContent>

          {/* Payouts Tab */}
          <TabsContent value="payouts" className="mt-6">
            <OwnerPayouts />
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="mt-6">
            <PortfolioOverview />
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Owner Verification</h2>
              <p className="text-muted-foreground">
                Verify your ownership to unlock more features and build trust
              </p>
            </div>
            <OwnerVerification />
          </TabsContent>

          {/* Membership Tab */}
          <TabsContent value="membership" className="mt-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Membership Plan</h2>
              <p className="text-muted-foreground">
                Your current plan, commission rate, voice quota, and listing limits
              </p>
            </div>
            <MembershipPlans category="owner" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerDashboard;
