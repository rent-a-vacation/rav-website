---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# SESSION 2: Display Engineer (Solo)

**Agent:** Property Display Engineer  
**Duration:** ~45 minutes  
**Mission:** Enhance PropertyDetail page with resort information  
**Dependencies:** Session 1 must be complete

---

## Your Responsibilities

1. ✅ Create `ResortInfoCard` component
2. ✅ Create `UnitTypeSpecs` component  
3. ✅ Create `ResortAmenities` component
4. ✅ Update `PropertyDetail.tsx` to show resort info
5. ✅ Update property cards on `/rentals` (add resort badge)
6. ✅ Ensure graceful fallback for properties without resort_id
7. ✅ Add "View Official Website" link

---

## Context from Session 1

Session 1 (Agent Team) has completed:
- ✅ Database schema with resorts and resort_unit_types tables
- ✅ 10 HGV resorts imported
- ✅ 33 unit types imported
- ✅ Properties table has resort_id and unit_type_id columns
- ✅ ListProperty.tsx allows linking to resort data

**Your job:** Make that data visible on PropertyDetail pages!

---

## Task 1: Create ResortInfoCard Component

**File:** `src/components/resort/ResortInfoCard.tsx`

This component displays comprehensive resort information on the property detail page.

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Star, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResortAmenities } from "./ResortAmenities";

interface Resort {
  resort_name: string;
  location: {
    city: string;
    state: string;
    country: string;
    full_address: string;
  };
  description: string;
  contact: {
    phone: string;
    website: string;
  };
  resort_amenities: string[];
  policies: {
    check_in: string;
    check_out: string;
    parking: string;
    pets: string;
    resort_fees?: string;
  };
  nearby_airports: string[];
  guest_rating: number;
  main_image_url: string;
}

interface ResortInfoCardProps {
  resort: Resort;
}

export function ResortInfoCard({ resort }: ResortInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl">{resort.resort_name}</span>
          {resort.guest_rating && (
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span className="font-semibold">{resort.guest_rating.toFixed(1)}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Location */}
        <div className="flex items-start gap-3">
          <MapPin className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Location</p>
            <p className="text-sm text-muted-foreground">
              {resort.location.city}, {resort.location.state}, {resort.location.country}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {resort.location.full_address}
            </p>
          </div>
        </div>

        {/* Contact */}
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="font-medium">Contact</p>
            <p className="text-sm text-muted-foreground">{resort.contact.phone}</p>
          </div>
        </div>

        {/* Description */}
        {resort.description && (
          <div>
            <p className="font-medium mb-2">About This Resort</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {resort.description}
            </p>
          </div>
        )}

        {/* Amenities */}
        {resort.resort_amenities && resort.resort_amenities.length > 0 && (
          <div>
            <p className="font-medium mb-3">Resort Amenities</p>
            <ResortAmenities amenities={resort.resort_amenities} />
          </div>
        )}

        {/* Policies */}
        {resort.policies && (
          <div>
            <p className="font-medium mb-3">Resort Policies</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Check-in:</span>{" "}
                <span className="font-medium">{resort.policies.check_in}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Check-out:</span>{" "}
                <span className="font-medium">{resort.policies.check_out}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Parking:</span>{" "}
                <span className="font-medium">{resort.policies.parking}</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Pets:</span>{" "}
                <span className="font-medium">{resort.policies.pets}</span>
              </div>
              {resort.policies.resort_fees && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Resort Fees:</span>{" "}
                  <span className="font-medium">{resort.policies.resort_fees}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nearby Airports */}
        {resort.nearby_airports && resort.nearby_airports.length > 0 && (
          <div>
            <p className="font-medium mb-2">Nearby Airports</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {resort.nearby_airports.map((airport, index) => (
                <li key={index}>• {airport}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Official Website Link */}
        {resort.contact.website && (
          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <a
              href={resort.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              View Official Resort Website
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Task 2: Create ResortAmenities Component

**File:** `src/components/resort/ResortAmenities.tsx`

```typescript
import { Check } from "lucide-react";

interface ResortAmenitiesProps {
  amenities: string[];
  maxDisplay?: number;
}

export function ResortAmenities({ amenities, maxDisplay }: ResortAmenitiesProps) {
  const displayAmenities = maxDisplay ? amenities.slice(0, maxDisplay) : amenities;
  const remaining = maxDisplay && amenities.length > maxDisplay 
    ? amenities.length - maxDisplay 
    : 0;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        {displayAmenities.map((amenity, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            <span>{amenity}</span>
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <p className="text-sm text-muted-foreground">
          +{remaining} more amenities
        </p>
      )}
    </div>
  );
}
```

---

## Task 3: Create UnitTypeSpecs Component

**File:** `src/components/resort/UnitTypeSpecs.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bed, Users, Maximize, UtensilsCrossed } from "lucide-react";

interface UnitType {
  unit_type_name: string;
  bedrooms: number;
  bathrooms: number;
  max_occupancy: number;
  square_footage: number;
  kitchen_type: string;
  bedding_config: string;
  unit_amenities: string[];
  features: {
    balcony?: boolean;
    view_type?: string;
    washer_dryer?: boolean;
    accessible?: boolean;
  };
}

interface UnitTypeSpecsProps {
  unitType: UnitType;
}

export function UnitTypeSpecs({ unitType }: UnitTypeSpecsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Unit Specifications</CardTitle>
        <p className="text-sm text-muted-foreground">{unitType.unit_type_name}</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
            <Bed className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{unitType.bedrooms}</p>
            <p className="text-xs text-muted-foreground">Bedrooms</p>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{unitType.max_occupancy}</p>
            <p className="text-xs text-muted-foreground">Sleeps</p>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
            <Maximize className="h-5 w-5 text-primary mb-2" />
            <p className="text-lg font-bold">{unitType.square_footage}</p>
            <p className="text-xs text-muted-foreground">sq ft</p>
          </div>
          
          <div className="flex flex-col items-center p-3 bg-secondary/50 rounded-lg">
            <UtensilsCrossed className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm font-bold text-center">{unitType.kitchen_type}</p>
            <p className="text-xs text-muted-foreground">Kitchen</p>
          </div>
        </div>

        {/* Bathrooms */}
        <div>
          <p className="text-sm font-medium mb-1">Bathrooms</p>
          <p className="text-sm text-muted-foreground">{unitType.bathrooms} bathrooms</p>
        </div>

        {/* Bedding Configuration */}
        {unitType.bedding_config && (
          <div>
            <p className="text-sm font-medium mb-2">Bedding Configuration</p>
            <p className="text-sm text-muted-foreground">{unitType.bedding_config}</p>
          </div>
        )}

        {/* Features */}
        {unitType.features && Object.keys(unitType.features).length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Features</p>
            <div className="space-y-1">
              {unitType.features.balcony && (
                <p className="text-sm text-muted-foreground">✓ Private Balcony</p>
              )}
              {unitType.features.view_type && (
                <p className="text-sm text-muted-foreground">✓ {unitType.features.view_type}</p>
              )}
              {unitType.features.washer_dryer && (
                <p className="text-sm text-muted-foreground">✓ In-Unit Washer/Dryer</p>
              )}
              {unitType.features.accessible && (
                <p className="text-sm text-muted-foreground">✓ Accessible Unit</p>
              )}
            </div>
          </div>
        )}

        {/* Unit Amenities */}
        {unitType.unit_amenities && unitType.unit_amenities.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Unit Amenities</p>
            <div className="flex flex-wrap gap-2">
              {unitType.unit_amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="text-xs bg-secondary px-2 py-1 rounded-md"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Task 4: Update PropertyDetail Page

**File:** `src/pages/PropertyDetail.tsx`

Integrate resort information display:

```typescript
import { ResortInfoCard } from "@/components/resort/ResortInfoCard";
import { UnitTypeSpecs } from "@/components/resort/UnitTypeSpecs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export default function PropertyDetail() {
  const { id } = useParams();

  // Fetch property with resort data
  const { data: property, isLoading } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          resort:resorts(*),
          unit_type:resort_unit_types(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (!property) return <div>Property not found</div>;

  return (
    <div className="container py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content (Left/Center) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Title */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {property.unit_type?.unit_type_name || `${property.bedrooms}-Bedroom`} at{" "}
              {property.resort?.resort_name || property.resort_name}
            </h1>
            
            {/* Resort Badge */}
            {property.resort && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-sm">
                  {property.resort.location.city}, {property.resort.location.state}
                </span>
                {property.resort.guest_rating && (
                  <span className="text-sm">• ★ {property.resort.guest_rating.toFixed(1)}</span>
                )}
              </div>
            )}
          </div>

          {/* Images */}
          {/* ... existing image carousel ... */}

          {/* Property Description */}
          {/* ... existing description ... */}

          {/* Unit Type Specs (if available) */}
          {property.unit_type && (
            <UnitTypeSpecs unitType={property.unit_type} />
          )}

          {/* Owner-specific amenities (if different from unit type) */}
          {/* ... existing amenities ... */}
        </div>

        {/* Sidebar (Right) */}
        <div className="space-y-6">
          {/* Booking Card */}
          {/* ... existing booking form ... */}

          {/* Resort Information Card (if available) */}
          {property.resort && (
            <ResortInfoCard resort={property.resort} />
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## Task 5: Update Rentals Property Cards

**File:** Update property card component in `src/pages/Rentals.tsx`

Add resort badge to property cards:

```typescript
// Inside PropertyCard component or similar
{property.resort && (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <MapPin className="h-3 w-3" />
    <span>{property.resort.location.city}, {property.resort.location.state}</span>
    {property.resort.guest_rating && (
      <>
        <span>•</span>
        <Star className="h-3 w-3 fill-primary text-primary" />
        <span>{property.resort.guest_rating.toFixed(1)}</span>
      </>
    )}
  </div>
)}
```

---

## Task 6: Graceful Fallback for Old Properties

Ensure properties without `resort_id` still display correctly:

```typescript
// In PropertyDetail.tsx
export default function PropertyDetail() {
  // ... fetch property ...

  const hasResortData = !!property.resort;
  const hasUnitTypeData = !!property.unit_type;

  return (
    <div className="container py-8">
      {/* Title */}
      <h1>
        {hasUnitTypeData 
          ? `${property.unit_type.unit_type_name} at` 
          : `${property.bedrooms}-Bedroom at`
        }
        {" "}
        {hasResortData ? property.resort.resort_name : property.resort_name}
      </h1>

      {/* Show resort card only if data exists */}
      {hasResortData && <ResortInfoCard resort={property.resort} />}
      
      {/* Show unit specs only if data exists */}
      {hasUnitTypeData && <UnitTypeSpecs unitType={property.unit_type} />}

      {/* Always show property-specific fields */}
      <div>
        <p>Bedrooms: {property.bedrooms}</p>
        <p>Bathrooms: {property.bathrooms}</p>
        <p>Sleeps: {property.sleeps}</p>
        {/* ... etc ... */}
      </div>
    </div>
  );
}
```

---

## Testing Checklist

Before completing this session, test:

### Display Tests

- ✅ PropertyDetail shows ResortInfoCard when resort_id exists
- ✅ PropertyDetail shows UnitTypeSpecs when unit_type_id exists
- ✅ Resort amenities display correctly
- ✅ Resort policies display correctly
- ✅ "View Official Website" link works
- ✅ Nearby airports display correctly

### Fallback Tests

- ✅ Old properties (without resort_id) still display correctly
- ✅ No console errors for properties without resort data
- ✅ Page doesn't break if resort or unit_type is null

### Visual Tests

- ✅ Resort info card looks good on desktop
- ✅ Resort info card looks good on mobile
- ✅ Unit specs grid is responsive
- ✅ Icons and spacing are consistent
- ✅ Colors use semantic tokens (not hardcoded)

### Integration Tests

- ✅ Property cards on /rentals show resort badge
- ✅ Clicking property opens detail with full resort info
- ✅ All links work correctly

---

## Deliverables (Handoff)

**File:** `handoffs/session2-display-handoff.md`

```markdown
# SESSION 2 HANDOFF: Display Engineer

**Completed:** [Date/Time]  
**Agent:** Property Display Engineer  
**Duration:** [Actual time]  
**Status:** ✅ Complete

---

## Components Created

✅ `src/components/resort/ResortInfoCard.tsx`
✅ `src/components/resort/UnitTypeSpecs.tsx`
✅ `src/components/resort/ResortAmenities.tsx`

---

## Pages Modified

✅ `src/pages/PropertyDetail.tsx` - Added resort info display
✅ `src/pages/Rentals.tsx` - Added resort badges to property cards

---

## Features Implemented

✅ Resort information card with:
  - Location and contact
  - Description
  - Amenities
  - Policies
  - Nearby airports
  - Official website link

✅ Unit type specifications with:
  - Quick stats (bedrooms, bathrooms, sleeps, sq ft)
  - Kitchen type
  - Bedding configuration
  - Features (balcony, view, washer/dryer)
  - Unit amenities

✅ Graceful fallback for properties without resort_id
✅ Resort badges on property cards

---

## Testing Results

✅ All display tests passed
✅ Fallback tests passed
✅ Visual tests passed (desktop + mobile)
✅ No console errors
✅ Accessibility: No violations found

---

## Next Steps for Search/QA Engineer (Session 3)

**What's Ready:**
- Properties display full resort information
- Components are reusable and tested
- Backward compatibility verified

**What You Need to Do:**
- Update voice search Edge Function to return resort data
- Test voice search describes resort amenities
- Run E2E tests on listing → display flow
- Fill out production checklist

**Sample Query for Voice Search Update:**

```typescript
// In voice-search Edge Function
const { data: properties } = await supabase
  .from('properties')
  .select(`
    *,
    resort:resorts(resort_name, location, guest_rating),
    unit_type:resort_unit_types(unit_type_name, bedrooms, bathrooms, max_occupancy)
  `)
  .limit(10);

// Return with resort info included
return properties.map(p => ({
  ...p,
  resort_name: p.resort?.resort_name || p.resort_name,
  location: p.resort?.location?.city + ", " + p.resort?.location?.state || p.location,
  rating: p.resort?.guest_rating
}));
```

---

**HANDOFF COMPLETE ✅**
Ready for Session 3: Search Integration & QA
```

---

## Success Criteria

- ✅ ResortInfoCard displays all resort data
- ✅ UnitTypeSpecs displays all unit details
- ✅ PropertyDetail enhanced with resort info
- ✅ Property cards show resort badges
- ✅ Graceful fallback for old properties
- ✅ No accessibility violations
- ✅ Mobile responsive
- ✅ All tests passing

---

**END OF SESSION 2 TASK CARD**
