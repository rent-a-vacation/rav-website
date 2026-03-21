---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# Functional Search Bar — Project Brief

**Feature Name:** Functional Search Bar & Filters
**Phase:** Priority #1 (Search → Book flow)
**Route:** `/rentals` (existing)
**Status:** ✅ Completed
**Created:** February 21, 2026
**Migration:** None — frontend only
**Docs:** `docs/features/functional-search-bar/`

---

## Problem

The Rentals page (`/rentals`) has a search bar with visual UI elements that are **not functional**:

1. **Calendar picker** — static `<Input placeholder="Check-in - Check-out">` with no Popover, no Calendar component, no date state
2. **Search button** — renders but has **no onClick handler**
3. **Filter panel** (Price, Guests, Bedrooms, Resort Brand) — inputs render but have **no state bindings**, Apply/Clear buttons have **no onClick**
4. **Location search** — WORKS (text input with `searchQuery` state + client-side filtering)

Users cannot filter by dates, price, bedrooms, guests, or brand through the search bar UI. The only working search paths are: typing a location name, using RAVIO text chat, or using voice search.

---

## What Works Today

- `searchQuery` state bound to location Input → client-side text filtering on name/location/brand
- `useActiveListings()` hook fetches all active listings with properties/resort/unit_type joins
- Pagination works
- Voice search + Text chat (RAVIO) both work
- Grid/List view toggle works
- Favorites (heart button) works
- Social proof badges work
- URL search params: `?location=` and `?brand=` pre-populate `searchQuery`

---

## What Needs to Be Built

### 1. Date Range Picker (Calendar)

Replace the static Input with a Popover + Calendar component for date range selection.

**Available components (already installed, unused):**
- `src/components/ui/calendar.tsx` — shadcn Calendar using react-day-picker v8 (DayPicker)
- `src/components/ui/popover.tsx` — Radix popover with z-50 portal
- `react-day-picker@^8.10.1`, `date-fns@^3.6.0`, `@radix-ui/react-popover@^1.1.14`

**Important timeshare context:** Listings have fixed `check_in_date` and `check_out_date` set by the owner. Renters book exact dates — they don't pick arbitrary dates. The calendar picker filters listings to show only those overlapping the selected date range.

**Implementation:**
```tsx
// State
const [dateRange, setDateRange] = useState<DateRange | undefined>();

// UI: Replace <Input placeholder="Check-in - Check-out"> with:
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start text-left font-normal pl-10">
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
      {dateRange?.from ? (
        dateRange.to ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}` : format(dateRange.from, "MMM d, yyyy")
      ) : "Check-in - Check-out"}
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

### 2. Filter State + Bindings

Add state variables and wire all filter inputs:

```tsx
const [dateRange, setDateRange] = useState<DateRange | undefined>();
const [minPrice, setMinPrice] = useState<string>("");
const [maxPrice, setMaxPrice] = useState<string>("");
const [minGuests, setMinGuests] = useState<string>("");
const [minBedrooms, setMinBedrooms] = useState<string>("");
const [brandFilter, setBrandFilter] = useState<string>("");
```

Wire each Input in the filter panel to its state via `value` + `onChange`.

### 3. Client-Side Filter Logic

Extend the existing `filteredListings` computation to include all filters:

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
    // Overlap: listing starts before filter ends AND listing ends after filter starts
    if (listingStart > filterEnd || listingEnd < dateRange.from) return false;
  }

  // Price range
  if (minPrice && listing.final_price < Number(minPrice)) return false;
  if (maxPrice && listing.final_price > Number(maxPrice)) return false;

  // Guests
  if (minGuests && listing.property.sleeps < Number(minGuests)) return false;

  // Bedrooms
  if (minBedrooms && listing.property.bedrooms < Number(minBedrooms)) return false;

  // Brand
  if (brandFilter.trim()) {
    const brandLabel = getListingBrandLabel(listing).toLowerCase();
    if (!brandLabel.includes(brandFilter.toLowerCase())) return false;
  }

  return true;
});
```

### 4. Search Button

Wire the Search button with an onClick that:
- Closes the filter panel if open
- Resets to page 1
- Optionally: scrolls to results

Since filtering is already reactive (computed from state), the button's primary role is UX affordance. But it should trigger `setCurrentPage(1)` and close filters.

### 5. Apply / Clear Buttons

- **Apply Filters**: Close filter panel, reset page to 1
- **Clear All**: Reset all filter state to defaults, close filter panel

### 6. Brand Filter Enhancement

Replace the free-text brand Input in the filter panel with a Select dropdown using existing `BRAND_LABELS`:

```tsx
<Select value={brandFilter} onValueChange={setBrandFilter}>
  <SelectTrigger><SelectValue placeholder="All Brands" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="">All Brands</SelectItem>
    {Object.entries(BRAND_LABELS).map(([value, label]) => (
      <SelectItem key={value} value={value}>{label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

### 7. Active Filter Indicators

Show active filter count on the Filters button badge and individual filter chips above results:

```tsx
// Badge on Filters button
const activeFilterCount = [dateRange, minPrice, maxPrice, minGuests, minBedrooms, brandFilter]
  .filter(Boolean).length;

<Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
  <SlidersHorizontal className="w-4 h-4 mr-2" />
  Filters {activeFilterCount > 0 && <Badge className="ml-1">{activeFilterCount}</Badge>}
</Button>
```

---

## File Changes

### Modified Files

| File | Change |
|------|--------|
| `src/pages/Rentals.tsx` | Add date/filter state, wire calendar popover, wire filter inputs, wire Search/Apply/Clear buttons, extend filter logic |

### No New Files Needed

All UI components (Calendar, Popover, Select, Badge) already exist in the shadcn/ui toolkit.

---

## Important Notes

- **All filtering is client-side** — `useActiveListings()` already fetches all active listings. No backend changes needed.
- **No database migration** — purely frontend state management.
- **Preserve existing functionality** — voice search, text chat, favorites, social proof, pagination all remain unchanged.
- **Mobile responsive** — calendar shows 1 month on mobile (`numberOfMonths={window.innerWidth < 640 ? 1 : 2}`).
- **Date filtering is overlap-based** — timeshare listings have fixed dates. Filter shows listings whose date range overlaps the selected range.

---

## Success Criteria

- [ ] Calendar picker opens with date range selection in a Popover
- [ ] Date range filters listings by check-in/check-out date overlap
- [ ] Search button resets page and scrolls to results
- [ ] Filter panel inputs (price, guests, bedrooms) are wired to state
- [ ] Brand filter uses Select dropdown with all 9 brands
- [ ] Apply Filters closes panel, Clear All resets all filters
- [ ] Active filter count shown on Filters button
- [ ] "X properties found" count updates reactively with all filters
- [ ] Existing location text search still works
- [ ] Voice search and text chat unaffected
- [ ] Mobile responsive (single-column calendar, stacked filters)
- [ ] `npm run build` passes
- [ ] `npx tsc --noEmit` passes
- [ ] All existing tests pass
