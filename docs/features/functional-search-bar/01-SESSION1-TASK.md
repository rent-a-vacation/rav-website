---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "archived"
---
# Session 1: Functional Search Bar — Build It

**Feature:** Functional Search Bar & Filters
**Session:** 1 of 1
**Agent Role:** Frontend Engineer
**Duration:** ~1.5 hours
**Prerequisites:** Read `00-PROJECT-BRIEF.md` fully before writing any code

---

## Mission

Make the Rentals page search bar and filter panel fully functional. One file to modify: `src/pages/Rentals.tsx`. All UI components already exist (Calendar, Popover, Select, Badge).

---

## Task 1: Add Filter State

In `src/pages/Rentals.tsx`, add these state variables after the existing `searchQuery` state (line ~105):

```tsx
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Inside Rentals component:
const [dateRange, setDateRange] = useState<DateRange | undefined>();
const [minPrice, setMinPrice] = useState("");
const [maxPrice, setMaxPrice] = useState("");
const [minGuests, setMinGuests] = useState("");
const [minBedrooms, setMinBedrooms] = useState("");
const [brandFilter, setBrandFilter] = useState("");
```

---

## Task 2: Replace Calendar Input with Popover + Calendar

Replace the static calendar Input (line ~217-218):
```tsx
// OLD:
<div className="relative">
  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
  <Input placeholder="Check-in - Check-out" className="pl-10" />
</div>

// NEW:
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
```

Note: Import `Calendar` icon as a named import from lucide-react (already imported). Import `CalendarComponent` from `@/components/ui/calendar` to avoid name collision.

---

## Task 3: Wire Search Button

Replace the plain Search button (line ~221):
```tsx
// OLD:
<Button className="flex-1">
  <Search className="w-4 h-4 mr-2" />
  Search
</Button>

// NEW:
<Button className="flex-1" onClick={() => setCurrentPage(1)}>
  <Search className="w-4 h-4 mr-2" />
  Search
</Button>
```

---

## Task 4: Wire Filter Panel Inputs

Replace the static filter inputs (lines ~341-364):

```tsx
{showFilters && (
  <div className="bg-card rounded-xl shadow-card p-6 mb-6 animate-fade-in">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold">Filters</h3>
      <button onClick={() => setShowFilters(false)}>
        <X className="w-5 h-5" />
      </button>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
      <div>
        <label className="text-sm font-medium mb-2 block">Price Range</label>
        <div className="flex gap-2">
          <Input placeholder="Min" type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          <Input placeholder="Max" type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Guests</label>
        <Input placeholder="Min guests" type="number" value={minGuests} onChange={(e) => setMinGuests(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Bedrooms</label>
        <Input placeholder="Min bedrooms" type="number" value={minBedrooms} onChange={(e) => setMinBedrooms(e.target.value)} />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Resort Brand</label>
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
      <Button variant="outline" onClick={() => {
        setDateRange(undefined);
        setMinPrice("");
        setMaxPrice("");
        setMinGuests("");
        setMinBedrooms("");
        setBrandFilter("");
        setSearchQuery("");
        setShowFilters(false);
        setCurrentPage(1);
      }}>
        Clear All
      </Button>
    </div>
  </div>
)}
```

---

## Task 5: Extend Filter Logic

Replace the existing `filteredListings` computation (lines ~166-178):

```tsx
const filteredListings = listings.filter((listing) => {
  // Text search (existing)
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const name = getListingDisplayName(listing).toLowerCase();
    const location = getListingLocation(listing).toLowerCase();
    const brand = getListingBrandLabel(listing).toLowerCase();
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
```

---

## Task 6: Active Filter Count Badge

Update the Filters button to show active filter count:

```tsx
const activeFilterCount = [
  dateRange?.from,
  minPrice,
  maxPrice,
  minGuests,
  minBedrooms,
  brandFilter && brandFilter !== "all" ? brandFilter : "",
].filter(Boolean).length;

<Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
  <SlidersHorizontal className="w-4 h-4 mr-2" />
  Filters
  {activeFilterCount > 0 && (
    <Badge variant="secondary" className="ml-1.5 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
      {activeFilterCount}
    </Badge>
  )}
</Button>
```

---

## Task 7: Reset Page on Filter Changes

Add filter state to the `useEffect` that resets pagination:

```tsx
useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, dateRange, minPrice, maxPrice, minGuests, minBedrooms, brandFilter]);
```

---

## Deliverables Checklist

- [ ] Calendar Popover opens with date range picker
- [ ] Selecting dates filters listings by overlap
- [ ] Search button triggers page reset
- [ ] Filter panel: Price min/max inputs wired to state
- [ ] Filter panel: Guests input wired to state
- [ ] Filter panel: Bedrooms input wired to state
- [ ] Filter panel: Brand uses Select dropdown with all 9 brands
- [ ] Apply Filters closes panel
- [ ] Clear All resets all filter state
- [ ] Active filter count badge on Filters button
- [ ] Property count updates reactively
- [ ] Existing text search still works
- [ ] Voice search unaffected
- [ ] Text chat unaffected
- [ ] Mobile responsive (1 month calendar on mobile)
- [ ] `npx tsc --noEmit` — no type errors
- [ ] `npm run build` — succeeds
- [ ] All existing tests pass

## Handoff

Create `docs/features/functional-search-bar/handoffs/session1-handoff.md`:
- List of all state variables added
- Any deviations from the brief
- Build/type-check results
