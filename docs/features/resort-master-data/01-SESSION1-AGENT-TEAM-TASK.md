---
last_updated: "2026-03-21T02:05:09"
change_ref: "94959eb"
change_type: "session-39-docs-update"
status: "active"
---
# SESSION 1: Agent Team - Database + Listing Flow

**Agents:** Database Engineer + Listing Flow Engineer (working together)  
**Duration:** ~1 hour  
**Mission:** Set up resort master data tables and create enhanced listing form  
**Approach:** Collaborative parallel development

---

## 🎯 Team Coordination Strategy

You are **TWO AGENTS working as a TEAM** in the same session:

### **Agent A: Database Engineer**
**Focus:** Schema creation, data import, database operations  
**Primary Files:** SQL migrations, data import scripts

### **Agent B: Listing Flow Engineer**
**Focus:** React components, form updates, UI integration  
**Primary Files:** `ListProperty.tsx`, new resort components

**CRITICAL:** Coordinate your work:
- Database Engineer creates schema FIRST
- Listing Engineer waits for schema confirmation before querying
- Test integration together at the end

---

## Agent A: Database Engineer

### Your Responsibilities

1. ✅ Create `resorts` table with proper schema
2. ✅ Create `resort_unit_types` table
3. ✅ Modify `properties` table (add foreign keys)
4. ✅ Import 10 HGV resorts from JSON data
5. ✅ Import 33 unit types from JSON data
6. ✅ Create indexes for performance
7. ✅ Create helper view for joined queries
8. ✅ Verify data integrity

---

### Task 1: Review Existing Schema

**Check current `properties` table:**

```sql
-- Query Supabase to understand current schema
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;
```

**Verify enum exists:**
```sql
SELECT enumlabel 
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'vacation_club_brand';
```

Expected brands: `hilton_grand_vacations`, `marriott_vacation_club`, `disney_vacation_club`, etc.

---

### Task 2: Create Resorts Table

```sql
-- Create resorts table
CREATE TABLE IF NOT EXISTS public.resorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Information
  brand public.vacation_club_brand NOT NULL,
  resort_name TEXT NOT NULL UNIQUE,
  
  -- Location Information (JSONB for flexibility)
  location JSONB NOT NULL,
  -- Structure: {
  --   "city": "Orlando",
  --   "state": "Florida",
  --   "country": "United States",
  --   "full_address": "8122 Arrezzo Way, Orlando, FL 32821"
  -- }
  
  -- Description
  description TEXT,
  
  -- Contact Information (JSONB)
  contact JSONB,
  -- Structure: {
  --   "phone": "+1 407-465-2600",
  --   "email": "info@resort.com",
  --   "website": "https://resort.com"
  -- }
  
  -- Resort-Level Amenities (array)
  resort_amenities TEXT[] DEFAULT '{}',
  
  -- Policies (JSONB)
  policies JSONB,
  -- Structure: {
  --   "check_in": "4:00 PM",
  --   "check_out": "10:00 AM",
  --   "parking": "Complimentary self-parking",
  --   "pets": "Not allowed",
  --   "resort_fees": "May apply"
  -- }
  
  -- Travel Information
  nearby_airports TEXT[] DEFAULT '{}',
  
  -- Ratings
  guest_rating NUMERIC(2,1) CHECK (guest_rating >= 0 AND guest_rating <= 5),
  
  -- Images
  main_image_url TEXT,
  additional_images TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resorts_brand ON public.resorts(brand);
CREATE INDEX IF NOT EXISTS idx_resorts_location ON public.resorts USING gin(location);
CREATE INDEX IF NOT EXISTS idx_resorts_resort_name ON public.resorts(resort_name);

-- RLS Policies (anyone can view resorts)
ALTER TABLE public.resorts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resorts"
  ON public.resorts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "RAV team can manage resorts"
  ON public.resorts FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_resorts_updated_at
  BEFORE UPDATE ON public.resorts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
```

---

### Task 3: Create Resort Unit Types Table

```sql
-- Create resort_unit_types table
CREATE TABLE IF NOT EXISTS public.resort_unit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key to resorts
  resort_id UUID NOT NULL REFERENCES public.resorts(id) ON DELETE CASCADE,
  
  -- Unit Type Information
  unit_type_name TEXT NOT NULL,
  
  -- Capacity and Size
  bedrooms INTEGER NOT NULL DEFAULT 0 CHECK (bedrooms >= 0),
  bathrooms NUMERIC(3,1) NOT NULL DEFAULT 1.0 CHECK (bathrooms > 0),
  max_occupancy INTEGER NOT NULL CHECK (max_occupancy > 0),
  square_footage INTEGER,
  
  -- Kitchen Information
  kitchen_type TEXT,  -- "Full Kitchen", "Kitchenette", "None"
  
  -- Bedding Configuration
  bedding_config TEXT,  -- "1 King Bed, 2 Queen Beds, 1 Sofa Bed"
  
  -- Features (JSONB)
  features JSONB,
  -- Structure: {
  --   "balcony": true,
  --   "view_type": "Ocean View",
  --   "washer_dryer": true,
  --   "accessible": false
  -- }
  
  -- Unit-Specific Amenities
  unit_amenities TEXT[] DEFAULT '{}',
  
  -- Images
  image_urls TEXT[] DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_resort_unit_types_resort_id ON public.resort_unit_types(resort_id);
CREATE INDEX IF NOT EXISTS idx_resort_unit_types_bedrooms ON public.resort_unit_types(bedrooms);
CREATE INDEX IF NOT EXISTS idx_resort_unit_types_max_occupancy ON public.resort_unit_types(max_occupancy);

-- RLS Policies
ALTER TABLE public.resort_unit_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view unit types"
  ON public.resort_unit_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "RAV team can manage unit types"
  ON public.resort_unit_types FOR ALL
  TO authenticated
  USING (public.is_rav_team(auth.uid()))
  WITH CHECK (public.is_rav_team(auth.uid()));
```

---

### Task 4: Modify Properties Table

```sql
-- Add foreign keys to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS resort_id UUID REFERENCES public.resorts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS unit_type_id UUID REFERENCES public.resort_unit_types(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_properties_resort_id ON public.properties(resort_id);
CREATE INDEX IF NOT EXISTS idx_properties_unit_type_id ON public.properties(unit_type_id);

-- Comments
COMMENT ON COLUMN public.properties.resort_id IS 'Optional link to resort master data';
COMMENT ON COLUMN public.properties.unit_type_id IS 'Optional link to standard unit type';
```

---

### Task 5: Create Helper View

```sql
-- View for properties with full resort details
CREATE OR REPLACE VIEW public.properties_with_resort_details AS
SELECT 
  p.*,
  -- Resort information
  r.id as resort_db_id,
  r.resort_name as resort_full_name,
  r.description as resort_description,
  r.location as resort_location,
  r.contact as resort_contact,
  r.resort_amenities,
  r.policies as resort_policies,
  r.nearby_airports,
  r.guest_rating as resort_rating,
  r.main_image_url as resort_main_image,
  r.additional_images as resort_images,
  -- Unit type information
  ut.id as unit_type_db_id,
  ut.unit_type_name,
  ut.square_footage,
  ut.kitchen_type,
  ut.bedding_config,
  ut.features as unit_features,
  ut.unit_amenities,
  ut.image_urls as unit_type_images
FROM public.properties p
LEFT JOIN public.resorts r ON p.resort_id = r.id
LEFT JOIN public.resort_unit_types ut ON p.unit_type_id = ut.id;
```

---

### Task 6: Import Resort Data

**The user has provided HGV resort data.** Import using this approach:

```sql
-- Example INSERT for one resort (Tuscany Village)
INSERT INTO public.resorts (
  brand,
  resort_name,
  location,
  description,
  contact,
  resort_amenities,
  policies,
  nearby_airports,
  guest_rating,
  main_image_url
) VALUES (
  'hilton_grand_vacations',
  'Hilton Grand Vacations Club at Tuscany Village',
  '{"city": "Orlando", "state": "Florida", "country": "United States", "full_address": "8122 Arrezzo Way, Orlando, FL 32821"}'::jsonb,
  'Just minutes from Walt Disney World and adjacent to Orlando Premium Outlets, Tuscany Village is one of the top places to stay near Florida''s famous attractions.',
  '{"phone": "+1 407-465-2600", "website": "https://www.hiltongrandvacations.com/resorts-and-destinations/florida/central/tuscany-village-a-hilton-grand-vacations-club"}'::jsonb,
  ARRAY['Resort-style Pool', 'Fitness Center', 'Sports Court', 'Recreation Room', 'Dining & Bars', 'Walking Path', 'Spa Services', 'Kids Activities', 'Free WiFi', 'Business Center'],
  '{"check_in": "4:00 PM", "check_out": "10:00 AM", "parking": "Complimentary self-parking", "pets": "Not allowed", "resort_fees": "May apply"}'::jsonb,
  ARRAY['Orlando International Airport (MCO) - 15 miles'],
  4.3,
  'https://via.placeholder.com/800x600?text=Tuscany+Village'
);

-- Repeat for all 10 HGV resorts
-- (Full data will be in sample-data/hgv-resorts-import.json)
```

**After importing resorts, get their IDs for unit type import:**

```sql
-- Check imported resorts
SELECT id, resort_name FROM public.resorts ORDER BY resort_name;
```

---

### Task 7: Import Unit Type Data

```sql
-- Example INSERT for unit types
-- First, get the resort ID
WITH tuscany AS (
  SELECT id FROM public.resorts 
  WHERE resort_name = 'Hilton Grand Vacations Club at Tuscany Village'
)
INSERT INTO public.resort_unit_types (
  resort_id,
  unit_type_name,
  bedrooms,
  bathrooms,
  max_occupancy,
  square_footage,
  kitchen_type,
  bedding_config,
  features,
  unit_amenities
)
SELECT 
  tuscany.id,
  'Studio Suite',
  0,
  1.0,
  4,
  400,
  'Kitchenette',
  '1 King Bed, 1 Sofa Bed',
  '{"balcony": true, "view_type": "Resort View", "washer_dryer": false}'::jsonb,
  ARRAY['WiFi', 'TV', 'Kitchenette', 'Coffee Maker']
FROM tuscany;

-- Repeat for all unit types across all 10 resorts
-- (Full data will be in sample-data/hgv-unit-types-import.json)
```

---

### Task 8: Verify Data Integrity

```sql
-- Count resorts
SELECT COUNT(*) as resort_count FROM public.resorts;
-- Expected: 10

-- Count unit types
SELECT COUNT(*) as unit_type_count FROM public.resort_unit_types;
-- Expected: 33

-- Verify all unit types have valid resort_id
SELECT COUNT(*) 
FROM public.resort_unit_types ut
LEFT JOIN public.resorts r ON ut.resort_id = r.id
WHERE r.id IS NULL;
-- Expected: 0 (no orphaned unit types)

-- Sample query to test view
SELECT 
  id, 
  resort_name,
  resort_full_name,
  resort_rating,
  unit_type_name
FROM public.properties_with_resort_details
LIMIT 5;
```

---

### Database Engineer Deliverables

When complete, document in handoff:

```markdown
## Database Engineer - Completed Tasks

✅ Created `resorts` table with 10 HGV resorts
✅ Created `resort_unit_types` table with 33 unit types
✅ Modified `properties` table (added resort_id, unit_type_id)
✅ Created indexes for performance
✅ Created helper view `properties_with_resort_details`
✅ All data imports successful

### Data Summary
- Resorts: 10
- Unit Types: 33
- Verification queries: All passed

### SQL Migration File
`docs/supabase-migrations/007_resort_master_data.sql`

### Sample Queries for Listing Engineer

```sql
-- Get all HGV resorts
SELECT * FROM resorts WHERE brand = 'hilton_grand_vacations' ORDER BY resort_name;

-- Get unit types for a resort
SELECT * FROM resort_unit_types WHERE resort_id = 'YOUR_RESORT_ID' ORDER BY bedrooms;

-- Get property with full resort details
SELECT * FROM properties_with_resort_details WHERE id = 'PROPERTY_ID';
```

### Ready for Listing Engineer
✅ Schema is live in Supabase
✅ Data is imported and verified
✅ Queries tested and working
```

---

## Agent B: Listing Flow Engineer

### Your Responsibilities

1. ✅ Create `ResortSelector` component (brand → resort → unit type cascade)
2. ✅ Create `UnitTypeSelector` component
3. ✅ Create `ResortPreview` component
4. ✅ Update `ListProperty.tsx` form
5. ✅ Add Supabase queries for resort/unit data
6. ✅ Implement auto-population logic
7. ✅ Add "Resort not listed" fallback

---

### Task 1: Wait for Database Schema

**BEFORE STARTING:** Confirm with Database Engineer that schema is created and data imported.

**Test query in your code:**
```typescript
const { data: testResorts, error } = await supabase
  .from('resorts')
  .select('id, resort_name')
  .limit(1);

if (error) {
  console.error('Schema not ready:', error);
  // Wait for Database Engineer
} else {
  console.log('Schema ready! Found resort:', testResorts);
  // Proceed with component creation
}
```

---

### Task 2: Create ResortSelector Component

**File:** `src/components/resort/ResortSelector.tsx`

```typescript
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ResortPreview } from "./ResortPreview";

interface Resort {
  id: string;
  brand: string;
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
  };
  guest_rating: number;
}

interface ResortSelectorProps {
  selectedBrand?: string;
  selectedResortId?: string;
  onBrandChange: (brand: string) => void;
  onResortChange: (resort: Resort | null) => void;
}

export function ResortSelector({
  selectedBrand,
  selectedResortId,
  onBrandChange,
  onResortChange,
}: ResortSelectorProps) {
  const [resorts, setResorts] = useState<Resort[]>([]);
  const [selectedResort, setSelectedResort] = useState<Resort | null>(null);
  const [loading, setLoading] = useState(false);

  // Brands available (from vacation_club_brand enum)
  const brands = [
    { value: "hilton_grand_vacations", label: "Hilton Grand Vacations" },
    { value: "marriott_vacation_club", label: "Marriott Vacation Club" },
    { value: "disney_vacation_club", label: "Disney Vacation Club" },
    { value: "wyndham_destinations", label: "Wyndham Destinations" },
    { value: "other", label: "Other / Independent" },
  ];

  // Fetch resorts when brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setResorts([]);
      setSelectedResort(null);
      return;
    }

    const fetchResorts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("resorts")
        .select("*")
        .eq("brand", selectedBrand)
        .order("resort_name");

      if (error) {
        console.error("Error fetching resorts:", error);
      } else {
        setResorts(data || []);
      }
      setLoading(false);
    };

    fetchResorts();
  }, [selectedBrand]);

  // Fetch selected resort details
  useEffect(() => {
    if (!selectedResortId) {
      setSelectedResort(null);
      return;
    }

    const resort = resorts.find((r) => r.id === selectedResortId);
    if (resort) {
      setSelectedResort(resort);
      onResortChange(resort);
    }
  }, [selectedResortId, resorts]);

  return (
    <div className="space-y-4">
      {/* Brand Selection */}
      <div className="space-y-2">
        <Label htmlFor="brand">Vacation Club Brand *</Label>
        <Select value={selectedBrand} onValueChange={onBrandChange}>
          <SelectTrigger id="brand">
            <SelectValue placeholder="Select brand..." />
          </SelectTrigger>
          <SelectContent>
            {brands.map((brand) => (
              <SelectItem key={brand.value} value={brand.value}>
                {brand.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resort Selection (only show if brand selected) */}
      {selectedBrand && (
        <div className="space-y-2">
          <Label htmlFor="resort">Resort *</Label>
          <Select
            value={selectedResortId}
            onValueChange={(value) => {
              const resort = resorts.find((r) => r.id === value);
              setSelectedResort(resort || null);
              onResortChange(resort || null);
            }}
            disabled={loading}
          >
            <SelectTrigger id="resort">
              <SelectValue placeholder={loading ? "Loading resorts..." : "Select resort..."} />
            </SelectTrigger>
            <SelectContent>
              {resorts.map((resort) => (
                <SelectItem key={resort.id} value={resort.id}>
                  {resort.resort_name}
                </SelectItem>
              ))}
              {resorts.length === 0 && !loading && (
                <SelectItem value="none" disabled>
                  No resorts found for this brand
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Resort Preview */}
      {selectedResort && <ResortPreview resort={selectedResort} />}
    </div>
  );
}
```

---

### Task 3: Create ResortPreview Component

**File:** `src/components/resort/ResortPreview.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Star } from "lucide-react";

interface Resort {
  resort_name: string;
  location: {
    city: string;
    state: string;
  };
  guest_rating: number;
  resort_amenities: string[];
}

interface ResortPreviewProps {
  resort: Resort;
}

export function ResortPreview({ resort }: ResortPreviewProps) {
  return (
    <Card className="bg-secondary/50">
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{resort.resort_name}</span>
          {resort.guest_rating && (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {resort.guest_rating.toFixed(1)}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>
            {resort.location.city}, {resort.location.state}
          </span>
        </div>

        {resort.resort_amenities && resort.resort_amenities.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Resort Amenities:</p>
            <div className="flex flex-wrap gap-2">
              {resort.resort_amenities.slice(0, 5).map((amenity, index) => (
                <span
                  key={index}
                  className="text-xs bg-background px-2 py-1 rounded-md border"
                >
                  {amenity}
                </span>
              ))}
              {resort.resort_amenities.length > 5 && (
                <span className="text-xs text-muted-foreground px-2 py-1">
                  +{resort.resort_amenities.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

### Task 4: Create UnitTypeSelector Component

**File:** `src/components/resort/UnitTypeSelector.tsx`

```typescript
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface UnitType {
  id: string;
  unit_type_name: string;
  bedrooms: number;
  bathrooms: number;
  max_occupancy: number;
  square_footage: number;
  kitchen_type: string;
  bedding_config: string;
  unit_amenities: string[];
}

interface UnitTypeSelectorProps {
  resortId?: string;
  selectedUnitTypeId?: string;
  onUnitTypeChange: (unitType: UnitType | null) => void;
}

export function UnitTypeSelector({
  resortId,
  selectedUnitTypeId,
  onUnitTypeChange,
}: UnitTypeSelectorProps) {
  const [unitTypes, setUnitTypes] = useState<UnitType[]>([]);
  const [selectedUnitType, setSelectedUnitType] = useState<UnitType | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch unit types when resort changes
  useEffect(() => {
    if (!resortId) {
      setUnitTypes([]);
      setSelectedUnitType(null);
      return;
    }

    const fetchUnitTypes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("resort_unit_types")
        .select("*")
        .eq("resort_id", resortId)
        .order("bedrooms");

      if (error) {
        console.error("Error fetching unit types:", error);
      } else {
        setUnitTypes(data || []);
      }
      setLoading(false);
    };

    fetchUnitTypes();
  }, [resortId]);

  // Update selected unit type
  useEffect(() => {
    if (!selectedUnitTypeId) {
      setSelectedUnitType(null);
      return;
    }

    const unitType = unitTypes.find((ut) => ut.id === selectedUnitTypeId);
    if (unitType) {
      setSelectedUnitType(unitType);
      onUnitTypeChange(unitType);
    }
  }, [selectedUnitTypeId, unitTypes]);

  if (!resortId) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="unitType">Unit Type *</Label>
        <Select
          value={selectedUnitTypeId}
          onValueChange={(value) => {
            const unitType = unitTypes.find((ut) => ut.id === value);
            setSelectedUnitType(unitType || null);
            onUnitTypeChange(unitType || null);
          }}
          disabled={loading}
        >
          <SelectTrigger id="unitType">
            <SelectValue
              placeholder={loading ? "Loading unit types..." : "Select unit type..."}
            />
          </SelectTrigger>
          <SelectContent>
            {unitTypes.map((ut) => (
              <SelectItem key={ut.id} value={ut.id}>
                {ut.unit_type_name} - {ut.bedrooms} BR, {ut.bathrooms} BA (sleeps{" "}
                {ut.max_occupancy})
              </SelectItem>
            ))}
            {unitTypes.length === 0 && !loading && (
              <SelectItem value="none" disabled>
                No unit types available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Unit Type Preview */}
      {selectedUnitType && (
        <Card className="bg-secondary/50">
          <CardContent className="pt-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Bedrooms:</span>{" "}
                <span className="font-medium">{selectedUnitType.bedrooms}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Bathrooms:</span>{" "}
                <span className="font-medium">{selectedUnitType.bathrooms}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Sleeps:</span>{" "}
                <span className="font-medium">{selectedUnitType.max_occupancy}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span>{" "}
                <span className="font-medium">{selectedUnitType.square_footage} sq ft</span>
              </div>
            </div>

            {selectedUnitType.kitchen_type && (
              <div>
                <span className="text-muted-foreground">Kitchen:</span>{" "}
                <span className="font-medium">{selectedUnitType.kitchen_type}</span>
              </div>
            )}

            {selectedUnitType.bedding_config && (
              <div>
                <span className="text-muted-foreground">Bedding:</span>{" "}
                <span className="font-medium">{selectedUnitType.bedding_config}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

### Task 5: Update ListProperty.tsx

**File:** `src/pages/ListProperty.tsx`

Add resort selection to the form:

```typescript
import { ResortSelector } from "@/components/resort/ResortSelector";
import { UnitTypeSelector } from "@/components/resort/UnitTypeSelector";
import { useState } from "react";

export default function ListProperty() {
  // ... existing state ...

  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedResort, setSelectedResort] = useState<any>(null);
  const [selectedUnitType, setSelectedUnitType] = useState<any>(null);
  const [useResortData, setUseResortData] = useState(true);

  // Auto-populate fields when resort selected
  const handleResortChange = (resort: any) => {
    setSelectedResort(resort);
    
    if (resort && useResortData) {
      // Auto-populate from resort data
      form.setValue("resort_name", resort.resort_name);
      form.setValue("location", `${resort.location.city}, ${resort.location.state}`);
      // Store resort_id for database
      form.setValue("resort_id", resort.id);
    }
  };

  // Auto-populate fields when unit type selected
  const handleUnitTypeChange = (unitType: any) => {
    setSelectedUnitType(unitType);
    
    if (unitType && useResortData) {
      // Auto-populate from unit type data
      form.setValue("bedrooms", unitType.bedrooms);
      form.setValue("bathrooms", unitType.bathrooms);
      form.setValue("sleeps", unitType.max_occupancy);
      // Store unit_type_id for database
      form.setValue("unit_type_id", unitType.id);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6">List Your Property</h1>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Resort Selection Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Resort Information</h2>
            <button
              type="button"
              onClick={() => setUseResortData(!useResortData)}
              className="text-sm text-primary underline"
            >
              {useResortData ? "My resort isn't listed" : "Use resort database"}
            </button>
          </div>

          {useResortData ? (
            <>
              <ResortSelector
                selectedBrand={selectedBrand}
                selectedResortId={selectedResort?.id}
                onBrandChange={setSelectedBrand}
                onResortChange={handleResortChange}
              />

              {selectedResort && (
                <UnitTypeSelector
                  resortId={selectedResort.id}
                  selectedUnitTypeId={selectedUnitType?.id}
                  onUnitTypeChange={handleUnitTypeChange}
                />
              )}
            </>
          ) : (
            <>
              {/* Fallback: Manual entry (existing form fields) */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manual_resort">Resort Name *</Label>
                  <Input
                    id="manual_resort"
                    {...form.register("resort_name")}
                    placeholder="Enter resort name manually"
                  />
                </div>
                <div>
                  <Label htmlFor="manual_location">Location *</Label>
                  <Input
                    id="manual_location"
                    {...form.register("location")}
                    placeholder="City, State"
                  />
                </div>
                {/* Existing manual bedrooms, bathrooms, sleeps fields */}
              </div>
            </>
          )}
        </div>

        {/* Allow override even with resort selected */}
        {useResortData && selectedUnitType && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              These values were auto-populated. You can modify them if your unit differs:
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  {...form.register("bedrooms", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  step="0.5"
                  {...form.register("bathrooms", { valueAsNumber: true })}
                />
              </div>
              <div>
                <Label htmlFor="sleeps">Sleeps</Label>
                <Input
                  id="sleeps"
                  type="number"
                  {...form.register("sleeps", { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Rest of form: description, amenities, images, pricing, etc. */}
        {/* ... existing form fields ... */}

        <Button type="submit" className="w-full">
          Submit Listing
        </Button>
      </form>
    </div>
  );
}
```

---

### Listing Engineer Deliverables

When complete, document in handoff:

```markdown
## Listing Flow Engineer - Completed Tasks

✅ Created `ResortSelector` component (brand → resort cascade)
✅ Created `UnitTypeSelector` component (filtered by resort)
✅ Created `ResortPreview` component (shows resort info)
✅ Updated `ListProperty.tsx` with resort selection
✅ Implemented auto-population from resort/unit type data
✅ Added "Resort not listed" fallback toggle
✅ Allow manual override of auto-populated fields

### Components Created
- `src/components/resort/ResortSelector.tsx`
- `src/components/resort/UnitTypeSelector.tsx`
- `src/components/resort/ResortPreview.tsx`

### Pages Modified
- `src/pages/ListProperty.tsx` - Added resort selection flow

### Integration Points
- Uses TanStack React Query for data fetching
- Integrates with existing form (React Hook Form)
- Works with Database Engineer's schema

### Testing Checklist
✅ Brand dropdown loads
✅ Resort dropdown filters by brand
✅ Resort selection shows preview
✅ Unit type dropdown filters by resort
✅ Auto-population works correctly
✅ Manual override works
✅ "Resort not listed" fallback works
✅ Form submission includes resort_id and unit_type_id

### Ready for Display Engineer
✅ All resort data is queryable
✅ Properties can link to resorts
✅ Components are reusable
```

---

## Team Integration Testing

**BEFORE COMPLETING SESSION 1**, test together:

### Test 1: Database Query from Frontend

```typescript
// In browser console or test component
const { data, error } = await supabase
  .from('resorts')
  .select('*')
  .eq('brand', 'hilton_grand_vacations');

console.log('Resorts:', data);
// Should show 10 HGV resorts
```

### Test 2: Complete Listing Flow

1. Go to `/list-property`
2. Select "Hilton Grand Vacations" brand
3. Verify resort dropdown shows 10 resorts
4. Select "Tuscany Village"
5. Verify resort preview shows location, rating, amenities
6. Verify unit type dropdown shows 4 options (Studio, 1BR, 2BR, 3BR)
7. Select "2-Bedroom Suite"
8. Verify fields auto-populate:
   - Bedrooms: 2
   - Bathrooms: 2.0
   - Sleeps: 6
9. Override bedrooms to 3
10. Submit form
11. Verify `resort_id` and `unit_type_id` are saved

---

## Session 1 Team Handoff

**File:** `handoffs/session1-team-handoff.md`

```markdown
# SESSION 1 TEAM HANDOFF: Database + Listing Flow

**Completed:** [Date/Time]  
**Agents:** Database Engineer + Listing Flow Engineer  
**Duration:** [Actual time]  
**Status:** ✅ Complete / ⚠️ Issues Found

---

## Database Engineer Summary

**Schema Created:**
- ✅ `resorts` table (10 HGV resorts)
- ✅ `resort_unit_types` table (33 unit types)
- ✅ `properties` table modified (resort_id, unit_type_id added)
- ✅ Indexes created
- ✅ Helper view created
- ✅ RLS policies applied

**Data Imported:**
- Resorts: 10
- Unit Types: 33
- All verifications passed

**SQL Migration File:**
`docs/supabase-migrations/007_resort_master_data.sql`

---

## Listing Engineer Summary

**Components Created:**
- ✅ `ResortSelector.tsx` - Brand/resort cascade
- ✅ `UnitTypeSelector.tsx` - Unit type dropdown
- ✅ `ResortPreview.tsx` - Resort info card

**Pages Modified:**
- ✅ `ListProperty.tsx` - Resort selection integrated

**Features Implemented:**
- ✅ Brand → Resort → Unit Type cascade
- ✅ Auto-population from master data
- ✅ Manual override capability
- ✅ "Resort not listed" fallback

---

## Integration Test Results

✅ Database queries work from frontend
✅ Resort dropdown populated correctly
✅ Unit type filtering works
✅ Auto-population works
✅ Form submission includes resort_id/unit_type_id
✅ No console errors

---

## Known Issues

[List any issues encountered]

---

## Next Steps for Display Engineer (Session 2)

**What's Ready:**
- Database has full resort data
- Properties can link to resorts via resort_id
- You can query `properties_with_resort_details` view

**What You Need to Build:**
- `ResortInfoCard` component for PropertyDetail page
- `UnitTypeSpecs` component for PropertyDetail page
- Update PropertyDetail to show resort info when available
- Fallback for properties without resort_id

**Sample Queries for You:**

```typescript
// Get property with resort data
const { data: property } = await supabase
  .from('properties')
  .select(`
    *,
    resort:resorts(*),
    unit_type:resort_unit_types(*)
  `)
  .eq('id', propertyId)
  .single();

// Use like this:
if (property.resort) {
  // Show ResortInfoCard
}
if (property.unit_type) {
  // Show UnitTypeSpecs
}
```

---

**HANDOFF COMPLETE ✅**
Ready for Session 2: Display Engineer
```

---

## Success Criteria for Session 1

Before ending this session, verify:

- ✅ Database schema created successfully
- ✅ 10 resorts imported
- ✅ 33 unit types imported
- ✅ ResortSelector component working
- ✅ UnitTypeSelector component working
- ✅ Auto-population working
- ✅ Form submission works with new fields
- ✅ No critical errors
- ✅ Handoff document created

---

**🎉 END OF SESSION 1 TASK CARD**

**Ready to start? Paste the PROJECT BRIEF + this task card into your agent session!**
