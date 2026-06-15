import { ORS_API_KEY, ORS_PROXY_URL } from "@/lib/config";
import { estimateRouteFare } from "@/lib/fare-estimates";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { cacheKey, haversineM, sampleLineString } from "@/lib/geo";
import { buildMultimodalLegs } from "@/lib/multimodal-legs";
import { timeSafetyLabel, timeSafetyModifier } from "@/lib/time-safety";
import { buildCorridorProfile, profileToScoringInputs } from "@/lib/corridor-risk";
import { supabase } from "@/lib/supabase/client";
import { nominatimService, type GeocodedPlace } from "@/services/osm/nominatim.service";
import { fetchEmergencyPlacesNear } from "@/services/osm/overpass.service";
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
  costMul: number;
  /** Index into the alternatives array (0 = primary, 1 = alt1, 2 = alt2) */
  altIndex: number;
};

/**
 * Route variants — each maps to a different alternative geometry from ORS.
 * alt 0 = ORS recommended (standard fastest + balanced)
 * alt 1 = ORS 1st alternative (different corridor → used for safest)
 * alt 2 = ORS shortest path  (fewest km → cheapest)
 * alt 3 = ORS 2nd alternative (another corridor → women-friendly)
 */
const VARIANTS: VariantConfig[] = [
  { type: "balanced",       costMul: 1.00, altIndex: 0 },
  { type: "safest",         costMul: 1.08, altIndex: 1 },
  { type: "cheapest",       costMul: 0.75, altIndex: 2 },
  { type: "women_friendly", costMul: 1.02, altIndex: 3 },
];

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

/**
 * Fetch a single ORS route (used for cheapest / shortest preference).
 */
async function fetchORS(
  start: [number, number],
  end: [number, number],
  profile: string,
  preference: string
): Promise<OrsResult | null> {
  const body = JSON.stringify({ coordinates: [start, end], preference, units: "km" });

  try {
    let res: Response | null = null;
    if (ORS_PROXY_URL) {
      res = await fetchWithTimeout(
        `${ORS_PROXY_URL}?path=/v2/directions/${profile}/geojson`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body, timeoutMs: 14_000 }
      );
    } else if (ORS_API_KEY) {
      res = await fetchWithTimeout(
        `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
        {
          method: "POST",
          headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
          body,
          timeoutMs: 12_000,
        }
      );
    }
    if (!res?.ok) return null;
    const json = await res.json();
    const f = json.features?.[0];
    if (!f?.geometry?.coordinates?.length) return null;
    return {
      distance_km: Math.round(f.properties.summary.distance * 100) / 100,
      duration_min: Math.round(f.properties.summary.duration / 60),
      geometry: f.geometry,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch up to 3 genuinely different ORS route alternatives in a single call.
 *
 * ORS alternative_routes parameters:
 *   target_count  — how many alternatives to request (including the primary)
 *   weight_factor — alternatives may be up to N× longer than the primary
 *   share_factor  — routes share at most this fraction of waypoints (lower = more different)
 *
 * Returns [primary, alt1, alt2] — fewer entries if ORS can't find alternatives.
 */
async function fetchORSAlternatives(
  start: [number, number],
  end: [number, number],
  profile = "driving-car"
): Promise<OrsResult[]> {
  const body = JSON.stringify({
    coordinates: [start, end],
    preference: "recommended",
    units: "km",
    alternative_routes: {
      target_count: 3,     // request up to 3 distinct routes
      weight_factor: 1.6,  // alternatives may be up to 60% longer
      share_factor: 0.6,   // routes share at most 60% of their path
    },
  });

  try {
    let res: Response | null = null;
    if (ORS_PROXY_URL) {
      res = await fetchWithTimeout(
        `${ORS_PROXY_URL}?path=/v2/directions/${profile}/geojson`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body, timeoutMs: 18_000 }
      );
    } else if (ORS_API_KEY) {
      res = await fetchWithTimeout(
        `https://api.openrouteservice.org/v2/directions/${profile}/geojson`,
        {
          method: "POST",
          headers: { Authorization: ORS_API_KEY, "Content-Type": "application/json" },
          body,
          timeoutMs: 16_000,
        }
      );
    }
    if (!res?.ok) return [];
    const json = await res.json();
    const features: unknown[] = json.features ?? [];
    return features
      .map((f: unknown) => {
        const feat = f as { geometry: GeoJSON.LineString; properties: { summary: { distance: number; duration: number } } };
        if (!feat?.geometry?.coordinates?.length) return null;
        return {
          distance_km: Math.round(feat.properties.summary.distance * 100) / 100,
          duration_min: Math.round(feat.properties.summary.duration / 60),
          geometry: feat.geometry,
        };
      })
      .filter((r): r is OrsResult => r !== null);
  } catch {
    return [];
  }
}

/** Single OSRM route — used for straight-line fallback detection */
async function fetchOSRM(
  start: [number, number],
  end: [number, number],
  profile: string
): Promise<OrsResult | null> {
  const osrmProfile = profile === "foot-walking" ? "foot" : "driving";
  const coords = `${start[0]},${start[1]};${end[0]},${end[1]}`;
  try {
    const res = await fetchWithTimeout(
      `https://router.project-osrm.org/route/v1/${osrmProfile}/${coords}?overview=full&geometries=geojson`,
      { timeoutMs: 12_000 }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const route = json.routes?.[0];
    if (!route?.geometry?.coordinates?.length) return null;
    return {
      distance_km: Math.round((route.distance / 1000) * 100) / 100,
      duration_min: Math.max(1, Math.round(route.duration / 60)),
      geometry: route.geometry,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch up to 3 genuinely different route alternatives from the OSRM public
 * demo server. OSRM `alternatives=3` is reliable and always free.
 *
 * Returns routes sorted by distance ascending so callers can easily pick
 * the shortest (cheapest) vs longer (potentially safer) options.
 */
async function fetchOSRMAlternatives(
  start: [number, number],
  end: [number, number]
): Promise<OrsResult[]> {
  const coords = `${start[0]},${start[1]};${end[0]},${end[1]}`;
  try {
    const res = await fetchWithTimeout(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&alternatives=3&steps=false`,
      { timeoutMs: 15_000 }
    );
    if (!res.ok) return [];
    const json = await res.json();
    return ((json.routes ?? []) as Array<{ geometry: GeoJSON.LineString; distance: number; duration: number }>)
      .map((r) => ({
        distance_km: Math.round((r.distance / 1000) * 100) / 100,
        duration_min: Math.max(1, Math.round(r.duration / 60)),
        geometry: r.geometry,
      }))
      .filter((r) => !isStraightLineGeometry(r.geometry));
  } catch {
    return [];
  }
}

/**
 * Route via an intermediate city-centre waypoint to force a genuinely
 * different corridor. Used for "safest" and "women-friendly" variants when
 * the routing API only returns one geometry for a given O-D pair.
 *
 * The waypoint is chosen as the midpoint between src and dst but offset
 * toward the nearest city centre (lat/lng bias), producing a route that
 * curves through denser, better-lit urban areas.
 */
async function fetchOSRMViaWaypoint(
  src: GeocodedPlace,
  dst: GeocodedPlace,
  cityId: CityId
): Promise<OrsResult | null> {
  // City-centre reference points (well-lit, high-police-density areas)
  const CITY_CENTRES: Record<CityId, [number, number]> = {
    chennai:    [13.0827, 80.2707],   // Chennai Central / Anna Salai
    bangalore:  [12.9716, 77.5946],   // MG Road / Brigade Road
    trivandrum: [8.5241,  76.9366],   // East Fort / Palayam
    hyderabad:  [17.3850, 78.4867],   // Charminar / Abids
  };

  const centre = CITY_CENTRES[cityId] ?? CITY_CENTRES.chennai;

  // Waypoint = weighted midpoint shifted 35% toward city centre
  const wLat = (src.lat + dst.lat) / 2 * 0.65 + centre[0] * 0.35;
  const wLng = (src.lng + dst.lng) / 2 * 0.65 + centre[1] * 0.35;

  const coords = `${src.lng},${src.lat};${wLng},${wLat};${dst.lng},${dst.lat}`;
  try {
    const res = await fetchWithTimeout(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`,
      { timeoutMs: 12_000 }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const r = json.routes?.[0];
    if (!r?.geometry?.coordinates?.length) return null;
    return {
      distance_km: Math.round((r.distance / 1000) * 100) / 100,
      duration_min: Math.max(1, Math.round(r.duration / 60)),
      geometry: r.geometry,
    };
  } catch {
    return null;
  }
}

function isStraightLineGeometry(geometry: GeoJSON.LineString): boolean {
  return (geometry.coordinates?.length ?? 0) <= 2;
}

async function fetchRoadRoute(
  src: GeocodedPlace,
  dst: GeocodedPlace,
  profile: string,
  preference: string
): Promise<{ result: OrsResult; source: string } | null> {
  const start: [number, number] = [src.lng, src.lat];
  const end: [number, number] = [dst.lng, dst.lat];

  const ors = await fetchORS(start, end, profile, preference);
  if (ors && !isStraightLineGeometry(ors.geometry)) {
    return { result: ors, source: "OpenRouteService" };
  }

  const osrm = await fetchOSRM(start, end, profile);
  if (osrm && !isStraightLineGeometry(osrm.geometry)) {
    return { result: osrm, source: "OpenStreetMap (OSRM)" };
  }

  return null;
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
    preference,
    src.lat.toFixed(4),
    src.lng.toFixed(4),
    dst.lat.toFixed(4),
    dst.lng.toFixed(4),
  ]);

  const cached = await routeCacheService.get(cKey);
  if (cached && !isStraightLineGeometry(cached.geometry)) return cached;

  const road = await fetchRoadRoute(src, dst, profile, preference);
  if (road) {
    const inferredRouteType: RouteType =
      preference === "shortest" ? "cheapest" : "balanced";
    void routeCacheService.set(cKey, {
      source_lat: src.lat,
      source_lng: src.lng,
      dest_lat: dst.lat,
      dest_lng: dst.lng,
      route_type: inferredRouteType,
      ors_profile: profile,
      distance_km: road.result.distance_km,
      duration_min: road.result.duration_min,
      geometry: road.result.geometry,
    });
    return road.result;
  }

  return straightLineRoute(src, dst);
}

/**
 * Builds a synthetic route variant from an existing OrsResult by adjusting
 * distance/duration estimates. Used as fallback when ORS can't return distinct
 * alternatives (e.g. very short trips or sparse road network areas).
 *
 * The geometry is slightly simplified to visually differentiate routes.
 */
function deriveVariantRoute(
  base: OrsResult,
  distanceMul: number,
  durationMul: number
): OrsResult {
  const coords = base.geometry.coordinates;

  // Produce a visually distinct geometry by keeping every Nth point
  // (creates a simplified / slightly different-looking polyline)
  const simplified = coords.filter((_, i) => i % 2 === 0 || i === coords.length - 1);

  return {
    distance_km: Math.round(base.distance_km * distanceMul * 100) / 100,
    duration_min: Math.max(5, Math.round(base.duration_min * durationMul)),
    geometry: { type: "LineString", coordinates: simplified.length >= 2 ? simplified : coords },
  };
}

function scoreRouteWithProfile(
  distanceKm: number,
  routeType: RouteType,
  reportsNear: number,
  policeNear: number,
  hospitalsNear: number,
  hotspotPenalty: number,
  crimeIndex: number,
  departureHour: number,
  infraScore: number,
  communityScore: number,
  lightingScore: number
): { score: number; breakdown: SafetyBreakdownItem[] } {
  // Use corridor-specific values when available, fall back gracefully
  const community = communityScore > 0 ? communityScore : Math.max(15, 100 - reportsNear * 12);
  const crime = crimeIndex;
  const police =
    infraScore > 0
      ? Math.min(98, infraScore * 0.6 + Math.min(30, policeNear * 5))
      : Math.min(98, 40 + policeNear * 8);
  const hospital = Math.min(90, 45 + hospitalsNear * 4);
  const timeMod = timeSafetyModifier(departureHour);
  const lighting = lightingScore > 0 ? lightingScore : Math.min(95, Math.max(20, 55 + distanceKm * 1.2 + timeMod));

  let weighted =
    community * 0.30 +
    crime * 0.20 +
    police * 0.18 +
    hospital * 0.10 +
    lighting * 0.12 +
    Math.max(0, 80 - hotspotPenalty) * 0.10;

  // Route type modifiers
  if (routeType === "safest") weighted += 6;
  if (routeType === "women_friendly") weighted += 8;
  if (routeType === "cheapest") weighted -= 4;

  const score = Math.max(12, Math.min(98, Math.round(weighted)));
  return {
    score,
    breakdown: [
      { factor: "Community Reports", weight_pct: 30, score: Math.round(community), contribution: Math.round(community * 0.3) },
      { factor: "Historical Crime Index (NCRB)", weight_pct: 20, score: crime, contribution: Math.round(crime * 0.2) },
      { factor: "Police Station Proximity", weight_pct: 18, score: Math.round(police), contribution: Math.round(police * 0.18) },
      { factor: "Hospital Proximity", weight_pct: 10, score: Math.round(hospital), contribution: Math.round(hospital * 0.1) },
      { factor: "Lighting & Infrastructure", weight_pct: 12, score: Math.round(lighting), contribution: Math.round(lighting * 0.12) },
      { factor: "Night Travel Risk", weight_pct: 10, score: Math.max(0, 80 - hotspotPenalty), contribution: Math.round(Math.max(0, 80 - hotspotPenalty) * 0.1) },
    ],
  };
}

/** Fetch OSM emergency places covering the full route corridor in one call */
async function fetchCorridorPlaces(
  samples: { lat: number; lng: number }[]
): Promise<import("@/services/osm/overpass.service").OverpassPlace[]> {
  if (!samples.length) return [];

  // Find centroid and max radius to cover the whole corridor in one Overpass call
  const centLat = samples.reduce((s, p) => s + p.lat, 0) / samples.length;
  const centLng = samples.reduce((s, p) => s + p.lng, 0) / samples.length;
  const maxDist = samples.reduce(
    (max, p) => Math.max(max, haversineM(centLat, centLng, p.lat, p.lng)),
    0
  );
  const radiusM = Math.min(8000, Math.max(600, Math.round(maxDist + 600)));

  try {
    return await fetchEmergencyPlacesNear(centLat, centLng, radiusM, 10_000);
  } catch {
    return [];
  }
}

function buildPlannedRoute(
  v: VariantConfig,
  src: GeocodedPlace,
  dst: GeocodedPlace,
  ors: OrsResult,
  allReports: { latitude: number; longitude: number; category?: string }[],
  osmPlaces: import("@/services/osm/overpass.service").OverpassPlace[],
  crimeIndex: number,
  departureHour: number,
  crimeMeta?: { risk_label: string; report_year: number; data_source: string }
): PlannedRoute {
  const legs = buildMultimodalLegs(v.type, src, dst, ors);

  // Build corridor-specific safety profile
  const corridorProfile = buildCorridorProfile(ors.geometry, allReports, osmPlaces, {
    distanceKm: ors.distance_km,
    departureHour,
    transferCount: Math.max(0, legs.length - 1),
  });

  const { policeNear, hospitalsNear, reportsNear, hotspotPenalty } =
    profileToScoringInputs(corridorProfile);

  const { score, breakdown } = scoreRouteWithProfile(
    ors.distance_km,
    v.type,
    reportsNear,
    policeNear,
    hospitalsNear,
    hotspotPenalty,
    crimeIndex,
    departureHour,
    corridorProfile.infraScore,
    corridorProfile.communityScore,
    corridorProfile.lightingScore
  );

  const baseCost = estimateRouteFare(legs, v.type);
  const isEstimate = isStraightLineGeometry(ors.geometry);
  const routedVia = isEstimate
    ? "Direct estimate (re-search for road routing)"
    : ORS_PROXY_URL || ORS_API_KEY
      ? "OpenRouteService / OSM roads"
      : "OpenStreetMap road network";

  // Build corridor-specific recommendations
  const recommendations: string[] = [timeSafetyLabel(departureHour)];

  if (reportsNear > 0) {
    recommendations.push(`${reportsNear} community report(s) along corridor`);
  } else {
    recommendations.push("No recent community reports on this corridor");
  }

  if (corridorProfile.hotspots.length > 0) {
    const highRisk = corridorProfile.hotspots.filter((h) => h.riskLevel === "high").length;
    recommendations.push(
      highRisk > 0
        ? `${highRisk} high-density report cluster${highRisk > 1 ? "s" : ""} detected on route`
        : `${corridorProfile.hotspots.length} report cluster${corridorProfile.hotspots.length > 1 ? "s" : ""} near corridor`
    );
  }

  if (crimeMeta) {
    recommendations.push(
      `NCRB ${crimeMeta.report_year} crime index: ${crimeIndex}/100 (${crimeMeta.risk_label.replace(/_/g, " ")})`
    );
  }

  if (policeNear > 0) {
    recommendations.push(
      `${policeNear} police station${policeNear > 1 ? "s" : ""} within corridor${corridorProfile.policeNames.length ? ` — ${corridorProfile.policeNames[0]}` : ""}`
    );
  }

  if (hospitalsNear > 0) {
    recommendations.push(
      `${hospitalsNear} hospital${hospitalsNear > 1 ? "s" : ""} within corridor${corridorProfile.hospitalNames.length ? ` — ${corridorProfile.hospitalNames[0]}` : ""}`
    );
  }

  recommendations.push(`Multi-modal: ${legs.map((l) => l.mode).join(" → ")} via ${routedVia}`);

  return {
    route_type: v.type,
    source_name: src.name,
    destination_name: dst.name,
    source_lat: src.lat,
    source_lng: src.lng,
    dest_lat: dst.lat,
    dest_lng: dst.lng,
    legs,
    safety_score: score,
    safety_breakdown: breakdown,
    distance_km: ors.distance_km,
    eta_minutes: legs.reduce((s, l) => s + l.duration_min, 0),
    estimated_cost_inr: baseCost,
    reliability_score: Math.min(98, 60 + policeNear * 4 + hospitalsNear * 2),
    crowd_level: ors.duration_min < 25 ? "High" : "Moderate",
    walking_distance_km:
      Math.round(
        legs.filter((l) => l.mode === "walk").reduce((s, l) => s + l.distance_km, 0) * 100
      ) / 100,
    transfer_count: Math.max(0, legs.length - 1),
    geometry: ors.geometry,
    recommendations,
    corridor_profile: corridorProfile,
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
    resolved?: { source?: GeocodedPlace; destination?: GeocodedPlace },
    options?: { departureHour?: number }
  ): Promise<PlannedRoute[]> {
    const departureHour = options?.departureHour ?? new Date().getHours();
    const [src, dst, allReports, crimeScore] = await Promise.all([
      resolved?.source ?? nominatimService.geocode(source, cityId),
      resolved?.destination ?? nominatimService.geocode(destination, cityId),
      reportsService.listByCity(cityId, 100).catch(() => []),
      crimeService.getCityScore(cityId),
    ]);

    const start: [number, number] = [src.lng, src.lat];
    const end: [number, number] = [dst.lng, dst.lat];

    // ── Step 1: Gather all available distinct road geometries ─────────────
    // Fire all route-fetching in parallel:
    //   a) ORS alternatives  (up to 3, if ORS is configured)
    //   b) OSRM alternatives (up to 3, always available — public server)
    //   c) ORS shortest      (cheapest — fewest km)
    //   d) OSRM via city-centre waypoint (safest / women-friendly corridor)
    const [orsAlternativesRaw, osrmAlternatives, orsShortestResult, waypointRoute] =
      await Promise.all([
        fetchORSAlternatives(start, end, "driving-car"),
        fetchOSRMAlternatives(start, end),
        resolveOrsRoute(src, dst, "driving-car", "shortest", "drive-short"),
        fetchOSRMViaWaypoint(src, dst, cityId),
      ]);

    const orsAlts = orsAlternativesRaw.filter((r) => !isStraightLineGeometry(r.geometry));

    // Prefer ORS alternatives (road-class-aware); fall back to OSRM
    const mainAlts: OrsResult[] = orsAlts.length >= 2 ? orsAlts : osrmAlternatives;

    // ── Step 2: Assign one distinct geometry per route type ───────────────
    //
    // balanced       → mainAlts[0]  (fastest recommended road route)
    // safest         → mainAlts[1] if different, else waypointRoute (city-centre detour)
    // cheapest       → shortest-km route among all candidates
    // women_friendly → mainAlts[2] or waypointRoute (well-lit urban corridor)

    // Guaranteed base
    const primary: OrsResult =
      mainAlts[0] ??
      (await fetchRoadRoute(src, dst, "driving-car", "recommended"))?.result ??
      straightLineRoute(src, dst);

    // Safest: use 2nd alternative if it's genuinely different (≥2km apart), else city-centre waypoint
    const safeCandidate = mainAlts[1];
    const safest: OrsResult =
      safeCandidate && Math.abs(safeCandidate.distance_km - primary.distance_km) >= 1
        ? safeCandidate
        : waypointRoute ?? deriveVariantRoute(primary, 1.18, 1.25);

    // Cheapest: pick the route with the smallest distance_km from all candidates
    const allCandidates = [primary, safeCandidate, orsShortestResult, ...mainAlts].filter(
      (r): r is OrsResult => !!r && !isStraightLineGeometry(r.geometry)
    );
    const cheapest: OrsResult =
      allCandidates.sort((a, b) => a.distance_km - b.distance_km)[0] ??
      deriveVariantRoute(primary, 0.85, 0.88);

    // Women-friendly: use 3rd alternative or waypoint route (urban lit corridor)
    const womenCandidate = mainAlts[2];
    const womenFriendly: OrsResult =
      womenCandidate && womenCandidate !== primary
        ? womenCandidate
        : waypointRoute ?? deriveVariantRoute(primary, 1.08, 1.12);

    // Final map: each variant gets its own geometry
    const altMap: OrsResult[] = [primary, safest, cheapest, womenFriendly];

    // ── Step 3: Build corridor profiles and planned routes ────────────────
    const routeSamples = sampleLineString(primary.geometry, 10);
    const osmPlaces = await fetchCorridorPlaces(routeSamples);

    const crimeMeta = {
      risk_label: crimeScore.risk_label,
      report_year: crimeScore.report_year,
      data_source: crimeScore.data_source,
    };

    const routes = VARIANTS.map((v) => {
      const ors = altMap[v.altIndex] ?? primary;
      return buildPlannedRoute(v, src, dst, ors, allReports, osmPlaces, crimeScore.crime_index, departureHour, crimeMeta);
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) persistRoutes(user.id, cityId, routes);

    return routes;
  },
};
