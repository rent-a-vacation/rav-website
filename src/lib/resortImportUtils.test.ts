import { describe, it, expect } from "vitest";
import {
  validateResortJson,
  findDuplicateResorts,
  generateTemplateJson,
  type ResortImportRow,
} from "./resortImportUtils";

describe("validateResortJson", () => {
  it("rejects non-array input", () => {
    const result = validateResortJson("not an array");
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("JSON array");
  });

  it("rejects empty array", () => {
    const result = validateResortJson([]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("empty");
  });

  it("accepts valid resort data", () => {
    const result = validateResortJson([
      {
        resort_name: "Test Resort",
        brand: "hilton_grand_vacations",
        location: { city: "Orlando", state: "FL" },
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects missing resort_name", () => {
    const result = validateResortJson([
      {
        brand: "hilton_grand_vacations",
        location: { city: "Orlando", state: "FL" },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("resort_name");
  });

  it("rejects invalid brand", () => {
    const result = validateResortJson([
      {
        resort_name: "Test",
        brand: "invalid_brand",
        location: { city: "Orlando", state: "FL" },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("brand");
  });

  it("rejects missing location city/state", () => {
    const result = validateResortJson([
      {
        resort_name: "Test",
        brand: "hilton_grand_vacations",
        location: { address: "123 Main" },
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("location");
  });

  it("rejects invalid guest_rating", () => {
    const result = validateResortJson([
      {
        resort_name: "Test",
        brand: "hilton_grand_vacations",
        location: { city: "Orlando", state: "FL" },
        guest_rating: 6,
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("guest_rating");
  });

  it("validates multiple rows and collects all errors", () => {
    const result = validateResortJson([
      {
        resort_name: "Good Resort",
        brand: "hilton_grand_vacations",
        location: { city: "Orlando", state: "FL" },
      },
      { brand: "bad" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.rows).toHaveLength(1);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("findDuplicateResorts", () => {
  const existing = [
    {
      id: "r-1",
      resort_name: "Hilton Orlando",
      brand: "hilton_grand_vacations",
      location: { city: "Orlando", state: "FL" },
    },
  ];

  it("detects duplicate by name + brand + city", () => {
    const rows: ResortImportRow[] = [
      {
        resort_name: "Hilton Orlando",
        brand: "hilton_grand_vacations",
        location: { city: "Orlando", state: "FL" },
      },
    ];
    const results = findDuplicateResorts(rows, existing);
    expect(results[0].isDuplicate).toBe(true);
    expect(results[0].matchedId).toBe("r-1");
  });

  it("marks new resort as non-duplicate", () => {
    const rows: ResortImportRow[] = [
      {
        resort_name: "New Resort",
        brand: "marriott_vacation_club",
        location: { city: "Miami", state: "FL" },
      },
    ];
    const results = findDuplicateResorts(rows, existing);
    expect(results[0].isDuplicate).toBe(false);
    expect(results[0].matchedId).toBeUndefined();
  });
});

describe("validateResortJson — MDM fields (WS1)", () => {
  it("accepts valid resort with MDM optional fields (lat, lng, postal_code, data_source)", () => {
    const result = validateResortJson([
      {
        resort_name: "Geo Resort",
        brand: "marriott_vacation_club",
        location: { city: "Maui", state: "HI" },
        latitude: 20.8985,
        longitude: -156.4305,
        postal_code: "96761",
        data_source: "admin_entry",
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.rows[0].latitude).toBe(20.8985);
    expect(result.rows[0].postal_code).toBe("96761");
  });

  it("accepts resort without MDM fields (backward compat)", () => {
    const result = validateResortJson([
      {
        resort_name: "Plain Resort",
        brand: "disney_vacation_club",
        location: { city: "Anaheim", state: "CA" },
      },
    ]);
    expect(result.valid).toBe(true);
    expect(result.rows[0].latitude).toBeUndefined();
  });

  it("rejects latitude out of range (-90 to 90)", () => {
    const result = validateResortJson([
      {
        resort_name: "Bad Lat",
        brand: "hilton_grand_vacations",
        location: { city: "Orlando", state: "FL" },
        latitude: 91,
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("latitude");
  });

  it("rejects negative latitude below -90", () => {
    const result = validateResortJson([
      {
        resort_name: "Bad Lat South",
        brand: "hilton_grand_vacations",
        location: { city: "Orlando", state: "FL" },
        latitude: -91,
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("latitude");
  });

  it("rejects longitude out of range (-180 to 180)", () => {
    const result = validateResortJson([
      {
        resort_name: "Bad Lng",
        brand: "hilton_grand_vacations",
        location: { city: "Orlando", state: "FL" },
        longitude: 200,
      },
    ]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain("longitude");
  });

  it("accepts boundary values for lat/lng", () => {
    const result = validateResortJson([
      {
        resort_name: "Edge Resort",
        brand: "hilton_grand_vacations",
        location: { city: "Orlando", state: "FL" },
        latitude: -90,
        longitude: 180,
      },
    ]);
    expect(result.valid).toBe(true);
  });
});

describe("generateTemplateJson", () => {
  it("returns valid JSON with example resort", () => {
    const template = generateTemplateJson();
    const parsed = JSON.parse(template);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].resort_name).toBeDefined();
    expect(parsed[0].brand).toBeDefined();
    expect(parsed[0].location.city).toBeDefined();
  });

  it("template includes MDM fields (latitude, longitude, postal_code, data_source)", () => {
    const parsed = JSON.parse(generateTemplateJson());
    expect(parsed[0].latitude).toBeDefined();
    expect(parsed[0].longitude).toBeDefined();
    expect(parsed[0].postal_code).toBeDefined();
    expect(parsed[0].data_source).toBeDefined();
  });
});
