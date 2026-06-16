/**
 * Distance-Aware Mode Assignment Engine
 *
 * Assigns walk / bus / metro / auto / cab per route type and distance band.
 * ETA for ride legs is derived from the road-routing duration (OSRM/ORS),
 * scaled by realistic public-transit vs driving factors.
 */

import type { GeocodedPlace } from "@/services/osm/nominatim.service";
import type { RouteLeg, RouteType } from "@/types/database";

const MODE_ETA_FACTOR: Record<string, number> = {
  walk: 2.8,
  bus: 1.25,
  metro: 0.9,
  auto: 1.15,
  cab: 1.05,
};

function leg(
  mode: string,
  from: string,
  to: string,
  distKm: number,
  durationMin: number
): RouteLeg {
  return {
    mode,
    from,
    to,
    distance_km: Math.round(distKm * 100) / 100,
    duration_min: Math.max(1, Math.round(durationMin)),
  };
}

function rideDurationMin(
  totalKm: number,
  rideKm: number,
  mode: string,
  orsDurationMin: number
): number {
  if (totalKm <= 0) return 1;
  const share = rideKm / totalKm;
  const base = orsDurationMin * share * (MODE_ETA_FACTOR[mode] ?? 1.1);
  return Math.max(1, Math.round(base));
}

/**
 * Cheapest: bus/walk for urban hops; metro only when distance makes bus impractical.
 * Others: auto (short), metro/cab by distance band.
 */
function selectMode(distKm: number, routeType: RouteType): string {
  if (distKm <= 2) return "walk";
  if (distKm <= 8) return routeType === "cheapest" ? "bus" : "auto";
  if (distKm <= 15) {
    if (routeType === "safest") return "cab";
    if (routeType === "cheapest") return "bus";
    return "metro";
  }
  if (distKm <= 25) {
    if (routeType === "cheapest") return "metro";
    return routeType === "safest" ? "cab" : "metro";
  }
  return routeType === "cheapest" ? "bus" : "cab";
}

export function buildMultimodalLegs(
  routeType: RouteType,
  src: GeocodedPlace,
  dst: GeocodedPlace,
  ors: { distance_km: number; duration_min: number }
): RouteLeg[] {
  const from = src.display_name ?? src.name;
  const to = dst.display_name ?? dst.name;
  const d = ors.distance_km;
  const mode = selectMode(d, routeType);

  if (mode === "walk") {
    return [leg("walk", from, to, d, rideDurationMin(d, d, "walk", ors.duration_min))];
  }

  if (mode === "auto") {
    const walkKm = Math.min(0.3, d * 0.05);
    const rideKm = Math.max(0.3, d - walkKm);
    return [
      leg("walk", from, "Auto stand", walkKm, rideDurationMin(d, walkKm, "walk", ors.duration_min)),
      leg("auto", "Auto stand", to, rideKm, rideDurationMin(d, rideKm, "auto", ors.duration_min)),
    ];
  }

  if (mode === "cab") {
    const walkKm = Math.min(0.2, d * 0.03);
    const rideKm = Math.max(0.5, d - walkKm);
    return [
      leg("walk", from, "Cab pickup", walkKm, rideDurationMin(d, walkKm, "walk", ors.duration_min)),
      leg("cab", "Cab pickup", to, rideKm, rideDurationMin(d, rideKm, "cab", ors.duration_min)),
    ];
  }

  if (mode === "metro") {
    const walkKm = Math.min(0.5, d * 0.08);
    const rideKm = Math.max(0.8, d - walkKm * 2);
    const rideLabel =
      routeType === "women_friendly" ? "Metro (Women's Coach)" : "Metro";
    return [
      leg("walk", from, "Metro entrance", walkKm, rideDurationMin(d, walkKm, "walk", ors.duration_min)),
      leg("metro", rideLabel, "Metro station", rideKm, rideDurationMin(d, rideKm, "metro", ors.duration_min)),
      leg("walk", "Station exit", to, walkKm, rideDurationMin(d, walkKm, "walk", ors.duration_min)),
    ];
  }

  const walkKm = Math.min(0.4, d * 0.05);
  const rideKm = Math.max(0.5, d - walkKm * 2);
  return [
    leg("walk", from, "Bus stop", walkKm, rideDurationMin(d, walkKm, "walk", ors.duration_min)),
    leg("bus", "Bus corridor", "Drop point", rideKm, rideDurationMin(d, rideKm, "bus", ors.duration_min)),
    leg("walk", "Drop point", to, walkKm, rideDurationMin(d, walkKm, "walk", ors.duration_min)),
  ];
}

export function modeLabel(mode: string): string {
  const labels: Record<string, string> = {
    walk: "Walk",
    bus: "Bus",
    metro: "Metro",
    auto: "Auto",
    cab: "Cab",
  };
  return labels[mode] ?? mode;
}

export function primaryTransitMode(legs: RouteLeg[]): string | null {
  return legs.find((l) => l.mode !== "walk")?.mode ?? null;
}
