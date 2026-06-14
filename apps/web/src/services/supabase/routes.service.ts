import { IS_DEMO_MODE, ORS_API_KEY } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { cacheKey, haversineM, sampleLineString } from "@/lib/geo";
import { supabase } from "@/lib/supabase/client";
import { nominatimService, type GeocodedPlace } from "@/services/osm/nominatim.service";
import { crimeService } from "@/services/supabase/crime.service";
import { reportsService } from "@/services/supabase/reports.service";
import { routeCacheService } from "@/services/supabase/route-cache.service";
import type { CityId, PlannedRoute, RouteType, SafetyBreakdownItem } from "@/types/database";

type OrsResult = {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
};

type VariantConfig = {
  type: RouteType;
  profile: string;
  preference: string;
  costMul: number;
  orsKey: string;
};

const VARIANTS: VariantConfig[] = [
  { type: "balanced", profile: "driving-car", preference: "recommended", costMul: 1, orsKey: "drive-rec" },
  { type: "safest", profile: "driving-car", preference: "recommended", costMul: 1.08, orsKey: "drive-rec" },
  { type: "cheapest", profile: "driving-car", preference: "shortest", costMul: 0.75, orsKey: "drive-short" },
  { type: "women_friendly", profile: "foot-walking", preference: "recommended", costMul: 1.02, orsKey: "walk-rec" },
];

const UNIQUE_ORS = [
  { key: "drive-rec", profile: "driving-car", preference: "recommended" },
  { key: "drive-short", profile: "driving-car", preference: "shortest" },
  { key: "walk-rec", profile: "foot-walking", preference: "recommended" },
] as const;

function straightLineRoute(
  src: { lat: number; lng: number },
  dst: { lat: number; lng: number }
): OrsResult {
  const distM = haversineM(src.lat, src.lng, dst.lat, dst.lng);
  const distance_km = Math.round((distM / 1000) * 100) / 100;
  return {
    distance_km,
    duration_min: Math.max(5, Math.round(distance_km * 3.2)),
    geometry: {
      type: "LineString",
      coordinates: [
        [src.lng, src.lat],
        [dst.lng, dst.lat],
      ],
    },
  };
}

async function fetchORS(
  start: [number, number],
  end: [number, number],
  profile: string,
  preference: string
): Promise<OrsResult | null> {
  if (!ORS_API_KEY) return null;
  try {
    const res = await fetchWithTimeout(
      `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
      {
        method: "POST",
        headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ coordinates: [start, end], preference, units: "km" }),
        timeoutMs: 12_000,
      }
    );
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

async function resolveOrsRoute(
  src: GeocodedPlace,
  dst: GeocodedPlace,
  profile: string,
  preference: string,
  routeKey: string
): Promise<OrsResult> {
  const cKey = cacheKey([
    routeKey,
    profile,
    src.lat.toFixed(4),
    src.lng.toFixed(4),
    dst.lat.toFixed(4),
    dst.lng.toFixed(4),
  ]);

  const cached = await routeCacheService.get(cKey);
  if (cached) return cached;

  if (!IS_DEMO_MODE) {
    const fresh = await fetchORS([src.lng, src.lat], [dst.lng, dst.lat], profile, preference);
    if (fresh) {
      void routeCacheService.set(cKey, {
        source_lat: src.lat,
        source_lng: src.lng,
        dest_lat: dst.lat,
        dest_lng: dst.lng,
        route_type: "balanced",
        ors_profile: profile,
        distance_km: fresh.distance_km,
        duration_min: fresh.duration_min,
        geometry: fresh.geometry,
      });
      return fresh;
    }
  }

  return straightLineRoute(src, dst);
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

function estimatePoiCounts(distanceKm: number) {
  return {
    police: Math.min(6, Math.max(1, Math.round(distanceKm / 4))),
    hospitals: Math.min(5, Math.max(1, Math.round(distanceKm / 6))),
  };
}

function scoreRoute(
  distanceKm: number,
  routeType: RouteType,
  reportsNear: number,
  policeNear: number,
  hospitalsNear: number,
  crimeIndex: number
): { score: number; breakdown: SafetyBreakdownItem[] } {
  const community = Math.max(15, 100 - reportsNear * 12);
  const crime = crimeIndex;
  const police = Math.min(98, 40 + policeNear * 8);
  const hospital = Math.min(90, 45 + hospitalsNear * 4);
  const hour = new Date().getHours();
  const routeChars = Math.min(95, 55 + distanceKm * 1.2 + (hour >= 22 || hour < 5 ? -15 : 20));

  let weighted =
    community * 0.4 + crime * 0.25 + police * 0.15 + hospital * 0.1 + routeChars * 0.1;
  if (routeType === "safest") weighted += 6;
  if (routeType === "women_friendly") weighted += 8;
  if (routeType === "cheapest") weighted -= 4;

  const score = Math.max(12, Math.min(98, Math.round(weighted)));
  return {
    score,
    breakdown: [
      { factor: "Community Reports", weight_pct: 40, score: community, contribution: Math.round(community * 0.4) },
      { factor: "Historical Crime Index (NCRB)", weight_pct: 25, score: crime, contribution: Math.round(crime * 0.25) },
      { factor: "Police Station Proximity", weight_pct: 15, score: police, contribution: Math.round(police * 0.15) },
      { factor: "Hospital Proximity", weight_pct: 10, score: hospital, contribution: Math.round(hospital * 0.1) },
      { factor: "Route Characteristics", weight_pct: 10, score: Math.round(routeChars), contribution: Math.round(routeChars * 0.1) },
    ],
  };
}

function buildPlannedRoute(
  v: VariantConfig,
  src: GeocodedPlace,
  dst: GeocodedPlace,
  ors: OrsResult,
  reportsNear: number,
  policeNear: number,
  hospitalsNear: number,
  crimeIndex: number,
  crimeMeta?: { risk_label: string; report_year: number; data_source: string }
): PlannedRoute {
  const { score, breakdown } = scoreRoute(
    ors.distance_km,
    v.type,
    reportsNear,
    policeNear,
    hospitalsNear,
    crimeIndex
  );
  const baseCost = Math.max(15, Math.round(20 + ors.distance_km * 10 * v.costMul));
  const routedVia = ORS_API_KEY && !IS_DEMO_MODE ? "OpenRouteService" : "direct corridor estimate";

  return {
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
    walking_distance_km:
      v.profile === "foot-walking" ? ors.distance_km : Math.round(ors.distance_km * 0.1 * 100) / 100,
    transfer_count: v.type === "cheapest" ? 1 : 0,
    geometry: ors.geometry,
    recommendations: [
      reportsNear > 0 ? `${reportsNear} community report(s) near corridor` : "No recent community reports on this corridor",
      crimeMeta
        ? `NCRB ${crimeMeta.report_year} crime index: ${crimeIndex}/100 (${crimeMeta.risk_label.replace(/_/g, " ")})`
        : `Historical crime index: ${crimeIndex}/100`,
      policeNear > 0 ? `~${policeNear} police POIs estimated along route` : "Limited police proximity data",
      `Routed via ${routedVia}`,
    ],
  };
}

function persistRoutes(userId: string, cityId: CityId, routes: PlannedRoute[]) {
  void Promise.all(
    routes.map((r) =>
      supabase.from("routes").insert({
        user_id: userId,
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
      })
    )
  );
}

export const routesService = {
  geocode: nominatimService.geocode,

  async searchRoutes(
    source: string,
    destination: string,
    cityId: CityId,
    resolved?: { source?: GeocodedPlace; destination?: GeocodedPlace }
  ): Promise<PlannedRoute[]> {
    const [src, dst, allReports, crimeScore] = await Promise.all([
      resolved?.source ?? nominatimService.geocode(source, cityId),
      resolved?.destination ?? nominatimService.geocode(destination, cityId),
      reportsService.listByCity(cityId, 100).catch(() => []),
      crimeService.getCityScore(cityId),
    ]);

    const orsEntries = await Promise.all(
      UNIQUE_ORS.map(async (ors) => ({
        key: ors.key,
        result: await resolveOrsRoute(src, dst, ors.profile, ors.preference, ors.key),
      }))
    );
    const orsMap = Object.fromEntries(orsEntries.map((e) => [e.key, e.result])) as Record<string, OrsResult>;

    const routes = VARIANTS.map((v) => {
      const ors = orsMap[v.orsKey] ?? straightLineRoute(src, dst);
      const samples = sampleLineString(ors.geometry, 8);
      const reportsNear = countReportsNearRoute(allReports, samples);
      const { police, hospitals } = estimatePoiCounts(ors.distance_km);

      return buildPlannedRoute(
        v,
        src,
        dst,
        ors,
        reportsNear,
        police,
        hospitals,
        crimeScore.crime_index,
        {
          risk_label: crimeScore.risk_label,
          report_year: crimeScore.report_year,
          data_source: crimeScore.data_source,
        }
      );
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) persistRoutes(user.id, cityId, routes);

    return routes;
  },
};
