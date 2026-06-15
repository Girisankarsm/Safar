/**
 * Distance-Aware Mode Assignment Engine
 *
 * Replaces hardcoded per-type mode logic with a two-axis model:
 *   Axis 1 — Travel distance (determines which mode band applies)
 *   Axis 2 — Route type (picks the best mode within that band)
 *
 * Distance bands:
 *   ≤ 1.5 km   → walk only (any type)
 *   ≤ 5 km     → auto (safest/balanced/women) | walk (cheapest)
 *   ≤ 15 km    → metro (cheapest/balanced/women) | auto (safest)
 *   ≤ 30 km    → metro (cheapest) | cab (safest/balanced/women)
 *   30+ km     → cab (safest/balanced/women) | bus (cheapest)
 *
 * Rules enforced:
 *   - Never auto for 30+ km routes
 *   - Never metro for routes where distances exceed realistic metro range (30 km)
 *   - Cab used for long-distance safest/women to ensure door-to-door safety
 *   - Women-friendly uses metro with "Women's Coach" label when metro is selected
 */

import type { GeocodedPlace } from "@/services/osm/nominatim.service";
import type { RouteLeg, RouteType } from "@/types/database";

// Realistic average speeds in Indian urban conditions (km/h)
const MODE_SPEEDS_KPH: Record<string, number> = {
  walk:  5,
  auto:  22,
  bus:   18,
  metro: 35,
  cab:   28,
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

function dmin(km: number, mode: string): number {
  return (km / (MODE_SPEEDS_KPH[mode] ?? 20)) * 60;
}

/**
 * Select primary transit mode.
 *
 *   ≤ 1.5 km:  walk
 *   ≤ 5 km:    walk (cheapest)  | auto (others)
 *   ≤ 15 km:   metro (cheapest/balanced/women) | auto (safest)
 *   ≤ 30 km:   metro (cheapest) | cab  (others)
 *   30+ km:    bus   (cheapest) | cab  (others)
 */
function selectMode(distKm: number, routeType: RouteType): string {
  if (distKm <= 1.5) return "walk";
  if (distKm <= 5) return routeType === "cheapest" ? "walk" : "auto";
  if (distKm <= 15) return routeType === "safest" ? "auto" : "metro";
  if (distKm <= 30) return routeType === "cheapest" ? "metro" : "cab";
  return routeType === "cheapest" ? "bus" : "cab";
}

export function buildMultimodalLegs(
  routeType: RouteType,
  src: GeocodedPlace,
  dst: GeocodedPlace,
  ors: { distance_km: number; duration_min: number }
): RouteLeg[] {
  const from = src.display_name ?? src.name;
  const to   = dst.display_name ?? dst.name;
  const d    = ors.distance_km;
  const mode = selectMode(d, routeType);

  // ── Walk only ──────────────────────────────────────────────────────────────
  if (mode === "walk") {
    return [leg("walk", from, to, d, dmin(d, "walk"))];
  }

  // ── Auto (short urban hop) ─────────────────────────────────────────────────
  if (mode === "auto") {
    const walkKm = Math.min(0.3, d * 0.05);
    const rideKm = Math.max(0.3, d - walkKm);
    return [
      leg("walk", from, "Auto stand", walkKm, dmin(walkKm, "walk")),
      leg("auto", "Auto stand", to, rideKm, dmin(rideKm, "auto")),
    ];
  }

  // ── Cab (cross-city, long-distance) ───────────────────────────────────────
  if (mode === "cab") {
    const walkKm = Math.min(0.2, d * 0.03);
    const rideKm = Math.max(0.5, d - walkKm);
    return [
      leg("walk", from, "Cab pickup", walkKm, dmin(walkKm, "walk")),
      leg("cab", "Cab pickup", to, rideKm, dmin(rideKm, "cab")),
    ];
  }

  // ── Metro (city transit zone, 5–30 km) ────────────────────────────────────
  if (mode === "metro") {
    const walkKm = Math.min(0.5, d * 0.08);
    const rideKm = Math.max(0.8, d - walkKm * 2);
    // Women-friendly gets explicit women's coach label
    const rideLabel =
      routeType === "women_friendly" ? "Metro (Women's Coach)" : "Metro";
    return [
      leg("walk", from, "Metro entrance", walkKm, dmin(walkKm, "walk")),
      leg("metro", rideLabel, "Metro station", rideKm, dmin(rideKm, "metro")),
      leg("walk", "Station exit", to, walkKm, dmin(walkKm, "walk")),
    ];
  }

  // ── Bus (cheapest 30+ km — transit corridor) ───────────────────────────────
  const walkKm = Math.min(0.4, d * 0.05);
  const rideKm = Math.max(0.5, d - walkKm * 2);
  return [
    leg("walk", from, "Bus stop", walkKm, dmin(walkKm, "walk")),
    leg("bus", "Bus corridor", "Drop point", rideKm, dmin(rideKm, "bus")),
    leg("walk", "Drop point", to, walkKm, dmin(walkKm, "walk")),
  ];
}

export function modeLabel(mode: string): string {
  const labels: Record<string, string> = {
    walk:  "Walk",
    bus:   "Bus",
    metro: "Metro",
    auto:  "Auto",
    cab:   "Cab",
  };
  return labels[mode] ?? mode;
}
