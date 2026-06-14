import type { RouteLeg, RouteType } from "@/types/database";

const FARE_RATES: Record<string, { base: number; perKm: number }> = {
  walk: { base: 0, perKm: 0 },
  bus: { base: 8, perKm: 2.5 },
  metro: { base: 15, perKm: 3 },
  auto: { base: 30, perKm: 12 },
  cab: { base: 50, perKm: 14 },
};

export function estimateLegFare(mode: string, distanceKm: number): number {
  const rates = FARE_RATES[mode] ?? FARE_RATES.auto;
  return Math.round(rates.base + distanceKm * rates.perKm);
}

export function estimateRouteFare(legs: RouteLeg[], routeType: RouteType): number {
  const total = legs.reduce((sum, leg) => sum + estimateLegFare(leg.mode, leg.distance_km), 0);
  if (routeType === "cheapest") return Math.max(12, Math.round(total * 0.85));
  if (routeType === "women_friendly") return Math.max(15, Math.round(total * 1.05));
  return Math.max(15, total);
}
