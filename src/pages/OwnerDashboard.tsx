import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  ChevronDown,
  Share2,
  ChevronRight,
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
import { SubscriptionManagement } from "@/components/SubscriptionManagement";
import { ReferralDashboard } from "@/components/owner/ReferralDashboard";
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
import { usePageMeta } from "@/hooks/usePageMeta";

// Backwards-compatible redirect map: old tab values → new ones
const TAB_REDIRECTS: Record<string, string> = {
  overview: "dashboard",
  properties: "my-listings",
  listings: "my-listings",
  proposals: "my-listings",
  bookings: "bookings-earnings",
  confirmations: "bookings-earnings",
  earnings: "bookings-earnings",
  payouts: "bookings-earnings",
  portfolio: "dashboard",
  verification: "account",
  membership: "account",
};

const VALID_TABS = new Set(["dashboard", "my-listings", "bookings-earnings", "account"]);

interface DashboardStats {
  totalProperties: number;
  activeListings: number;
  pendingBookings: number;
  totalEarnings: number;
  completedBookings: number;
}

const OwnerDashboard = () => {
  usePageMeta("RAV Edge Dashboard", 'Manage your timeshare listings, bookings, earnings, and owner account.');

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

  const rawTab = searchParams.get("tab") || "dashboard";
  const activeTab = VALID_TABS.has(rawTab) ? rawTab : (TAB_REDIRECTS[rawTab] || "dashboard");

  const setActiveTab = useCallback((tab: string) => {
    const resolved = VALID_TABS.has(tab) ? tab : (TAB_REDIRECTS[tab] || "dashboard");
    setSearchParams({ tab: resolved });
  }, [setSearchParams]);

  // Redirect old tab URLs
  useEffect(() => {
    if (rawTab !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true });
    }
  }, [rawTab, activeTab, setSearchParams]);

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
      <Header />
      {/* Page Header */}
      <header className="border-b bg-card mt-16 md:mt-20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="flex-shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">RAV Edge</h1>
                <p className="text-sm text-muted-foreground">
                  Your command center — manage listings, bookings, earnings, and more
                </p>
              </div>
            </div>
            <Button onClick={() => setActiveTab("my-listings")} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Property
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="dashboard" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="my-listings" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">My Listings</span>
            </TabsTrigger>
            <TabsTrigger value="bookings-earnings" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings & Earnings</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
          </TabsList>

          {/* ========== Dashboard Tab (Overview + Portfolio) ========== */}
          <TabsContent value="dashboard" className="mt-6 space-y-6">
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

            {/* Messages Quick Access */}
            <Link
              to="/messages"
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Messages</p>
                  <p className="text-xs text-muted-foreground">View conversations with travelers</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>

            {/* Headline Stats */}
            <OwnerHeadlineStats stats={dashStats} isLoading={dashStatsLoading} />

            {/* Earnings Timeline */}
            <EarningsTimeline
              data={earningsData}
              isLoading={earningsLoading}
              annualMaintenanceFees={dashStats?.annual_maintenance_fees ?? null}
            />

            {/* Listings + Pricing */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <MyListingsTable listings={ownerListingsData} isLoading={listingsDataLoading} />
              <PricingIntelligence listings={ownerListingsData} isLoading={listingsDataLoading} />
            </div>

            {/* Bid Activity + Fee Tracker */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <BidActivityFeed events={bidActivity} isLoading={bidActivityLoading} />
              <MaintenanceFeeTracker
                annualFees={dashStats?.annual_maintenance_fees ?? null}
                totalEarnedYtd={dashStats?.total_earned_ytd ?? 0}
              />
            </div>

            {/* Portfolio */}
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Portfolio
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <PortfolioOverview />
              </CollapsibleContent>
            </Collapsible>

            {/* Progress Tracker */}
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
                        done: true,
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
                          ? { label: "Create Listing", action: () => setActiveTab("my-listings") }
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

          {/* ========== My Listings Tab (Properties + Listings + Proposals) ========== */}
          <TabsContent value="my-listings" className="mt-6 space-y-8">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Properties
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <OwnerProperties />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Listings
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <OwnerListings />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Proposals
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <OwnerProposals />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* ========== Bookings & Earnings Tab ========== */}
          <TabsContent value="bookings-earnings" className="mt-6 space-y-8">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Bookings
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <OwnerBookings />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Resort Confirmations
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <OwnerBookingConfirmations />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Earnings
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <OwnerEarnings />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Payouts
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <OwnerPayouts />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          {/* ========== Account Tab (Verification + Membership) ========== */}
          <TabsContent value="account" className="mt-6 space-y-8">
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Verification
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <OwnerVerification />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Membership Plan
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SubscriptionManagement />
                <MembershipPlans category="owner" />
              </CollapsibleContent>
            </Collapsible>

            <Collapsible>
              <CollapsibleTrigger className="flex items-center justify-between w-full py-3 text-left border-t pt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Referral Program
                </h3>
                <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <ReferralDashboard />
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerDashboard;
