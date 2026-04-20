import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, ShieldCheck, BarChart3, Settings, GitBranch, Plane, Sparkles, MessageSquare, FileText, Gavel, Send, Building2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/bidding/NotificationBell";
import { useUnreadConversationCount } from "@/hooks/useConversations";
import { RoleBadge, getDisplayRole } from "@/components/RoleBadge";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, roles, isPropertyOwner, isRavTeam, signOut, isLoading } = useAuth();
  const displayRole = getDisplayRole(roles);
  const firstName = profile?.full_name?.split(" ")[0];
  const { data: unreadMessages = 0 } = useUnreadConversationCount();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border shadow-sm">
      {/* Skip-to-content link — WCAG 2.4.1 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/rav-logo.svg"
              alt="Rent-A-Vacation"
              className="h-14 md:h-16 w-auto select-none"
              draggable={false}
            />
            <span className="font-display font-bold text-xl text-foreground tracking-tight">Rent-A-Vacation</span>
          </Link>

          {/* Desktop Navigation — shared core + role layers */}
          <nav className="hidden md:flex items-center gap-1" data-testid="desktop-nav">
            {/* CORE: Browse Rentals dropdown — all roles */}
            <div
              className="relative pb-2 -mb-2"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                className={`flex items-center gap-1 cursor-pointer group px-3 py-2 rounded-lg transition-colors ${
                  isActive("/rentals") || isActive("/destinations") || isActive("/rav-deals")
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsDropdownOpen(false);
                }}
              >
                <span className="text-sm font-semibold">Browse Rentals</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>
              {isDropdownOpen && (
                <div
                  className="absolute top-full left-0 w-52 bg-card rounded-xl shadow-lg border border-border/60 p-1.5 animate-fade-in z-50"
                  role="menu"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsDropdownOpen(false);
                  }}
                >
                  <Link
                    to="/rentals"
                    role="menuitem"
                    className="block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    All Rentals
                  </Link>
                  <Link
                    to="/destinations"
                    role="menuitem"
                    className="block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    By Destination
                  </Link>
                  <Link
                    to="/rav-deals"
                    role="menuitem"
                    className="block px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    RAV Deals
                  </Link>
                </div>
              )}
            </div>

            {/* CORE: Marketplace — single entry for listings + wishes + offers, all roles */}
            <Link
              to="/marketplace"
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                isActive("/marketplace") || isActive("/bidding")
                  ? "text-accent bg-accent/10"
                  : "text-accent hover:text-accent hover:bg-accent/10"
              }`}
            >
              Marketplace
            </Link>

            {/* ROLE: Owner — My Rentals */}
            {user && isPropertyOwner() && (
              <Link
                to="/owner-dashboard"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/owner-dashboard")
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                My Rentals
              </Link>
            )}

            {/* ROLE: Renter or Owner (not team) — My Trips */}
            {user && !isRavTeam() && (
              <Link
                to="/my-trips"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/my-trips")
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                My Trips
              </Link>
            )}

            {/* UNAUTHENTICATED: How It Works */}
            {!user && (
              <Link
                to="/how-it-works"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/how-it-works")
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                How It Works
              </Link>
            )}

            {/* UNAUTHENTICATED: List Your Property */}
            {!user && (
              <Link
                to="/list-property"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/list-property")
                    ? "text-foreground bg-muted/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                List Your Property
              </Link>
            )}

            {/* UNAUTHENTICATED: Free Tools */}
            {!user && (
              <Link
                to="/tools"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  isActive("/tools") || isActive("/calculator")
                    ? "text-primary bg-primary/5"
                    : "text-primary/80 hover:text-primary hover:bg-primary/5"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Free Tools
              </Link>
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <Link to="/messages" className="relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/30">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                  {unreadMessages > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1 flex items-center justify-center text-[10px]">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Badge>
                  )}
                </Link>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
                        {(firstName || user.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="max-w-32 truncate">Hi, {firstName || user.email?.split("@")[0]}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{profile?.full_name || "User"}</p>
                        {displayRole && <RoleBadge role={displayRole} variant="compact" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {/* Renter activity — everyone non-team sees this */}
                    {!isRavTeam() && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/my-trips" className="flex items-center gap-2 cursor-pointer">
                            <Plane className="h-4 w-4" />
                            My Trips
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/my-trips?tab=offers" className="flex items-center gap-2 cursor-pointer">
                            <Gavel className="h-4 w-4" />
                            My Offers
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/my-trips?tab=offers&sub=wishes" className="flex items-center gap-2 cursor-pointer">
                            <Send className="h-4 w-4" />
                            My Wishes
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {/* Owner activity — property owners see their inventory + offer flows */}
                    {isPropertyOwner() && !isRavTeam() && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/owner-dashboard?tab=my-listings" className="flex items-center gap-2 cursor-pointer">
                            <Building2 className="h-4 w-4" />
                            My Listings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/owner-dashboard?tab=offers-sent" className="flex items-center gap-2 cursor-pointer">
                            <Send className="h-4 w-4" />
                            Offers I Sent
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/owner-dashboard?tab=offers-received" className="flex items-center gap-2 cursor-pointer">
                            <Gavel className="h-4 w-4" />
                            Offers on My Listings
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    {isRavTeam() && (
                      <DropdownMenuItem asChild>
                        <Link to="/my-trips" className="flex items-center gap-2 cursor-pointer">
                          <Plane className="h-4 w-4" />
                          My Trips
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isRavTeam() && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <ShieldCheck className="h-4 w-4" />
                          RAV Ops
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isRavTeam() && (
                      <DropdownMenuItem asChild>
                        <Link to="/executive-dashboard" className="flex items-center gap-2 cursor-pointer">
                          <BarChart3 className="h-4 w-4" />
                          RAV Insights
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isRavTeam() && (
                      <DropdownMenuItem asChild>
                        <Link to="/user-journeys" className="flex items-center gap-2 cursor-pointer">
                          <GitBranch className="h-4 w-4" />
                          User Journeys
                        </Link>
                      </DropdownMenuItem>
                    )}

                    {(isPropertyOwner() || isRavTeam()) && (
                      <DropdownMenuItem asChild>
                        <Link to="/list-property" className="flex items-center gap-2 cursor-pointer">
                          <FileText className="h-4 w-4" />
                          List a Property
                        </Link>
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem asChild>
                      <Link to="/tools" className="flex items-center gap-2 cursor-pointer">
                        <Sparkles className="h-4 w-4" />
                        Free Tools
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="h-4 w-4" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="default" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: User indicator + Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {isLoading && (
              <div className="h-8 w-16 bg-muted animate-pulse rounded-full" />
            )}
            {user && !isLoading && (
              <div className="flex items-center gap-2">
                <Link to="/messages" className="relative flex items-center p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
                  <MessageSquare className="h-5 w-5" />
                  {unreadMessages > 0 && (
                    <Badge variant="destructive" className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-0.5 flex items-center justify-center text-[9px]">
                      {unreadMessages > 99 ? '99+' : unreadMessages}
                    </Badge>
                  )}
                </Link>
                <NotificationBell />
                <button
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 hover:bg-primary/15 transition-colors"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  title={profile?.full_name || user.email || "Account"}
                >
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
                    {(firstName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground max-w-20 truncate">
                    {firstName || "Me"}
                  </span>
                </button>
              </div>
            )}
            <button
              className="p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-b border-border animate-slide-up">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {/* Mobile: User greeting */}
            {user && (
              <div className="flex items-center gap-3 pb-3 border-b border-border">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-semibold flex-shrink-0">
                  {(profile?.full_name || user.email || "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{profile?.full_name || "Welcome!"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  {displayRole && <RoleBadge role={displayRole} variant="compact" />}
                </div>
              </div>
            )}

            {/* CORE mobile nav — all roles */}
            <Link
              to="/rentals"
              className={`py-2.5 text-sm font-medium transition-colors ${isActive("/rentals") ? "text-foreground" : "text-muted-foreground"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Rentals
            </Link>
            <Link
              to="/destinations"
              className={`py-2.5 text-sm font-medium transition-colors ${isActive("/destinations") ? "text-foreground" : "text-muted-foreground"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Destinations
            </Link>
            <Link
              to="/rav-deals"
              className={`py-2.5 text-sm font-medium transition-colors ${isActive("/rav-deals") ? "text-foreground" : "text-muted-foreground"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              RAV Deals
            </Link>
            <Link
              to="/marketplace"
              className={`py-2.5 text-sm font-bold transition-colors ${isActive("/marketplace") || isActive("/bidding") ? "text-accent" : "text-accent/80"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Marketplace
            </Link>

            {/* ROLE: Owner — My Rentals + owner-specific activity */}
            {user && isPropertyOwner() && (
              <>
                <Link
                  to="/owner-dashboard"
                  className={`py-2.5 text-sm font-medium transition-colors ${isActive("/owner-dashboard") ? "text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Rentals
                </Link>
                <Link
                  to="/owner-dashboard?tab=offers-sent"
                  className="py-2.5 text-sm font-medium transition-colors text-muted-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Offers I Sent
                </Link>
                <Link
                  to="/owner-dashboard?tab=offers-received"
                  className="py-2.5 text-sm font-medium transition-colors text-muted-foreground"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Offers on My Listings
                </Link>
              </>
            )}

            {/* ROLE: Renter or Owner (not team) — My Trips + My Offers + My Wishes */}
            {user && !isRavTeam() && (
              <>
                <Link
                  to="/my-trips"
                  className={`py-2.5 text-sm font-medium transition-colors ${isActive("/my-trips") ? "text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Trips
                </Link>
                {!isPropertyOwner() && (
                  <>
                    <Link
                      to="/my-trips?tab=offers"
                      className="py-2.5 text-sm font-medium transition-colors text-muted-foreground"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Offers
                    </Link>
                    <Link
                      to="/my-trips?tab=offers&sub=wishes"
                      className="py-2.5 text-sm font-medium transition-colors text-muted-foreground"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Wishes
                    </Link>
                  </>
                )}
              </>
            )}

            {/* UNAUTHENTICATED: How It Works + List Your Property */}
            {!user && (
              <>
                <Link
                  to="/how-it-works"
                  className={`py-2.5 text-sm font-medium transition-colors ${isActive("/how-it-works") ? "text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  How It Works
                </Link>
                <Link
                  to="/list-property"
                  className={`py-2.5 text-sm font-medium transition-colors ${isActive("/list-property") ? "text-foreground" : "text-muted-foreground"}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  List Your Property
                </Link>
              </>
            )}

            {/* Free Tools + FAQs — visible to all authenticated users + unauthenticated */}
            <Link
              to="/tools"
              className="py-2.5 text-sm font-medium text-primary flex items-center gap-1.5"
              onClick={() => setIsMenuOpen(false)}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Free Tools
            </Link>
            <Link
              to="/faq"
              className={`py-2.5 text-sm font-medium transition-colors ${isActive("/faq") ? "text-foreground" : "text-muted-foreground"}`}
              onClick={() => setIsMenuOpen(false)}
            >
              FAQs
            </Link>
            
            {user && (
              <div className="border-t border-border pt-4">
                <Link
                  to="/messages"
                  className="flex items-center gap-2 text-foreground py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Messages
                  {unreadMessages > 0 && (
                    <Badge variant="destructive" className="h-5 min-w-5 px-1 text-[10px]">
                      {unreadMessages}
                    </Badge>
                  )}
                </Link>
                {(isPropertyOwner() || isRavTeam()) && (
                  <Link
                    to="/list-property"
                    className="flex items-center gap-2 text-foreground py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <FileText className="h-4 w-4" />
                    List a Property
                  </Link>
                )}
                {isRavTeam() && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 text-foreground py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    RAV Ops
                  </Link>
                )}
                {isRavTeam() && (
                  <Link
                    to="/executive-dashboard"
                    className="flex items-center gap-2 text-foreground py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <BarChart3 className="h-4 w-4" />
                    RAV Insights
                  </Link>
                )}
                {isRavTeam() && (
                  <Link
                    to="/user-journeys"
                    className="flex items-center gap-2 text-foreground py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <GitBranch className="h-4 w-4" />
                    User Journeys
                  </Link>
                )}
                <Link
                  to="/account"
                  className="flex items-center gap-2 text-foreground py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Account Settings
                </Link>
              </div>
            )}
            
            <div className="flex gap-3 pt-4 border-t border-border">
              {isLoading ? (
                <div className="w-full h-10 bg-muted animate-pulse rounded-md" />
              ) : user ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              ) : (
                <>
                  <Link to="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Log In</Button>
                  </Link>
                  <Link to="/signup" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="default" className="w-full">Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
