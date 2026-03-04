import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  DollarSign,
  Users,
  ArrowLeft,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Wallet,
  FileCheck,
  ShieldCheck as EscrowIcon,
  MessageSquareWarning,
  UserCheck,
  Settings,
  Crown,
  Network,
  Wrench,
  Mic,
  Scale,
  Receipt,
} from "lucide-react";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminProperties from "@/components/admin/AdminProperties";
import AdminListings from "@/components/admin/AdminListings";
import AdminBookings from "@/components/admin/AdminBookings";
import AdminFinancials from "@/components/admin/AdminFinancials";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminPayouts from "@/components/admin/AdminPayouts";
import AdminVerifications from "@/components/admin/AdminVerifications";
import AdminEscrow from "@/components/admin/AdminEscrow";
import AdminCheckinIssues from "@/components/admin/AdminCheckinIssues";
import { PendingApprovals } from "@/components/admin/PendingApprovals";
import { RoleUpgradeRequests } from "@/components/admin/RoleUpgradeRequests";
import { SystemSettings } from "@/components/admin/SystemSettings";
import { AdminMemberships } from "@/components/admin/AdminMemberships";
import { DevTools } from "@/components/admin/DevTools";
import { VoiceControls } from "@/components/admin/VoiceControls";
import AdminDisputes from "@/components/admin/AdminDisputes";
import AdminTaxReporting from "@/components/admin/AdminTaxReporting";

const IS_DEV = import.meta.env.VITE_SUPABASE_URL?.includes("oukbxqnlxnkainnligfz");

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isRavTeam, isRavAdmin, hasRole, isLoading: authLoading } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [roleRequestCount, setRoleRequestCount] = useState(0);

  const ADMIN_ONLY_TABS = ['financials', 'tax', 'payouts', 'memberships', 'settings', 'voice', 'dev-tools'];

  const requestedTab = searchParams.get("tab") || "overview";
  // Redirect staff away from admin-only tabs
  const activeTab = (!isRavAdmin() && ADMIN_ONLY_TABS.includes(requestedTab)) ? "overview" : requestedTab;
  const initialSearch = searchParams.get("search") || "";

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  /** Navigate to a tab with an optional pre-filled search term */
  const navigateToEntity = (tab: string, search?: string) => {
    const params: Record<string, string> = { tab };
    if (search) params.search = search;
    setSearchParams(params);
  };

  // Redirect if not authorized
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/admin");
    }
  }, [user, authLoading, navigate]);

  // Fetch pending approval count + role request count for badge
  useEffect(() => {
    const fetchCounts = async () => {
      const [{ count: userCount }, { count: roleCount }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("approval_status", "pending_approval"),
        supabase
          .from("role_upgrade_requests")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      setPendingCount(userCount || 0);
      setRoleRequestCount(roleCount || 0);
    };

    fetchCounts();

    // Refresh every 30 seconds
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

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

  // Check if user has RAV team role
  if (!isRavTeam()) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          This dashboard is only accessible to RAV team members.
        </p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
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
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold">RAV Admin Dashboard</h1>
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Platform management and oversight
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasRole("rav_owner") && (
                <Button variant="outline" size="sm" onClick={() => navigate("/user-journeys")}>
                  <Network className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">User Journeys</span>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => navigate("/documentation")}>
                <FileCheck className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Documentation</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap gap-1 h-auto w-full mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
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
            <TabsTrigger value="bookings" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="escrow" className="gap-2">
              <EscrowIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Escrow</span>
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-2">
              <MessageSquareWarning className="h-4 w-4" />
              <span className="hidden sm:inline">Issues</span>
            </TabsTrigger>
            <TabsTrigger value="disputes" className="gap-2">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Disputes</span>
            </TabsTrigger>
            <TabsTrigger value="verifications" className="gap-2">
              <FileCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Verifications</span>
            </TabsTrigger>
            {isRavAdmin() && (
              <TabsTrigger value="financials" className="gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Financials</span>
              </TabsTrigger>
            )}
            {isRavAdmin() && (
              <TabsTrigger value="tax" className="gap-2">
                <Receipt className="h-4 w-4" />
                <span className="hidden sm:inline">Tax & 1099</span>
              </TabsTrigger>
            )}
            {isRavAdmin() && (
              <TabsTrigger value="payouts" className="gap-2">
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Payouts</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="pending-approvals" className="gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Approvals</span>
              {(pendingCount + roleRequestCount) > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1 text-xs">
                  {pendingCount + roleRequestCount}
                </Badge>
              )}
            </TabsTrigger>
            {isRavAdmin() && (
              <TabsTrigger value="memberships" className="gap-2">
                <Crown className="h-4 w-4" />
                <span className="hidden sm:inline">Memberships</span>
              </TabsTrigger>
            )}
            {isRavAdmin() && (
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
            )}
            {isRavAdmin() && (
              <TabsTrigger value="voice" className="gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Voice</span>
              </TabsTrigger>
            )}
            {IS_DEV && isRavAdmin() && (
              <TabsTrigger value="dev-tools" className="gap-2">
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Dev Tools</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview">
            <AdminOverview />
          </TabsContent>

          <TabsContent value="properties">
            <AdminProperties
              initialSearch={activeTab === "properties" ? initialSearch : ""}
              onNavigateToEntity={navigateToEntity}
            />
          </TabsContent>

          <TabsContent value="listings">
            <AdminListings
              initialSearch={activeTab === "listings" ? initialSearch : ""}
              onNavigateToEntity={navigateToEntity}
            />
          </TabsContent>

          <TabsContent value="bookings">
            <AdminBookings
              initialSearch={activeTab === "bookings" ? initialSearch : ""}
              onNavigateToEntity={navigateToEntity}
            />
          </TabsContent>

          <TabsContent value="escrow">
            <AdminEscrow
              initialSearch={activeTab === "escrow" ? initialSearch : ""}
              onNavigateToEntity={navigateToEntity}
            />
          </TabsContent>

          <TabsContent value="issues">
            <AdminCheckinIssues />
          </TabsContent>

          <TabsContent value="disputes">
            <AdminDisputes
              initialSearch={activeTab === "disputes" ? initialSearch : ""}
              onNavigateToEntity={navigateToEntity}
            />
          </TabsContent>

          <TabsContent value="verifications">
            <AdminVerifications />
          </TabsContent>

          {isRavAdmin() && (
            <TabsContent value="financials">
              <AdminFinancials />
            </TabsContent>
          )}

          {isRavAdmin() && (
            <TabsContent value="tax">
              <AdminTaxReporting />
            </TabsContent>
          )}

          {isRavAdmin() && (
            <TabsContent value="payouts">
              <AdminPayouts
                onNavigateToEntity={navigateToEntity}
              />
            </TabsContent>
          )}

          <TabsContent value="users">
            <AdminUsers
              initialSearch={activeTab === "users" ? initialSearch : ""}
            />
          </TabsContent>

          <TabsContent value="pending-approvals">
            <div className="space-y-8">
              <PendingApprovals />
              <RoleUpgradeRequests />
            </div>
          </TabsContent>

          {isRavAdmin() && (
            <TabsContent value="memberships">
              <AdminMemberships />
            </TabsContent>
          )}

          {isRavAdmin() && (
            <TabsContent value="settings">
              <SystemSettings />
            </TabsContent>
          )}

          {isRavAdmin() && (
            <TabsContent value="voice">
              <VoiceControls />
            </TabsContent>
          )}

          {IS_DEV && isRavAdmin() && (
            <TabsContent value="dev-tools">
              <DevTools />
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
