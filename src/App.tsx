import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageLoadingFallback } from "@/components/PageLoadingFallback";
import { initPostHog, trackPageView } from "@/lib/posthog";
import { initGA4, trackGA4PageView } from "@/lib/analytics";
import { getCookieConsent } from "@/hooks/useCookieConsent";

// Eagerly loaded — SEO-critical landing pages and auth entry points
import Index from "./pages/Index";
import HowItWorksPage from "./pages/HowItWorksPage";
import Destinations from "./pages/Destinations";
import FAQ from "./pages/FAQ";
import RavTools from "./pages/RavTools";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";

// Lazy loaded — authenticated, role-gated, or deep-journey pages
const Rentals = lazy(() => import("./pages/Rentals"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const Checkout = lazy(() => import("./pages/Checkout"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));
const ListProperty = lazy(() => import("./pages/ListProperty"));
const OwnerDashboard = lazy(() => import("./pages/OwnerDashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const ExecutiveDashboard = lazy(() => import("./pages/ExecutiveDashboard"));
const BiddingMarketplace = lazy(() => import("./pages/BiddingMarketplace"));
const MyBidsDashboard = lazy(() => import("./pages/MyBidsDashboard"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const RenterDashboard = lazy(() => import("./pages/RenterDashboard"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));
const TravelerCheckin = lazy(() => import("./pages/TravelerCheckin"));
const Documentation = lazy(() => import("./pages/Documentation"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Contact = lazy(() => import("./pages/Contact"));
const MaintenanceFeeCalculator = lazy(() => import("./pages/MaintenanceFeeCalculator"));
const UserJourneys = lazy(() => import("./pages/UserJourneys"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const ApiDocs = lazy(() => import("./pages/ApiDocs"));
const Developers = lazy(() => import("./pages/Developers"));
const DestinationDetail = lazy(() => import("./pages/DestinationDetail"));
const CostComparator = lazy(() => import("./pages/CostComparator"));

const ResortQuiz = lazy(() => import("./pages/ResortQuiz"));
const BudgetPlanner = lazy(() => import("./pages/BudgetPlanner"));
const Notifications = lazy(() => import("./pages/Notifications"));
const NotificationPreferences = lazy(() => import("./pages/settings/NotificationPreferences"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));

import { PWAInstallBanner } from "@/components/PWAInstallBanner";
import { OfflineBanner } from "@/components/OfflineBanner";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";

const queryClient = new QueryClient();

const isDevEnvironment = import.meta.env.VITE_SUPABASE_URL?.includes('oukbxqnlxnkainnligfz');


/** Track page views on route changes for PostHog + GA4 analytics. */
function PageViewTracker() {
  const location = useLocation();

  // Initialize analytics only when cookie consent allows it
  useEffect(() => {
    const consent = getCookieConsent();
    if (consent?.analytics) {
      initGA4();
      initPostHog();
    }
  }, []);

  useEffect(() => {
    trackPageView(location.pathname);
    trackGA4PageView(location.pathname);
  }, [location.pathname]);
  return null;
}

/**
 * Handles auth events that require navigation (e.g., PASSWORD_RECOVERY).
 * Must be rendered inside BrowserRouter since AuthProvider is outside it.
 */
function AuthEventHandler() {
  const { isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isPasswordRecovery && location.pathname !== '/reset-password') {
      navigate('/reset-password', { replace: true });
    }
  }, [isPasswordRecovery, navigate, location.pathname, clearPasswordRecovery]);

  return null;
}

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'property_owner' | 'renter' }) {
  const { user, profile, isRavTeam, isPropertyOwner, hasRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // RAV team always has access
    if (isRavTeam()) return;

    // Redirect pending users to the pending page
    if (profile?.approval_status === "pending_approval") {
      navigate("/pending-approval");
      return;
    }

    // Check role-specific access
    if (requiredRole && !hasRole(requiredRole)) {
      navigate("/rentals");
    }
  }, [user, profile, isRavTeam, isPropertyOwner, hasRole, isLoading, navigate, location, requiredRole]);

  // Show nothing while checking auth (prevents flash of content)
  if (isLoading) return null;
  if (!user) return null;
  if (!isRavTeam() && profile?.approval_status !== "approved") return null;
  if (requiredRole && !isRavTeam() && !hasRole(requiredRole)) return null;

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        {isDevEnvironment && (
          <div className="fixed top-0 left-0 right-0 z-[60] pointer-events-none bg-yellow-400 text-yellow-900 text-center text-xs font-medium py-1">
            🚧 DEV ENVIRONMENT — dev.rent-a-vacation.com
          </div>
        )}
        <div className={isDevEnvironment ? 'pt-7' : ''}>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <PWAInstallBanner />
        <CookieConsentBanner />
        <BrowserRouter>
          <ErrorBoundary>
          <PageViewTracker />
          <AuthEventHandler />
          <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/property/:id" element={<ProtectedRoute><PropertyDetail /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:destinationSlug" element={<Suspense fallback={<PageLoadingFallback />}><DestinationDetail /></Suspense>} />
            <Route path="/destinations/:destinationSlug/:citySlug" element={<Suspense fallback={<PageLoadingFallback />}><DestinationDetail /></Suspense>} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/documentation" element={<Documentation />} />
            <Route path="/user-guide" element={<UserGuide />} />
            <Route path="/user-journeys" element={<UserJourneys />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/calculator" element={<MaintenanceFeeCalculator />} />
            <Route path="/tools" element={<RavTools />} />
            <Route path="/tools/cost-comparator" element={<Suspense fallback={<PageLoadingFallback />}><CostComparator /></Suspense>} />
            <Route path="/tools/yield-estimator" element={<Navigate to="/calculator" replace />} />
            <Route path="/tools/resort-quiz" element={<Suspense fallback={<PageLoadingFallback />}><ResortQuiz /></Suspense>} />
            <Route path="/tools/budget-planner" element={<Suspense fallback={<PageLoadingFallback />}><BudgetPlanner /></Suspense>} />

            {/* Protected routes — require approved account */}
            <Route path="/rentals" element={<ProtectedRoute><Rentals /></ProtectedRoute>} />
            <Route path="/list-property" element={<ProtectedRoute requiredRole="property_owner"><ListProperty /></ProtectedRoute>} />
            <Route path="/owner-dashboard" element={<ProtectedRoute requiredRole="property_owner"><OwnerDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/executive-dashboard" element={<ProtectedRoute><ExecutiveDashboard /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/booking-success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
            <Route path="/bidding" element={<ProtectedRoute><BiddingMarketplace /></ProtectedRoute>} />
            <Route path="/my-trips" element={<ProtectedRoute><RenterDashboard /></ProtectedRoute>} />
            <Route path="/my-bids" element={<Navigate to="/my-trips?tab=offers" replace />} />
            <Route path="/my-bookings" element={<Navigate to="/my-trips?tab=bookings" replace />} />
            <Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/settings/notifications" element={<ProtectedRoute><NotificationPreferences /></ProtectedRoute>} />
            <Route path="/checkin" element={<ProtectedRoute><TravelerCheckin /></ProtectedRoute>} />
            <Route path="/subscription-success" element={<ProtectedRoute><SubscriptionSuccess /></ProtectedRoute>} />

            {/* Developer & internal tools */}
            <Route path="/developers" element={<Developers />} />
            <Route path="/api-docs" element={<ApiDocs />} />

            {/* Legacy routes - redirect to proper sections */}
            <Route path="/deals" element={<Navigate to="/rentals" replace />} />
            <Route path="/owner-resources" element={<Navigate to="/how-it-works#for-owners" replace />} />
            <Route path="/pricing" element={<Navigate to="/how-it-works#pricing" replace />} />
            <Route path="/success-stories" element={<Navigate to="/how-it-works#success-stories" replace />} />
            <Route path="/owner-faq" element={<Navigate to="/faq" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
