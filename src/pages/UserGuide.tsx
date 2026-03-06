import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/hooks/usePageMeta";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Home,
  Building2,
  Gavel,
  CreditCard,
  Shield,
  Download,
  Menu,
  X,
  CheckCircle2,
  DollarSign,
  MapPin,
  Calendar,
  Search,
  FileCheck,
  AlertTriangle,
  ArrowLeft,
  User,
  Key,
  Camera,
  MessageSquare,
  Clock,
  Plane,
  Bell,
  Settings,
  Ban,
  Wallet,
  MailCheck,
  BarChart3,
  TrendingUp,
  CalendarCheck,
  AlertCircle,
  UserCheck,
  LayoutDashboard,
  Bookmark,
  Mail,
  GitCompare,
  Star,
  Share2,
  Compass
} from "lucide-react";

const UserGuide = () => {
  usePageMeta('User Guide', 'Step-by-step guide to using Rent-A-Vacation for renting and listing vacation properties.');
  const [activeSection, setActiveSection] = useState("getting-started");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeRole, setActiveRole] = useState<"owner" | "renter">("owner");
  const navigate = useNavigate();

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  const ownerSections = [
    { id: "getting-started", label: "Getting Started", icon: Home },
    { id: "register-property", label: "Register Your Property", icon: Building2 },
    { id: "create-listing", label: "Create a Listing", icon: FileCheck },
    { id: "manage-bids", label: "Manage Offers & Proposals", icon: Gavel },
    { id: "confirm-bookings", label: "Confirm Bookings", icon: Calendar },
    { id: "receive-payouts", label: "Receive Payouts", icon: DollarSign },
    { id: "cancellations", label: "Cancellations", icon: Ban },
    { id: "portfolio", label: "Portfolio Overview", icon: BarChart3 },
    { id: "pricing-suggestions", label: "Pricing Suggestions", icon: TrendingUp },
    { id: "referral-program", label: "Referral Program", icon: Share2 },
    { id: "ical-export", label: "Calendar Export (iCal)", icon: CalendarCheck },
    { id: "idle-alerts", label: "Idle Week Alerts", icon: AlertCircle },
    { id: "owner-profiles", label: "Owner Profiles", icon: UserCheck },
    { id: "dashboard-nav", label: "Dashboard Navigation", icon: LayoutDashboard },
    { id: "account-settings", label: "Account & Preferences", icon: Settings },
    { id: "owner-faq", label: "Owner FAQ", icon: MessageSquare },
  ];

  const renterSections = [
    { id: "getting-started", label: "Getting Started", icon: Home },
    { id: "search-book", label: "Search & Book", icon: Search },
    { id: "travel-requests", label: "Submit Travel Requests", icon: Plane },
    { id: "place-bids", label: "Make Offers on Listings", icon: Gavel },
    { id: "my-bookings", label: "My Bookings & Cancellations", icon: Calendar },
    { id: "checkin", label: "Check-In Process", icon: Key },
    { id: "saved-searches", label: "Saved Searches & Price Alerts", icon: Bookmark },
    { id: "pre-booking-messaging", label: "Pre-Booking Messaging", icon: Mail },
    { id: "renter-dashboard", label: "My Trips Dashboard", icon: LayoutDashboard },
    { id: "compare-properties", label: "Compare Properties", icon: GitCompare },
    { id: "booking-timeline", label: "Booking Timeline", icon: Clock },
    { id: "reviews", label: "Reviews & Ratings", icon: Star },
    { id: "destinations", label: "Explore Destinations", icon: Compass },
    { id: "protection", label: "Renter Protection", icon: Shield },
    { id: "account-settings", label: "Account & Preferences", icon: Settings },
    { id: "renter-faq", label: "Renter FAQ", icon: MessageSquare },
  ];

  const sections = activeRole === "owner" ? ownerSections : renterSections;

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

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
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <img src="/rav-logo.svg" alt="RAV Logo" className="h-8 w-8" />
            <div>
              <h1 className="text-lg font-bold text-foreground">Rent-A-Vacation</h1>
              <p className="text-xs text-muted-foreground">User Guide</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
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
            {/* Role Toggle */}
            <div className="px-3 mb-4">
              <div className="bg-muted rounded-lg p-1 flex">
                <button
                  onClick={() => {
                    setActiveRole("owner");
                    setActiveSection("getting-started");
                  }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeRole === "owner" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Property Owner
                </button>
                <button
                  onClick={() => {
                    setActiveRole("renter");
                    setActiveSection("getting-started");
                  }}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    activeRole === "renter" 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Renter
                </button>
              </div>
            </div>

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
                  <p className="text-2xl text-primary font-medium mb-2">
                    {activeRole === "owner" ? "Property Owner Guide" : "Renter Guide"}
                  </p>
                  <p className="text-xl text-muted-foreground mb-8">Name Your Price. Book Your Paradise.</p>
                  <div className="bg-muted/50 rounded-xl p-6 max-w-md">
                    <p className="text-sm text-muted-foreground">
                      <strong>Version:</strong> 1.0<br />
                      <strong>Last Updated:</strong> {currentDate}
                    </p>
                  </div>
                  <div className="mt-auto pt-16">
                    <p className="text-sm text-muted-foreground">A Techsilon Group Company</p>
                    <p className="text-xs text-muted-foreground mt-1">Jacksonville, FL • rentavacation.com</p>
                  </div>
                </div>
              </section>
            )}

            {/* ============ OWNER SECTIONS ============ */}
            
            {/* Owner Getting Started */}
            {activeRole === "owner" && (isPrinting || activeSection === "getting-started") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Welcome, Property Owner!</h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Turn your vacation club or timeshare ownership into income by renting directly to renters 
                    on the Rent-A-Vacation marketplace.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-8 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">✓</span>
                    <h2 className="text-2xl font-semibold">Why List on RAV?</h2>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">85%</p>
                      <p className="text-sm text-muted-foreground">You Keep</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">0</p>
                      <p className="text-sm text-muted-foreground">Upfront Fees</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">100%</p>
                      <p className="text-sm text-muted-foreground">Control</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Quick Start Checklist</h3>
                  {[
                    { step: 1, title: "Create your account", desc: "Sign up with your email and verify your email address by clicking the link we send you." },
                    { step: 2, title: "Get approved", desc: "Your account will be reviewed by our team. You'll receive an email once approved (typically within 24 hours)." },
                    { step: 3, title: "Register your property", desc: "Once approved, add your vacation club resort and unit details" },
                    { step: 4, title: "Get verified", desc: "Upload ID and ownership documents for the verified badge" },
                    { step: 5, title: "Connect Stripe", desc: "Set up Stripe Connect to receive automated payouts directly to your bank account" },
                    { step: 6, title: "Create your first listing", desc: "Set nightly rates, dates, and open for bookings" },
                    { step: 7, title: "Receive bookings", desc: "Confirm reservations and collect payouts" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 p-4 bg-card rounded-xl border">
                      <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Register Property */}
            {activeRole === "owner" && (isPrinting || activeSection === "register-property") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Register Your Property</h1>
                  <p className="text-xl text-muted-foreground">
                    Add your vacation club or timeshare property to start creating rental listings.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Step-by-Step Instructions</h3>
                  <ol className="space-y-4">
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <div>
                        <h4 className="font-medium">Navigate to Owner Dashboard</h4>
                        <p className="text-sm text-muted-foreground">Click "List Your Property" in the main navigation, or go to /owner-dashboard</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <div>
                        <h4 className="font-medium">Select "My Properties" Tab</h4>
                        <p className="text-sm text-muted-foreground">Click "Add New Property" to open the registration form</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <div>
                        <h4 className="font-medium">Enter Property Details</h4>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                          <li>• <strong>Resort/Club Name:</strong> e.g., "Hilton Grand Vacations Las Vegas"</li>
                          <li>• <strong>Location:</strong> Full address of the resort</li>
                          <li>• <strong>Unit Type:</strong> Studio, 1BR, 2BR, etc.</li>
                          <li>• <strong>Max Occupancy:</strong> Maximum guests allowed</li>
                          <li>• <strong>Amenities:</strong> Kitchen, pool access, parking, etc.</li>
                        </ul>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">4</span>
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          <Camera className="h-4 w-4" />
                          Upload Photos
                        </h4>
                        <p className="text-sm text-muted-foreground">Add high-quality photos of the unit interior, view, and resort amenities</p>
                      </div>
                    </li>
                    <li className="flex gap-4">
                      <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">5</span>
                      <div>
                        <h4 className="font-medium">Submit for Review</h4>
                        <p className="text-sm text-muted-foreground">Our team reviews new properties within 24-48 hours</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Important: Get Verified First
                  </h4>
                  <p className="text-sm text-amber-700">
                    Properties from verified owners are prioritized in search results and receive the "Verified Owner ✓" 
                    badge, increasing trust and booking rates by up to 40%.
                  </p>
                </div>
              </section>
            )}

            {/* Create Listing */}
            {activeRole === "owner" && (isPrinting || activeSection === "create-listing") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Create a Listing</h1>
                  <p className="text-xl text-muted-foreground">
                    Once your property is registered, create listings for specific date ranges to attract renters.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Listing Creation Steps</h3>
                  <ol className="space-y-4 text-sm">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Select your property</strong> — Choose from your registered properties
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Set check-in and check-out dates</strong> — When is your unit available?
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Set your nightly rate</strong> — Per-night pricing (total is calculated automatically based on dates)
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Add optional fees</strong> — Cleaning fee and/or resort fee (shown separately to renters at checkout)
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Choose cancellation policy</strong> — Flexible, Moderate, Strict, or Super Strict
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Optionally enable flexible pricing</strong> — Allow renters to submit competitive offers
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Submit for approval</strong> — RAV team reviews within 24-48 hours
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-6">
                    <h4 className="font-semibold mb-3">Standard Listing</h4>
                    <p className="text-sm text-muted-foreground">
                      Set a nightly rate plus optional cleaning and resort fees. Renters book directly through Stripe secure checkout with a full fee breakdown.
                    </p>
                  </div>
                  <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Gavel className="h-4 w-4 text-primary" />
                      Open for Flexible Pricing
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Enable flexible pricing. Set a reserve price (minimum you'll accept) and offer deadline.
                      Review and accept the best offer.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Manage Bids */}
            {activeRole === "owner" && (isPrinting || activeSection === "manage-bids") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Manage Offers & Proposals</h1>
                  <p className="text-xl text-muted-foreground">
                    The RAV marketplace offers two ways to connect with renters through price negotiation.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Gavel className="h-5 w-5 text-primary" />
                    Receiving Offers on Your Listings
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    When you enable "Open for Flexible Pricing" on a listing, renters can submit offers below your asking price.
                  </p>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Go to Owner Dashboard → "My Offers" tab</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Review incoming offers with renter details and offer amounts</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Accept the best offer before the deadline (or let flexible pricing continue)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Accepted offers convert to confirmed bookings</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    Responding to Travel Requests
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Renters can post "Travel Requests" specifying their destination, dates, and budget. 
                    You can submit proposals offering your property.
                  </p>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Browse the Name Your Price page for matching travel requests</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Click "Submit Proposal" on a request that fits your property</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Enter your proposed price and any special notes</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>If the renter accepts, you'll be notified to confirm</span>
                    </li>
                  </ol>
                </div>
              </section>
            )}

            {/* Confirm Bookings */}
            {activeRole === "owner" && (isPrinting || activeSection === "confirm-bookings") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Confirm Bookings</h1>
                  <p className="text-xl text-muted-foreground">
                    After a renter books, you must confirm you can fulfill the reservation within 48 hours.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    48-Hour Confirmation Deadline
                  </h4>
                  <p className="text-sm text-red-700">
                    You have 48 hours from booking to confirm. Unconfirmed bookings are automatically cancelled 
                    with a full refund to the renter. Repeated failures may result in account suspension.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Confirm a Booking</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Go to Owner Dashboard → "Booking Confirmations" tab</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Review the booking details (dates, guest count, special requests)</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Verify you can provide the unit as described</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Upload your booking confirmation from the resort (if available)</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Click "Confirm Booking" to finalize</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h4 className="font-medium text-green-800 mb-2">After Confirmation</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Renter receives confirmation email with your contact info</li>
                    <li>• Provide check-in instructions 24 hours before arrival</li>
                    <li>• Funds remain in escrow until 5 days after checkout</li>
                  </ul>
                </div>
              </section>
            )}

            {/* Receive Payouts */}
            {activeRole === "owner" && (isPrinting || activeSection === "receive-payouts") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Receive Payouts</h1>
                  <p className="text-xl text-muted-foreground">
                    Get paid securely after successful guest stays.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Payout Timeline</h3>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    {[
                      { stage: "Booking", desc: "Payment collected and held in escrow" },
                      { stage: "Check-in", desc: "Renter confirms arrival at property" },
                      { stage: "Checkout", desc: "Stay completes successfully" },
                      { stage: "+5 Days", desc: "Funds released to your account" },
                    ].map((item, i) => (
                      <div key={i} className="relative flex gap-4 pb-6">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 z-10">
                          {i + 1}
                        </div>
                        <div className="pt-1">
                          <h4 className="font-medium text-sm">{item.stage}</h4>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-4">Payout Calculation</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Booking Total</span>
                      <span className="font-medium">$1,000</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Platform Commission (15%)</span>
                      <span>-$150</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-primary">
                      <span>Your Payout</span>
                      <span>$850</span>
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-primary" />
                    Set Up Stripe Connect
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    To receive automated payouts directly to your bank account, connect your Stripe account:
                  </p>
                  <ol className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Go to Owner Dashboard → "Earnings" tab</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Click "Connect Stripe Account" in the banner at the top</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Complete the Stripe onboarding (identity verification, bank details)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Once connected, payouts are processed automatically after the 5-day hold period</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold mb-3">Track Your Earnings</h3>
                  <p className="text-sm text-muted-foreground">
                    View all earnings, pending payouts, and transaction history in Owner Dashboard → "Earnings" tab.
                    You can see your Stripe connection status and payout history at any time.
                  </p>
                </div>
              </section>
            )}

            {/* Owner Cancellations */}
            {activeRole === "owner" && (isPrinting || activeSection === "cancellations") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Cancellations</h1>
                  <p className="text-xl text-muted-foreground">
                    Understand when and how to cancel bookings as an owner.
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Owner Cancellation Policy
                  </h4>
                  <p className="text-sm text-red-700">
                    If you cancel a confirmed booking, the renter receives a full refund regardless of the cancellation policy.
                    Repeated cancellations may affect your account standing and search ranking.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Cancel a Booking</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Go to Owner Dashboard → "Bookings" tab</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Find the booking you need to cancel</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Click "Cancel Booking" and provide a reason</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>The renter is automatically refunded in full and notified via email</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Renter Cancellation Policies</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    When a renter cancels, the refund amount depends on the cancellation policy you set on the listing:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-background rounded">
                      <span className="font-medium">Flexible</span>
                      <span className="text-muted-foreground">Full refund up to 24 hours before check-in</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-background rounded">
                      <span className="font-medium">Moderate</span>
                      <span className="text-muted-foreground">Full refund up to 5 days before check-in</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-background rounded">
                      <span className="font-medium">Strict</span>
                      <span className="text-muted-foreground">50% refund up to 7 days before check-in</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-background rounded">
                      <span className="font-medium">Super Strict</span>
                      <span className="text-muted-foreground">No refund after booking confirmation</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Portfolio Overview */}
            {activeRole === "owner" && (isPrinting || activeSection === "portfolio") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Portfolio Overview</h1>
                  <p className="text-xl text-muted-foreground">
                    See all your properties and their performance at a glance.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">What You'll See</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Property Cards</strong> — Each property shows its brand, location, unit details, and key stats (active listings, bookings, revenue)</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Status Calendar</strong> — Color-coded date bars showing availability, bookings, and expired listings for each property</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Summary Stats</strong> — Total properties, active listings, total bookings, and lifetime revenue across your portfolio</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-800 mb-2">How to Access</h4>
                  <p className="text-sm text-blue-700">
                    Go to Owner Dashboard → "Dashboard" tab → "Portfolio Overview" section. Click any property card to jump to its listings.
                  </p>
                </div>
              </section>
            )}

            {/* Pricing Suggestions */}
            {activeRole === "owner" && (isPrinting || activeSection === "pricing-suggestions") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Pricing Suggestions</h1>
                  <p className="text-xl text-muted-foreground">
                    Get market-based pricing guidance when setting your nightly rate.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How It Works</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    When you create or edit a listing, the platform analyzes similar listings (same brand and location)
                    to show you the current market rate range.
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Market Range Bar</strong> — Visual gradient showing the low, average, and high nightly rates for comparable listings</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Competitive Label</strong> — Your rate is labeled as "Below Market", "Competitive", or "Above Market"</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Smart Filtering</strong> — Only active, approved listings from the same brand and location are compared</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Dynamic Pricing Factors</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    When enough historical data is available, the platform also suggests an optimized nightly rate
                    based on three factors:
                  </p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Urgency</strong> — Suggests discounts as your check-in date approaches (up to 15% off for last-minute availability)</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Seasonality</strong> — Adjusts based on what similar properties actually booked for in the same month historically</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Demand</strong> — Identifies when demand is high (many pending bids or saved searches) and suggests a premium</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Tip
                  </h4>
                  <p className="text-sm text-amber-700">
                    Pricing suggestions appear in the List Property form (Step 2) and when editing listing rates in
                    your Owner Dashboard. If there aren't enough comparable listings, no suggestion is shown.
                    Dynamic pricing factors require historical booking data and appear alongside the market range.
                  </p>
                </div>
              </section>
            )}

            {/* Referral Program */}
            {activeRole === "owner" && (isPrinting || activeSection === "referral-program") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Referral Program</h1>
                  <p className="text-xl text-muted-foreground">
                    Invite other timeshare owners and earn rewards when they join and book.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How It Works</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <span>Go to Owner Dashboard &rarr; Account tab &rarr; Referral Program section</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <span>Copy your unique referral link and share it with other timeshare owners</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <span>When someone signs up using your link, they appear in your referral list as "pending"</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
                      <span>Once they complete their first booking, the referral converts and you earn a reward</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Your Dashboard</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Referral Link</strong> — Your unique shareable link with one-click copy</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Stats Cards</strong> — Total referrals, conversion rate, and total rewards earned</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Referral History</strong> — List of all referred users with their status (pending or converted)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-800 mb-2">Rewards</h4>
                  <p className="text-sm text-blue-700">
                    The default reward is a commission discount applied to your future bookings.
                    Reward rates are configured by the platform and may change over time.
                  </p>
                </div>
              </section>
            )}

            {/* iCal Export */}
            {activeRole === "owner" && (isPrinting || activeSection === "ical-export") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Calendar Export (iCal)</h1>
                  <p className="text-xl text-muted-foreground">
                    Export your bookings to Google Calendar, Apple Calendar, Outlook, or any calendar app.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Export</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <span>Go to Owner Dashboard → "Bookings & Earnings" tab → "Bookings" section</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <span>Click the "Export Calendar" button in the toolbar</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <span>A <code className="bg-muted px-1 rounded">.ics</code> file downloads containing all confirmed bookings</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
                      <span>Open the file with your calendar app — events include resort name, dates, and guest details</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-800 mb-2">Supported Calendars</h4>
                  <p className="text-sm text-blue-700">
                    The iCal format (RFC 5545) works with Google Calendar, Apple Calendar, Microsoft Outlook,
                    Yahoo Calendar, and most other calendar applications. Each booking appears as an all-day event.
                  </p>
                </div>
              </section>
            )}

            {/* Idle Week Alerts */}
            {activeRole === "owner" && (isPrinting || activeSection === "idle-alerts") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Idle Week Alerts</h1>
                  <p className="text-xl text-muted-foreground">
                    Get notified when your weeks are sitting idle so you can take action before they go unused.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How It Works</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    The platform automatically monitors your listings and sends email alerts at two key milestones:
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-800">60-Day Warning</h4>
                        <p className="text-sm text-amber-700">Your listing check-in is 60 days away with no bookings yet. Consider adjusting your price.</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-3 bg-red-50 rounded-lg border border-red-200">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-800">30-Day Urgent Alert</h4>
                        <p className="text-sm text-red-700">Only 30 days left and still no bookings. Strong recommendation to lower your price or promote.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-800 mb-2">Note</h4>
                  <p className="text-sm text-blue-700">
                    Alerts are sent automatically — no setup required. You'll only receive each alert once per listing.
                    Alerts include a direct link to edit your listing's pricing.
                  </p>
                </div>
              </section>
            )}

            {/* Owner Profiles */}
            {activeRole === "owner" && (isPrinting || activeSection === "owner-profiles") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Owner Profiles</h1>
                  <p className="text-xl text-muted-foreground">
                    Your public profile helps renters trust you and learn about your properties.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">What Renters See</h3>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Profile Card</strong> — Your name, membership tier, verified badge, and member-since date</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Property Count</strong> — How many properties you have listed on the platform</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Review Summary</strong> — Average rating and total review count from past guests</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Response Rate</strong> — How quickly you typically respond to inquiries and offers</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-800 mb-2">Where It Appears</h4>
                  <p className="text-sm text-blue-700">
                    Your owner profile card is shown on each of your property detail pages. Getting verified
                    and maintaining good reviews helps attract more bookings.
                  </p>
                </div>
              </section>
            )}

            {/* Dashboard Navigation */}
            {activeRole === "owner" && (isPrinting || activeSection === "dashboard-nav") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Dashboard Navigation</h1>
                  <p className="text-xl text-muted-foreground">
                    Your Owner Dashboard is organized into 4 main tabs with collapsible sub-sections.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { tab: "Dashboard", desc: "Overview stats, portfolio overview, pricing intelligence, and demand signals. Your home base for quick insights.", sections: "Overview Stats, Portfolio, Pricing Intelligence, Demand Signals" },
                    { tab: "My Listings", desc: "All your properties and listings. Add properties, create listings, edit pricing, and manage availability.", sections: "My Properties, My Listings (active/pending/expired)" },
                    { tab: "Bookings & Earnings", desc: "Track bookings, manage payouts, view earnings breakdown, and export calendar.", sections: "Bookings, Earnings, Stripe Connect, Calendar Export" },
                    { tab: "Account", desc: "Profile settings, verification status, and notification preferences.", sections: "Account Settings, Verification, Notifications" },
                  ].map((item, i) => (
                    <div key={i} className="bg-card rounded-xl p-6 border">
                      <h4 className="font-medium mb-2">{item.tab}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{item.desc}</p>
                      <p className="text-xs text-muted-foreground"><strong>Sub-sections:</strong> {item.sections}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-800 mb-2">Tip</h4>
                  <p className="text-sm text-blue-700">
                    Each sub-section is collapsible — click the header to expand or collapse it.
                    If you bookmarked an old tab URL, it will automatically redirect to the correct new tab.
                  </p>
                </div>
              </section>
            )}

            {/* Owner Account & Preferences */}
            {activeRole === "owner" && (isPrinting || activeSection === "account-settings") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Account & Preferences</h1>
                  <p className="text-xl text-muted-foreground">
                    Manage your profile, security settings, and notification preferences.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Profile Settings
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go to <strong>Account Settings</strong> (click your avatar in the header) to manage:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Full Name & Phone</strong> — Update your contact information</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Password</strong> — Change your password (minimum 6 characters)</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Account Info</strong> — View your roles and membership date</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Control which emails you receive. Go to Account Settings → Notification Preferences to toggle:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Booking Updates</strong> — Booking confirmations, cancellations, payout notifications</li>
                    <li>• <strong>Offers & Proposals</strong> — New offers on your listings, offer acceptance, deadline reminders</li>
                    <li>• <strong>Travel Requests</strong> — New matching travel requests, proposal acceptance</li>
                    <li>• <strong>Marketing & Updates</strong> — Product updates, tips, and platform news</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3">
                    Transactional emails (password resets, security alerts) cannot be disabled.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <MailCheck className="h-5 w-5" />
                    Email Verification
                  </h4>
                  <p className="text-sm text-amber-700">
                    Your email must be verified to use all platform features. If you haven't verified yet,
                    check your inbox for the verification link or request a new one from the notification banner.
                  </p>
                </div>
              </section>
            )}

            {/* Owner FAQ */}
            {activeRole === "owner" && (isPrinting || activeSection === "owner-faq") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Owner FAQ</h1>
                  <p className="text-xl text-muted-foreground">
                    Common questions from property owners.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { q: "How much does it cost to list?", a: "Listing is free. We only charge a 15% commission when your property is booked." },
                    { q: "What if I need to cancel a booking?", a: "Go to Owner Dashboard → Bookings, click 'Cancel Booking' on the reservation. The renter receives a full refund automatically. Repeated cancellations affect your account standing and search ranking. See the Cancellations section for details." },
                    { q: "How do I get the verified badge?", a: "Upload your government ID and vacation club membership documentation in Owner Dashboard → Verification tab." },
                    { q: "Can I set a minimum offer amount?", a: "Yes, when enabling flexible pricing you can set a 'reserve price' - the minimum you'll accept. Offers below this are marked accordingly." },
                    { q: "What cancellation policy should I choose?", a: "Flexible policies attract more bookings but carry more risk. Strict policies protect your income but may reduce bookings. Start with Moderate." },
                    { q: "How do I provide check-in instructions?", a: "After confirming a booking, you can add check-in details that are shared with the renter 24 hours before arrival." },
                    { q: "What if the renter reports an issue?", a: "RAV support will contact you to resolve. Maintain accurate listings and prompt communication to avoid disputes." },
                  ].map((item, i) => (
                    <div key={i} className="bg-card rounded-xl p-6 border">
                      <h4 className="font-medium mb-2">{item.q}</h4>
                      <p className="text-sm text-muted-foreground">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ============ TRAVELER SECTIONS ============ */}

            {/* Renter Getting Started */}
            {activeRole === "renter" && (isPrinting || activeSection === "getting-started") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Welcome, Renter!</h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Discover premium vacation club resorts at prices you name. Book directly from verified owners 
                    and enjoy protected transactions.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-8 border border-blue-500/20">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">🧳</span>
                    <h2 className="text-2xl font-semibold">Why Book on RAV?</h2>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Escrow Protected</p>
                    </div>
                    <div className="text-center">
                      <Gavel className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Name Your Price</p>
                    </div>
                    <div className="text-center">
                      <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm text-muted-foreground">Premium Resorts</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                    <MailCheck className="h-5 w-5" />
                    Email Verification & Account Approval
                  </h4>
                  <p className="text-sm text-amber-700 mb-2">
                    After signing up, verify your email address by clicking the link sent to your inbox.
                    Then your account will be reviewed by our team — you'll receive an email once approved,
                    typically within 24 hours. Until then, you'll see a "Pending Approval" page when you log in.
                  </p>
                  <p className="text-xs text-amber-600">
                    Didn't receive the verification email? Check your spam folder or click "Resend" on the verification banner.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Voice Search</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Use our AI-powered voice search to find properties by speaking naturally. Just click the microphone
                    icon on the search page and say what you're looking for.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• You must be logged in to use voice search</li>
                    <li>• Voice search quotas are tier-based: Free (5/day), Plus/Pro (25/day), Premium/Business (unlimited)</li>
                    <li>• Manual text search is always available with no limits</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Three Ways to Book</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-card rounded-xl p-6 border text-center">
                      <Search className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h4 className="font-medium mb-2">Book Directly</h4>
                      <p className="text-xs text-muted-foreground">Browse listings and book at listed prices</p>
                    </div>
                    <div className="bg-card rounded-xl p-6 border text-center">
                      <Gavel className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h4 className="font-medium mb-2">Make an Offer</h4>
                      <p className="text-xs text-muted-foreground">Offer your price on open listings</p>
                    </div>
                    <div className="bg-card rounded-xl p-6 border text-center">
                      <Plane className="h-8 w-8 mx-auto mb-3 text-primary" />
                      <h4 className="font-medium mb-2">Post a Request</h4>
                      <p className="text-xs text-muted-foreground">Tell us where you want to go; owners come to you</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Search & Book */}
            {activeRole === "renter" && (isPrinting || activeSection === "search-book") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Search & Book</h1>
                  <p className="text-xl text-muted-foreground">
                    Find your perfect vacation rental and book securely.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Search</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Enter your destination (city, state, or resort name)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Select your check-in and check-out dates</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Filter by price, amenities, or resort brand</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Click on a listing to view details and photos</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
                  <h3 className="font-semibold text-lg mb-4">Voice Search</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click the microphone icon next to the search button and speak naturally:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 mb-3">
                    <li>• "Find 2-bedroom properties in Orlando near Disney"</li>
                    <li>• "Show me Hilton properties in Hawaii"</li>
                    <li>• "Properties with pool under $300 per night"</li>
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Voice search requires a logged-in account. Your daily quota depends on your membership tier:
                    Free (5/day), Plus/Pro (25/day), Premium/Business (unlimited).
                    A quota indicator next to the search bar shows your remaining searches.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Book</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Review listing details, cancellation policy, and total price</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Click "Book Now" to proceed to checkout</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Review the fee breakdown (nightly rate, service fee, cleaning fee, applicable taxes)</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Complete secure payment via Stripe</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Owner confirms within 48 hours</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Receive confirmation email with details</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Understanding the Fee Breakdown</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    At checkout, you'll see a transparent breakdown of all charges:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nightly rate × number of nights</span>
                      <span className="font-medium">Base price</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service fee (15%)</span>
                      <span className="font-medium">Platform fee</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cleaning fee (if applicable)</span>
                      <span className="font-medium">Set by owner</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxes</span>
                      <span className="font-medium">Calculated by location</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>All-in price</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Travel Requests */}
            {activeRole === "renter" && (isPrinting || activeSection === "travel-requests") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Submit Travel Requests</h1>
                  <p className="text-xl text-muted-foreground">
                    Tell us where you want to go and let property owners compete for your booking.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-6 border">
                  <h3 className="font-semibold mb-3">How Travel Requests Work</h3>
                  <p className="text-sm text-muted-foreground">
                    Post your travel plans publicly. Property owners see your request and submit proposals 
                    with their best offers. You choose the one that fits your needs and budget.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Create a Travel Request</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Go to Name Your Price and click "Post Travel Request"</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Enter your destination (be specific or flexible)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Select your travel dates (or date range if flexible)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Set your budget (this is your target, not a binding offer)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
                      <span>Add preferences (unit size, amenities, etc.)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">6</span>
                      <span>Submit and wait for owner proposals</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h4 className="font-medium mb-2">Review & Accept Proposals</h4>
                  <p className="text-sm text-muted-foreground">
                    Check your dashboard for incoming proposals. Compare properties, prices, and owner ratings. 
                    Accept the best offer to proceed to booking.
                  </p>
                </div>
              </section>
            )}

            {/* Place Bids */}
            {activeRole === "renter" && (isPrinting || activeSection === "place-bids") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Make Offers on Listings</h1>
                  <p className="text-xl text-muted-foreground">
                    Found a property you love? Offer your price and see if the owner accepts.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Make an Offer</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Find listings marked "Open for Offers" in search results</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Review the listing details and current asking price</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Click "Make Offer" and enter your offer amount</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Add a note to the owner (optional)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">5</span>
                      <span>Submit your offer before the deadline</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                  <h4 className="font-medium text-amber-800 mb-2">Offer Tips</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Research similar listings to make competitive offers</li>
                    <li>• Offers closer to asking price are more likely to be accepted</li>
                    <li>• You can update your offer until the deadline</li>
                    <li>• If accepted, you'll proceed to payment immediately</li>
                  </ul>
                </div>
              </section>
            )}

            {/* My Bookings & Cancellations */}
            {activeRole === "renter" && (isPrinting || activeSection === "my-bookings") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">My Bookings & Cancellations</h1>
                  <p className="text-xl text-muted-foreground">
                    View, manage, and cancel your bookings from one place.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    My Bookings Page
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Access your bookings from the header navigation or go to <strong>/my-bookings</strong>. You can filter by:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>All Bookings</strong> — See every booking you've made</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Upcoming</strong> — Future bookings that haven't checked in yet</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Past</strong> — Completed stays and cancelled bookings</span>
                    </li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    Each booking card shows the resort name, dates, status badge (confirmed, pending, cancelled),
                    and total amount paid.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Ban className="h-5 w-5 text-primary" />
                    How to Cancel a Booking
                  </h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">1</span>
                      <span>Go to My Bookings and find the booking you want to cancel</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">2</span>
                      <span>Click the "Cancel" button on the booking card</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">3</span>
                      <span>Review the refund amount based on the listing's cancellation policy</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold">4</span>
                      <span>Confirm the cancellation — your refund is processed via Stripe</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-muted/50 rounded-xl p-6">
                  <h3 className="font-semibold mb-3">Cancellation Policies & Refunds</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Refund amounts depend on the cancellation policy set by the owner:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center p-2 bg-background rounded">
                      <span className="font-medium">Flexible</span>
                      <span className="text-muted-foreground">Full refund up to 24 hours before check-in</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-background rounded">
                      <span className="font-medium">Moderate</span>
                      <span className="text-muted-foreground">Full refund up to 5 days before check-in</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-background rounded">
                      <span className="font-medium">Strict</span>
                      <span className="text-muted-foreground">50% refund up to 7 days before check-in</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-background rounded">
                      <span className="font-medium">Super Strict</span>
                      <span className="text-muted-foreground">No refund after booking confirmation</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    The cancellation policy is displayed on the listing page and at checkout. Always review it before booking.
                  </p>
                </div>
              </section>
            )}

            {/* Check-in Process */}
            {activeRole === "renter" && (isPrinting || activeSection === "checkin") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Check-In Process</h1>
                  <p className="text-xl text-muted-foreground">
                    Confirm your arrival and report any issues for protected stays.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    Before You Arrive
                  </h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Check-in instructions sent 24 hours before arrival</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Save owner contact information for arrival questions</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Review property amenities and resort check-in procedures</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h4 className="font-medium text-green-800 mb-3">Confirm Your Check-In</h4>
                  <p className="text-sm text-green-700 mb-3">
                    After arriving, confirm check-in through your dashboard or the link in your confirmation email. 
                    This starts the countdown for owner payout and confirms everything is as expected.
                  </p>
                  <div className="bg-white rounded-lg p-4">
                    <ol className="text-sm text-green-800 space-y-2">
                      <li>1. Go to your booking details page</li>
                      <li>2. Click "Confirm Check-In"</li>
                      <li>3. Select "Everything looks great!" or report an issue</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <h4 className="font-medium text-red-800 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Report an Issue
                  </h4>
                  <p className="text-sm text-red-700">
                    If something is wrong (access problems, cleanliness, safety concerns), report it immediately 
                    during check-in. RAV support will work with you and the owner to resolve the issue.
                  </p>
                </div>
              </section>
            )}

            {/* Saved Searches & Price Alerts */}
            {activeRole === "renter" && (isPrinting || activeSection === "saved-searches") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Saved Searches & Price Alerts</h1>
                  <p className="text-xl text-muted-foreground">
                    Save your search criteria and get notified when prices drop.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Save a Search</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <span>Browse listings on the Rentals page and apply your desired filters (location, dates, price range)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <span>Click the "Save Search" button in the toolbar</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <span>Give your search a name (e.g., "Orlando Spring Break")</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Price Drop Alerts</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Each saved search automatically tracks prices. When a listing matching your criteria drops in price,
                    you'll see a "Price Drop" badge on your My Trips dashboard. This helps you find deals without
                    manually checking every day.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-800 mb-2">Where to Find Saved Searches</h4>
                  <p className="text-sm text-blue-700">
                    Go to My Trips → the "Saved Searches" section shows all your saved searches with the latest
                    matching listings and price changes.
                  </p>
                </div>
              </section>
            )}

            {/* Pre-Booking Messaging */}
            {activeRole === "renter" && (isPrinting || activeSection === "pre-booking-messaging") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Pre-Booking Messaging</h1>
                  <p className="text-xl text-muted-foreground">
                    Ask the owner questions before you book — no commitment required.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Send an Inquiry</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <span>Visit any property detail page</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <span>Click "Ask the Owner" button</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <span>Type your question about the property, amenities, check-in process, or anything else</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
                      <span>The owner receives a notification and can reply directly. You'll see responses in the same thread.</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-800 mb-2">Good Questions to Ask</h4>
                  <p className="text-sm text-blue-700">
                    Check-in/check-out procedures, parking details, kitchen equipment,
                    nearby restaurants, shuttle services, or special accommodation needs.
                  </p>
                </div>
              </section>
            )}

            {/* Renter Dashboard */}
            {activeRole === "renter" && (isPrinting || activeSection === "renter-dashboard") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">My Trips Dashboard</h1>
                  <p className="text-xl text-muted-foreground">
                    Your personal travel hub at <code className="bg-muted px-1 rounded">/my-trips</code>.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { tab: "Overview", desc: "Quick stats — upcoming trips, active offers, saved searches. Check-in countdown shows days until your next trip." },
                    { tab: "Bookings", desc: "All your bookings with status, timeline visualization, review buttons, and cancellation options." },
                    { tab: "Offers", desc: "Track all your active bids and offers. See which are pending, accepted, or expired." },
                    { tab: "Favorites", desc: "Properties you've saved, plus your saved searches with price drop alerts." },
                  ].map((item, i) => (
                    <div key={i} className="bg-card rounded-xl p-6 border">
                      <h4 className="font-medium mb-2">{item.tab}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Compare Properties */}
            {activeRole === "renter" && (isPrinting || activeSection === "compare-properties") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Compare Properties</h1>
                  <p className="text-xl text-muted-foreground">
                    Compare up to 3 properties side by side to find your best option.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Compare</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <span>On the Rentals page, click "Compare" to enter comparison mode</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <span>Select up to 3 listings by clicking their checkboxes</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <span>Click "Compare Selected" in the floating bar to open the comparison dialog</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">What's Compared</h3>
                  <p className="text-sm text-muted-foreground">
                    The comparison table shows price per night, total price, dates, location, bedrooms,
                    bathrooms, max guests, amenities, cancellation policy, and fair value score.
                    "Best" badges highlight the top option for each category.
                  </p>
                </div>
              </section>
            )}

            {/* Booking Timeline */}
            {activeRole === "renter" && (isPrinting || activeSection === "booking-timeline") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Booking Timeline</h1>
                  <p className="text-xl text-muted-foreground">
                    Track your booking's progress from confirmation to checkout.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Timeline Steps</h3>
                  <div className="space-y-3">
                    {[
                      { step: "Booked", desc: "Your reservation is confirmed and payment is held in escrow" },
                      { step: "Confirmed", desc: "The owner has confirmed your booking" },
                      { step: "Check-In Ready", desc: "Check-in instructions are available (24h before arrival)" },
                      { step: "In Progress", desc: "You're currently on your vacation" },
                      { step: "Completed", desc: "Your stay is complete — leave a review!" },
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4 p-3 bg-muted/50 rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">
                          {i + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{item.step}</h4>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <h4 className="font-medium text-blue-800 mb-2">Where to Find It</h4>
                  <p className="text-sm text-blue-700">
                    The timeline appears on your booking confirmation page and in My Bookings.
                    A compact horizontal version shows at a glance; click to expand the full vertical timeline.
                  </p>
                </div>
              </section>
            )}

            {/* Reviews & Ratings */}
            {activeRole === "renter" && (isPrinting || activeSection === "reviews") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Reviews & Ratings</h1>
                  <p className="text-xl text-muted-foreground">
                    Share your experience and help other renters make informed decisions.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Write a Review</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <span>After your stay completes, go to My Bookings</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <span>Click "Write Review" on the completed booking card</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <span>Rate your stay (1-5 stars) and write your review</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
                      <span>Your review appears on the property detail page and contributes to the owner's rating</span>
                    </li>
                  </ol>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">Reading Reviews</h3>
                  <p className="text-sm text-muted-foreground">
                    Every property detail page shows a review summary (average rating and count) in the sidebar,
                    plus a full list of reviews with star ratings at the bottom of the page.
                  </p>
                </div>
              </section>
            )}

            {/* Explore Destinations */}
            {activeRole === "renter" && (isPrinting || activeSection === "destinations") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Explore Destinations</h1>
                  <p className="text-xl text-muted-foreground">
                    Discover vacation club properties across 10 popular destinations and 35 cities.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4">How to Browse</h3>
                  <ol className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">1</span>
                      <span>Click "Destinations" in the main navigation</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">2</span>
                      <span>Browse destination cards showing popular regions (Florida, Hawaii, California, etc.)</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">3</span>
                      <span>Click a destination to see available cities and properties in that area</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">4</span>
                      <span>Click any city to jump directly to filtered rental listings for that location</span>
                    </li>
                  </ol>
                </div>
              </section>
            )}

            {/* Renter Protection */}
            {activeRole === "renter" && (isPrinting || activeSection === "protection") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Renter Protection</h1>
                  <p className="text-xl text-muted-foreground">
                    Your booking is protected from payment to checkout.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-card rounded-xl p-6 border">
                    <Shield className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold mb-2">Escrow Protection</h4>
                    <p className="text-sm text-muted-foreground">
                      Your payment is held securely until 5 days after checkout. Owners aren't paid until 
                      you've had a successful stay.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border">
                    <FileCheck className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold mb-2">Owner Verification</h4>
                    <p className="text-sm text-muted-foreground">
                      Verified owners have confirmed their identity and property ownership. Look for the 
                      "Verified Owner ✓" badge.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border">
                    <Clock className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold mb-2">48h Confirmation Guarantee</h4>
                    <p className="text-sm text-muted-foreground">
                      Owners must confirm within 48 hours. If they don't, you receive a full automatic refund.
                    </p>
                  </div>
                  <div className="bg-card rounded-xl p-6 border">
                    <DollarSign className="h-8 w-8 text-primary mb-3" />
                    <h4 className="font-semibold mb-2">Guarantee Fund</h4>
                    <p className="text-sm text-muted-foreground">
                      3% of every transaction goes to a reserve fund for emergency resolutions when things go wrong.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Renter Account & Preferences */}
            {activeRole === "renter" && (isPrinting || activeSection === "account-settings") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Account & Preferences</h1>
                  <p className="text-xl text-muted-foreground">
                    Manage your profile, security, and email notification preferences.
                  </p>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Account Settings
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Click your avatar in the header and select "Account Settings" or go to <strong>/account</strong>.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Profile</strong> — Update your full name and phone number</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Security</strong> — Change your password (minimum 6 characters)</span>
                    </li>
                    <li className="flex gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span><strong>Account Info</strong> — View your roles and member-since date</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-card rounded-xl p-6 border">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notification Preferences
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Control which emails you receive from Rent-A-Vacation:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>Booking Updates</strong> — Confirmation, cancellation, and payout emails</li>
                    <li>• <strong>Offers & Proposals</strong> — Offer status and proposal notifications</li>
                    <li>• <strong>Travel Requests</strong> — Updates on your posted travel requests</li>
                    <li>• <strong>Marketing & Updates</strong> — Product news, tips, and platform updates</li>
                  </ul>
                  <p className="text-xs text-muted-foreground mt-3">
                    Toggle each preference on or off. Transactional emails (password resets, security alerts) cannot be disabled.
                  </p>
                </div>
              </section>
            )}

            {/* Renter FAQ */}
            {activeRole === "renter" && (isPrinting || activeSection === "renter-faq") && (
              <section className="space-y-8 print:break-after-page">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-4">Renter FAQ</h1>
                  <p className="text-xl text-muted-foreground">
                    Common questions from renters.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { q: "Why can't I use voice search?", a: "Voice search requires a logged-in, approved account. If you see a disabled microphone icon, sign in first. If your account is pending approval, wait for the approval email. If you've reached your daily quota (Free: 5, Plus/Pro: 25, Premium/Business: unlimited), try again tomorrow or use manual text search." },
                    { q: "How do I get my account approved?", a: "After signing up, your account is reviewed by our team. You'll receive an email notification once approved (typically within 24 hours). Until then, you'll see a 'Pending Approval' page." },
                    { q: "What is the daily voice search limit?", a: "Voice search quotas are tier-based: Free members get 5/day, Plus/Pro get 25/day, and Premium/Business members have unlimited searches. Quotas reset at midnight. A badge near the search bar shows your remaining searches. Manual text search has no limits." },
                    { q: "Is my payment secure?", a: "Yes, all payments are processed through Stripe and held in escrow until your stay completes successfully." },
                    { q: "What if the owner doesn't confirm?", a: "If the owner doesn't confirm within 48 hours, your booking is automatically cancelled with a full refund." },
                    { q: "Can I cancel my booking?", a: "Yes — go to My Bookings, click 'Cancel' on the booking card, and confirm. Your refund depends on the listing's cancellation policy: Flexible (full refund 24h before), Moderate (full refund 5 days before), Strict (50% refund 7 days before), or Super Strict (no refund). See the My Bookings & Cancellations section for details." },
                    { q: "What if the property isn't as described?", a: "Report the issue during check-in. RAV support will work to resolve it, potentially including relocation or refund." },
                    { q: "How do I contact the owner?", a: "Owner contact information is provided after booking confirmation, 24 hours before check-in." },
                    { q: "Are these real vacation club properties?", a: "Yes, all properties are from verified vacation club and timeshare owners. Verified owners have confirmed ownership documents." },
                    { q: "What's the Guarantee Fund?", a: "3% of each transaction is held in reserve to cover emergency situations requiring platform intervention." },
                  ].map((item, i) => (
                    <div key={i} className="bg-card rounded-xl p-6 border">
                      <h4 className="font-medium mb-2">{item.q}</h4>
                      <p className="text-sm text-muted-foreground">{item.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
              <p>Rent-A-Vacation © {new Date().getFullYear()} — A Techsilon Group Company</p>
              <p className="mt-1">Jacksonville, FL • 1-800-RAV-0800 • rentavacation.com</p>
            </footer>
          </div>
        </main>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
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

export default UserGuide;
