import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown, User, LogOut, LayoutDashboard, ShieldCheck, Gavel, Store, BarChart3, Calculator, BookOpen, Settings, GitBranch, Plane } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/bidding/NotificationBell";
import { RoleBadge, getDisplayRole } from "@/components/RoleBadge";
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
  const { user, profile, roles, isPropertyOwner, isRavTeam, signOut, isLoading } = useAuth();
  const displayRole = getDisplayRole(roles);
  const firstName = profile?.full_name?.split(" ")[0];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border/50">
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
            <span className="font-display font-bold text-xl text-foreground">Rent-A-Vacation</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <div
              className="relative pb-2 -mb-2"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <button
                className="flex items-center gap-1 cursor-pointer group py-2"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setIsDropdownOpen(false);
                }}
              >
                <span className="text-muted-foreground group-hover:text-foreground transition-colors">Explore</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
              {isDropdownOpen && (
                <div
                  className="absolute top-full left-0 w-56 bg-card rounded-xl shadow-card-hover border border-border p-2 animate-fade-in z-50"
                  role="menu"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setIsDropdownOpen(false);
                  }}
                >
                  <Link
                    to="/rentals"
                    role="menuitem"
                    className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    All Rentals
                  </Link>
                  <Link
                    to="/destinations"
                    role="menuitem"
                    className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    By Destination
                  </Link>
                  <Link
                    to="/rentals?filter=deals"
                    role="menuitem"
                    className="block px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Last Minute Deals
                  </Link>
                  <Link
                    to="/calculator"
                    role="menuitem"
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Calculator className="h-4 w-4" />
                    Fee Calculator
                  </Link>
                </div>
              )}
            </div>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/bidding" className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
              <Store className="h-4 w-4" />
              Name Your Price
            </Link>
            {(isPropertyOwner() || isRavTeam() || !user) && (
              <Link to="/list-property" className="text-muted-foreground hover:text-foreground transition-colors">
                List Your Property
              </Link>
            )}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <div className="flex items-center gap-2">
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
                    
                    <DropdownMenuItem asChild>
                      <Link to="/my-trips" className="flex items-center gap-2 cursor-pointer">
                        <Plane className="h-4 w-4" />
                        My Trips
                      </Link>
                    </DropdownMenuItem>

                    {isRavTeam() && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                          <ShieldCheck className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isRavTeam() && (
                      <DropdownMenuItem asChild>
                        <Link to="/executive-dashboard" className="flex items-center gap-2 cursor-pointer">
                          <BarChart3 className="h-4 w-4" />
                          Executive Dashboard
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

                    {isPropertyOwner() && (
                      <DropdownMenuItem asChild>
                        <Link to="/owner-dashboard" className="flex items-center gap-2 cursor-pointer">
                          <LayoutDashboard className="h-4 w-4" />
                          Owner Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {(isRavTeam() || isPropertyOwner()) && <DropdownMenuSeparator />}

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

            <Link
              to="/rentals"
              className="text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Browse Rentals
            </Link>
            <Link 
              to="/destinations" 
              className="text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Destinations
            </Link>
            <Link 
              to="/how-it-works" 
              className="text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </Link>
            {(isPropertyOwner() || isRavTeam() || !user) && (
              <Link
                to="/list-property"
                className="text-foreground py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                List Your Property
              </Link>
            )}
            <Link
              to="/bidding"
              className="text-foreground py-2 flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Store className="h-4 w-4" />
              Name Your Price
            </Link>
            <Link
              to="/calculator"
              className="text-foreground py-2 flex items-center gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Calculator className="h-4 w-4" />
              Fee Calculator
            </Link>
            <Link
              to="/faq"
              className="text-foreground py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              FAQs
            </Link>
            
            {user && (
              <>
                <div className="border-t border-border pt-4">
                  <Link
                    to="/my-trips"
                    className="flex items-center gap-2 text-foreground py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Plane className="h-4 w-4" />
                    My Trips
                  </Link>
                  {isRavTeam() && (
                    <Link
                      to="/admin"
                      className="flex items-center gap-2 text-foreground py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  {isRavTeam() && (
                    <Link
                      to="/executive-dashboard"
                      className="flex items-center gap-2 text-foreground py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Executive Dashboard
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
                  {isPropertyOwner() && (
                    <Link
                      to="/owner-dashboard"
                      className="flex items-center gap-2 text-foreground py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Owner Dashboard
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
              </>
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
