import { IS_DEMO_MODE, ORS_API_KEY } from "@/lib/config";
import { cacheKey, haversineM, sampleLineString } from "@/lib/geo";
import { supabase } from "@/lib/supabase/client";
import { nominatimService } from "@/services/osm/nominatim.service";
import { placesService } from "@/services/supabase/places.service";
import { reportsService } from "@/services/supabase/reports.service";
import { routeCacheService } from "@/services/supabase/route-cache.service";
import type { CityId, PlannedRoute, RouteType, SafetyBreakdownItem } from "@/types/database";

type OrsResult = {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
};

async function fetchORS(
  start: [number, number],
  end: [number, number],
  profile: string,
  preference: string
): Promise<OrsResult | null> {
  if (!ORS_API_KEY) return null;
  try {
    const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
      method: "POST",
      headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ coordinates: [start, end], preference, units: "km" }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const f = json.features?.[0];
    if (!f) return null;
    return {
      distance_km: Math.round(f.properties.summary.distance * 100) / 100,
      duration_min: Math.round(f.properties.summary.duration / 60),
      geometry: f.geometry,
    };
  } catch {
    return null;
  }
}

function countReportsNearRoute(
  reports: { latitude: number; longitude: number }[],
  samples: { lat: number; lng: number }[]
): number {
  let near = 0;
  for (const r of reports) {
    for (const s of samples) {
      const dLat = Math.abs(r.latitude - s.lat);
      const dLng = Math.abs(r.longitude - s.lng);
      if (dLat < 0.015 && dLng < 0.015) {
        near += 1;
        break;
      }
    }
  }
  return near;
}

async function scoreRouteLive(
  distanceKm: number,
  routeType: RouteType,
  reportsNear: number,
  policeNear: number,
  hospitalsNear: number
): Promise<{ score: number; breakdown: SafetyBreakdownItem[] }> {
  const community = Math.max(15, 100 - reportsNear * 12);
  const popularity = Math.min(95, 50 + distanceKm * 1.5);
  const police = Math.min(98, 40 + policeNear * 8);
  const transit = Math.min(90, 45 + hospitalsNear * 4);
  const hour = new Date().getHours();
  const timeRisk = hour >= 22 || hour < 5 ? 50 : 88;

  let weighted =
    community * 0.35 + popularity * 0.25 + police * 0.2 + transit * 0.1 + timeRisk * 0.1;
  if (routeType === "safest") weighted += 6;
  if (routeType === "women_friendly") weighted += 8;
  if (routeType === "cheapest") weighted -= 4;

  const score = Math.max(12, Math.min(98, Math.round(weighted)));
  return {
    score,
    breakdown: [
      { factor: "Community Safety Rating", weight_pct: 35, score: community, contribution: Math.round(community * 0.35) },
      { factor: "Route Popularity", weight_pct: 25, score: popularity, contribution: Math.round(popularity * 0.25) },
      { factor: "Police Station Proximity", weight_pct: 20, score: police, contribution: Math.round(police * 0.2) },
      { factor: "Public Transport Activity", weight_pct: 10, score: transit, contribution: Math.round(transit * 0.1) },
      { factor: "Time-of-Day Risk", weight_pct: 10, score: timeRisk, contribution: Math.round(timeRisk * 0.1) },
    ],
  };
}

const VARIANTS: { type: RouteType; profile: string; preference: string; costMul: number }[] = [
  { type: "balanced", profile: "driving-car", preference: "recommended", costMul: 1 },
  { type: "safest", profile: "driving-car", preference: "recommended", costMul: 1.08 },
  { type: "cheapest", profile: "driving-car", preference: "shortest", costMul: 0.75 },
  { type: "women_friendly", profile: "foot-walking", preference: "recommended", costMul: 1.02 },
];

export const routesService = {
  geocode: nominatimService.geocode,

  async searchRoutes(source: string, destination: string, cityId: CityId): Promise<PlannedRoute[]> {
    const [src, dst, allReports] = await Promise.all([
      nominatimService.geocode(source, cityId),
      nominatimService.geocode(destination, cityId),
      reportsService.listByCity(cityId, 100),
    ]);

    const routes: PlannedRoute[] = [];

    for (const v of VARIANTS) {
      const cKey = cacheKey([
        v.type,
        v.profile,
        src.lat.toFixed(4),
        src.lng.toFixed(4),
        dst.lat.toFixed(4),
        dst.lng.toFixed(4),
      ]);

      let ors = await routeCacheService.get(cKey);
      if (!ors && !IS_DEMO_MODE) {
        const fresh = await fetchORS([src.lng, src.lat], [dst.lng, dst.lat], v.profile, v.preference);
        if (fresh) {
          ors = fresh;
          await routeCacheService.set(cKey, {
            source_lat: src.lat,
            source_lng: src.lng,
            dest_lat: dst.lat,
            dest_lng: dst.lng,
            route_type: v.type,
            ors_profile: v.profile,
            distance_km: fresh.distance_km,
            duration_min: fresh.duration_min,
            geometry: fresh.geometry,
          });
        }
      }

      if (!ors && IS_DEMO_MODE) {
        const distM = haversineM(src.lat, src.lng, dst.lat, dst.lng);
        const distance_km = Math.round((distM / 1000) * 100) / 100;
        ors = {
          distance_km,
          duration_min: Math.round(distance_km * 3.2),
          geometry: {
            type: "LineString",
            coordinates: [
              [src.lng, src.lat],
              [dst.lng, dst.lat],
            ],
          },
        };
      }

      if (!ors) {
        throw new Error(
          "Could not generate route. Add VITE_OPENROUTESERVICE_API_KEY or set VITE_DEMO_MODE=true for local fallback."
        );
      }

      const samples = sampleLineString(ors.geometry);
      const reportsNear = countReportsNearRoute(allReports, samples);
      const [policeNear, hospitalsNear] = IS_DEMO_MODE
        ? [2, 1]
        : await Promise.all([
            placesService.countPlacesNearRoute(samples, cityId, "police"),
            placesService.countPlacesNearRoute(samples, cityId, "hospital"),
          ]);

      const { score, breakdown } = await scoreRouteLive(
        ors.distance_km,
        v.type,
        reportsNear,
        policeNear,
        hospitalsNear
      );

      const baseCost = Math.max(15, Math.round(20 + ors.distance_km * 10 * v.costMul));

      routes.push({
        route_type: v.type,
        source_name: src.name,
        destination_name: dst.name,
        source_lat: src.lat,
        source_lng: src.lng,
        dest_lat: dst.lat,
        dest_lng: dst.lng,
        legs: [
          {
            mode: v.profile === "foot-walking" ? "walk" : v.type === "cheapest" ? "bus" : "metro",
            from: src.display_name ?? src.name,
            to: dst.display_name ?? dst.name,
            duration_min: ors.duration_min,
            distance_km: ors.distance_km,
          },
        ],
        safety_score: score,
        safety_breakdown: breakdown,
        distance_km: ors.distance_km,
        eta_minutes: ors.duration_min,
        estimated_cost_inr: baseCost,
        reliability_score: Math.min(98, 68 + policeNear * 3),
        crowd_level: ors.duration_min < 25 ? "High" : "Moderate",
        walking_distance_km: v.profile === "foot-walking" ? ors.distance_km : Math.round(ors.distance_km * 0.1 * 100) / 100,
        transfer_count: v.type === "cheapest" ? 1 : 0,
        geometry: ors.geometry,
        recommendations: [
          reportsNear > 0 ? `${reportsNear} community report(s) near corridor` : "No recent reports on this corridor",
          policeNear > 0 ? `${policeNear} police POIs sampled along route` : "Limited police proximity data",
          `Geocoded via ${src.source} · Routed via OpenRouteService`,
        ],
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      for (const r of routes) {
        await supabase.from("routes").insert({
          user_id: user.id,
          city_id: cityId,
          route_type: r.route_type,
          source_name: r.source_name,
          destination_name: r.destination_name,
          source_lat: r.source_lat,
          source_lng: r.source_lng,
          dest_lat: r.dest_lat,
          dest_lng: r.dest_lng,
          legs: r.legs,
          safety_score: r.safety_score,
          safety_breakdown: r.safety_breakdown,
          distance_km: r.distance_km,
          eta_minutes: r.eta_minutes,
          estimated_cost_inr: r.estimated_cost_inr,
          reliability_score: r.reliability_score,
          crowd_level: r.crowd_level,
          walking_distance_km: r.walking_distance_km,
          transfer_count: r.transfer_count,
          geometry: r.geometry,
        });
      }
    }

    return routes;
  },
};
