import { describe, expect, it } from "vitest";
import {
  compareByVehicleCategory,
  comparePlatformBrands,
  quoteWithHighlights,
  VEHICLE_CATEGORIES,
} from "../platform-fares";
import type { PlannedRoute } from "@/types/database";

const mockRoute: PlannedRoute = {
  id: "test-route-1",
  city: "bangalore",
  route_type: "balanced",
  safety_score: 72,
  reliability_score: 80,
  distance_km: 8,
  eta_minutes: 25,
  estimated_cost_inr: 40,
  geometry: { type: "LineString", coordinates: [] },
  safety_breakdown: [
    { factor: "community", score: 75, weight_pct: 30, contribution: 23 },
    { factor: "crime", score: 70, weight_pct: 25, contribution: 18 },
    { factor: "police", score: 65, weight_pct: 20, contribution: 13 },
    { factor: "hospital", score: 60, weight_pct: 15, contribution: 9 },
    { factor: "route_characteristics", score: 80, weight_pct: 10, contribution: 8 },
  ],
  recommendations: ["Safe corridor with good community data"],
  waypoints: [],
  created_at: new Date().toISOString(),
};

describe("comparePlatformBrands", () => {
  it("returns brands for all major platforms", () => {
    const brands = comparePlatformBrands(mockRoute);
    const ids = brands.map((b) => b.id);
    expect(ids).toContain("uber");
    expect(ids).toContain("ola");
    expect(ids).toContain("rapido");
    expect(ids).toContain("namma_yatri");
  });

  it("each brand has at least one vehicle", () => {
    const brands = comparePlatformBrands(mockRoute);
    for (const brand of brands) {
      expect(brand.vehicles.length).toBeGreaterThan(0);
    }
  });

  it("applies surge multiplier for night hours", () => {
    const day = comparePlatformBrands(mockRoute, { departureHour: 10 });
    const night = comparePlatformBrands(mockRoute, { departureHour: 23 });
    const dayUber = day.find((b) => b.id === "uber")!;
    const nightUber = night.find((b) => b.id === "uber")!;
    const dayFare = dayUber.vehicles.find((v) => v.id === "uber_go")!.fareInr;
    const nightFare = nightUber.vehicles.find((v) => v.id === "uber_go")!.fareInr;
    expect(nightFare).toBeGreaterThan(dayFare);
  });

  it("women safety mode boosts safety scores", () => {
    const normal = comparePlatformBrands(mockRoute, { departureHour: 10 });
    const women = comparePlatformBrands(mockRoute, { departureHour: 10, womenSafetyMode: true });
    const normalUber = normal.find((b) => b.id === "uber")!.vehicles.find((v) => v.id === "uber_go")!;
    const womenUber = women.find((b) => b.id === "uber")!.vehicles.find((v) => v.id === "uber_go")!;
    expect(womenUber.safetyScore).toBeGreaterThanOrEqual(normalUber.safetyScore);
  });
});

describe("compareByVehicleCategory", () => {
  it("returns only auto platforms for auto category", () => {
    const rows = compareByVehicleCategory(mockRoute, "auto");
    for (const row of rows) {
      expect(row.vehicle.mode).toBe("Auto");
    }
  });

  it("returns only bike platforms for bike category", () => {
    const rows = compareByVehicleCategory(mockRoute, "bike");
    for (const row of rows) {
      expect(row.vehicle.mode).toBe("Bike");
    }
  });

  it("returns results for all vehicle categories", () => {
    for (const cat of VEHICLE_CATEGORIES) {
      const rows = compareByVehicleCategory(mockRoute, cat);
      expect(Array.isArray(rows)).toBe(true);
    }
  });

  it("transit category returns the Safar transit option", () => {
    const rows = compareByVehicleCategory(mockRoute, "transit");
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].brand.id).toBe("safar");
  });
});

describe("quoteWithHighlights", () => {
  const allQuotes: import("../platform-fares").VehicleQuote[] = [
    { id: "uber_go", mode: "Go", fareInr: 80, safetyScore: 70, etaMinutes: 20, safetyNote: "" },
    { id: "rapido_bike", mode: "Bike", fareInr: 50, safetyScore: 85, etaMinutes: 15, safetyNote: "" },
    { id: "ola_prime", mode: "Prime", fareInr: 120, safetyScore: 60, etaMinutes: 30, safetyNote: "" },
  ];

  it("marks cheapest correctly", () => {
    const quote = { fareInr: 50, safetyScore: 85, etaMinutes: 15, name: "Rapido", brandColor: "#F4C430", id: "rapido_bike" as const, mode: "Bike", safetyNote: "" };
    const result = quoteWithHighlights(quote, allQuotes);
    expect(result.highlights).toContain("cheapest");
  });

  it("marks safest correctly", () => {
    const quote = { fareInr: 50, safetyScore: 85, etaMinutes: 15, name: "Rapido", brandColor: "#F4C430", id: "rapido_bike" as const, mode: "Bike", safetyNote: "" };
    const result = quoteWithHighlights(quote, allQuotes);
    expect(result.highlights).toContain("safest");
  });

  it("marks fastest correctly", () => {
    const quote = { fareInr: 50, safetyScore: 85, etaMinutes: 15, name: "Rapido", brandColor: "#F4C430", id: "rapido_bike" as const, mode: "Bike", safetyNote: "" };
    const result = quoteWithHighlights(quote, allQuotes);
    expect(result.highlights).toContain("fastest");
  });

  it("expensive non-safe quote gets no highlights", () => {
    const quote = { fareInr: 120, safetyScore: 60, etaMinutes: 30, name: "Test", brandColor: "#000", id: "ola_prime" as const, mode: "Prime", safetyNote: "" } as const;
    const result = quoteWithHighlights(quote, allQuotes);
    expect(result.highlights).toHaveLength(0);
  });
});
