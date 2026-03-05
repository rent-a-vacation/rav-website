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

describe("generateTemplateJson", () => {
  it("returns valid JSON with example resort", () => {
    const template = generateTemplateJson();
    const parsed = JSON.parse(template);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].resort_name).toBeDefined();
    expect(parsed[0].brand).toBeDefined();
    expect(parsed[0].location.city).toBeDefined();
  });
});
