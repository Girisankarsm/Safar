import type { RouteLeg, RouteType } from "@/types/database";

/** Indian urban fare bands (INR) — aligned with MTC/BMTC/metro typical rates */
const FARE_RATES: Record<string, { base: number; perKm: number; cap?: number }> = {
  walk: { base: 0, perKm: 0 },
  bus: { base: 10, perKm: 1.8, cap: 45 },
  metro: { base: 20, perKm: 2.2, cap: 80 },
  auto: { base: 35, perKm: 14, cap: 350 },
  cab: { base: 55, perKm: 16, cap: 900 },
};

export function estimateLegFare(mode: string, distanceKm: number): number {
  const rates = FARE_RATES[mode] ?? FARE_RATES.auto;
  const raw = rates.base + distanceKm * rates.perKm;
  return Math.round(rates.cap != null ? Math.min(raw, rates.cap) : raw);
}

export function estimateRouteFare(legs: RouteLeg[], routeType: RouteType): number {
  const total = legs.reduce((sum, leg) => sum + estimateLegFare(leg.mode, leg.distance_km), 0);
  if (routeType === "cheapest") return Math.max(10, Math.round(total * 0.92));
  if (routeType === "women_friendly") return Math.max(15, Math.round(total * 1.05));
  return Math.max(15, total);
}
