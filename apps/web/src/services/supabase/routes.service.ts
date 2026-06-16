import { ORS_API_KEY, ORS_PROXY_URL } from "@/lib/config";
import { estimateRouteFare } from "@/lib/fare-estimates";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import { cacheKey, haversineM, sampleLineString } from "@/lib/geo";
import { buildMultimodalLegs } from "@/lib/multimodal-legs";
import { timeSafetyLabel, timeSafetyModifier } from "@/lib/time-safety";
import { buildCorridorProfile } from "@/lib/corridor-risk";
import type { CorridorProfile } from "@/lib/corridor-risk";
import { decayWeight } from "@/lib/report-decay";
import { supabase } from "@/lib/supabase/client";
import { nominatimService, type GeocodedPlace } from "@/services/osm/nominatim.service";
import { fetchEmergencyPlacesAlongCorridor } from "@/services/osm/overpass.service";
import { crimeService } from "@/services/supabase/crime.service";
import { reportsService } from "@/services/supabase/reports.service";
import { routeCacheService } from "@/services/supabase/route-cache.service";
import type { CityId, PlannedRoute, RouteType, SafetyBreakdownItem } from "@/types/database";

type OrsResult = {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
};


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


// ─── Scoring Engine v2 — no flat bonuses, genuine corridor analysis ──────────

type ReportLike = {
  latitude: number;
  longitude: number;
  category?: string;
  report_type?: string;
  created_at: string;
};

type ScoredCandidate = {
  ors: OrsResult;
  profile: CorridorProfile;
  safetyScore: number;
  safetyBreakdown: SafetyBreakdownItem[];
  womenScore: number;
};

/**
 * Pure corridor safety score — no route-type bonuses.
 * Weights: Community 30%, Crime 20%, Police 18%, Hospital 10%, Lighting 12%, Hotspots 10%
 * This is the final displayed safety_score for any route.
 */
function computeCorridorSafetyScore(
  profile: CorridorProfile,
  crimeIndex: number,
  departureHour: number,
  distanceKm: number
): { score: number; breakdown: SafetyBreakdownItem[] } {
  const community = profile.communityScore > 0
    ? profile.communityScore
    : Math.max(15, 100 - profile.reportCount * 12);

  const police = profile.infraScore > 0
    ? Math.min(98, profile.infraScore * 0.6 + Math.min(30, profile.policeCount * 5))
    : Math.min(98, 40 + profile.policeCount * 8);

  const hospital = Math.min(90, 45 + profile.hospitalCount * 4);

  const timeMod = timeSafetyModifier(departureHour);
  const lighting = profile.lightingScore > 0
    ? profile.lightingScore
    : Math.min(95, Math.max(20, 55 + distanceKm * 1.2 + timeMod));

  const hotspotPenalty = profile.hotspots.reduce((sum, h) => {
    return sum + (h.riskLevel === "high" ? 15 : h.riskLevel === "moderate" ? 8 : 3);
  }, 0);

  const weighted =
    community  * 0.30 +
    crimeIndex * 0.20 +
    police     * 0.18 +
    hospital   * 0.10 +
    lighting   * 0.12 +
    Math.max(0, 80 - hotspotPenalty) * 0.10;

  const score = Math.max(12, Math.min(98, Math.round(weighted)));
  return {
    score,
    breakdown: [
      { factor: "Community Reports",           weight_pct: 30, score: Math.round(community),                    contribution: Math.round(community * 0.3)    },
      { factor: "Historical Crime Index (NCRB)",weight_pct: 20, score: crimeIndex,                               contribution: Math.round(crimeIndex * 0.2)   },
      { factor: "Police Station Proximity",     weight_pct: 18, score: Math.round(police),                       contribution: Math.round(police * 0.18)      },
      { factor: "Hospital Proximity",           weight_pct: 10, score: Math.round(hospital),                     contribution: Math.round(hospital * 0.1)     },
      { factor: "Lighting & Infrastructure",    weight_pct: 12, score: Math.round(lighting),                     contribution: Math.round(lighting * 0.12)    },
      { factor: "Night Travel Risk",            weight_pct: 10, score: Math.max(0, 80 - hotspotPenalty),         contribution: Math.round(Math.max(0, 80 - hotspotPenalty) * 0.1) },
    ],
  };
}

/**
 * Women-specific safety score.
 *
 * Weights:
 *   35% Harassment Reports  (2× severity vs other incidents)
 *   20% Lighting Quality
 *   15% Police Coverage
 *   15% Transit Reliability  (mode-dependent)
 *   10% Historical Crime Baseline
 *    5% Hospital Access
 */
function computeWomenSafetyScore(
  profile: CorridorProfile,
  allReports: ReportLike[],
  geometrySamples: { lat: number; lng: number }[],
  crimeIndex: number,
  primaryMode: string
): number {
  // Count decay-weighted harassment/unsafe_area reports near corridor (2× weight)
  const harassmentTypes = new Set(["harassment", "unsafe_area"]);
  const harassmentReports = allReports.filter(
    (r) => harassmentTypes.has(r.report_type ?? r.category ?? "")
  );

  let harassmentWeighted = 0;
  const counted = new Set<number>();
  for (const sample of geometrySamples) {
    for (let i = 0; i < harassmentReports.length; i++) {
      if (counted.has(i)) continue;
      const dist = haversineM(sample.lat, sample.lng, harassmentReports[i].latitude, harassmentReports[i].longitude);
      if (dist <= 500) {
        counted.add(i);
        harassmentWeighted += 2 * decayWeight(harassmentReports[i].created_at, harassmentReports[i].report_type);
      }
    }
  }
  // Score: 100 at 0 incidents, drops 20 pts per weighted harassment report
  const harassmentScore = Math.max(0, 100 - Math.round(harassmentWeighted * 20));

  const lightingScore = profile.lightingScore > 0 ? profile.lightingScore : 50;
  const policeScore   = Math.min(98, 40 + profile.policeCount * 10);

  // Transit reliability by mode (metro = predictable + women's coach = highest)
  const TRANSIT_RELIABILITY: Record<string, number> = {
    metro: 85, cab: 80, bus: 65, auto: 55, walk: 70,
  };
  const transitScore  = TRANSIT_RELIABILITY[primaryMode] ?? 65;
  const hospitalScore = Math.min(90, 45 + profile.hospitalCount * 5);

  const womenScore =
    harassmentScore * 0.35 +
    lightingScore   * 0.20 +
    policeScore     * 0.15 +
    transitScore    * 0.15 +
    crimeIndex      * 0.10 +
    hospitalScore   * 0.05;

  return Math.max(12, Math.min(98, Math.round(womenScore)));
}

/**
 * Composite optimization score — drives geometry SELECTION, never displayed.
 *
 * Optimization weights per route type:
 *   balanced:       Safety 40% + ETA 30% + Cost 30%
 *   safest:         Safety 70% + ETA 20% + Cost 10%
 *   cheapest:       Safety 10% + ETA 20% + Cost 70%
 *   women_friendly: 100% womenScore (own axis entirely)
 */
function computeOptimizationScore(
  safetyScore: number,
  durationMin: number,
  costInr: number,
  routeType: RouteType,
  womenScore?: number
): number {
  if (routeType === "women_friendly" && womenScore !== undefined) return womenScore;

  // Normalise ETA and cost to 0–100 (Indian urban upper bounds: 180 min, ₹900)
  const etaScore  = Math.max(0, 100 - Math.round((durationMin / 180) * 100));
  const costScore = Math.max(0, 100 - Math.round((costInr / 900) * 100));

  switch (routeType) {
    // Safety: 75 % · ETA: 15 % · Cost: 10 %
    case "safest":   return safetyScore * 0.75 + etaScore * 0.15 + costScore * 0.10;
    // Cost: 70 % · ETA: 20 % · Safety: 10 % — favours bus/metro transit corridors
    case "cheapest": return safetyScore * 0.10 + etaScore * 0.20 + costScore * 0.70;
    // Balanced: Safety: 40 % · ETA: 35 % · Cost: 25 %
    default:         return safetyScore * 0.40 + etaScore * 0.35 + costScore * 0.25;
  }
}

/**
 * Data confidence score based on report density, infrastructure coverage,
 * corridor sampling quality, and data freshness.
 *
 * Output: { label: "Low" | "Medium" | "High", pct: 0–98 }
 */
function computeConfidence(
  profile: CorridorProfile,
  allReports: ReportLike[],
  sampleCount: number
): { label: "Low" | "Medium" | "High"; pct: number } {
  let score = 0;
  // Data freshness: reports filed within 7 days contribute most
  const sevenDaysMs = 7 * 24 * 3_600_000;
  const recentCount = allReports.filter(
    (r) => Date.now() - new Date(r.created_at).getTime() < sevenDaysMs
  ).length;
  score += Math.min(30, recentCount * 6);               // up to 30 pts
  score += Math.min(25, profile.policeCount * 8);       // infrastructure
  score += Math.min(10, profile.hospitalCount * 3);
  score += Math.min(20, Math.round((sampleCount / 15) * 20)); // sampling density
  if (profile.hotspots.length > 0) score += 8;         // hotspot detection
  if (profile.reportCount > 0) score += 5;             // community data exists

  const pct = Math.min(98, Math.round(score));
  const label: "Low" | "Medium" | "High" =
    pct >= 65 ? "High" : pct >= 35 ? "Medium" : "Low";
  return { label, pct };
}

/**
 * Generate route-specific explanations from real corridor data.
 * Produces 3–5 plain-English strings explaining WHY this route was selected,
 * which factors helped, and which factors hurt.
 */
function generateRouteExplanations(
  routeType: RouteType,
  profile: CorridorProfile,
  safetyScore: number,
  costInr: number,
  crimeIndex: number,
  departureHour: number,
  primaryMode: string,
  womenScore?: number
): string[] {
  const out: string[] = [];
  const hour = departureHour;

  switch (routeType) {
    case "balanced": {
      out.push(
        safetyScore >= 65
          ? "Selected as the optimal everyday commute — best balance of safety, speed, and cost"
          : "Best available balance of safety and travel efficiency on this corridor"
      );
      out.push(
        profile.policeCount >= 2
          ? `Solid police coverage — ${profile.policeCount} stations along corridor`
          : profile.policeCount === 1
          ? `1 police station on corridor${profile.policeNames[0] ? ` (${profile.policeNames[0]})` : ""}`
          : "Limited police presence — compensated by corridor safety profile"
      );
      out.push(
        profile.reportCount === 0
          ? "No active community incident reports on this corridor"
          : `${profile.reportCount} decay-weighted community report(s) factored into score`
      );
      break;
    }

    case "safest": {
      const highRisk = profile.hotspots.filter((h) => h.riskLevel === "high").length;
      out.push(
        highRisk === 0
          ? "Zero high-risk hotspots detected — cleanest available safety corridor"
          : `${highRisk} high-risk zone(s) on corridor — selected as safest viable option`
      );
      out.push(
        profile.policeCount >= 2
          ? `Strong police coverage — ${profile.policeCount} stations within 500 m${profile.policeNames[0] ? ` (${profile.policeNames[0]})` : ""}`
          : profile.policeCount === 1
          ? `1 police station on corridor${profile.policeNames[0] ? ` — ${profile.policeNames[0]}` : ""}`
          : "Minimal police presence — route chosen for other corridor safety factors"
      );
      out.push(
        profile.lightingScore >= 70
          ? `Well-lit corridor — lighting score ${profile.lightingScore}/100`
          : `Lighting score ${profile.lightingScore}/100 — exercise caution after dark`
      );
      if (profile.reportCount > 0) {
        out.push(`${profile.reportCount} incident report(s) near corridor — included in risk model`);
      }
      break;
    }

    case "cheapest": {
      out.push(`Transit-optimised corridor — estimated ₹${costInr} using ${primaryMode}`);
      out.push("Route selected for minimum travel distance, reducing fuel and fare costs");
      out.push(
        crimeIndex >= 65
          ? `Trade-off: NCRB crime index ${crimeIndex}/100 — acceptable for daytime travel`
          : `City crime index ${crimeIndex}/100 — acceptable safety level for budget route`
      );
      if (profile.reportCount > 0) {
        out.push(`${profile.reportCount} community report(s) near corridor — cost-safety trade-off accepted`);
      }
      break;
    }

    case "women_friendly": {
      const ws = womenScore ?? safetyScore;
      const harassmentFree = !profile.hotspots.some(
        (h) => h.types.some((t) => t === "harassment" || t === "unsafe_area")
      );
      out.push(
        harassmentFree
          ? "Corridor avoids all reported harassment zones — prioritised for solo women"
          : "Lowest harassment exposure available — harassment reports weighted 2× in selection"
      );
      out.push(
        profile.lightingScore >= 65
          ? `Lighting score ${profile.lightingScore}/100 — well-lit areas along this corridor`
          : `Lighting score ${profile.lightingScore}/100 — prefer daytime travel on this route`
      );
      out.push(
        primaryMode === "metro"
          ? "Metro women's coach available — predictable schedule, high transit reliability"
          : primaryMode === "cab"
          ? "Cab selected for door-to-door safety — no waiting at transit stops"
          : `${primaryMode} mode selected for this distance range`
      );
      out.push(`Women safety composite score: ${ws}/100`);
      break;
    }
  }

  // Time-of-day advisory
  if (hour >= 22 || hour < 5) {
    out.push("Late-night travel — safety scores adjusted for reduced visibility and activity");
  } else if (hour >= 7 && hour <= 10) {
    out.push("Peak morning hours — good visibility, high road activity");
  }

  // General time label from existing utility
  out.push(timeSafetyLabel(departureHour));

  return out;
}

/**
 * Select the best-scoring candidate geometry for a given route type.
 *
 * For safest + women_friendly: enforces distance ≤ fastest × 1.15.
 * Falls back to unconstrained pool if constraint eliminates all candidates.
 */
/**
 * Distance and ETA hard limits per route type (relative to fastest candidate):
 *
 *   balanced:       dist ≤ fastest + 5%   (ensures it stays near the main corridor)
 *   safest:         dist ≤ fastest + 20%  (allow meaningful detours for safety)
 *   cheapest:       no constraint          (pure cost optimisation)
 *   women_friendly: dist ≤ fastest + 10%  AND ETA ≤ fastest + 15%  (never the longest)
 */
const ROUTE_DIST_LIMIT: Record<RouteType, number> = {
  balanced:       1.05,
  safest:         1.20,
  cheapest:       999,
  women_friendly: 1.10,
};
const ROUTE_ETA_LIMIT: Record<RouteType, number> = {
  balanced:       999,
  safest:         999,
  cheapest:       999,
  women_friendly: 1.15,
};

function selectBestGeometry(
  routeType: RouteType,
  candidates: ScoredCandidate[],
  fastestDistKm: number,
  src: GeocodedPlace,
  dst: GeocodedPlace
): ScoredCandidate {
  const maxDist = fastestDistKm * ROUTE_DIST_LIMIT[routeType];
  const fastestDuration = Math.min(...candidates.map((c) => c.ors.duration_min));
  const maxEta  = fastestDuration * ROUTE_ETA_LIMIT[routeType];

  const constrained = candidates.filter(
    (c) => c.ors.distance_km <= maxDist && c.ors.duration_min <= maxEta
  );
  // Fallback: if all candidates violate constraints, pick the one closest to limits
  const pool = constrained.length > 0 ? constrained : candidates;

  return pool.reduce((best, c) => {
    const legsC  = buildMultimodalLegs(routeType, src, dst, c.ors);
    const legsB  = buildMultimodalLegs(routeType, src, dst, best.ors);
    const costC  = estimateRouteFare(legsC, routeType);
    const costB  = estimateRouteFare(legsB, routeType);
    const scoreC = computeOptimizationScore(c.safetyScore,    c.ors.duration_min, costC, routeType, c.womenScore);
    const scoreB = computeOptimizationScore(best.safetyScore, best.ors.duration_min, costB, routeType, best.womenScore);
    return scoreC > scoreB ? c : best;
  });
}

/**
 * Fetch OSM emergency POIs along the full route corridor.
 *
 * Uses a corridor-buffer query (Overpass `around:radius,lat0,lng0,lat1,lng1,...`)
 * instead of a centroid circle — this guarantees hospitals, police stations, and
 * other facilities near the ACTUAL road are found, not just those near the
 * geometric center of the route.
 *
 * Buffer radius: 600 m per sample point (wider than corridor-risk's 500 m
 * buffer to pre-fetch anything that might be counted as "nearby").
 */
async function fetchCorridorPlaces(
  samples: { lat: number; lng: number }[]
): Promise<import("@/services/osm/overpass.service").OverpassPlace[]> {
  if (!samples.length) return [];
  try {
    return await fetchEmergencyPlacesAlongCorridor(samples, 600, 18_000);
  } catch {
    return [];
  }
}

/**
 * Assemble a PlannedRoute from a pre-scored geometry candidate.
 * No scoring happens here — scores are pre-computed by searchRoutes().
 */
function buildPlannedRoute(
  routeType: RouteType,
  src: GeocodedPlace,
  dst: GeocodedPlace,
  candidate: ScoredCandidate,
  allReports: ReportLike[],
  crimeIndex: number,
  departureHour: number,
  sampleCount: number,
  crimeMeta?: { risk_label: string; report_year: number; data_source: string }
): PlannedRoute {
  const { ors, profile, safetyScore, safetyBreakdown, womenScore } = candidate;

  const legs     = buildMultimodalLegs(routeType, src, dst, ors);
  const baseCost = estimateRouteFare(legs, routeType);
  const primaryMode = legs.find((l) => l.mode !== "walk")?.mode ?? "walk";

  const isEstimate = isStraightLineGeometry(ors.geometry);
  const routedVia  = isEstimate
    ? "Direct estimate (re-search for road routing)"
    : ORS_PROXY_URL || ORS_API_KEY
      ? "OpenRouteService / OSM roads"
      : "OpenStreetMap road network";

  const confidence = computeConfidence(profile, allReports, sampleCount);

  const optimizationScore = computeOptimizationScore(
    safetyScore, ors.duration_min, baseCost, routeType,
    routeType === "women_friendly" ? womenScore : undefined
  );

  const recommendations = generateRouteExplanations(
    routeType, profile, safetyScore, baseCost, crimeIndex,
    departureHour, primaryMode,
    routeType === "women_friendly" ? womenScore : undefined
  );

  if (crimeMeta) {
    recommendations.push(
      `NCRB ${crimeMeta.report_year} crime index: ${crimeIndex}/100 (${crimeMeta.risk_label.replace(/_/g, " ")})`
    );
  }
  recommendations.push(`Multi-modal: ${legs.map((l) => l.mode).join(" → ")} via ${routedVia}`);

  return {
    route_type: routeType,
    source_name: src.name,
    destination_name: dst.name,
    source_lat: src.lat,
    source_lng: src.lng,
    dest_lat: dst.lat,
    dest_lng: dst.lng,
    legs,
    safety_score: safetyScore,
    safety_breakdown: safetyBreakdown,
    distance_km: ors.distance_km,
    eta_minutes: legs.reduce((s, l) => s + l.duration_min, 0),
    estimated_cost_inr: baseCost,
    reliability_score: Math.min(98, 60 + profile.policeCount * 4 + profile.hospitalCount * 2),
    crowd_level: ors.duration_min < 25 ? "High" : "Moderate",
    walking_distance_km: Math.round(
      legs.filter((l) => l.mode === "walk").reduce((s, l) => s + l.distance_km, 0) * 100
    ) / 100,
    transfer_count: Math.max(0, legs.length - 1),
    geometry: ors.geometry,
    recommendations,
    corridor_profile: profile,
    confidence,
    women_safety_score: routeType === "women_friendly" ? womenScore : undefined,
    optimization_score: Math.round(optimizationScore),
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

    // ── Step 1: Geocode + base data in parallel ───────────────────────────
    const [src, dst, allReports, crimeScore] = await Promise.all([
      resolved?.source      ?? nominatimService.geocode(source, cityId),
      resolved?.destination ?? nominatimService.geocode(destination, cityId),
      reportsService.listByCity(cityId, 100).catch(() => []),
      crimeService.getCityScore(cityId),
    ]);

    const start: [number, number] = [src.lng, src.lat];
    const end:   [number, number] = [dst.lng, dst.lat];

    // ── Step 2: Fetch all geometries in parallel ───────────────────────────
    // a) ORS alternatives (up to 3, road-class-aware)
    // b) OSRM alternatives (up to 3, always available)
    // c) ORS shortest path (minimum km — cheapest)
    // d) OSRM via city-centre waypoint (urban-lit corridor for safest/women)
    const [orsAlternativesRaw, osrmAlternatives, orsShortestResult, waypointRoute] =
      await Promise.all([
        fetchORSAlternatives(start, end, "driving-car"),
        fetchOSRMAlternatives(start, end),
        resolveOrsRoute(src, dst, "driving-car", "shortest", "drive-short"),
        fetchOSRMViaWaypoint(src, dst, cityId),
      ]);

    // Prefer ORS (road-class-aware) if ≥ 2 distinct routes; otherwise OSRM
    const orsAlts = orsAlternativesRaw.filter((r) => !isStraightLineGeometry(r.geometry));
    const baseAlts: OrsResult[] = orsAlts.length >= 2 ? orsAlts : osrmAlternatives;

    // Build the full candidate pool — deduplicated by distance (≥ 0.5 km gap)
    const rawPool: OrsResult[] = [
      ...baseAlts,
      orsShortestResult,
      ...(waypointRoute ? [waypointRoute] : []),
    ].filter((r) => !isStraightLineGeometry(r.geometry));

    if (rawPool.length === 0) {
      // Nothing routed — fall back to straight-line estimate
      rawPool.push(straightLineRoute(src, dst));
    }

    // Deduplicate: keep only routes whose distance differs ≥ 0.5 km from any already-kept
    const pool: OrsResult[] = rawPool.reduce<OrsResult[]>((acc, r) => {
      const isDup = acc.some((a) => Math.abs(a.distance_km - r.distance_km) < 0.5);
      return isDup ? acc : [...acc, r];
    }, []);

    // ── Step 3: Fetch OSM corridor places once (covers full O-D bounding box) ─
    // 15 samples gives a point every ~460 m for a 7 km route — enough corridor coverage
    const routeSamples = sampleLineString(pool[0].geometry, 15);
    const osmPlaces    = await fetchCorridorPlaces(routeSamples);
    const sampleCount  = routeSamples.length;

    // ── Step 4: Profile every geometry (pure in-memory — no extra API calls) ─
    // buildCorridorProfile is a pure function: geometry × reports × osmPlaces → profile
    const scored: ScoredCandidate[] = pool.map((ors) => {
      const legs = buildMultimodalLegs("balanced", src, dst, ors); // for transfer count
      const profile = buildCorridorProfile(ors.geometry, allReports, osmPlaces, {
        distanceKm: ors.distance_km,
        departureHour,
        transferCount: Math.max(0, legs.length - 1),
      });

      const { score: safetyScore, breakdown: safetyBreakdown } =
        computeCorridorSafetyScore(profile, crimeScore.crime_index, departureHour, ors.distance_km);

      // Women score uses geometry samples for precise harassment proximity check
      const geoSamples = sampleLineString(ors.geometry, 8);
      const primaryMode = buildMultimodalLegs("women_friendly", src, dst, ors)
        .find((l) => l.mode !== "walk")?.mode ?? "walk";
      const womenScore = computeWomenSafetyScore(
        profile, allReports as ReportLike[], geoSamples,
        crimeScore.crime_index, primaryMode
      );

      return { ors, profile, safetyScore, safetyBreakdown, womenScore };
    });

    // ── Step 5: Select best geometry per route type ────────────────────────
    // Each type uses its own optimization weights; distance constraints apply
    // to safest + women_friendly (≤ fastest × 1.15)
    const fastestDistKm = Math.min(...pool.map((g) => g.distance_km));

    const crimeMeta = {
      risk_label: crimeScore.risk_label,
      report_year: crimeScore.report_year,
      data_source: crimeScore.data_source,
    };

    const routes: PlannedRoute[] = (["balanced", "safest", "cheapest", "women_friendly"] as RouteType[])
      .map((routeType) => {
        const best = selectBestGeometry(routeType, scored, fastestDistKm, src, dst);
        return buildPlannedRoute(
          routeType, src, dst, best,
          allReports as ReportLike[], crimeScore.crime_index,
          departureHour, sampleCount, crimeMeta
        );
      });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) persistRoutes(user.id, cityId, routes);

    return routes;
  },
};
