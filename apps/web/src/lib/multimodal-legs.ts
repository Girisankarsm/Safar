import type { GeocodedPlace } from "@/services/osm/nominatim.service";
import type { RouteLeg, RouteType } from "@/types/database";

type OrsLike = { distance_km: number; duration_min: number };

function leg(
  mode: string,
  from: string,
  to: string,
  distanceKm: number,
  durationMin: number
): RouteLeg {
  return {
    mode,
    from,
    to,
    distance_km: Math.round(distanceKm * 100) / 100,
    duration_min: Math.max(1, Math.round(durationMin)),
  };
}

/** Build realistic multi-modal legs from a road-routed corridor */
export function buildMultimodalLegs(
  routeType: RouteType,
  src: GeocodedPlace,
  dst: GeocodedPlace,
  ors: OrsLike
): RouteLeg[] {
  const from = src.display_name ?? src.name;
  const to = dst.display_name ?? dst.name;
  const d = ors.distance_km;
  const t = ors.duration_min;

  switch (routeType) {
    case "cheapest": {
      const walkStart = Math.min(0.4, d * 0.08);
      const busKm = Math.max(0.5, d - walkStart * 2);
      const walkEnd = Math.min(0.4, d * 0.08);
      return [
        leg("walk", from, "Nearest bus stop", walkStart, walkStart * 12),
        leg("bus", "Bus corridor", "Drop point", busKm, busKm * 2.8),
        leg("walk", "Drop point", to, walkEnd, walkEnd * 12),
      ];
    }
    case "women_friendly": {
      const walkStart = Math.min(0.5, d * 0.12);
      const metroKm = Math.max(0.8, d - walkStart * 2);
      const walkEnd = Math.min(0.5, d * 0.12);
      return [
        leg("walk", from, "Metro entrance", walkStart, walkStart * 12),
        leg("metro", "Metro (women's coach)", "Nearest station", metroKm, metroKm * 2.2),
        leg("walk", "Station exit", to, walkEnd, walkEnd * 12),
      ];
    }
    case "safest": {
      const walkStart = Math.min(0.3, d * 0.06);
      const autoKm = Math.max(0.5, d - walkStart);
      return [
        leg("walk", from, "Pickup point", walkStart, walkStart * 12),
        leg("auto", "Well-lit corridor", to, autoKm, t - walkStart * 12),
      ];
    }
    default: {
      const walkStart = Math.min(0.35, d * 0.07);
      const metroKm = Math.max(0.6, d * 0.75);
      const walkEnd = Math.min(0.35, d * 0.07);
      return [
        leg("walk", from, "Metro/bus hub", walkStart, walkStart * 12),
        leg("metro", "Transit corridor", "Exit station", metroKm, metroKm * 2),
        leg("walk", "Exit station", to, walkEnd, walkEnd * 12),
      ];
    }
  }
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
