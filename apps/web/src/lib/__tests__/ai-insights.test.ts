import { describe, expect, it } from "vitest";
import { recommendRoute, generateAIInsights } from "../ai-insights";
import type { PlannedRoute } from "@/types/database";

function makeRoute(
  type: PlannedRoute["route_type"],
  safety: number,
  eta: number,
  cost: number
): PlannedRoute {
  return {
    id: `route-${type}`,
    route_type: type,
    safety_score: safety,
    reliability_score: 75,
    distance_km: 6,
    eta_minutes: eta,
    estimated_cost_inr: cost,
    geometry: { type: "LineString", coordinates: [] },
    safety_breakdown: [
      { factor: "community", score: 70, weight_pct: 30, contribution: 21 },
      { factor: "crime", score: 65, weight_pct: 25, contribution: 16 },
      { factor: "police", score: 60, weight_pct: 20, contribution: 12 },
      { factor: "hospital", score: 55, weight_pct: 15, contribution: 8 },
      { factor: "route_characteristics", score: 75, weight_pct: 10, contribution: 8 },
    ],
    recommendations: ["Safe corridor"],
  };
}

describe("recommendRoute", () => {
  it("returns null for empty routes", () => {
    expect(recommendRoute([])).toBeNull();
  });

  it("returns a recommendation for a single route", () => {
    const routes = [makeRoute("balanced", 70, 20, 60)];
    const result = recommendRoute(routes);
    expect(result).not.toBeNull();
    expect(result!.route.route_type).toBe("balanced");
  });

  it("prefers higher safety when ETA and cost are equal", () => {
    const routes = [
      makeRoute("balanced", 60, 20, 60),
      makeRoute("safest", 90, 20, 60),
    ];
    const result = recommendRoute(routes);
    expect(result!.route.route_type).toBe("safest");
  });

  it("boosts women-friendly route significantly in women safety mode", () => {
    const routes = [
      makeRoute("balanced", 72, 20, 60),
      makeRoute("women_friendly", 70, 20, 60),
    ];
    const result = recommendRoute(routes, { womenSafetyMode: true });
    expect(result!.route.route_type).toBe("women_friendly");
  });

  it("includes reasons in recommendation", () => {
    const routes = [makeRoute("safest", 95, 20, 70)];
    const result = recommendRoute(routes);
    expect(result!.reasons.length).toBeGreaterThan(0);
  });

  it("score is between 0 and 1", () => {
    const routes = [makeRoute("balanced", 70, 20, 60), makeRoute("safest", 85, 25, 80)];
    const result = recommendRoute(routes);
    expect(result!.score).toBeGreaterThanOrEqual(0);
    expect(result!.score).toBeLessThanOrEqual(1.5);
  });
});

describe("generateAIInsights", () => {
  const route = makeRoute("safest", 82, 22, 65);

  it("returns a valid risk level", () => {
    const insights = generateAIInsights(route);
    expect(["Low", "Moderate", "High"]).toContain(insights.riskLevel);
  });

  it("returns safety confidence between 0 and 100", () => {
    const insights = generateAIInsights(route);
    expect(insights.safetyConfidence).toBeGreaterThanOrEqual(0);
    expect(insights.safetyConfidence).toBeLessThanOrEqual(100);
  });

  it("returns a non-empty summary", () => {
    const insights = generateAIInsights(route);
    expect(insights.summary.length).toBeGreaterThan(10);
  });

  it("returns at least one highlight", () => {
    const insights = generateAIInsights(route);
    expect(insights.highlights.length).toBeGreaterThan(0);
  });

  it("returns a corridorExplanation string", () => {
    const insights = generateAIInsights(route);
    expect(typeof insights.corridorExplanation).toBe("string");
    expect(insights.corridorExplanation.length).toBeGreaterThan(5);
  });

  it("uses corridorExplanation from profile when available", () => {
    const routeWithProfile = {
      ...route,
      corridor_profile: {
        policeCount: 3,
        hospitalCount: 2,
        reportCount: 1,
        hotspots: [],
        segments: [
          { fromCoordIdx: 0, toCoordIdx: 1, riskLevel: "safe" as const, reportCount: 0, policeNearby: 2, hospitalNearby: 1, lat: 12.934, lng: 77.614 },
        ],
        policeCoverage: 1,
        hospitalCoverage: 1,
        infraScore: 82,
        communityScore: 90,
        lightingScore: 72,
        confidenceScore: 78,
        dominantRisk: "safe" as const,
        policeNames: ["Koramangala Police Station"],
        hospitalNames: ["Apollo Hospital", "St. Martha's Hospital"],
        policeStations: [{ name: "Koramangala Police Station", lat: 12.934, lng: 77.614 }],
        hospitals: [
          { name: "Apollo Hospital", lat: 12.936, lng: 77.616 },
          { name: "St. Martha's Hospital", lat: 12.938, lng: 77.618 },
        ],
      },
    };
    const insights = generateAIInsights(routeWithProfile);
    expect(insights.safetyConfidence).toBe(78);
    expect(insights.corridorExplanation).toContain("police station");
  });
});
