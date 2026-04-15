import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Calendar,
  SlidersHorizontal,
  Grid3X3,
  List,
  ChevronDown,
  X,
  Loader2,
  Mic,
  ArrowUpDown,
  MapPin,
  Home,
  Star,
  Users,
  Palmtree,
  FerrisWheel,
  Flag,
  Dice5,
  Snowflake,
  Sparkles,
  Mountain as MountainIcon,
  Waves,
  Film,
  Trophy,
  PartyPopper,
  Sun,
  Ghost,
  UtensilsCrossed,
  Gift,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { VoiceStatusIndicator } from "@/components/VoiceStatusIndicator";
import { VoiceQuotaIndicator } from "@/components/VoiceQuotaIndicator";
import { useTextChat } from "@/hooks/useTextChat";
import { TextChatButton } from "@/components/TextChatButton";
import { TextChatPanel } from "@/components/TextChatPanel";
import { useAuth } from "@/hooks/useAuth";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { useToast } from "@/hooks/use-toast";
import { useActiveListings, type ActiveListing } from "@/hooks/useListings";
import { useListingSocialProof } from "@/hooks/useListingSocialProof";
import { ListingCard, BRAND_LABELS, getDisplayName, getLocation, getBrandLabel } from "@/components/ListingCard";
import { useVoiceFeatureFlags } from "@/hooks/useVoiceFeatureFlags";
import { ListingFairValueBadge } from "@/components/fair-value/ListingFairValueBadge";
import { PostRequestCTA } from "@/components/bidding/PostRequestCTA";
import { calculateNights } from "@/lib/pricing";
import { sortListings, SORT_LABELS, type SortOption } from "@/lib/listingSort";
import { CompareListingsDialog } from "@/components/CompareListingsDialog";
import { trackEvent } from "@/lib/posthog";
import { SaveSearchButton } from "@/components/SaveSearchButton";
import { Checkbox } from "@/components/ui/checkbox";
import { ATTRACTION_TAGS, filterByAttractions, type AttractionTag } from "@/lib/attractionTags";
import { getUpcomingEvents, filterByEvent, formatEventDateRange, type CuratedEvent } from "@/lib/events";
import { useCuratedEvents } from "@/hooks/useCuratedEvents";
const ITEMS_PER_PAGE = 6;

// Icon map for attraction tags (keyed by AttractionTagDef.icon)
const ATTRACTION_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "Palmtree": Palmtree,
  "Ferris Wheel": FerrisWheel,
  "Flag": Flag,
  "Dice5": Dice5,
  "Snowflake": Snowflake,
  "Sparkles": Sparkles,
  "Mountain": MountainIcon,
  "Waves": Waves,
};

// Icon map for event categories (keyed by CuratedEvent.icon)
const EVENT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "Film": Film,
  "Trophy": Trophy,
  "PartyPopper": PartyPopper,
  "Sun": Sun,
  "Flag": Flag,
  "Snowflake": Snowflake,
  "Sparkles": Sparkles,
  "Ghost": Ghost,
  "UtensilsCrossed": UtensilsCrossed,
  "Gift": Gift,
  "Palmtree": Palmtree,
};

const Rentals = () => {
  usePageMeta({
    title: 'Browse Vacation Rentals',
    description: 'Search and filter vacation rentals from verified timeshare owners. Compare prices and book at 20-40% off resort rates.',
    canonicalPath: '/rentals',
  });

  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("location") || searchParams.get("brand") || "");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minGuests, setMinGuests] = useState("");
  const [minBedrooms, setMinBedrooms] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [selectedAttractions, setSelectedAttractions] = useState<Set<string>>(new Set());
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [discoveryTab, setDiscoveryTab] = useState<"activity" | "events">("activity");
  const [sortOption, setSortOption] = useState<SortOption>("newest");

  // Curated events (DB-backed) for filter pill bar + event banner
  const { data: curatedEvents = [] } = useCuratedEvents();
  const upcomingEvents = getUpcomingEvents(curatedEvents, undefined, 8);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  // Auth state for voice search gating
  const { user, isPropertyOwner, isRavTeam } = useAuth();
  const isAuthenticated = !!user;

  // Voice feature flags (DB-controlled)
  const { isFeatureActive } = useVoiceFeatureFlags();
  const voiceEnabled = isFeatureActive("search");

  // Favorites
  const { data: favoriteIds = [] } = useFavoriteIds();
  const toggleFavoriteMutation = useToggleFavorite();
  const { toast } = useToast();

  // Real listings from database
  const { data: listings = [], isLoading, error: listingsError } = useActiveListings();
  const { favoritesCount } = useListingSocialProof();

  // Text chat integration
  const [chatOpen, setChatOpen] = useState(false);
  const {
    messages: chatMessages,
    status: chatStatus,
    error: chatError,
    sendMessage: sendChatMessage,
    clearHistory: clearChatHistory,
  } = useTextChat({ context: "rentals" });

  // Voice search integration
  const {
    status: voiceStatus,
    results: voiceResults,
    error: voiceError,
    transcript: voiceTranscript,
    isCallActive,
    startVoiceSearch,
    stopVoiceSearch,
    reset: resetVoice,
  } = useVoiceSearch();

  // Stop voice session if user logs out
  useEffect(() => {
    if (!isAuthenticated && isCallActive) {
      stopVoiceSearch();
    }
  }, [isAuthenticated, isCallActive, stopVoiceSearch]);

  const toggleLike = (id: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save your favorites.",
      });
      return;
    }
    toggleFavoriteMutation.mutate(id);
  };

  // Active filter count for badge
  const activeFilterCount = [
    dateRange?.from,
    minPrice,
    maxPrice,
    minGuests,
    minBedrooms,
    brandFilter && brandFilter !== "all" ? brandFilter : "",
    selectedAttractions.size > 0 ? "attractions" : "",
    selectedEvent || "",
  ].filter(Boolean).length;

  // Filter listings by all criteria
  const baseFiltered = listings.filter((listing) => {
    // Text search (existing)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = getDisplayName(listing).toLowerCase();
      const location = getLocation(listing).toLowerCase();
      const brand = getBrandLabel(listing).toLowerCase();
      if (!location.includes(q) && !name.includes(q) && !brand.includes(q)) return false;
    }

    // Date range overlap
    if (dateRange?.from) {
      const listingStart = new Date(listing.check_in_date);
      const listingEnd = new Date(listing.check_out_date);
      const filterEnd = dateRange.to || dateRange.from;
      if (listingStart > filterEnd || listingEnd < dateRange.from) return false;
    }

    // Price range
    if (minPrice && listing.final_price < Number(minPrice)) return false;
    if (maxPrice && listing.final_price > Number(maxPrice)) return false;

    // Guests
    if (minGuests && listing.property.sleeps < Number(minGuests)) return false;

    // Bedrooms
    if (minBedrooms && listing.property.bedrooms < Number(minBedrooms)) return false;

    // Brand (from filter panel dropdown)
    if (brandFilter && brandFilter !== "all") {
      if (listing.property.brand !== brandFilter) return false;
    }

    return true;
  });

  // Apply attraction + event filters
  const filteredListings = filterByEvent(
    filterByAttractions(baseFiltered, selectedAttractions),
    selectedEvent,
    curatedEvents
  );

  // Sort
  const sortedListings = sortListings(filteredListings, sortOption);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedListings.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedListings = sortedListings.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  // Reset page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateRange, minPrice, maxPrice, minGuests, minBedrooms, brandFilter, selectedAttractions, selectedEvent, sortOption]);

  // Toggle attraction tag selection
  const toggleAttraction = (tag: string) => {
    setSelectedAttractions((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  // Clear all filters helper
  const clearAllFilters = () => {
    setDateRange(undefined);
    setMinPrice("");
    setMaxPrice("");
    setMinGuests("");
    setMinBedrooms("");
    setBrandFilter("");
    setSelectedAttractions(new Set());
    setSelectedEvent(null);
    setSearchQuery("");
    setShowFilters(false);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Header */}
      <section id="main-content" className="pt-20 md:pt-24 pb-6 md:pb-8 bg-muted/40 border-b border-border/60">
        <div className="container mx-auto px-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-1">
            Browse Vacation Rentals
          </h1>
          <p className="text-muted-foreground mb-5 md:mb-6">Find your next stay across 117 resorts.</p>

          {/* Search Bar */}
          <div className="bg-card rounded-xl shadow-card p-4 border border-border/60">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by destination, resort brand, or event..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal pl-10 relative h-10">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    {dateRange?.from ? (
                      <span>
                        {format(dateRange.from, "MMM d")}
                        {dateRange.to ? ` - ${format(dateRange.to, "MMM d")}` : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Check-in - Check-out</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="range"
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={window.innerWidth < 640 ? 1 : 2}
                    disabled={{ before: new Date() }}
                  />
                </PopoverContent>
              </Popover>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => setCurrentPage(1)}>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <TextChatButton
                  onClick={() => setChatOpen(true)}
                  isOpen={chatOpen}
                  disabled={!isAuthenticated}
                  disabledReason={!isAuthenticated ? "Sign in to ask RAVIO" : undefined}
                />
                {voiceEnabled && (
                  <VoiceSearchButton
                    status={voiceStatus}
                    isCallActive={isCallActive}
                    onStart={startVoiceSearch}
                    onStop={stopVoiceSearch}
                    disabled={!isAuthenticated || listings.length === 0}
                    disabledReason={
                      !isAuthenticated
                        ? "Sign in to use voice search"
                        : listings.length === 0
                          ? "No listings available for voice search"
                          : undefined
                    }
                  />
                )}
              </div>
            </div>

            {/* Voice disabled explanation */}
            {voiceEnabled && isAuthenticated && listings.length === 0 && voiceStatus === "idle" && (
              <p className="mt-3 text-sm text-muted-foreground">
                <Mic className="w-3.5 h-3.5 inline mr-1" />
                Voice search is unavailable — no properties are listed yet. Check back soon!
              </p>
            )}
            {voiceEnabled && !isAuthenticated && voiceStatus === "idle" && (
              <p className="mt-3 text-sm text-muted-foreground">
                <Mic className="w-3.5 h-3.5 inline mr-1" />
                <Link to="/login" className="text-primary hover:underline">Sign in</Link> to use voice search.
              </p>
            )}

            {/* Voice Status Indicator */}
            {voiceEnabled && voiceStatus !== "idle" && (
              <VoiceStatusIndicator
                status={voiceStatus}
                transcript={voiceTranscript}
                resultCount={voiceResults.length}
                error={voiceError}
                onDismiss={voiceStatus === "success" || voiceStatus === "error" ? resetVoice : undefined}
              />
            )}

            {/* Voice Quota Indicator */}
            {voiceEnabled && isAuthenticated && listings.length > 0 && (
              <div className="mt-3 flex justify-end">
                <VoiceQuotaIndicator />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Unified Discovery Bar — Airbnb-style horizontal scroll */}
      <section className="py-3 border-b border-border/60 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            {/* Tab toggle */}
            <div className="flex shrink-0 border border-border rounded-lg overflow-hidden shadow-sm">
              <button
                onClick={() => setDiscoveryTab("activity")}
                className={`px-4 py-2 text-sm font-bold transition-colors ${
                  discoveryTab === "activity"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                Activity
              </button>
              <button
                onClick={() => setDiscoveryTab("events")}
                className={`px-4 py-2 text-sm font-bold transition-colors ${
                  discoveryTab === "events"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                Events
              </button>
            </div>

            {/* Scrollable icon bar */}
            <div className="relative flex-1 min-w-0">
              {/* Right fade hint */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />

              <div className="flex items-end gap-7 overflow-x-auto scrollbar-hide pb-3 pt-1">
                {discoveryTab === "activity" ? (
                  <>
                    {ATTRACTION_TAGS.map((tagDef) => {
                      const Icon = ATTRACTION_ICON_MAP[tagDef.icon];
                      const isSelected = selectedAttractions.has(tagDef.tag);
                      return (
                        <button
                          key={tagDef.tag}
                          onClick={() => toggleAttraction(tagDef.tag)}
                          className={`flex flex-col items-center gap-1.5 min-w-[60px] pb-2 transition-colors ${
                            isSelected
                              ? "border-b-2 border-primary"
                              : "border-b-2 border-transparent hover:border-primary/30"
                          }`}
                          aria-pressed={isSelected}
                          aria-label={`Filter by ${tagDef.label}`}
                        >
                          <div className={isSelected ? "text-primary" : "text-primary/70"}>
                            {Icon && <Icon className="w-6 h-6" />}
                          </div>
                          <span className={`text-xs font-semibold whitespace-nowrap ${isSelected ? "text-foreground" : "text-foreground/70"}`}>
                            {tagDef.label}
                          </span>
                        </button>
                      );
                    })}
                    {selectedAttractions.size > 0 && (
                      <button
                        onClick={() => setSelectedAttractions(new Set())}
                        className="flex flex-col items-center gap-1.5 min-w-[48px] pb-2 border-b-2 border-transparent hover:border-muted-foreground/40 transition-colors"
                        aria-label="Clear activity filters"
                      >
                        <X className="w-6 h-6 text-foreground/60" />
                        <span className="text-xs font-semibold text-foreground/60 whitespace-nowrap">Clear</span>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {upcomingEvents.map((event) => {
                      const Icon = EVENT_ICON_MAP[event.icon];
                      const isSelected = selectedEvent === event.slug;
                      return (
                        <button
                          key={event.slug}
                          onClick={() => setSelectedEvent(isSelected ? null : event.slug)}
                          className={`flex flex-col items-center gap-1.5 min-w-[64px] pb-2 transition-colors ${
                            isSelected
                              ? "border-b-2 border-accent"
                              : "border-b-2 border-transparent hover:border-accent/30"
                          }`}
                          aria-pressed={isSelected}
                          aria-label={`Filter by ${event.name}`}
                        >
                          <div className={isSelected ? "text-accent" : "text-accent/70"}>
                            {Icon && <Icon className="w-6 h-6" />}
                          </div>
                          <span className={`text-xs font-semibold whitespace-nowrap ${isSelected ? "text-foreground" : "text-foreground/70"}`}>
                            {event.name}
                          </span>
                        </button>
                      );
                    })}
                    {selectedEvent && (
                      <button
                        onClick={() => setSelectedEvent(null)}
                        className="flex flex-col items-center gap-1.5 min-w-[48px] pb-2 border-b-2 border-transparent hover:border-muted-foreground/40 transition-colors"
                        aria-label="Clear event filter"
                      >
                        <X className="w-6 h-6 text-foreground/60" />
                        <span className="text-xs font-semibold text-foreground/60 whitespace-nowrap">Clear</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event context banner */}
      {selectedEvent && (() => {
        const event = upcomingEvents.find((e) => e.slug === selectedEvent);
        if (!event) return null;
        return (
          <div className="container mx-auto px-4 mt-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-4 py-2 text-sm">
              Showing listings near <span className="font-semibold">{event.name}</span> — {formatEventDateRange(event)}
              {!event.nationwide && event.destinations.length > 0 && (
                <span className="text-muted-foreground"> in {event.destinations.slice(0, 3).join(", ")}{event.destinations.length > 3 ? ` +${event.destinations.length - 3} more` : ""}</span>
              )}
            </div>
          </div>
        );
      })()}

      {/* Filters & Results */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-4">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(true)}>
                Price
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(true)}>
                Bedrooms
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(true)}>
                Resort Brand
                <ChevronDown className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={compareMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setCompareMode(!compareMode);
                  if (compareMode) setCompareIds(new Set());
                }}
              >
                {compareMode ? "Exit Compare" : "Compare"}
              </Button>
              <SaveSearchButton
                criteria={{
                  searchQuery: searchQuery.trim() || undefined,
                  minPrice: minPrice || undefined,
                  maxPrice: maxPrice || undefined,
                  minGuests: minGuests || undefined,
                  minBedrooms: minBedrooms || undefined,
                  brandFilter: brandFilter || undefined,
                  attractionTags: selectedAttractions.size > 0 ? Array.from(selectedAttractions) : undefined,
                  eventSlug: selectedEvent || undefined,
                  dateFrom: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
                  dateTo: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
                }}
              />
              <span className="text-sm text-muted-foreground">
                {filteredListings.length} {filteredListings.length === 1 ? "property" : "properties"} found
              </span>
              <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                <SelectTrigger className="w-44">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SORT_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg overflow-hidden" role="group" aria-label="View mode">
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card"}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-card rounded-xl shadow-card p-6 mb-6 animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filters</h3>
                <button onClick={() => setShowFilters(false)} aria-label="Close filters">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <span className="text-sm font-medium mb-2 block" id="price-range-label">Price Range</span>
                  <div className="flex gap-2">
                    <Input placeholder="Min" type="number" aria-label="Minimum price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
                    <Input placeholder="Max" type="number" aria-label="Maximum price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="filter-guests" className="text-sm font-medium mb-2 block">Guests</label>
                  <Input id="filter-guests" placeholder="Min guests" type="number" value={minGuests} onChange={(e) => setMinGuests(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="filter-bedrooms" className="text-sm font-medium mb-2 block">Bedrooms</label>
                  <Input id="filter-bedrooms" placeholder="Min bedrooms" type="number" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="filter-brand" className="text-sm font-medium mb-2 block">Resort Brand</label>
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {Object.entries(BRAND_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => { setShowFilters(false); setCurrentPage(1); }}>
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Voice Search Results */}
          {voiceEnabled && voiceResults.length > 0 && (
            <div className="mb-8 animate-fade-in">
              <h2 className="font-display text-xl font-semibold text-foreground mb-4">
                Voice Search Results
              </h2>
              <div
                className={
                  viewMode === "grid"
                    ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    : "flex flex-col gap-4"
                }
              >
                {voiceResults.map((result) => (
                  <Link
                    key={result.listing_id}
                    to={`/property/${result.listing_id}`}
                    className={`group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 ${
                      viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                    }`}
                  >
                    {/* Image */}
                    <div
                      className={`relative overflow-hidden bg-muted ${
                        viewMode === "list" ? "w-full sm:w-72 h-48" : "h-52"
                      }`}
                    >
                      {result.image_url ? (
                        <img
                          src={result.image_url}
                          alt={result.property_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <MapPin className="w-8 h-8" />
                        </div>
                      )}
                      {result.brand && (
                        <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold bg-primary text-primary-foreground rounded-full">
                          {result.brand.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {result.location}
                      </div>
                      <h3 className="font-display font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                        {result.property_name}
                      </h3>
                      {result.unit_type_name && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {result.unit_type_name}
                          {result.resort_rating && (
                            <span className="ml-2">
                              <Star className="w-3 h-3 fill-warning text-warning inline" /> {result.resort_rating}
                            </span>
                          )}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mb-2">
                        {result.check_in} — {result.check_out}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="text-foreground">
                          <span className="font-display text-xl font-bold">
                            ${result.price.toLocaleString()}
                          </span>
                          <span className="text-muted-foreground text-sm"> / week</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <Users className="w-3 h-3 inline mr-1" />
                          {result.sleeps} guests • {result.bedrooms} BR
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="border-b border-border my-8" />
            </div>
          )}

          {/* Search context banner */}
          {searchQuery.trim() && (
            <div className="flex items-center gap-2 mb-6 p-3 bg-muted/50 rounded-lg">
              <Search className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Showing results for "<span className="font-medium text-foreground">{searchQuery}</span>"
              </span>
              <button
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading available properties...</p>
            </div>
          )}

          {/* Error State */}
          {listingsError && !isLoading && (
            <div className="text-center py-16">
              <X className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                Unable to load listings
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Something went wrong loading properties. Please try again.
              </p>
            </div>
          )}

          {/* Empty State — No listings in DB */}
          {!isLoading && !listingsError && listings.length === 0 && (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Home className="w-10 h-10 text-primary" />
              </div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                Our Marketplace is Launching Soon!
              </h3>
              <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                We're onboarding property owners and building an amazing selection of vacation rentals.
                Be among the first to list or browse when we launch.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {(isPropertyOwner() || isRavTeam()) && (
                  <Link to="/list-property">
                    <Button size="lg">
                      <Home className="w-4 h-4 mr-2" />
                      List Your Property
                    </Button>
                  </Link>
                )}
                <Link to="/marketplace">
                  <Button variant="outline" size="lg">
                    Browse Marketplace
                  </Button>
                </Link>
              </div>
              <PostRequestCTA
                searchDestination={searchQuery}
                searchCheckIn={dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined}
                searchCheckOut={dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined}
              />
            </div>
          )}

          {/* Empty search results */}
          {!isLoading && !listingsError && listings.length > 0 && filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                No properties found
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                No properties match your current filters. Try adjusting your search criteria or browse all available rentals.
              </p>
              <Button variant="outline" onClick={clearAllFilters}>
                View All Properties
              </Button>
              <PostRequestCTA
                searchDestination={searchQuery}
                searchCheckIn={dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined}
                searchCheckOut={dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined}
              />
            </div>
          ) : !isLoading && !listingsError && filteredListings.length > 0 && (
          <>
          {/* Results Grid */}
          <div
            className={
              viewMode === "grid"
                ? "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            }
          >
            {paginatedListings.map((listing) => {
              const nights = calculateNights(listing.check_in_date, listing.check_out_date);
              const pricePerNight = listing.nightly_rate || (nights > 0 ? Math.round(listing.final_price / nights) : 0);

              return (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isFavorited={favoriteIds.includes(listing.id)}
                  onToggleFavorite={toggleLike}
                  favoritesCount={favoritesCount.get(listing.id) || 0}
                  viewMode={viewMode}
                  showDateRange
                  showBedrooms
                  imageOverlay={
                    compareMode ? (
                      <div
                        className="absolute top-3 left-3 z-10"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Checkbox
                          checked={compareIds.has(listing.id)}
                          onCheckedChange={(checked) => {
                            setCompareIds((prev) => {
                              const next = new Set(prev);
                              if (checked && next.size < 3) {
                                next.add(listing.id);
                              } else {
                                next.delete(listing.id);
                              }
                              return next;
                            });
                          }}
                          disabled={!compareIds.has(listing.id) && compareIds.size >= 3}
                          className="h-5 w-5 bg-white/90 border-2"
                          aria-label="Select for comparison"
                        />
                      </div>
                    ) : undefined
                  }
                  priceExtra={
                    <>
                      <ListingFairValueBadge listingId={listing.id} />
                      {(listing as Record<string, unknown>).previous_nightly_rate &&
                        Number((listing as Record<string, unknown>).previous_nightly_rate) > pricePerNight && (
                        <Badge variant="secondary" className="text-[10px] bg-green-100 text-green-700 border-green-200">
                          Price dropped!
                        </Badge>
                      )}
                    </>
                  }
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-12">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={safePage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === safePage}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={safePage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
          </>
          )}
        </div>
      </section>

      {/* Compare floating bar */}
      {compareMode && compareIds.size >= 2 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border shadow-lg rounded-full px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{compareIds.size} selected</span>
          <Button size="sm" onClick={() => { trackEvent('comparison_opened', { listing_count: compareIds.size }); setCompareDialogOpen(true); }}>
            Compare Now
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCompareIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Compare Dialog */}
      <CompareListingsDialog
        listings={listings.filter((l) => compareIds.has(l.id))}
        open={compareDialogOpen}
        onOpenChange={setCompareDialogOpen}
        onRemove={(id) => {
          setCompareIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          if (compareIds.size <= 2) setCompareDialogOpen(false);
        }}
      />

      <Footer />

      {/* Text Chat Panel */}
      <TextChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        messages={chatMessages}
        status={chatStatus}
        error={chatError}
        context="rentals"
        onSendMessage={sendChatMessage}
        onClearHistory={clearChatHistory}
      />
    </div>
  );
};

export default Rentals;
