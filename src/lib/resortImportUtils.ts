import type { VacationClubBrand } from "@/types/database";

export interface ResortImportRow {
  resort_name: string;
  brand: VacationClubBrand;
  location: {
    address?: string;
    city: string;
    state: string;
    country?: string;
  };
  description?: string;
  resort_amenities?: string[];
  attraction_tags?: string[];
  guest_rating?: number;
  nearby_airports?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  rows: ResortImportRow[];
}

export interface DuplicateCheckResult {
  row: ResortImportRow;
  isDuplicate: boolean;
  matchedId?: string;
}

const VALID_BRANDS: VacationClubBrand[] = [
  "hilton_grand_vacations",
  "marriott_vacation_club",
  "disney_vacation_club",
  "wyndham_destinations",
  "hyatt_residence_club",
  "bluegreen_vacations",
  "holiday_inn_club",
  "worldmark",
  "other",
];

export function validateResortJson(input: unknown): ValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(input)) {
    return { valid: false, errors: ["Input must be a JSON array of resort objects."], rows: [] };
  }

  if (input.length === 0) {
    return { valid: false, errors: ["Array is empty. Provide at least one resort."], rows: [] };
  }

  const rows: ResortImportRow[] = [];

  for (let i = 0; i < input.length; i++) {
    const item = input[i];
    const prefix = `Row ${i + 1}`;

    if (!item || typeof item !== "object") {
      errors.push(`${prefix}: Must be an object.`);
      continue;
    }

    if (!item.resort_name || typeof item.resort_name !== "string") {
      errors.push(`${prefix}: Missing or invalid "resort_name" (string required).`);
    }

    if (!item.brand || !VALID_BRANDS.includes(item.brand)) {
      errors.push(`${prefix}: Missing or invalid "brand". Valid values: ${VALID_BRANDS.join(", ")}`);
    }

    if (!item.location || typeof item.location !== "object" || !item.location.city || !item.location.state) {
      errors.push(`${prefix}: Missing or invalid "location" (must have "city" and "state").`);
    }

    if (item.guest_rating !== undefined && (typeof item.guest_rating !== "number" || item.guest_rating < 0 || item.guest_rating > 5)) {
      errors.push(`${prefix}: "guest_rating" must be a number between 0 and 5.`);
    }

    if (errors.length === 0 || !errors.some((e) => e.startsWith(prefix))) {
      rows.push(item as ResortImportRow);
    }
  }

  return { valid: errors.length === 0, errors, rows };
}

export function findDuplicateResorts(
  importRows: ResortImportRow[],
  existingResorts: Array<{ id: string; resort_name: string; brand: string; location: { city?: string; state?: string } | null }>
): DuplicateCheckResult[] {
  return importRows.map((row) => {
    const match = existingResorts.find(
      (existing) =>
        existing.resort_name.toLowerCase() === row.resort_name.toLowerCase() &&
        existing.brand === row.brand &&
        (existing.location as { city?: string; state?: string } | null)?.city?.toLowerCase() === row.location.city.toLowerCase()
    );

    return {
      row,
      isDuplicate: !!match,
      matchedId: match?.id,
    };
  });
}

export function generateTemplateJson(): string {
  const template: ResortImportRow[] = [
    {
      resort_name: "Example Grand Resort",
      brand: "hilton_grand_vacations",
      location: {
        address: "123 Resort Blvd",
        city: "Orlando",
        state: "FL",
        country: "US",
      },
      description: "A beautiful resort with world-class amenities.",
      resort_amenities: ["Pool", "Spa", "Fitness Center", "Restaurant"],
      attraction_tags: ["Beach", "Spa"],
      guest_rating: 4.5,
      nearby_airports: ["MCO", "SFB"],
    },
  ];

  return JSON.stringify(template, null, 2);
}
