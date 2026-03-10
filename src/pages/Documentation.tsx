import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  Home,
  Users,
  Building2,
  Gavel,
  CreditCard,
  Shield,
  FileCheck,
  Mail,
  Settings,
  Download,
  Menu,
  X,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  UserCheck,
  MapPin,
  Calendar,
  Briefcase,
  ArrowLeft,
  AlertCircle,
  Crown,
  MessageSquare,
  TrendingUp,
  Calculator,
  LayoutDashboard,
  Compass,
  BarChart3,
  Database,
  Wrench,
  Scale,
  Trash2,
  Link2,
  Activity,
  Wifi,
  Star,
  Bookmark,
  CalendarCheck,
  FileCode,
  CalendarDays,
  Share2,
  Zap,
} from "lucide-react";

const Documentation = () => {
  const navigate = useNavigate();
  const { user, isRavTeam, isLoading: authLoading } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  // Handle print - show all sections during print
  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const sections = [
    { id: "overview", label: "Platform Overview", icon: Home },
    { id: "user-roles", label: "User Roles & Access", icon: Users },
    { id: "property-management", label: "Property Management", icon: Building2 },
    { id: "bidding-system", label: "Name Your Price & Flexible Pricing", icon: Gavel },
    { id: "booking-flow", label: "Booking Flow", icon: Calendar },
    { id: "payments", label: "Payments & Payouts", icon: CreditCard },
    { id: "trust-safety", label: "Trust & Safety", icon: Shield },
    { id: "owner-verification", label: "Owner Verification", icon: UserCheck },
    { id: "confirmations", label: "Booking Confirmations", icon: FileCheck },
    { id: "cancellations", label: "Cancellation Policies", icon: AlertTriangle },
    { id: "notifications", label: "Email Notifications", icon: Mail },
    { id: "admin", label: "Admin Dashboard", icon: Settings },
    { id: "rav-owner-guide", label: "RAV Owner How-To Guide", icon: Briefcase },
    { id: "membership-tiers", label: "Membership Tiers", icon: Crown },
    { id: "ai-assistants", label: "AI Assistants (RAVIO)", icon: MessageSquare },
    { id: "fair-value", label: "Fair Value Score", icon: TrendingUp },
    { id: "fee-calculator", label: "Maintenance Fee Calculator", icon: Calculator },
    { id: "owner-dashboard", label: "Owner Dashboard", icon: LayoutDashboard },
    { id: "travel-enhancements", label: "Travel Request Automation", icon: Compass },
    { id: "executive-dashboard", label: "Executive Dashboard", icon: BarChart3 },
    { id: "seed-data", label: "Seed Data System", icon: Database },
    { id: "per-night-pricing", label: "Per-Night Pricing", icon: DollarSign },
    { id: "platform-improvements", label: "Platform Improvements", icon: Wrench },
    { id: "disputes", label: "Disputes & Resolution", icon: Scale },
    { id: "gdpr", label: "GDPR & Data Deletion", icon: Trash2 },
    { id: "stripe-connect", label: "Stripe Connect", icon: Link2 },
    { id: "ga4", label: "Google Analytics (GA4)", icon: Activity },
    { id: "realtime", label: "Realtime Subscriptions", icon: Wifi },
    { id: "reviews-system", label: "Reviews System", icon: Star },
    { id: "messaging", label: "Messaging System", icon: MessageSquare },
    { id: "saved-searches-system", label: "Saved Searches & Price Tracking", icon: Bookmark },
    { id: "pre-booking-inquiries", label: "Pre-Booking Inquiries", icon: Mail },
    { id: "idle-listing-alerts", label: "Idle Listing Alerts", icon: CalendarCheck },
    { id: "openapi-swagger", label: "OpenAPI / Swagger", icon: FileCode },
    { id: "ical-export", label: "iCal Calendar Export", icon: CalendarDays },
    { id: "dynamic-pricing", label: "Dynamic Pricing", icon: Zap },
    { id: "referral-program", label: "Referral Program", icon: Share2 },
    { id: "public-api", label: "Public API & API Keys", icon: Link2 },
  ];

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          Please log in to access the Admin Manual.
        </p>
        <Button variant="outline" onClick={() => navigate("/login?redirect=/documentation")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go to Login
        </Button>
      </div>
    );
  }

  // Access denied if not RAV team
  if (!isRavTeam()) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          This documentation is only accessible to RAV team members (Owner, Admin, or Staff).
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <Button onClick={() => navigate("/user-guide")}>
            View User Guide
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 print:hidden">
        <div className="flex h-16 items-center px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <img src="/rav-logo.svg" alt="RAV Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Rent-A-Vacation</h1>
              <p className="text-xs text-muted-foreground">Admin Manual v1.0</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button onClick={() => navigate('/user-guide')} variant="ghost" size="sm">
              User Guide
            </Button>
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className={`
          fixed md:sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-card z-40
          transition-transform duration-200 print:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <ScrollArea className="h-full py-4">
            <nav className="space-y-1 px-3">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                      ${activeSection === section.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                    `}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{section.label}</span>
                    {activeSection === section.id && (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 p-6 md:p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            
            {/* Print Cover Page */}
            {isPrinting && (
              <section className="print:break-after-page hidden print:block">
                <div className="min-h-[90vh] flex flex-col items-center justify-center text-center">
                  <img src="/rav-logo.svg" alt="RAV Logo" className="h-24 w-24 mb-8" />
                  <h1 className="text-5xl font-bold text-foreground mb-4">Rent-A-Vacation</h1>
                  <p className="text-2xl text-primary font-medium mb-2">Administrator Manual</p>
                  <p className="text-xl text-muted-foreground mb-8">Name Your Price. Book Your Paradise.</p>
                  <div className="bg-muted/50 rounded-xl p-6 max-w-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Version:</strong> 1.0<br />
                      <strong>Last Updated:</strong> {currentDate}<br />
                      <strong>Confidential:</strong> For RAV Administrators Only
                    </p>
                  </div>
                  <div className="mt-auto pt-16">
                    <p className="text-sm text-muted-foreground">A Techsilon Group Company</p>
                    <p className="text-xs text-muted-foreground mt-1">Jacksonville, FL • rentavacation.com</p>
                  </div>
                </div>
              </section>
            )}

            {/* Print Table of Contents */}
            {isPrinting && (
              <section className="print:break-after-page hidden print:block">
                <h2 className="text-3xl font-bold text-foreground mb-8">Table of Contents</h2>
                <div className="space-y-3">
                  {sections.map((section, index) => {
                    const Icon = section.icon;
                    return (
                      <div key={section.id} className="flex items-center gap-4 py-2 border-b border-dashed">
                        <span className="text-lg font-medium text-primary w-8">{index + 1}.</span>
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <span className="text-lg">{section.label}</span>
                        <span className="flex-1 border-b border-dotted border-muted-foreground/30" />
                      </div>
                    );
                  })}
                </div>
                <div className="mt-12 bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-3">About This Document</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This Administrator Manual provides comprehensive documentation of the Rent-A-Vacation platform, 
                    including all features, workflows, and operational procedures. It is intended for RAV Owners and 
                    Administrators who manage the marketplace and oversee transactions between property owners and renters.
                  </p>
                </div>
              </section>
            )}

            {/* Overview Section */}
            {(isPrinting || activeSection === "overview") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Platform Overview</h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Rent-A-Vacation is a premier vacation rental marketplace connecting vacation club and timeshare owners 
                    directly with renters seeking authentic resort experiences at competitive prices.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-8 border">
                  <h2 className="text-2xl font-semibold mb-4">Name Your Price. Book Your Paradise.</h2>
                  <p className="text-muted-foreground">
                    Unlike traditional vacation rental platforms, Rent-A-Vacation empowers both owners and renters 
                    through innovative price discovery mechanisms including reverse auctions and competitive offers.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-card rounded-xl p-6 border shadow-sm">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Gavel className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Name Your Price</h3>
                    <p className="text-sm text-muted-foreground">
                      Renters submit travel requests; owners compete with proposals. Or owners open listings for flexible pricing with offers.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border shadow-sm">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Protected Transactions</h3>
                    <p className="text-sm text-muted-foreground">
                      Escrow holds funds until 5 days post-checkout. Owner verification and check-in confirmations ensure trust.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border shadow-sm">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Premium Resorts</h3>
                    <p className="text-sm text-muted-foreground">
                      Access to major vacation club brands including Hilton, Marriott, Disney, Wyndham, and more.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Key Platform Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">15%</p>
                      <p className="text-sm text-muted-foreground">Platform Commission</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">48h</p>
                      <p className="text-sm text-muted-foreground">Confirmation Deadline</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">3%</p>
                      <p className="text-sm text-muted-foreground">Guarantee Fund</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">5 days</p>
                      <p className="text-sm text-muted-foreground">Post-Checkout Escrow</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* User Roles Section */}
            {(isPrinting || activeSection === "user-roles") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">User Roles & Access</h1>
                  <p className="text-xl text-muted-foreground">
                    Rent-A-Vacation uses Role-Based Access Control (RBAC) to manage permissions across the platform.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">👑</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">RAV Owner</h3>
                        <p className="text-sm text-muted-foreground mb-3">Platform superuser with complete system access</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Full administrative dashboard access</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> User role management</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Financial reports and payout processing</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Listing approval/rejection</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🛡️</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">RAV Admin</h3>
                        <p className="text-sm text-muted-foreground mb-3">Platform administrator with operational access</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Administrative dashboard access</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Listing management and approval</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Booking oversight</li>
                          <li className="flex items-center gap-2"><X className="h-4 w-4 text-red-500" /> Cannot manage user roles</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">RAV Staff</h3>
                        <p className="text-sm text-muted-foreground mb-3">Support staff with view and limited management access</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> View listings and bookings</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Customer support functions</li>
                          <li className="flex items-center gap-2"><X className="h-4 w-4 text-red-500" /> No financial access</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">✓</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Property Owner</h3>
                        <p className="text-sm text-muted-foreground mb-3">Vacation club/timeshare owners listing their properties</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Owner Dashboard access</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Create and manage own properties</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Create listings and manage offers</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> View earnings and payout history</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Submit booking confirmations</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🧳</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Renter</h3>
                        <p className="text-sm text-muted-foreground mb-3">Default role for users who sign up as "I'm a Renter"</p>
                        <ul className="text-sm space-y-1">
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Browse and search listings</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Book properties via Stripe</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Submit travel requests</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Make offers on open listings</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Confirm check-in on arrival</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Request upgrade to Property Owner role</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Signup Role Selection</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    During signup, users choose between "I'm a Renter" and "I'm an Owner". This selection determines their initial role:
                  </p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-1">I'm a Renter</h4>
                      <p className="text-xs text-muted-foreground">Assigned the <code className="bg-muted px-1 rounded">renter</code> role. Can browse, book, make offers, and submit travel requests.</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-1">I'm an Owner</h4>
                      <p className="text-xs text-muted-foreground">Assigned the <code className="bg-muted px-1 rounded">property_owner</code> role. Gets immediate access to the Owner Dashboard.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Role Upgrade Requests</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Users can request additional roles without re-registering. The platform supports dual-role users (e.g., both renter and property owner).
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <h4 className="font-medium mb-2">Upgrade Flow</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>A renter visits the Owner Dashboard or reaches Step 3 of List Property</li>
                      <li>Instead of a dead-end, they see a "Become a Property Owner" button</li>
                      <li>They submit a role upgrade request with an optional reason</li>
                      <li>Admin reviews in <strong>/admin</strong> → <strong>Pending Approvals</strong> tab</li>
                      <li>On approval, the <code className="bg-muted px-1 rounded">property_owner</code> role is added and an email is sent</li>
                      <li>The user can now access the Owner Dashboard without re-login</li>
                    </ol>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Auto-approve:</strong> Admins can enable auto-approval in <strong>Settings</strong> → "Auto-approve role upgrade requests".
                      When enabled, role upgrades are granted instantly without admin review.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Property Management Section */}
            {(isPrinting || activeSection === "property-management") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Property Management</h1>
                  <p className="text-xl text-muted-foreground">
                    Owners register their vacation club properties and create rental listings for specific date ranges.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Supported Vacation Club Brands</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {["Hilton Grand Vacations", "Marriott Vacation Club", "Disney Vacation Club", "Wyndham Destinations",
                      "Hyatt Residence Club", "Bluegreen Vacations", "Holiday Inn Club Vacations", "WorldMark by Wyndham", "Other / Independent Resort"].map((brand) => (
                      <div key={brand} className="bg-muted/50 rounded-lg p-3 text-center text-sm">
                        {brand}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Property Workflow</h3>
                  
                  <div className="relative">
                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                    
                    <div className="relative flex gap-4 pb-8">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0 z-10">1</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Register Property</h4>
                        <p className="text-sm text-muted-foreground">Owner adds property details: resort name, location, unit type, amenities, and photos.</p>
                      </div>
                    </div>

                    <div className="relative flex gap-4 pb-8">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0 z-10">2</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Verification (Optional)</h4>
                        <p className="text-sm text-muted-foreground">Upload ownership documents for enhanced trust level and verification badge.</p>
                      </div>
                    </div>

                    <div className="relative flex gap-4 pb-8">
                      <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0 z-10">3</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Create Listing</h4>
                        <p className="text-sm text-muted-foreground">Specify available dates, nightly rate, and cancellation policy for a rental period.</p>
                      </div>
                    </div>

                    <div className="relative flex gap-4 pb-8">
                      <div className="h-12 w-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold flex-shrink-0 z-10">4</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Pending Approval</h4>
                        <p className="text-sm text-muted-foreground">New listings default to 'pending_approval' status for admin review.</p>
                      </div>
                    </div>

                    <div className="relative flex gap-4">
                      <div className="h-12 w-12 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0 z-10">5</div>
                      <div className="pt-2">
                        <h4 className="font-semibold">Published</h4>
                        <p className="text-sm text-muted-foreground">Once approved, listing appears on the Name Your Price marketplace and can receive bookings or offers.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Commission Structure</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Default Platform Commission</h4>
                      <p className="text-3xl font-bold text-primary">15%</p>
                      <p className="text-sm text-muted-foreground mt-1">Applied to the total booking amount</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Owner Payout</h4>
                      <p className="text-3xl font-bold text-primary">85%</p>
                      <p className="text-sm text-muted-foreground mt-1">Released 5 days after checkout</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Bidding System Section */}
            {(isPrinting || activeSection === "bidding-system") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Name Your Price & Flexible Pricing</h1>
                  <p className="text-xl text-muted-foreground">
                    Inspired by Priceline's "Name Your Own Price" model, our Name Your Price marketplace enables dynamic price discovery.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Gavel className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Owner-Led Flexible Pricing</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Owners open listings for competitive offers with defined end dates and optional reserve prices.
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Set offer end date and reserve price</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Renters submit competing offers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Owner selects winning offer</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-lg">Travel Requests</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Renters post where they want to go, when, and their budget. Owners respond with proposals.
                    </p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Specify destination, dates, budget</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Receive proposals from multiple owners</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>Accept best matching proposal</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Offer Workflow</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-left py-2 font-medium">Description</th>
                          <th className="text-left py-2 font-medium">Actions Available</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">open</span></td>
                          <td>Actively accepting offers/proposals</td>
                          <td>Submit offer, withdraw offer</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">pending</span></td>
                          <td>Offer submitted, awaiting response</td>
                          <td>Accept, reject, counter</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">accepted</span></td>
                          <td>Offer/proposal accepted</td>
                          <td>Proceed to checkout</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">rejected</span></td>
                          <td>Offer/proposal declined</td>
                          <td>Submit new offer</td>
                        </tr>
                        <tr>
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">expired</span></td>
                          <td>Offer period ended</td>
                          <td>None</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Booking Flow Section */}
            {(isPrinting || activeSection === "booking-flow") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Booking Flow</h1>
                  <p className="text-xl text-muted-foreground">
                    Complete end-to-end booking process from discovery to checkout confirmation.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-6">Standard Booking Journey</h3>
                  <div className="grid md:grid-cols-5 gap-4">
                    {[
                      { step: 1, title: "Browse", desc: "Search listings by location, dates, amenities" },
                      { step: 2, title: "Select", desc: "View property details and availability" },
                      { step: 3, title: "Book", desc: "Proceed to Stripe Checkout" },
                      { step: 4, title: "Accept", desc: "Owner accepts within timer, then submits resort confirmation" },
                      { step: 5, title: "Stay", desc: "Check-in and enjoy vacation" },
                    ].map((item) => (
                      <div key={item.step} className="text-center">
                        <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mx-auto mb-3">
                          {item.step}
                        </div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Payment Processing
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Stripe Checkout</strong> - Secure payment collection</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Escrow Hold</strong> - Funds held until post-checkout</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Auto-confirmation</strong> - Booking recorded on success</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Webhook Safety Net</strong> - Server-side verification catches payments even if browser closes</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileCheck className="h-5 w-5 text-primary" />
                      Post-Booking Requirements
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
                        <span><strong>48h Deadline</strong> - Owner must submit resort confirmation</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Clock className="h-4 w-4 text-amber-500 mt-0.5" />
                        <span><strong>24h Check-in</strong> - Renter confirms arrival</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <DollarSign className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>5-day Release</strong> - Payout after checkout</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-6 border border-amber-200 dark:border-amber-900">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-amber-900 dark:text-amber-100">Important: Confirmation Deadlines</h3>
                      <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                        If the owner fails to submit their resort confirmation number within 48 hours, 
                        the booking may be automatically cancelled and the renter refunded in full.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Payments Section */}
            {(isPrinting || activeSection === "payments") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Payments & Payouts</h1>
                  <p className="text-xl text-muted-foreground">
                    Secure payment processing with escrow protection and transparent payout tracking.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4">Payment Collection</h3>
                    <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                      <CreditCard className="h-6 w-6 text-primary" />
                      <span className="font-medium">Powered by Stripe</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>• Secure credit/debit card processing</li>
                      <li>• PCI DSS compliant</li>
                      <li>• Support for major payment methods</li>
                      <li>• Automatic fraud detection</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4">Escrow Protection</h3>
                    <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                      <Shield className="h-6 w-6 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-300">Funds Protected</span>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li>• Funds held during entire stay</li>
                      <li>• Released 5 days after checkout</li>
                      <li>• Automatic refund on issues</li>
                      <li>• Admin dispute resolution</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Payout Lifecycle</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-left py-2 font-medium">Description</th>
                          <th className="text-left py-2 font-medium">Timeline</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700 text-xs">Pending</span></td>
                          <td>Awaiting guest checkout</td>
                          <td>During stay</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs">Processing</span></td>
                          <td>Stay completed, preparing payout</td>
                          <td>Checkout + 1-5 days</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">Paid</span></td>
                          <td>Payout sent to owner</td>
                          <td>Checkout + 5 days</td>
                        </tr>
                        <tr>
                          <td className="py-3"><span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">Failed</span></td>
                          <td>Payout attempt failed</td>
                          <td>Requires admin action</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Payout Methods</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-card rounded-lg p-4">
                      <h4 className="font-medium mb-2">Zelle</h4>
                      <p className="text-sm text-muted-foreground">Instant bank transfers (US only)</p>
                    </div>
                    <div className="bg-card rounded-lg p-4">
                      <h4 className="font-medium mb-2">Bank Transfer (ACH)</h4>
                      <p className="text-sm text-muted-foreground">Standard 1-3 business days</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    * Payout processing is currently a manual administrative process
                  </p>
                </div>
              </section>
            )}

            {/* Trust & Safety Section */}
            {(isPrinting || activeSection === "trust-safety") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Trust & Safety</h1>
                  <p className="text-xl text-muted-foreground">
                    Multi-layered protection framework ensuring secure transactions for all users.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-primary" />
                      Owner Trust Levels
                    </h3>
                    <div className="space-y-3">
                      {[
                        { level: "New", desc: "Recently joined, building history", color: "bg-gray-100 text-gray-700" },
                        { level: "Verified", desc: "Identity & ownership confirmed", color: "bg-blue-100 text-blue-700" },
                        { level: "Trusted", desc: "Multiple successful bookings", color: "bg-green-100 text-green-700" },
                        { level: "Premium", desc: "Top-rated, exceptional track record", color: "bg-amber-100 text-amber-700" },
                      ].map((item) => (
                        <div key={item.level} className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color}`}>{item.level}</span>
                          <span className="text-sm text-muted-foreground">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Protection Mechanisms
                    </h3>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Escrow</strong> - Funds held until post-checkout</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>48h Confirmation</strong> - Owner deadline for resort number</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>Check-in Verification</strong> - Renter confirms arrival</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span><strong>3% Guarantee Fund</strong> - Fraud protection reserve</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Issue Resolution Process</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    {[
                      { step: 1, title: "Report", desc: "Renter reports issue at check-in" },
                      { step: 2, title: "Review", desc: "Admin reviews with evidence" },
                      { step: 3, title: "Resolve", desc: "Mediation or refund decision" },
                      { step: 4, title: "Close", desc: "Resolution and payout adjustment" },
                    ].map((item) => (
                      <div key={item.step} className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-primary mb-2">{item.step}</div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-6 border border-red-200 dark:border-red-900">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-3">Common Check-in Issues</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { issue: "No Access", desc: "Unable to access unit as booked" },
                      { issue: "Wrong Unit", desc: "Assigned different unit than reserved" },
                      { issue: "Safety Concern", desc: "Unsafe conditions or cleanliness" },
                    ].map((item) => (
                      <div key={item.issue} className="bg-white dark:bg-red-950 rounded-lg p-3">
                        <h4 className="font-medium text-red-700 dark:text-red-300">{item.issue}</h4>
                        <p className="text-xs text-red-600 dark:text-red-400">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Owner Verification Section */}
            {(isPrinting || activeSection === "owner-verification") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Owner Verification</h1>
                  <p className="text-xl text-muted-foreground">
                    KYC and document verification process for property owners.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Verification Steps</h3>
                  <div className="space-y-4">
                    {[
                      { step: 1, title: "Identity Verification", desc: "Upload government-issued ID (driver's license, passport)", status: "Required" },
                      { step: 2, title: "Ownership Documentation", desc: "Timeshare deed, vacation club contract, or membership proof", status: "Required" },
                      { step: 3, title: "Contact Verification", desc: "Phone number and email confirmation", status: "Required" },
                      { step: 4, title: "Address Verification", desc: "Utility bill or bank statement with matching address", status: "Optional" },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                          {item.step}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{item.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${item.status === 'Required' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-6 border border-green-200 dark:border-green-900">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">Verified Owner Benefits</h3>
                    <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Verified badge on listings</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Higher search ranking</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Increased renter trust</li>
                      <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Priority support</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-3">Document Storage</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      All verification documents are stored securely in private Supabase storage buckets 
                      with encrypted access controls.
                    </p>
                    <ul className="text-sm space-y-2">
                      <li>• Documents visible only to RAV admins</li>
                      <li>• 256-bit AES encryption at rest</li>
                      <li>• Automatic expiration reminders</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Booking Confirmations Section */}
            {(isPrinting || activeSection === "confirmations") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Booking Confirmations</h1>
                  <p className="text-xl text-muted-foreground">
                    Three-stage confirmation system ensuring booking validity and successful stays.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Owner Acceptance</h3>
                        <p className="text-xs text-muted-foreground">Configurable timer (default 60 min)</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      After payment, the owner must confirm they can fulfill the booking within a configurable time window. They can request up to 2 time extensions (30 min each).
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 space-y-1">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Confirm:</strong> Proceeds to resort confirmation step
                      </p>
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Decline / Timeout:</strong> Auto-cancel, full refund to renter
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                        <FileCheck className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Resort Confirmation</h3>
                        <p className="text-xs text-muted-foreground">48 hours after booking</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Owner must submit their resort confirmation number to validate the booking with the property.
                    </p>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        <strong>Failure to confirm:</strong> Booking cancelled, full refund to renter
                      </p>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Renter Check-in</h3>
                        <p className="text-xs text-muted-foreground">24 hours after arrival</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Renter confirms successful check-in or reports any issues encountered at the property.
                    </p>
                    <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3">
                      <p className="text-xs text-green-800 dark:text-green-200">
                        <strong>Successful check-in:</strong> Escrow countdown begins for payout release
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Automated Reminder System</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The platform automatically sends email reminders to ensure timely confirmations.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Reminder</th>
                          <th className="text-left py-2 font-medium">Recipient</th>
                          <th className="text-left py-2 font-medium">Timing</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3">New Booking Notification</td>
                          <td>Owner</td>
                          <td>Immediately after booking</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">Standard Reminder</td>
                          <td>Owner</td>
                          <td>6-12 hours before deadline</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3">Urgent Reminder</td>
                          <td>Owner</td>
                          <td>&lt; 6 hours before deadline</td>
                        </tr>
                        <tr>
                          <td className="py-3">Check-in Reminder</td>
                          <td>Renter</td>
                          <td>Around check-in time</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* Cancellation Policies Section */}
            {(isPrinting || activeSection === "cancellations") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Cancellation Policies</h1>
                  <p className="text-xl text-muted-foreground">
                    Four platform-defined cancellation tiers with automated refund calculations.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    {
                      name: "Flexible",
                      color: "bg-green-100 border-green-300 dark:bg-green-950/30 dark:border-green-800",
                      textColor: "text-green-800 dark:text-green-200",
                      rules: [
                        { timing: "7+ days before check-in", refund: "100% refund" },
                        { timing: "3-7 days before check-in", refund: "50% refund" },
                        { timing: "< 3 days before check-in", refund: "No refund" },
                      ]
                    },
                    {
                      name: "Moderate",
                      color: "bg-blue-100 border-blue-300 dark:bg-blue-950/30 dark:border-blue-800",
                      textColor: "text-blue-800 dark:text-blue-200",
                      rules: [
                        { timing: "14+ days before check-in", refund: "100% refund" },
                        { timing: "7-14 days before check-in", refund: "50% refund" },
                        { timing: "< 7 days before check-in", refund: "No refund" },
                      ]
                    },
                    {
                      name: "Strict",
                      color: "bg-amber-100 border-amber-300 dark:bg-amber-950/30 dark:border-amber-800",
                      textColor: "text-amber-800 dark:text-amber-200",
                      rules: [
                        { timing: "30+ days before check-in", refund: "100% refund" },
                        { timing: "14-30 days before check-in", refund: "50% refund" },
                        { timing: "< 14 days before check-in", refund: "No refund" },
                      ]
                    },
                    {
                      name: "Super Strict",
                      color: "bg-red-100 border-red-300 dark:bg-red-950/30 dark:border-red-800",
                      textColor: "text-red-800 dark:text-red-200",
                      rules: [
                        { timing: "60+ days before check-in", refund: "100% refund" },
                        { timing: "30-60 days before check-in", refund: "50% refund" },
                        { timing: "< 30 days before check-in", refund: "No refund" },
                      ]
                    },
                  ].map((policy) => (
                    <div key={policy.name} className={`rounded-xl p-6 border ${policy.color}`}>
                      <h3 className={`font-semibold text-lg mb-4 ${policy.textColor}`}>{policy.name}</h3>
                      <div className="grid md:grid-cols-3 gap-4">
                        {policy.rules.map((rule, idx) => (
                          <div key={idx} className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                            <p className={`text-sm font-medium ${policy.textColor}`}>{rule.timing}</p>
                            <p className={`text-lg font-bold ${policy.textColor}`}>{rule.refund}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Special Circumstances</h3>
                  <p className="text-sm text-muted-foreground">
                    In cases where the standard policy doesn't apply (e.g., owner-initiated cancellation, property issues, 
                    natural disasters), renters and owners can negotiate directly with admin mediation available.
                  </p>
                </div>
              </section>
            )}

            {/* Notifications Section */}
            {(isPrinting || activeSection === "notifications") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Email Notifications</h1>
                  <p className="text-xl text-muted-foreground">
                    Automated email delivery via Resend for all transactional communications.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Email Types</h3>
                  <div className="space-y-3">
                    {[
                      { type: "Welcome Email", recipient: "New Users", trigger: "On signup" },
                      { type: "Account Approved", recipient: "New Users", trigger: "On admin approval" },
                      { type: "Account Rejected", recipient: "New Users", trigger: "On admin rejection" },
                      { type: "Role Upgrade Approved", recipient: "Users", trigger: "On role upgrade approval" },
                      { type: "Role Upgrade Rejected", recipient: "Users", trigger: "On role upgrade rejection" },
                      { type: "New Booking Alert", recipient: "Owner", trigger: "When renter books" },
                      { type: "Booking Confirmation", recipient: "Renter", trigger: "After payment success" },
                      { type: "Confirmation Reminder", recipient: "Owner", trigger: "6-12h before deadline" },
                      { type: "Urgent Reminder", recipient: "Owner", trigger: "< 6h before deadline" },
                      { type: "Owner Confirmation Request", recipient: "Owner", trigger: "After payment, timer starts" },
                      { type: "Owner Extension Notification", recipient: "Renter", trigger: "Owner requests more time" },
                      { type: "Owner Confirmation Timeout", recipient: "Both", trigger: "Owner fails to respond" },
                      { type: "Check-in Reminder", recipient: "Renter", trigger: "Around check-in time" },
                      { type: "Listing Approved", recipient: "Owner", trigger: "Admin approves listing" },
                      { type: "Listing Rejected", recipient: "Owner", trigger: "Admin rejects listing" },
                      { type: "Verification Approved", recipient: "Owner", trigger: "On document approval" },
                      { type: "Payout Sent", recipient: "Owner", trigger: "After payout processed" },
                    ].map((email, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{email.type}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{email.recipient}</span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">{email.trigger}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-3">Sender Configuration</h3>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <p className="text-sm font-mono">notifications@updates.rent-a-vacation.com</p>
                      <p className="text-xs text-muted-foreground mt-1">Transactional emails (bookings, approvals, reminders)</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 mt-3">
                      <p className="text-sm font-mono">support@updates.rent-a-vacation.com</p>
                      <p className="text-xs text-muted-foreground mt-1">Contact form replies and support notifications</p>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold mb-3">Delivery Provider</h3>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-black flex items-center justify-center">
                        <span className="text-white font-bold text-sm">R</span>
                      </div>
                      <div>
                        <p className="font-medium">Resend</p>
                        <p className="text-xs text-muted-foreground">Transactional email delivery via updates.rent-a-vacation.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">GitHub Issue Notifications</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    A GitHub Action (<code className="bg-muted px-1 rounded text-xs">.github/workflows/issue-notifications.yml</code>)
                    sends email notifications to the RAV team when issues are assigned, closed, or commented on.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm"><strong>FROM:</strong> <code className="text-xs">RAV Updates &lt;notifications@updates.rent-a-vacation.com&gt;</code></p>
                    <p className="text-sm mt-1"><strong>TO:</strong> sujit, ajumon, celin, sandhya @rent-a-vacation.com</p>
                    <p className="text-sm mt-1"><strong>Secret:</strong> <code className="text-xs">RESEND_GITHUB_NOTIFICATIONS_KEY</code> (GitHub repo secret, separate from Supabase key)</p>
                  </div>
                </div>
              </section>
            )}

            {/* Admin Dashboard Section */}
            {(isPrinting || activeSection === "admin") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Admin Dashboard</h1>
                  <p className="text-xl text-muted-foreground">
                    Comprehensive administrative interface for platform management.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-4">Dashboard Sections</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "Overview", desc: "Key metrics and platform health", icon: Home },
                      { name: "Users", desc: "User management and roles", icon: Users },
                      { name: "Properties", desc: "All registered properties", icon: Building2 },
                      { name: "Listings", desc: "Listing approval queue", icon: Briefcase },
                      { name: "Bookings", desc: "All platform bookings", icon: Calendar },
                      { name: "Verifications", desc: "Owner document review", icon: UserCheck },
                      { name: "Confirmations", desc: "Booking confirmation status", icon: FileCheck },
                      { name: "Check-in Issues", desc: "Dispute resolution queue", icon: AlertTriangle },
                      { name: "Payouts", desc: "Payout processing", icon: DollarSign },
                      { name: "Financials", desc: "Revenue and commission reports", icon: CreditCard },
                      { name: "Escrow", desc: "Held funds management", icon: Shield },
                      { name: "Pending Approvals", desc: "User & role upgrade approval queue", icon: UserCheck },
                      { name: "Settings", desc: "Platform settings, voice limits, role upgrades & owner confirmation timer", icon: Settings },
                    ].map((section) => {
                      const Icon = section.icon;
                      return (
                        <div key={section.name} className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Icon className="h-5 w-5 text-primary" />
                            <h4 className="font-medium">{section.name}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground">{section.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Access Requirements</h3>
                  <p className="text-sm text-muted-foreground">
                    Admin Dashboard is accessible only to users with <strong>rav_owner</strong> or <strong>rav_admin</strong> roles.
                    Access the dashboard at <code className="bg-muted px-2 py-1 rounded">/admin</code>
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    User Approval System (Pending Approvals Tab)
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      New user signups require admin approval before they can access the platform.
                      The <strong>Pending Approvals</strong> tab shows all users awaiting review.
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Approval Flow</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>New user signs up and sees a "Pending Approval" page</li>
                        <li>Admin navigates to <strong>/admin</strong> → <strong>Pending Approvals</strong> tab</li>
                        <li>Reviews the user's email and signup date</li>
                        <li>Clicks <strong>Approve</strong> to grant platform access, or <strong>Reject</strong> with a reason</li>
                        <li>An approval/rejection email is sent automatically via Resend</li>
                        <li>Approved users can log in and access all platform features</li>
                      </ol>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">Approve</h4>
                        <p className="text-xs text-green-700 dark:text-green-300">
                          Sets approval_status to "approved". User receives a welcome email and can access the full platform including voice search.
                        </p>
                      </div>
                      <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 border border-red-200 dark:border-red-900">
                        <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">Reject</h4>
                        <p className="text-xs text-red-700 dark:text-red-300">
                          Requires a rejection reason. User receives an email explaining the decision. They cannot access protected routes.
                        </p>
                      </div>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Note:</strong> The approval requirement can be toggled on/off in the <strong>Settings</strong> tab using the
                        "Require user approval" switch. When disabled, new signups are automatically approved.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Role Upgrade Requests (Pending Approvals Tab)
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Below the user approvals section, the <strong>Pending Approvals</strong> tab also shows role upgrade requests
                      from existing users who want additional roles (e.g., a renter requesting property owner access).
                    </p>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Role Upgrade Review</h4>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>User submits a role upgrade request (with optional reason)</li>
                        <li>Request appears in the "Pending Role Upgrade Requests" section</li>
                        <li>Admin reviews the user's name, email, requested role, and reason</li>
                        <li>Clicks <strong>Approve</strong> to grant the role, or <strong>Reject</strong> with an optional reason</li>
                        <li>A role upgrade notification email is sent automatically</li>
                        <li>The badge count on the Approvals tab includes both user and role upgrade requests</li>
                      </ol>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-900">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Auto-approve:</strong> Toggle "Auto-approve role upgrade requests" in the <strong>Settings</strong> tab
                        to skip manual review. When enabled, role upgrades are granted instantly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    System Settings (Settings Tab)
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The <strong>Settings</strong> tab (12th tab in the admin dashboard) provides platform-wide configuration options.
                    </p>
                    <div className="space-y-3">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">User Approval Toggle</h4>
                        <p className="text-sm text-muted-foreground">
                          <strong>Require user approval for new signups</strong> — When enabled, all new users start in "pending_approval"
                          status and must be manually approved. When disabled, users are auto-approved on signup.
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Auto-Approve Role Upgrades</h4>
                        <p className="text-sm text-muted-foreground">
                          <strong>Auto-approve role upgrade requests</strong> — When enabled, users who request a role upgrade
                          (e.g., renter to property owner) are granted the role instantly without admin review. Default: <strong>off</strong>.
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Voice Search Daily Limit</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Voice search quotas are <strong>tier-based</strong> (configured in migration 011). The limit resets at midnight UTC.
                          Usage records older than 90 days are automatically cleaned up.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div className="bg-background rounded p-2 text-center">
                            <p className="font-medium text-foreground">Free</p>
                            <p className="text-muted-foreground">5/day</p>
                          </div>
                          <div className="bg-background rounded p-2 text-center">
                            <p className="font-medium text-foreground">Plus / Pro</p>
                            <p className="text-muted-foreground">25/day</p>
                          </div>
                          <div className="bg-background rounded p-2 text-center">
                            <p className="font-medium text-foreground">Premium / Business</p>
                            <p className="text-muted-foreground">Unlimited</p>
                          </div>
                          <div className="bg-background rounded p-2 text-center">
                            <p className="font-medium text-foreground">RAV Team</p>
                            <p className="text-muted-foreground">Unlimited</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Voice Quota Technical Details</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Counter increments only after a <strong>successful</strong> voice search (not on VAPI call start)</li>
                        <li>• Users see a color-coded badge showing remaining searches (green/yellow/red)</li>
                        <li>• When quota is exhausted, the voice button is disabled with a tooltip message</li>
                        <li>• Manual text search is always unlimited for all users</li>
                      </ul>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Owner Confirmation Timer</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Controls the time window and extension rules for owner booking acceptance after renter payment.
                      </p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>Confirmation Window</strong> — Minutes the owner has to accept (default: <strong>60</strong>)</li>
                        <li>• <strong>Extension Duration</strong> — Minutes added per extension request (default: <strong>30</strong>)</li>
                        <li>• <strong>Max Extensions</strong> — Maximum number of extensions allowed (default: <strong>2</strong>)</li>
                      </ul>
                      <p className="text-xs text-muted-foreground mt-2">
                        Settings stored in <code className="bg-muted px-1 py-0.5 rounded">system_settings</code> table.
                        If the owner does not confirm within the window (including any extensions), the booking is automatically
                        cancelled and the renter receives a full refund.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* RAV Owner How-To Guide Section */}
            {(isPrinting || activeSection === "rav-owner-guide") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">RAV Owner How-To Guide</h1>
                  <p className="text-xl text-muted-foreground">
                    Step-by-step operational procedures for platform superusers managing the Rent-A-Vacation marketplace.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-xl p-6 border border-amber-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">👑</span>
                    <h3 className="font-semibold text-lg">RAV Owner Responsibilities</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    As a RAV Owner, you have complete oversight of the platform including user management, financial operations, 
                    listing approvals, dispute resolution, and payout processing. This guide walks you through each core workflow.
                  </p>
                </div>

                {/* Daily Operations */}
                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Daily Operations Checklist
                  </h3>
                  <div className="space-y-3">
                    {[
                      { task: "Review pending user approvals", path: "/admin → Pending Approvals tab", priority: "High" },
                      { task: "Review pending role upgrade requests", path: "/admin → Pending Approvals tab", priority: "High" },
                      { task: "Review pending listing approvals", path: "/admin → Listings tab", priority: "High" },
                      { task: "Check new owner verification requests", path: "/admin → Verifications tab", priority: "High" },
                      { task: "Monitor booking confirmation deadlines", path: "/admin → Bookings tab", priority: "Critical" },
                      { task: "Review reported check-in issues", path: "/admin → Check-in Issues tab", priority: "High" },
                      { task: "Process pending payouts", path: "/admin → Payouts tab", priority: "Medium" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.task}</p>
                          <p className="text-xs text-muted-foreground">{item.path}</p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          item.priority === 'Critical' ? 'bg-red-100 text-red-700' :
                          item.priority === 'High' ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>{item.priority}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How to Approve Listings */}
                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    How to Approve/Reject Listings
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      All new listings are set to "Pending Approval" status. Review each listing for accuracy and compliance.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Navigate to <strong>/admin</strong> and select the <strong>Listings</strong> tab</li>
                      <li>Filter by "Pending" status to see listings awaiting review</li>
                      <li>Click on a listing to view full details including property photos and pricing</li>
                      <li>Verify the listing meets platform standards:
                        <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground">
                          <li>Accurate resort/property information</li>
                          <li>Clear, high-quality photos</li>
                          <li>Reasonable pricing within market range</li>
                          <li>Complete amenity descriptions</li>
                        </ul>
                      </li>
                      <li>Click <strong>Approve</strong> to publish or <strong>Reject</strong> with a reason</li>
                    </ol>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-amber-800">
                        <strong>⚠️ Tip:</strong> Always verify the owner has completed identity verification before approving their first listing.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How to Verify Owners */}
                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    How to Verify Property Owners
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Owner verification builds trust. Review submitted documents to confirm identity and property ownership.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Go to <strong>/admin</strong> → <strong>Verifications</strong> tab</li>
                      <li>Review pending verification requests</li>
                      <li>Check submitted documents:
                        <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground">
                          <li>Government-issued ID (passport, driver's license)</li>
                          <li>Vacation club membership certificate or statement</li>
                          <li>Proof of address (optional but recommended)</li>
                        </ul>
                      </li>
                      <li>Verify documents are legible, not expired, and match owner's profile</li>
                      <li>Approve verification or request additional documentation</li>
                    </ol>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-green-800">
                        <strong>✓ Result:</strong> Verified owners display a "Verified Owner ✓" badge on all their listings.
                      </p>
                    </div>
                  </div>
                </div>

                {/* How to Process Payouts */}
                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    How to Process Owner Payouts
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Payouts are released 5 days after guest checkout, assuming no issues are reported.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Navigate to <strong>/admin</strong> → <strong>Payouts</strong> tab</li>
                      <li>Review bookings with "Ready for Payout" status</li>
                      <li>Confirm the following before processing:
                        <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground">
                          <li>Renter confirmed check-in successfully</li>
                          <li>No disputes or issues reported</li>
                          <li>5 days have passed since checkout</li>
                        </ul>
                      </li>
                      <li>Calculate payout amount (booking total minus 15% platform commission)</li>
                      <li>Process payout via configured payment method</li>
                      <li>Mark as "Paid" with transaction reference</li>
                    </ol>
                    <div className="bg-muted/50 rounded-lg p-4 mt-4">
                      <p className="text-sm">
                        <strong>Payout Formula:</strong><br />
                        Owner Payout = Total Booking Amount × 85%<br />
                        Platform Commission = Total Booking Amount × 15%
                      </p>
                    </div>
                  </div>
                </div>

                {/* How to Handle Disputes */}
                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-primary" />
                    How to Handle Check-in Issues & Disputes
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Renters can report issues during check-in. These require immediate attention.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h4 className="font-medium text-red-800 mb-2">Access Issues</h4>
                        <p className="text-xs text-red-700">
                          Cannot access unit, wrong key/code, unit occupied. Contact owner immediately; may require alternative accommodation or full refund.
                        </p>
                      </div>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <h4 className="font-medium text-amber-800 mb-2">Condition Issues</h4>
                        <p className="text-xs text-amber-700">
                          Unit not as described, cleanliness problems. Document with photos; negotiate partial refund or resolution with owner.
                        </p>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <h4 className="font-medium text-orange-800 mb-2">Safety Concerns</h4>
                        <p className="text-xs text-orange-700">
                          Safety hazards, security issues. Prioritize guest safety; may require immediate relocation and Guarantee Fund usage.
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Amenity Mismatches</h4>
                        <p className="text-xs text-blue-700">
                          Advertised amenities unavailable. Negotiate compensation; update listing for accuracy.
                        </p>
                      </div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 mt-4">
                      <p className="text-sm">
                        <strong>Guarantee Fund:</strong> 3% of each transaction is held in reserve for emergency resolutions requiring platform intervention.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Managing User Roles */}
                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    How to Manage User Roles
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Only RAV Owners can assign or modify user roles. This is a sensitive operation.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Navigate to <strong>/admin</strong> → <strong>Users</strong> tab</li>
                      <li>Search for the user by email or name</li>
                      <li>Click on the user to view their profile</li>
                      <li>Select the appropriate role from the dropdown:
                        <ul className="list-disc list-inside ml-4 mt-2 text-muted-foreground">
                          <li><strong>rav_owner</strong> — Full platform access (use sparingly)</li>
                          <li><strong>rav_admin</strong> — Administrative access without role management</li>
                          <li><strong>rav_staff</strong> — Support staff with view access</li>
                          <li><strong>property_owner</strong> — Can list and manage properties</li>
                          <li><strong>renter</strong> — Default renter role</li>
                        </ul>
                      </li>
                      <li>Save changes and confirm the role update</li>
                    </ol>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                      <p className="text-sm text-red-800">
                        <strong>⚠️ Security:</strong> Roles are stored in a separate secure table with database-level access control. Never share admin credentials.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Reporting */}
                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Understanding Financial Reports
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      The Financials tab provides a comprehensive view of platform revenue and transactions.
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Revenue Metrics</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• Gross Booking Volume (GBV)</li>
                          <li>• Platform Commission (15% of GBV)</li>
                          <li>• Guarantee Fund Reserve (3%)</li>
                          <li>• Net Revenue</li>
                        </ul>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h4 className="font-medium mb-2">Transaction Status</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li>• In Escrow (awaiting checkout)</li>
                          <li>• Pending Payout (post-checkout hold)</li>
                          <li>• Paid Out (completed)</li>
                          <li>• Refunded (cancellations)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Procedures */}
                <div className="bg-card rounded-xl p-6 border border-red-200">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-red-700">
                    <Shield className="h-5 w-5" />
                    Emergency Procedures
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 mb-2">Fraudulent Listing Detected</h4>
                      <ol className="list-decimal list-inside text-xs text-red-700 space-y-1">
                        <li>Immediately suspend the listing and owner account</li>
                        <li>Identify all active bookings for the property</li>
                        <li>Contact affected renters with resolution options</li>
                        <li>Process refunds from Guarantee Fund if needed</li>
                        <li>Document incident for legal review</li>
                      </ol>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2">Owner Fails to Confirm Booking</h4>
                      <ol className="list-decimal list-inside text-xs text-amber-700 space-y-1">
                        <li>System sends automated reminders at 12h and 6h before deadline</li>
                        <li>If deadline passes, booking auto-cancels with full refund</li>
                        <li>Owner receives warning; repeated failures may result in suspension</li>
                        <li>Help renter find alternative accommodation</li>
                      </ol>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2">Payment Processing Issues</h4>
                      <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
                        <li>Check Stripe dashboard for transaction status</li>
                        <li>Verify webhook delivery in Edge Functions logs</li>
                        <li>Manual reconciliation may be needed for edge cases</li>
                        <li>Contact Stripe support for disputed charges</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Membership Tiers */}
            {(isPrinting || activeSection === "membership-tiers") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Membership Tiers</h1>
                  <p className="text-xl text-muted-foreground">
                    Six membership tiers with role-specific benefits, quotas, and commission discounts.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Renter Tiers</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Tier</th>
                          <th className="text-left py-2 px-3">Price</th>
                          <th className="text-left py-2 px-3">Voice Searches</th>
                          <th className="text-left py-2 px-3">Benefits</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">Free</td>
                          <td className="py-2 px-3">$0</td>
                          <td className="py-2 px-3">5/day</td>
                          <td className="py-2 px-3 text-muted-foreground">Basic search, browse listings</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">Plus</td>
                          <td className="py-2 px-3">$9.99/mo</td>
                          <td className="py-2 px-3">25/day</td>
                          <td className="py-2 px-3 text-muted-foreground">Priority support, saved searches</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium">Premium</td>
                          <td className="py-2 px-3">$24.99/mo</td>
                          <td className="py-2 px-3">Unlimited</td>
                          <td className="py-2 px-3 text-muted-foreground">Early access to new listings, concierge</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Owner Tiers</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Tier</th>
                          <th className="text-left py-2 px-3">Price</th>
                          <th className="text-left py-2 px-3">Commission</th>
                          <th className="text-left py-2 px-3">Benefits</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">Free</td>
                          <td className="py-2 px-3">$0</td>
                          <td className="py-2 px-3">15% (default)</td>
                          <td className="py-2 px-3 text-muted-foreground">List properties, basic dashboard</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 px-3 font-medium">Pro</td>
                          <td className="py-2 px-3">$19.99/mo</td>
                          <td className="py-2 px-3">13% (-2%)</td>
                          <td className="py-2 px-3 text-muted-foreground">Analytics, priority listing placement</td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3 font-medium">Business</td>
                          <td className="py-2 px-3">$49.99/mo</td>
                          <td className="py-2 px-3">10% (-5%)</td>
                          <td className="py-2 px-3 text-muted-foreground">Multi-property, API access, dedicated support</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    The base commission rate (currently 15%) is configurable by RAV Owner or RAV Admin in Admin &gt; System Settings.
                    Tier data is defined in migration <code className="text-xs bg-muted px-1 rounded">011_membership_tiers.sql</code>.
                  </p>
                </div>
              </section>
            )}

            {/* AI Assistants (RAVIO) */}
            {(isPrinting || activeSection === "ai-assistants") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">AI Assistants (RAVIO)</h1>
                  <p className="text-xl text-muted-foreground">
                    Voice and text AI assistants that help users search, explore, and navigate the platform.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-3">Voice Search (VAPI)</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Powered by VAPI SDK with Deepgram transcription</li>
                      <li>• Natural language: "Find a 2BR in Orlando under $2000"</li>
                      <li>• Tier-based daily quotas (Free: 5, Plus/Pro: 25, Premium/Business: unlimited)</li>
                      <li>• RAV team members always have unlimited access</li>
                      <li>• Requires microphone permission</li>
                    </ul>
                  </div>
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-3">Text Chat (OpenRouter)</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Powered by OpenRouter (10-100x cheaper than voice)</li>
                      <li>• No quota required — available to all authenticated users</li>
                      <li>• Context-aware prompts (rentals, property detail, bidding, general)</li>
                      <li>• SSE streaming for natural token-by-token display</li>
                      <li>• Session-only persistence (no DB storage)</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Both assistants share a common property search module (<code className="text-xs bg-muted px-1 rounded">_shared/property-search.ts</code>)
                    for consistent search results. Voice and text operate as independent systems — no shared state.
                  </p>
                </div>
              </section>
            )}

            {/* Fair Value Score */}
            {(isPrinting || activeSection === "fair-value") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Fair Value Score</h1>
                  <p className="text-xl text-muted-foreground">
                    Data-driven pricing transparency that helps renters identify good deals and owners price competitively.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How It Works</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The <code className="text-xs bg-muted px-1 rounded">calculate_fair_value_score()</code> PostgreSQL RPC compares
                    a listing's nightly rate against similar listings (same brand, unit type, location) using P25-P75 percentile range.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { tier: "Great Deal", range: "Below P25", color: "bg-emerald-100 text-emerald-800" },
                      { tier: "Fair Price", range: "P25 - P50", color: "bg-blue-100 text-blue-800" },
                      { tier: "Above Average", range: "P50 - P75", color: "bg-amber-100 text-amber-800" },
                      { tier: "Premium", range: "Above P75", color: "bg-red-100 text-red-800" },
                    ].map((item) => (
                      <div key={item.tier} className={`rounded-lg p-3 text-center text-xs ${item.color}`}>
                        <p className="font-medium">{item.tier}</p>
                        <p className="mt-1 opacity-75">{item.range}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-sm">Role-Specific Messaging</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• <strong>Renters</strong> see deal quality badges on listing cards and property detail</li>
                    <li>• <strong>Owners</strong> see pricing intelligence with market range and suggestions</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Maintenance Fee Calculator */}
            {(isPrinting || activeSection === "fee-calculator") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Maintenance Fee Calculator</h1>
                  <p className="text-xl text-muted-foreground">
                    Public tool at <code className="text-xs bg-muted px-1 rounded">/calculator</code> that helps timeshare owners
                    estimate how many rental weeks cover their annual maintenance fees.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Features</h3>
                  <ul className="text-sm text-muted-foreground space-y-2">
                    <li>• 9 supported vacation club brands (Hilton, Marriott, Disney, Wyndham, Hyatt, Bluegreen, Holiday Inn, WorldMark, Other)</li>
                    <li>• 4 unit types: Studio, 1BR, 2BR, 3BR+</li>
                    <li>• Live break-even analysis with color-coded progress bars</li>
                    <li>• 1/2/3 week rental scenarios with net income projections</li>
                    <li>• Uses current platform fee (default 15%, admin-configurable)</li>
                    <li>• No authentication required — public lead generation tool</li>
                    <li>• CTA links to owner signup for conversion</li>
                  </ul>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Pure calculation logic in <code className="text-xs bg-muted px-1 rounded">src/lib/calculatorLogic.ts</code>.
                    Income estimates are based on comparable RAV listings and published market research (labeled INDUSTRY DATA).
                  </p>
                </div>
              </section>
            )}

            {/* Owner Dashboard */}
            {(isPrinting || activeSection === "owner-dashboard") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Owner Dashboard</h1>
                  <p className="text-xl text-muted-foreground">
                    Business intelligence for property owners in the Overview tab of the Owner Dashboard.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">6 Dashboard Sections</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { name: "Headline Stats", desc: "Earned YTD, fees covered %, active offers count" },
                      { name: "Earnings Timeline", desc: "AreaChart with monthly/quarterly view + fee target line" },
                      { name: "My Listings Table", desc: "Status badges, Fair Value badges, idle week alerts" },
                      { name: "Offer Activity Feed", desc: "Real-time event stream of offer actions" },
                      { name: "Pricing Intelligence", desc: "Per-listing Fair Value score + market range" },
                      { name: "Maintenance Fee Tracker", desc: "Inline editor, coverage bar, YTD progress" },
                    ].map((section) => (
                      <div key={section.name} className="bg-muted/50 rounded-lg p-3">
                        <p className="font-medium text-sm">{section.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{section.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Powered by 4 data hooks: <code className="text-xs bg-muted px-1 rounded">useOwnerDashboardStats</code>,{" "}
                    <code className="text-xs bg-muted px-1 rounded">useOwnerEarnings</code>,{" "}
                    <code className="text-xs bg-muted px-1 rounded">useOwnerListingsData</code>,{" "}
                    <code className="text-xs bg-muted px-1 rounded">useOwnerBidActivity</code>.
                    Migration: <code className="text-xs bg-muted px-1 rounded">017</code>.
                  </p>
                </div>
              </section>
            )}

            {/* Travel Request Automation */}
            {(isPrinting || activeSection === "travel-enhancements") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Travel Request Automation</h1>
                  <p className="text-xl text-muted-foreground">
                    Automated matching, demand signals, and engagement features for the travel request system.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">4 Enhancements</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Auto-Match Engine", desc: "match-travel-requests edge function fires on listing approval, notifying requesters of matching inventory" },
                      { name: "Demand Signals", desc: "DemandSignal component on owner listing form shows how many travelers are looking for similar dates/locations" },
                      { name: "Post-Request CTA", desc: "When Rentals search returns no results, prompts travelers to submit a travel request with pre-filled filters" },
                      { name: "Expiry Warnings", desc: "process-deadline-reminders edge function scans for travel requests nearing expiration and sends email alerts" },
                    ].map((item) => (
                      <div key={item.name} className="bg-muted/50 rounded-lg p-3">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Executive Dashboard */}
            {(isPrinting || activeSection === "executive-dashboard") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Executive Dashboard</h1>
                  <p className="text-xl text-muted-foreground">
                    Investor-grade strategic dashboard at <code className="text-xs bg-muted px-1 rounded">/executive-dashboard</code> — dark-themed, boardroom-quality business intelligence.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">6 Sections</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { name: "Headline Bar", desc: "Sticky KPI pills: GMV, Revenue, Active Listings, Liquidity Score, Voice Adoption" },
                      { name: "Business Performance", desc: "4 Recharts charts: GMV trend, offer activity, offer spread index, revenue waterfall" },
                      { name: "Marketplace Health", desc: "Proprietary Liquidity Score gauge, supply/demand map, voice vs traditional funnel" },
                      { name: "Market Intelligence", desc: "BYOK pattern: AirDNA comparison, STR Global benchmarks, RAV pricing position" },
                      { name: "Industry Feed", desc: "NewsAPI integration, regulatory radar, macro indicators with sparklines" },
                      { name: "Unit Economics", desc: "7 metric cards (CAC, LTV, LTV:CAC, Payback, Avg Booking, Take Rate, MoM Growth)" },
                    ].map((section) => (
                      <div key={section.name} className="bg-muted/50 rounded-lg p-3">
                        <p className="font-medium text-sm">{section.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{section.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    RAV Owner only. Dark theme (standalone, not Tailwind dark: variants). BYOK pattern shows demo data by default,
                    toggles to connected mode with user-supplied API keys stored in <code className="text-xs bg-muted px-1 rounded">system_settings</code>.
                  </p>
                </div>
              </section>
            )}

            {/* Seed Data System */}
            {(isPrinting || activeSection === "seed-data") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Seed Data System</h1>
                  <p className="text-xl text-muted-foreground">
                    DEV-only 3-layer seed data system for functional testing and executive demos.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">3 Layers</h3>
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm">Layer 1: Foundation Users</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        8 permanent users (3 RAV team + 5 property owners). Marked <code className="text-xs bg-muted px-1 rounded">is_seed_foundation = true</code>, never wiped on reseed.
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm">Layer 2: Inventory</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        10 properties (2 per owner, real resort names), 30 listings (15 active, 10 flexible pricing, 5 draft).
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm">Layer 3: Transactions</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        50 renters, 90 completed bookings, 10 pending, 5 in escrow, 20 offers, 10 travel requests.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    <strong>Production guard:</strong> The seed-manager edge function checks <code className="text-xs bg-muted px-1 rounded">IS_DEV_ENVIRONMENT</code> secret.
                    It will refuse to run on PROD. Admin UI in DevTools tab (DEV only).
                  </p>
                </div>
              </section>
            )}

            {/* Per-Night Pricing */}
            {(isPrinting || activeSection === "per-night-pricing") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Per-Night Pricing</h1>
                  <p className="text-xl text-muted-foreground">
                    Nightly rate as the atomic pricing unit, with date proposals and inspired travel requests.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Key Features</h3>
                  <div className="space-y-3">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm">Nightly Rate</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Owners set a <code className="text-xs bg-muted px-1 rounded">nightly_rate</code> on listings. Total price = nights x rate.
                        RAV applies the platform fee (default 15%) on top for the traveler-facing price.
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm">Date Proposals</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Renters can "Propose Different Dates" via BidFormDialog date-proposal mode. The offer amount auto-computes
                        from nightly_rate x proposed nights. Owners see proposed dates in offer manager.
                      </p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium text-sm">Inspired Travel Requests</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        "Request Similar Dates" from PropertyDetail pre-fills a TravelRequestForm with the listing's details.
                        Optional "Send to this owner first" toggle targets the request.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    Shared pricing utility in <code className="text-xs bg-muted px-1 rounded">src/lib/pricing.ts</code> —
                    <code className="text-xs bg-muted px-1 rounded">calculateNights()</code> + <code className="text-xs bg-muted px-1 rounded">computeListingPricing()</code>
                    (15% RAV markup). Migration: <code className="text-xs bg-muted px-1 rounded">020_flexible_dates_nightly_pricing.sql</code>.
                  </p>
                </div>
              </section>
            )}

            {/* Platform Improvements */}
            {(activeSection === "platform-improvements" || isPrinting) && (
              <section id="platform-improvements" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Platform Improvements</h1>
                  <p className="text-xl text-muted-foreground">
                    Recent bug fixes, safety features, and UX improvements.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Error Boundaries</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      A React Error Boundary wraps all application routes to catch unexpected crashes gracefully.
                      Instead of a white screen, users see a friendly error message with "Try Again" and "Go Home" options,
                      plus a link to contact support. Error details are displayed for debugging.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Component: <code className="bg-muted px-1 rounded">src/components/ErrorBoundary.tsx</code>
                    </p>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Auto-Expire Listings</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Listings with past check-out dates are automatically filtered from public-facing views
                      (Rentals page, Name Your Price marketplace, listing counts). Owners see an "Expired" orange badge
                      on their dashboard for listings that have passed their checkout date.
                    </p>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Age Verification & Terms</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Signup requires users to confirm they are 18 years or older and agree to the Terms of Service
                      and Privacy Policy. Metadata (<code className="bg-muted px-1 rounded text-xs">age_verified</code>, <code className="bg-muted px-1 rounded text-xs">terms_accepted_at</code>)
                      is stored in Supabase auth for compliance records.
                    </p>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Google OAuth</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      "Continue with Google" buttons on both Login and Signup pages are fully functional,
                      using Supabase OAuth with Google provider. Users can sign in or create accounts with
                      their Google identity in a single click.
                    </p>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Form Draft Persistence</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The List Property form auto-saves progress to localStorage as users fill it out.
                      If they navigate away or refresh, their progress is restored automatically.
                      The draft is cleared once the property is submitted or the user navigates to their dashboard.
                    </p>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Proposal Acceptance Flow</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      When a renter accepts an owner's proposal on a travel request, a listing is now auto-created
                      from the proposal details (dates, pricing) so the "Proceed to Checkout" button works immediately.
                      Proposals expire after 24 hours (previously 7 days) to keep the marketplace responsive.
                    </p>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Property Dropdown Fix</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      The "Add Property" vacation club brand dropdown no longer pre-selects a default brand.
                      Users must explicitly choose their brand, preventing accidental misclassification.
                      The submit button is disabled until a brand is selected.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Disputes & Resolution */}
            {(activeSection === "disputes" || isPrinting) && (
              <section id="disputes" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Disputes & Resolution</h1>
                  <p className="text-xl text-muted-foreground">
                    How disputes are filed, tracked, and resolved on the platform.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Dispute Workflow</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li><strong>1. Filing:</strong> Renter clicks "Report Issue" on a booking → selects category (property_not_as_described, access_issues, safety_concerns, etc.) → describes the problem</li>
                      <li><strong>2. Triage:</strong> Admin sees dispute in Admin Dashboard → Disputes tab with priority/status/assignment filters</li>
                      <li><strong>3. Investigation:</strong> Admin updates status (open → investigating), assigns to team member, sends messages to parties via internal thread</li>
                      <li><strong>4. Resolution:</strong> Admin resolves with optional refund amount → dispute closed, booking/escrow updated</li>
                    </ol>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Dispute Categories</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <span>• Property not as described</span>
                      <span>• Access issues</span>
                      <span>• Safety concerns</span>
                      <span>• Cleanliness</span>
                      <span>• Amenities missing</span>
                      <span>• Communication issues</span>
                      <span>• Billing dispute</span>
                      <span>• Other</span>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Technical Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Database: <code className="bg-muted px-1 rounded">disputes</code> + <code className="bg-muted px-1 rounded">dispute_messages</code> tables.
                      Migration 026. Admin component: <code className="bg-muted px-1 rounded">AdminDisputes.tsx</code>.
                      Renter component: <code className="bg-muted px-1 rounded">ReportIssueDialog.tsx</code>.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* GDPR & Data Deletion */}
            {(activeSection === "gdpr" || isPrinting) && (
              <section id="gdpr" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">GDPR & Data Deletion</h1>
                  <p className="text-xl text-muted-foreground">
                    User data deletion and privacy compliance.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Delete Account Flow</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Users can request full account deletion from Account Settings → "Delete My Account".
                      The deletion is permanent and irrevocable.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Profile data is anonymized (name, email, phone replaced with "[deleted]")</li>
                      <li>• Auth account is deleted from Supabase Auth</li>
                      <li>• Active bookings are cancelled with appropriate refunds</li>
                      <li>• Listings are deactivated</li>
                      <li>• Reviews and dispute history are retained (anonymized) for platform integrity</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Technical Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Edge function: <code className="bg-muted px-1 rounded">gdpr-delete-user</code>.
                      Migration 028. Requires email confirmation before processing.
                      Rate limited to prevent abuse.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Stripe Connect */}
            {(activeSection === "stripe-connect" || isPrinting) && (
              <section id="stripe-connect" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Stripe Connect</h1>
                  <p className="text-xl text-muted-foreground">
                    How property owners receive automated payouts via Stripe Express accounts.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Owner Onboarding</h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li><strong>1.</strong> Owner clicks "Connect Stripe" banner in Owner Dashboard → Earnings tab</li>
                      <li><strong>2.</strong> <code className="bg-muted px-1 rounded">create-connect-account</code> edge function creates a Stripe Express account</li>
                      <li><strong>3.</strong> Owner completes Stripe's hosted onboarding (bank details, identity verification)</li>
                      <li><strong>4.</strong> On return, <code className="bg-muted px-1 rounded">stripe_account_id</code>, <code className="bg-muted px-1 rounded">onboarding_complete</code>, <code className="bg-muted px-1 rounded">charges_enabled</code>, <code className="bg-muted px-1 rounded">payouts_enabled</code> fields are updated</li>
                    </ol>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Payout Flow</h3>
                    <p className="text-sm text-muted-foreground">
                      Admin initiates payouts via Admin Dashboard → Payouts → "Pay via Stripe". The
                      <code className="bg-muted px-1 rounded"> create-stripe-payout</code> edge function creates a Stripe Transfer
                      from the RAV platform account to the owner's connected account. Transfer ID is recorded on the booking.
                    </p>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Banner States</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Not connected:</strong> "Connect your Stripe account to receive payouts" with setup button</li>
                      <li>• <strong>Onboarding incomplete:</strong> "Complete your Stripe setup" with continue button</li>
                      <li>• <strong>Connected:</strong> Green success message (auto-hides after first view)</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Google Analytics (GA4) */}
            {(activeSection === "ga4" || isPrinting) && (
              <section id="ga4" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Google Analytics (GA4)</h1>
                  <p className="text-xl text-muted-foreground">
                    Analytics integration with cookie consent compliance.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Integration Details</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Measurement ID:</strong> G-G2YCVHNS25</li>
                      <li>• <strong>Consent gating:</strong> GA4 script only loads after user accepts cookies via the CookieConsent banner</li>
                      <li>• <strong>Page views:</strong> Automatically tracked via React Router navigation</li>
                      <li>• <strong>Custom events:</strong> Can be sent via <code className="bg-muted px-1 rounded">gtag('event', ...)</code> after consent</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Cookie Consent</h3>
                    <p className="text-sm text-muted-foreground">
                      A bottom banner appears on first visit asking users to accept or decline cookies.
                      If declined, no GA4 tracking occurs. Preference is stored in localStorage.
                      Component: <code className="bg-muted px-1 rounded">CookieConsent.tsx</code>.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Realtime Subscriptions */}
            {(activeSection === "realtime" || isPrinting) && (
              <section id="realtime" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Realtime Subscriptions</h1>
                  <p className="text-xl text-muted-foreground">
                    Live updates via Supabase Realtime replace polling throughout the app.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Where Realtime is Used</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>NotificationBell:</strong> New notifications appear instantly (replaced 30s polling)</li>
                      <li>• <strong>BookingMessageThread:</strong> Messages arrive in real-time (replaced 10s polling)</li>
                      <li>• <strong>Unread counts:</strong> Badge counts update live (replaced 30s polling)</li>
                      <li>• <strong>Role upgrades:</strong> Approval status detected instantly without page refresh</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Technical Details</h3>
                    <p className="text-sm text-muted-foreground">
                      Hook: <code className="bg-muted px-1 rounded">useRealtimeSubscription</code> wraps Supabase
                      <code className="bg-muted px-1 rounded"> postgres_changes</code> channel. Subscribes to INSERT/UPDATE/DELETE
                      events on specified tables with optional filters. Channels are cleaned up on unmount.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Reviews System */}
            {(activeSection === "reviews-system" || isPrinting) && (
              <section id="reviews-system" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Reviews System</h1>
                  <p className="text-xl text-muted-foreground">
                    Guest reviews and property ratings architecture.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Architecture</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Table:</strong> <code className="bg-muted px-1 rounded">reviews</code> (migration 033) — rating (1-5), comment, reviewer_id, property_id, booking_id</li>
                      <li>• <strong>RPC:</strong> <code className="bg-muted px-1 rounded">get_property_review_summary</code> — returns avg rating + count per property</li>
                      <li>• <strong>Hooks:</strong> <code className="bg-muted px-1 rounded">useReviews</code> — 4 hooks (list, submit, summary, check-if-reviewed)</li>
                      <li>• <strong>Components:</strong> StarRating (read-only + interactive), ReviewForm (dialog), ReviewList, ReviewSummary</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Integration Points</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• PropertyDetail sidebar: review summary (avg rating + count)</li>
                      <li>• PropertyDetail bottom: full review list with star ratings</li>
                      <li>• MyBookings: "Write Review" button on completed bookings (one review per booking)</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Messaging System */}
            {(activeSection === "messaging" || isPrinting) && (
              <section id="messaging" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Messaging System</h1>
                  <p className="text-xl text-muted-foreground">
                    Post-booking messaging between owners and renters.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Architecture</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Table:</strong> <code className="bg-muted px-1 rounded">booking_messages</code> (migration 034) — sender_id, booking_id, content, read_at</li>
                      <li>• <strong>RPC:</strong> <code className="bg-muted px-1 rounded">get_unread_message_counts</code> — returns per-booking unread counts</li>
                      <li>• <strong>Component:</strong> <code className="bg-muted px-1 rounded">BookingMessageThread</code> — Sheet-based chat UI with real-time updates</li>
                      <li>• <strong>Access:</strong> "Message Owner" in MyBookings, "Message Renter" in OwnerBookings</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Saved Searches & Price Tracking */}
            {(activeSection === "saved-searches-system" || isPrinting) && (
              <section id="saved-searches-system" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Saved Searches & Price Tracking</h1>
                  <p className="text-xl text-muted-foreground">
                    Persistent search criteria with automatic price drop detection.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Architecture</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Table:</strong> <code className="bg-muted px-1 rounded">saved_searches</code> (migration 038) — name, filters (JSONB), last_min_price, price_dropped_since_last_check</li>
                      <li>• <strong>Components:</strong> SaveSearchButton (Rentals toolbar), SavedSearchesList (My Trips dashboard)</li>
                      <li>• <strong>Price tracking:</strong> On each load, current lowest price is compared to stored <code className="bg-muted px-1 rounded">last_min_price</code>. If lower, "Price Drop" badge appears.</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Pre-Booking Inquiries */}
            {(activeSection === "pre-booking-inquiries" || isPrinting) && (
              <section id="pre-booking-inquiries" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Pre-Booking Inquiries</h1>
                  <p className="text-xl text-muted-foreground">
                    Renters can message owners before committing to a booking.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Architecture</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Tables:</strong> <code className="bg-muted px-1 rounded">listing_inquiries</code> + <code className="bg-muted px-1 rounded">inquiry_messages</code> (migration 037)</li>
                      <li>• <strong>Components:</strong> InquiryDialog ("Ask the Owner" button on PropertyDetail), InquiryThread (message thread UI)</li>
                      <li>• <strong>Flow:</strong> Renter opens inquiry → sends message → owner receives notification → replies in thread → renter sees response</li>
                      <li>• <strong>Scope:</strong> Inquiry is per-listing, not per-property. Multiple inquiries can exist for different listings.</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* Idle Listing Alerts */}
            {(activeSection === "idle-listing-alerts" || isPrinting) && (
              <section id="idle-listing-alerts" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Idle Listing Alerts</h1>
                  <p className="text-xl text-muted-foreground">
                    Automated email alerts for listings approaching check-in without bookings.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Architecture</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Edge function:</strong> <code className="bg-muted px-1 rounded">idle-listing-alerts</code> — runs on a cron schedule</li>
                      <li>• <strong>Table:</strong> <code className="bg-muted px-1 rounded">idle_listing_alerts</code> (migration 039) — tracks which alerts have been sent per listing</li>
                      <li>• <strong>Thresholds:</strong> 60-day warning + 30-day urgent alert</li>
                      <li>• <strong>Idempotent:</strong> Each alert type sent only once per listing (deduped by listing_id + alert_type)</li>
                      <li>• <strong>Email:</strong> Sent via Resend with direct link to edit the listing's pricing</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {/* OpenAPI / Swagger */}
            {(activeSection === "openapi-swagger" || isPrinting) && (
              <section id="openapi-swagger" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">OpenAPI / Swagger</h1>
                  <p className="text-xl text-muted-foreground">
                    API documentation via OpenAPI 3.0.3 specification.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Access</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Swagger UI:</strong> <code className="bg-muted px-1 rounded">/api-docs</code> — interactive API explorer (admin-gated)</li>
                      <li>• <strong>Spec file:</strong> <code className="bg-muted px-1 rounded">docs/api/openapi.yaml</code> — OpenAPI 3.0.3 with all 26 edge function endpoints</li>
                      <li>• <strong>Authentication:</strong> Bearer token (Supabase JWT) + Stripe webhook signature scheme</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Coverage</h3>
                    <p className="text-sm text-muted-foreground">
                      All 26 edge functions documented with operationId, security requirements, x-rate-limit annotations,
                      request/response schemas, and error codes. Validated against OpenAPI 3.0.3 specification (0 errors, 0 warnings).
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* iCal Calendar Export */}
            {(activeSection === "ical-export" || isPrinting) && (
              <section id="ical-export" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">iCal Calendar Export</h1>
                  <p className="text-xl text-muted-foreground">
                    Export bookings as RFC 5545 iCalendar files for external calendar apps.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Architecture</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Library:</strong> <code className="bg-muted px-1 rounded">src/lib/icalendar.ts</code> — pure TypeScript, zero dependencies, RFC 5545 compliant</li>
                      <li>• <strong>Hook:</strong> <code className="bg-muted px-1 rounded">useOwnerCalendarExport</code> — fetches confirmed bookings and generates .ics download</li>
                      <li>• <strong>UI:</strong> "Export Calendar" button in OwnerBookings toolbar</li>
                      <li>• <strong>Format:</strong> VEVENT per booking with DTSTART/DTEND (DATE type), SUMMARY (resort name), DESCRIPTION (guest details)</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Compatibility</h3>
                    <p className="text-sm text-muted-foreground">
                      Works with Google Calendar, Apple Calendar, Microsoft Outlook, Yahoo Calendar, and
                      any app that supports .ics file import. Events appear as all-day events for check-in through check-out dates.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {(activeSection === "dynamic-pricing" || isPrinting) && (
              <section id="dynamic-pricing" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Dynamic Pricing</h1>
                  <p className="text-xl text-muted-foreground">
                    AI-powered pricing suggestions based on urgency, seasonality, and demand signals.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Architecture</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>RPC:</strong> <code className="bg-muted px-1 rounded">get_dynamic_pricing_data(brand, location, bedrooms, check_in_date)</code> — queries historical booking prices, market averages, pending bids, saved searches</li>
                      <li>• <strong>Library:</strong> <code className="bg-muted px-1 rounded">src/lib/dynamicPricing.ts</code> — pure functions for urgency, seasonal, and demand calculations</li>
                      <li>• <strong>Hook:</strong> <code className="bg-muted px-1 rounded">useDynamicPricing</code> — wraps RPC + pure functions with 5-min cache</li>
                      <li>• <strong>UI:</strong> Enhanced <code className="bg-muted px-1 rounded">PricingSuggestion</code> component with factor badges</li>
                      <li>• <strong>Migration:</strong> 042 (RPC only, no new tables)</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Pricing Factors</h3>
                    <ul className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span><strong>Urgency Discount</strong> — Graduated: 0% at 60+ days, -5% at 30-59d, -10% at 14-29d, -12% at 7-13d, -15% at 0-6d</span>
                      </li>
                      <li className="flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span><strong>Seasonal Factor</strong> — Weighted average of historical booking prices by month. Compares target month to annual average.</span>
                      </li>
                      <li className="flex gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span><strong>Demand Adjustment</strong> — 0-8% premium based on pending bid count and saved search activity for comparable listings</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Confidence Levels</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>High:</strong> 10+ comparable listings and 4+ months of booking history</li>
                      <li>• <strong>Medium:</strong> 3-9 comparable listings</li>
                      <li>• <strong>Low:</strong> Fewer than 3 comparables — labeled "limited data"</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {(activeSection === "referral-program" || isPrinting) && (
              <section id="referral-program" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Referral Program</h1>
                  <p className="text-xl text-muted-foreground">
                    Owner-to-owner referral system with unique codes, tracking, and commission discount rewards.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Architecture</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Tables:</strong> <code className="bg-muted px-1 rounded">referral_codes</code> (unique 8-char code per user) + <code className="bg-muted px-1 rounded">referrals</code> (referrer→referred tracking)</li>
                      <li>• <strong>RPCs:</strong> <code className="bg-muted px-1 rounded">get_or_create_referral_code</code>, <code className="bg-muted px-1 rounded">record_referral</code>, <code className="bg-muted px-1 rounded">get_referral_stats</code></li>
                      <li>• <strong>Library:</strong> <code className="bg-muted px-1 rounded">src/lib/referral.ts</code> — link builder, code extractor, stats utilities</li>
                      <li>• <strong>Hooks:</strong> <code className="bg-muted px-1 rounded">useReferralCode</code>, <code className="bg-muted px-1 rounded">useReferralStats</code>, <code className="bg-muted px-1 rounded">useReferralList</code>, <code className="bg-muted px-1 rounded">useRecordReferral</code></li>
                      <li>• <strong>UI:</strong> <code className="bg-muted px-1 rounded">ReferralDashboard</code> in Owner Dashboard Account tab</li>
                      <li>• <strong>Migration:</strong> 043</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Flow</h3>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                        <span>Owner visits Referral Program section → unique code auto-generated</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                        <span>Referral link (<code className="bg-muted px-1 rounded">/signup?ref=CODE</code>) shared with another owner</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                        <span>New user signs up → referral banner shown, code captured in metadata, <code className="bg-muted px-1 rounded">record_referral</code> RPC called (fire-and-forget)</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
                        <span>Referral status: pending → converted (when referred user completes first booking)</span>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Configuration</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>System Setting:</strong> <code className="bg-muted px-1 rounded">referral_program</code> in <code className="bg-muted px-1 rounded">system_settings</code> table</li>
                      <li>• <strong>Default Reward:</strong> 1% commission discount per converted referral</li>
                      <li>• <strong>Self-Referral:</strong> Blocked in RPC</li>
                      <li>• <strong>Duplicate Prevention:</strong> One referral per referred user (UNIQUE constraint)</li>
                      <li>• <strong>RLS:</strong> Users see own referrals; RAV team sees all</li>
                    </ul>
                  </div>
                </div>
              </section>
            )}

            {(activeSection === "public-api" || isPrinting) && (
              <section id="public-api" className="space-y-8">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Public API & API Keys</h1>
                  <p className="text-xl text-muted-foreground">
                    REST API for partners, mobile apps, and integrations. Managed via API keys with tiered rate limiting.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Architecture</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Gateway:</strong> <code className="bg-muted px-1 rounded">api-gateway</code> edge function — single entry point for all <code className="bg-muted px-1 rounded">/v1/*</code> routes</li>
                      <li>• <strong>Auth:</strong> Dual — API Key (<code className="bg-muted px-1 rounded">X-API-Key</code> header) for partners, JWT (<code className="bg-muted px-1 rounded">Authorization: Bearer</code>) for own apps</li>
                      <li>• <strong>Key Format:</strong> <code className="bg-muted px-1 rounded">rav_pk_&lt;32 hex chars&gt;</code> — SHA-256 hashed at rest, shown once at creation</li>
                      <li>• <strong>Tables:</strong> <code className="bg-muted px-1 rounded">api_keys</code> (hashed keys, scopes, tiers) + <code className="bg-muted px-1 rounded">api_request_log</code> (per-request analytics)</li>
                      <li>• <strong>RPCs:</strong> <code className="bg-muted px-1 rounded">validate_api_key</code>, <code className="bg-muted px-1 rounded">increment_api_key_usage</code>, <code className="bg-muted px-1 rounded">list_api_keys</code>, <code className="bg-muted px-1 rounded">get_api_key_stats</code></li>
                      <li>• <strong>Shared Modules:</strong> <code className="bg-muted px-1 rounded">_shared/api-auth.ts</code>, <code className="bg-muted px-1 rounded">_shared/api-response.ts</code></li>
                      <li>• <strong>Admin UI:</strong> "API Keys" tab in Admin Dashboard (rav_admin only)</li>
                      <li>• <strong>Public Docs:</strong> <code className="bg-muted px-1 rounded">/developers</code> — Swagger UI (no auth required)</li>
                      <li>• <strong>Migration:</strong> 044</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Public Endpoints (Read-Only)</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Method</th>
                            <th className="text-left py-2 font-medium">Path</th>
                            <th className="text-left py-2 font-medium">Scope</th>
                            <th className="text-left py-2 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b"><td className="py-2"><code className="bg-muted px-1 rounded">GET</code></td><td><code className="bg-muted px-1 rounded">/v1/listings</code></td><td>listings:read</td><td>Browse with filters + pagination</td></tr>
                          <tr className="border-b"><td className="py-2"><code className="bg-muted px-1 rounded">GET</code></td><td><code className="bg-muted px-1 rounded">/v1/listings/:id</code></td><td>listings:read</td><td>Single listing with full details</td></tr>
                          <tr className="border-b"><td className="py-2"><code className="bg-muted px-1 rounded">POST</code></td><td><code className="bg-muted px-1 rounded">/v1/search</code></td><td>search</td><td>AI-powered property search</td></tr>
                          <tr className="border-b"><td className="py-2"><code className="bg-muted px-1 rounded">GET</code></td><td><code className="bg-muted px-1 rounded">/v1/destinations</code></td><td>listings:read</td><td>Destination directory (10/35)</td></tr>
                          <tr><td className="py-2"><code className="bg-muted px-1 rounded">GET</code></td><td><code className="bg-muted px-1 rounded">/v1/resorts</code></td><td>listings:read</td><td>Resort directory with unit types</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Rate Limit Tiers</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Tier</th>
                            <th className="text-left py-2 font-medium">Daily</th>
                            <th className="text-left py-2 font-medium">Per-Minute</th>
                            <th className="text-left py-2 font-medium">Use Case</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b"><td className="py-2">Free</td><td>100</td><td>10</td><td>Developer testing</td></tr>
                          <tr className="border-b"><td className="py-2">Partner</td><td>10,000</td><td>100</td><td>Travel agents</td></tr>
                          <tr><td className="py-2">Premium</td><td>100,000</td><td>500</td><td>Large integrators</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Response Format</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• <strong>Success:</strong> <code className="bg-muted px-1 rounded">{"{ data, meta: { page, per_page, total_count, total_pages }, api_version: \"v1\" }"}</code></li>
                      <li>• <strong>Error:</strong> <code className="bg-muted px-1 rounded">{"{ error: { code, message }, api_version: \"v1\" }"}</code></li>
                      <li>• <strong>Rate Limit Headers:</strong> <code className="bg-muted px-1 rounded">X-RateLimit-Limit</code>, <code className="bg-muted px-1 rounded">X-RateLimit-Remaining</code>, <code className="bg-muted px-1 rounded">X-RateLimit-Reset</code></li>
                      <li>• <strong>Pagination:</strong> <code className="bg-muted px-1 rounded">?page=1&per_page=20</code> (max 50 per page)</li>
                      <li>• <strong>Versioning:</strong> URL-based (<code className="bg-muted px-1 rounded">/v1/</code>), 6-month deprecation notice via <code className="bg-muted px-1 rounded">Sunset</code> header</li>
                    </ul>
                  </div>

                  <div className="bg-card rounded-xl p-6 border">
                    <h3 className="font-semibold text-lg mb-4">Admin Key Management</h3>
                    <ol className="space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                        <span>Admin Dashboard → API Keys tab → Create Key</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                        <span>Choose name, tier, and scopes → key shown once (copy immediately)</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                        <span>Key appears in list with prefix, usage counter, and last-used timestamp</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
                        <span>Revoke anytime — immediate, permanent, cannot be undone</span>
                      </li>
                    </ol>
                  </div>
                </div>
              </section>
            )}

            <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>Rent-A-Vacation © 2024 — A Techsilon Group Company</p>
              <p className="mt-1">Jacksonville, FL • 1-800-RAV-0800 • rentavacation.com</p>
            </footer>
          </div>
        </main>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:break-after-page { page-break-after: always; }
          body { 
            print-color-adjust: exact; 
            -webkit-print-color-adjust: exact;
          }
          aside { display: none !important; }
          header { display: none !important; }
          main { 
            padding: 0 !important; 
            margin: 0 !important;
          }
          section {
            page-break-inside: avoid;
            page-break-after: always;
            margin-bottom: 2rem;
          }
          section:last-of-type {
            page-break-after: auto;
          }
          .max-w-4xl {
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Documentation;
