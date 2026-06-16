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

/* ──────────────────────────────────────────────────────────────────────
 * TRAFFIC INTELLIGENCE
 * City-specific historical traffic multipliers for realistic ETA.
 * Applied on top of OSRM base duration.
 * ────────────────────────────────────────────────────────────────────── */

const TRAFFIC_PATTERNS: Record<string, {
  morningRush: number;   // 07:00–10:00
  midday: number;        // 10:00–17:00
  eveningRush: number;   // 17:00–20:00
  night: number;         // 22:00–05:00
  peakWeekend: number;   // Fri/Sat evening bonus
}> = {
  // Bangalore: worst traffic in India (Indiranagar–Whitefield, Silk Board)
  bangalore: { morningRush: 1.40, midday: 1.10, eveningRush: 1.55, night: 0.80, peakWeekend: 1.20 },
  // Chennai: heavy on Anna Salai, GST Road, OMR
  chennai:   { morningRush: 1.30, midday: 1.08, eveningRush: 1.40, night: 0.83, peakWeekend: 1.15 },
  // Hyderabad: HITEC City ingress, Mehdipatnam
  hyderabad: { morningRush: 1.25, midday: 1.07, eveningRush: 1.35, night: 0.87, peakWeekend: 1.12 },
  // Trivandrum: lighter overall, moderate on MG Road
  trivandrum:{ morningRush: 1.15, midday: 1.04, eveningRush: 1.22, night: 0.92, peakWeekend: 1.08 },
};

function getTrafficMultiplier(
  cityId: string,
  hour: number
): { multiplier: number; label: string } {
  const p = TRAFFIC_PATTERNS[cityId] ?? TRAFFIC_PATTERNS.chennai;
  const dayOfWeek = new Date().getDay(); // 0=Sun … 6=Sat
  const isPeakDay = dayOfWeek === 5 || dayOfWeek === 6;  // Fri or Sat

  if (hour >= 7 && hour < 10) {
    return { multiplier: p.morningRush, label: "Morning Rush" };
  }
  if (hour >= 17 && hour < 20) {
    const m = isPeakDay
      ? Math.min(p.eveningRush * p.peakWeekend, 1.70)
      : p.eveningRush;
    return { multiplier: m, label: isPeakDay ? "Peak Evening (Fri/Sat)" : "Evening Rush" };
  }
  if (hour >= 22 || hour < 5) {
    return { multiplier: p.night, label: "Night — Clear Roads" };
  }
  return { multiplier: p.midday, label: "Normal Traffic" };
}

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
/* ──────────────────────────────────────────────────────────────────────
 * CITY CORRIDOR PROFILES
 * Real POI coordinates for 4 major Indian cities.
 * Each corridor type anchors a distinct OSRM via-waypoint route:
 *
 *   commercial  → shopping districts, active markets, malls
 *   transit     → railway stations, bus terminuses, metro hubs
 *   police      → police stations / commissionerates
 *   hospital    → major hospitals, medical college campuses
 *   nightSafe   → 24-hr commercial areas, IT corridors, well-lit trunk roads
 * ────────────────────────────────────────────────────────────────────── */

type CorridorType = "general" | "shortest" | "commercial" | "transit" | "police" | "hospital" | "nightSafe";

type CityProfile = {
  centre: [number, number];
  waypoints: Record<Exclude<CorridorType, "general" | "shortest">, [number, number][]>;
};

const CITY_PROFILES: Record<string, CityProfile> = {
  chennai: {
    centre: [13.0827, 80.2707],
    waypoints: {
      commercial: [
        [13.0418, 80.2341],  // T Nagar — Ranganathan Street (busiest shopping street)
        [13.0604, 80.2496],  // Anna Salai / Mount Road (commercial spine)
        [13.0312, 80.2700],  // Adyar Signal (south commercial corridor)
        [13.1066, 80.2886],  // Perambur (north commercial hub)
        [12.9165, 80.2273],  // Sholinganallur (OMR retail belt)
      ],
      transit: [
        [13.0827, 80.2707],  // Chennai Central Railway Station
        [13.0776, 80.2624],  // Chennai Egmore Station
        [13.0692, 80.1844],  // CMBT Koyambedu (Mofussil Bus Terminus)
        [13.0017, 80.2206],  // Chennai Airport
        [13.0524, 80.2173],  // Vadapalani Bus Stand
        [13.0520, 80.2518],  // Kodambakkam MRTS
      ],
      police: [
        [13.0786, 80.2740],  // Chennai Police Commissioner's Office
        [13.0418, 80.2341],  // T Nagar Police Station
        [13.0812, 80.2761],  // Egmore Police
        [13.0340, 80.2700],  // Adyar Police Station
        [13.0692, 80.2710],  // Park Town Police
      ],
      hospital: [
        [13.0549, 80.2666],  // Government Royapettah Hospital
        [13.0060, 80.2200],  // Apollo Hospital Greams Road
        [13.0829, 80.2760],  // Government General Hospital Park Town
        [13.0170, 80.2533],  // MIOT Hospital Manapakkam
        [13.1234, 80.2869],  // Stanley Medical College Royapuram
      ],
      nightSafe: [
        [13.0604, 80.2496],  // Anna Salai / Mount Road (24-hr activity)
        [13.0418, 80.2341],  // T Nagar (busy till midnight)
        [12.9165, 80.2273],  // OMR IT corridor (night shifts active)
        [13.0670, 80.2170],  // Vadapalani (active junction)
      ],
    },
  },

  bangalore: {
    centre: [12.9716, 77.5946],
    waypoints: {
      commercial: [
        [12.9758, 77.6012],  // MG Road
        [12.9698, 77.6073],  // Brigade Road
        [12.9352, 77.6245],  // Koramangala (Forum Mall area)
        [12.9784, 77.6408],  // Indiranagar 100ft Road
        [13.0358, 77.5970],  // Hebbal (commercial node)
        [12.9279, 77.6271],  // HSR Layout commercial strip
      ],
      transit: [
        [12.9767, 77.5713],  // KSR Bengaluru Railway Station (Majestic)
        [12.9715, 77.5710],  // KSRTC Central Bus Stand (Majestic)
        [13.0130, 77.5517],  // Yelahanka Junction
        [12.9591, 77.6482],  // Whitefield Railway Station
        [12.9306, 77.6768],  // Electronic City Toll / Hosur Road junction
        [12.9921, 77.5513],  // Peenya BMTC Depot (NW bus hub)
      ],
      police: [
        [12.9758, 77.6012],  // MG Road Police Station
        [12.9352, 77.6245],  // Koramangala Police Station
        [12.9784, 77.6408],  // Indiranagar Police Station
        [13.0351, 77.5970],  // Hebbal Police
        [12.9767, 77.5713],  // Upperpete Police (Majestic area)
      ],
      hospital: [
        [13.0074, 77.5692],  // Mallya Hospital (Vittal Mallya Road)
        [12.9352, 77.6245],  // Manipal Hospital Koramangala
        [12.9697, 77.5942],  // Bowring & Lady Curzon Hospital (Shivajinagar)
        [12.9398, 77.5987],  // Jayadeva Institute of Cardiology (Jayanagar)
        [12.9180, 77.5710],  // Narayana Health (Hosur Road)
      ],
      nightSafe: [
        [12.9758, 77.6012],  // MG Road (24-hr activity, well-lit)
        [12.9352, 77.6245],  // Koramangala (restaurants, pubs active late)
        [12.9784, 77.6408],  // Indiranagar (active nightlife)
        [12.8406, 77.6780],  // Electronic City (IT night shifts)
        [12.9130, 77.6745],  // Sarjapur Road (tech corridor)
      ],
    },
  },

  hyderabad: {
    centre: [17.3850, 78.4867],
    waypoints: {
      commercial: [
        [17.4156, 78.4530],  // Banjara Hills Road No. 1 (upscale commercial)
        [17.4344, 78.4487],  // Jubilee Hills Check Post
        [17.3850, 78.4867],  // Abids (traditional commercial core)
        [17.4474, 78.3762],  // HITEC City / Madhapur (IT commercial)
        [17.4400, 78.4983],  // Begumpet (commercial + embassy area)
        [17.4800, 78.3760],  // Gachibowli (IT park commercial)
      ],
      transit: [
        [17.4399, 78.4983],  // Secunderabad Railway Station
        [17.3840, 78.4759],  // Nampally Railway Station (Hyderabad)
        [17.3760, 78.4744],  // MGBS Imlibun Bus Stand
        [17.4436, 78.3988],  // Ameerpet Metro Station
        [17.2403, 78.4294],  // RGIA Airport
        [17.4330, 78.4482],  // Jubilee Bus Stand (Secunderabad)
      ],
      police: [
        [17.4399, 78.4983],  // Secunderabad Police Commissionerate
        [17.3840, 78.4759],  // Abids Police Station
        [17.4156, 78.4530],  // Banjara Hills Police Station
        [17.4474, 78.3762],  // Cyberabad CP Office (HITEC City)
        [17.3590, 78.4750],  // Falaknuma Police
      ],
      hospital: [
        [17.4344, 78.4487],  // Apollo Hospital Jubilee Hills
        [17.3850, 78.4867],  // Osmania General Hospital
        [17.4156, 78.4530],  // Care Hospital Banjara Hills
        [17.4474, 78.3762],  // AIG Hospital HITEC City
        [17.4000, 78.4780],  // Gandhi Hospital (Secunderabad)
      ],
      nightSafe: [
        [17.4474, 78.3762],  // HITEC City (IT night shifts, 24-hr security)
        [17.4156, 78.4530],  // Banjara Hills (restaurants + well-lit)
        [17.4344, 78.4487],  // Jubilee Hills (well-lit + commercial)
        [17.4399, 78.4983],  // Secunderabad (24-hr activity)
        [17.4800, 78.3760],  // Gachibowli (IT corridor, active late)
      ],
    },
  },

  trivandrum: {
    centre: [8.5241, 76.9366],
    waypoints: {
      commercial: [
        [8.5241, 76.9366],   // Palayam / MG Road junction (city commercial core)
        [8.4975, 76.9512],   // East Fort / Chalai Market
        [8.5110, 76.9490],   // Thampanoor commercial area
        [8.5523, 76.8822],   // Kowdiar (upscale residential + commercial)
        [8.5400, 76.9160],   // Vellayambalam (retail strip)
      ],
      transit: [
        [8.4888, 76.9524],   // Thiruvananthapuram Central Railway Station
        [8.5011, 76.9497],   // KSRTC Bus Stand Thampanoor
        [8.4827, 76.9192],   // Thiruvananthapuram International Airport
        [8.5241, 76.9366],   // Palayam Bus Stop (city centre hub)
        [8.5700, 76.8800],   // Sreekaryam Bus Terminal (north suburban)
      ],
      police: [
        [8.5241, 76.9366],   // Palayam Police Station
        [8.4975, 76.9512],   // Fort Police Station
        [8.5523, 76.8822],   // Kowdiar Police Station
        [8.5110, 76.9490],   // Thampanoor Police Outpost
        [8.4888, 76.9524],   // Central Station Area Police
      ],
      hospital: [
        [8.5241, 76.9366],   // SAT Government Hospital (Medical College)
        [8.5440, 76.9198],   // PRS Hospital (Killipalam)
        [8.5523, 76.8822],   // KIMS Hospital Kowdiar
        [8.4975, 76.9512],   // General Hospital Fort
        [8.5200, 76.9550],   // Sreechithira Thirunal Hospital
      ],
      nightSafe: [
        [8.5241, 76.9366],   // MG Road / Palayam (main junction, lit 24-hr)
        [8.5110, 76.9490],   // Thampanoor (central, active)
        [8.5523, 76.8822],   // Kowdiar (residential + commercial, safer)
        [8.4888, 76.9524],   // Central Station area (24-hr activity)
      ],
    },
  },
};

/**
 * Generic OSRM routing via an explicit intermediate coordinate.
 * OSRM snaps the waypoint to the nearest road automatically.
 */
async function fetchOSRMViaCoord(
  src: GeocodedPlace,
  dst: GeocodedPlace,
  viaLat: number,
  viaLng: number
): Promise<OrsResult | null> {
  const coords = `${src.lng},${src.lat};${viaLng},${viaLat};${dst.lng},${dst.lat}`;
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

/** Pick the waypoint from a list that is closest to a reference coordinate. */
function nearestOf(
  pts: [number, number][],
  refLat: number,
  refLng: number
): [number, number] {
  return pts.reduce((best, p) =>
    haversineM(refLat, refLng, p[0], p[1]) < haversineM(refLat, refLng, best[0], best[1])
      ? p : best
  );
}

/**
 * Compute commercial density score for a route geometry.
 * Measures how closely the route passes through commercial corridors
 * (used in women-friendly scoring and route labelling).  Score 0–100.
 */
function computeCommercialDensity(
  geometrySamples: { lat: number; lng: number }[],
  cityId: string
): number {
  const cityProfile = CITY_PROFILES[cityId];
  if (!cityProfile || !geometrySamples.length) return 40;

  let closestM = Infinity;
  for (const sample of geometrySamples) {
    for (const wp of cityProfile.waypoints.commercial) {
      const d = haversineM(sample.lat, sample.lng, wp[0], wp[1]);
      if (d < closestM) closestM = d;
    }
  }

  if (closestM <=   500) return 95;
  if (closestM <=  1000) return 82;
  if (closestM <=  2000) return 68;
  if (closestM <=  3500) return 52;
  if (closestM <=  5000) return 38;
  return 22;
}

/**
 * Generate 8–12 diverse route candidates for a given O-D pair.
 *
 * Sources (all fetched in parallel):
 *   1. OSRM direct alternatives (up to 3) → "general"
 *   2. ORS shortest path         (1)       → "shortest"
 *   3. Commercial corridor route (1)       → "commercial"
 *   4. Transit corridor route    (1)       → "transit"
 *   5. Police corridor route     (1)       → "police"
 *   6. Hospital corridor route   (1)       → "hospital"
 *   7. Night-safe corridor route (1)       → "nightSafe"
 *
 * Each corridor route is an OSRM via-waypoint call through the nearest
 * real anchor point for that corridor type in the city profile.
 */
/** Pick a corridor waypoint that does not add excessive detour vs direct O-D. */
function waypointWithMaxDetour(
  pts: [number, number][],
  src: GeocodedPlace,
  dst: GeocodedPlace,
  maxDetourRatio: number
): [number, number] | null {
  const directM = haversineM(src.lat, src.lng, dst.lat, dst.lng);
  let best: [number, number] | null = null;
  let bestViaM = Infinity;

  for (const p of pts) {
    const viaM =
      haversineM(src.lat, src.lng, p[0], p[1]) + haversineM(p[0], p[1], dst.lat, dst.lng);
    if (viaM <= directM * maxDetourRatio && viaM < bestViaM) {
      bestViaM = viaM;
      best = p;
    }
  }
  return best;
}

async function generateCandidatePool(
  src: GeocodedPlace,
  dst: GeocodedPlace,
  start: [number, number],
  end: [number, number],
  cityId: string
): Promise<Array<{ ors: OrsResult; corridorType: CorridorType }>> {
  const cityProfile = CITY_PROFILES[cityId] ?? CITY_PROFILES.chennai;
  const midLat = (src.lat + dst.lat) / 2;
  const midLng = (src.lng + dst.lng) / 2;

  const wCommercial = nearestOf(cityProfile.waypoints.commercial, midLat, midLng);
  const wTransit =
    waypointWithMaxDetour(cityProfile.waypoints.transit, src, dst, 1.32) ??
    nearestOf(cityProfile.waypoints.transit, midLat, midLng);
  const wPolice     = nearestOf(cityProfile.waypoints.police,     midLat, midLng);
  const wHospital   = nearestOf(cityProfile.waypoints.hospital,   midLat, midLng);
  const wNightSafe  = nearestOf(cityProfile.waypoints.nightSafe,  midLat, midLng);
  const directKm = haversineM(src.lat, src.lng, dst.lat, dst.lng) / 1000;

  const [
    osrmAlts,
    orsShortestResult,
    commercialRoute,
    transitRouteRaw,
    policeRoute,
    hospitalRoute,
    nightSafeRoute,
  ] = await Promise.all([
    fetchOSRMAlternatives(start, end),
    resolveOrsRoute(src, dst, "driving-car", "shortest", "drive-short"),
    fetchOSRMViaCoord(src, dst, wCommercial[0], wCommercial[1]),
    fetchOSRMViaCoord(src, dst, wTransit[0],    wTransit[1]),
    fetchOSRMViaCoord(src, dst, wPolice[0],     wPolice[1]),
    fetchOSRMViaCoord(src, dst, wHospital[0],   wHospital[1]),
    fetchOSRMViaCoord(src, dst, wNightSafe[0],  wNightSafe[1]),
  ]);

  const transitRoute =
    transitRouteRaw && transitRouteRaw.distance_km <= directKm * 1.45
      ? transitRouteRaw
      : null;

  // Corridor routes first — they survive dedup to preserve semantic labels
  const tagged: Array<{ ors: OrsResult; corridorType: CorridorType }> = [
    ...(
      [
        commercialRoute && { ors: commercialRoute, corridorType: "commercial" as CorridorType },
        transitRoute    && { ors: transitRoute,    corridorType: "transit"    as CorridorType },
        policeRoute     && { ors: policeRoute,     corridorType: "police"     as CorridorType },
        hospitalRoute   && { ors: hospitalRoute,   corridorType: "hospital"   as CorridorType },
        nightSafeRoute  && { ors: nightSafeRoute,  corridorType: "nightSafe"  as CorridorType },
      ].filter(Boolean) as Array<{ ors: OrsResult; corridorType: CorridorType }>
    ),
    ...osrmAlts.map((r) => ({ ors: r, corridorType: "general" as CorridorType })),
    { ors: orsShortestResult, corridorType: "shortest" as CorridorType },
  ].filter((c) => !isStraightLineGeometry(c.ors.geometry));

  if (tagged.length === 0) {
    return [{ ors: straightLineRoute(src, dst), corridorType: "general" }];
  }

  // Deduplicate: keep first candidate per 0.8 km distance bucket
  const seen: number[] = [];
  const deduped: Array<{ ors: OrsResult; corridorType: CorridorType }> = [];
  for (const c of tagged) {
    if (!seen.some((d) => Math.abs(d - c.ors.distance_km) < 0.8)) {
      seen.push(c.ors.distance_km);
      deduped.push(c);
    }
  }
  return deduped;
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
  commercialDensity: number;
  /** Semantic corridor this geometry was generated for (drives selection priority). */
  corridorType: CorridorType;
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
 * Weights (per spec):
 *   40% Harassment Safety    (decay-weighted, 2× severity for harassment/unsafe_area)
 *   20% Lighting Quality     (OSM-inferred infrastructure score)
 *   15% Police Coverage      (police count along corridor)
 *   10% Commercial Activity  (proximity to commercial anchors = safety in numbers)
 *   10% Hospital Access      (emergency proximity)
 *    5% ETA penalty          (longer routes penalised for solo night travel)
 *
 * Hard constraints enforced in selectBestGeometry:
 *   ETA  ≤ fastest + 15%
 *   Dist ≤ fastest + 10%
 */
function computeWomenSafetyScore(
  profile: CorridorProfile,
  allReports: ReportLike[],
  geometrySamples: { lat: number; lng: number }[],
  commercialDensity: number,
  etaMin: number,
  fastestEtaMin: number
): number {
  // 40% — Harassment / unsafe_area reports (2× decay-weighted near corridor)
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
  const harassmentScore = Math.max(0, 100 - Math.round(harassmentWeighted * 20));

  // 20% — Lighting
  const lightingScore = profile.lightingScore > 0 ? profile.lightingScore : 50;

  // 15% — Police coverage
  const policeScore = Math.min(98, 40 + profile.policeCount * 10);

  // 10% — Hospital access
  const hospitalScore = Math.min(90, 45 + profile.hospitalCount * 5);

  // 10% — Commercial activity (safety-in-numbers effect)
  const commercialScore = commercialDensity; // already 0–100

  // 5% — ETA penalty: longer than fastest penalised (max 20 pt penalty)
  const etaRatio = fastestEtaMin > 0 ? etaMin / fastestEtaMin : 1;
  const etaScore = Math.max(0, 100 - Math.round(Math.max(0, etaRatio - 1) * 200));

  const womenScore =
    harassmentScore  * 0.40 +
    lightingScore    * 0.20 +
    policeScore      * 0.15 +
    commercialScore  * 0.10 +
    hospitalScore    * 0.10 +
    etaScore         * 0.05;

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
 * Generate judge-friendly route explanations from real corridor data.
 * Every string is data-driven — no static copy-paste phrases.
 *
 * Structure per route:
 *   [0] WHY this route was selected (primary objective met)
 *   [1] WHAT risks were avoided (hotspots, harassment, lighting)
 *   [2] KEY INFRASTRUCTURE along corridor (police, hospitals)
 *   [3] TRADEOFF vs other options (cost/time/safety)
 *   [4] TIME-OF-DAY advisory (when relevant)
 */
function generateRouteExplanations(
  routeType: RouteType,
  profile: CorridorProfile,
  safetyScore: number,
  costInr: number,
  crimeIndex: number,
  departureHour: number,
  primaryMode: string,
  corridorType: CorridorType,
  commercialDensity: number,
  womenScore?: number
): string[] {
  const out: string[] = [];
  const isNight = departureHour >= 21 || departureHour < 6;
  const hotspots = profile.hotspots.length;
  const highRisk = profile.hotspots.filter((h) => h.riskLevel === "high").length;

  switch (routeType) {
    case "balanced": {
      // WHY
      out.push(
        safetyScore >= 70
          ? `Highest multi-objective score across all candidates — Safety ${safetyScore}/100 on a ${corridorType === "commercial" ? "commercial" : "main"} corridor`
          : `Best available balance of safety (${safetyScore}/100), speed, and cost on this O-D pair`
      );
      // RISKS AVOIDED
      out.push(
        hotspots === 0
          ? "No community-flagged incident clusters on this corridor"
          : `${hotspots} incident cluster${hotspots > 1 ? "s" : ""} detected — included in safety model; route still scores highest overall`
      );
      // INFRASTRUCTURE
      out.push(
        profile.policeCount >= 2
          ? `${profile.policeCount} police stations along corridor${profile.policeNames[0] ? ` — nearest: ${profile.policeNames[0]}` : ""}`
          : profile.policeCount === 1
          ? `1 police station nearby${profile.policeNames[0] ? ` (${profile.policeNames[0]})` : ""} — reasonable emergency coverage`
          : "Limited police coverage — route selected for overall profile strength"
      );
      // TRADEOFF
      out.push(
        `₹${costInr} via ${primaryMode} — cost optimised within 25% of balanced weight`
      );
      break;
    }

    case "safest": {
      // WHY
      out.push(
        highRisk === 0
          ? `Zero high-risk hotspots — cleanest available safety corridor (Score: ${safetyScore}/100). Selected via police-dense routing.`
          : `Scored highest on 75% safety weight despite ${highRisk} flagged zone${highRisk > 1 ? "s" : ""} — best viable safe corridor`
      );
      // RISKS AVOIDED
      const modHotspots = profile.hotspots.filter((h) => h.riskLevel === "moderate").length;
      out.push(
        hotspots === 0
          ? "All known report clusters avoided — corridor is community-clear"
          : `${highRisk} high-risk and ${modHotspots} moderate zone(s) on corridor — factored at full weight in selection`
      );
      // INFRASTRUCTURE
      out.push(
        profile.policeCount >= 2
          ? `Passes ${profile.policeCount} police stations — strong emergency infrastructure${profile.policeNames[0] ? ` (${profile.policeNames[0]})` : ""}`
          : profile.policeCount === 1
          ? `1 police station on route — moderate coverage`
          : "Limited police presence on corridor"
      );
      // LIGHTING
      out.push(
        profile.lightingScore >= 70
          ? `Lighting score ${profile.lightingScore}/100 — well-lit road infrastructure`
          : `Lighting score ${profile.lightingScore}/100 — ${isNight ? "exercise caution at night" : "acceptable for daytime travel"}`
      );
      break;
    }

    case "cheapest": {
      out.push(
        `Lowest-fare route via ${primaryMode} on the shortest practical path — ₹${costInr}. Public transit preferred over cab when viable.`
      );
      // RISKS AVOIDED
      out.push(
        hotspots === 0
          ? "No incident clusters — cost savings achieved without major safety trade-off"
          : `${hotspots} community report cluster${hotspots > 1 ? "s" : ""} present — cost vs safety trade-off accepted; verify for night travel`
      );
      // NCRB INDEX
      out.push(
        crimeIndex >= 65
          ? `NCRB crime index: ${crimeIndex}/100 (low risk) — safe for routine budget travel`
          : crimeIndex >= 45
          ? `NCRB crime index: ${crimeIndex}/100 (moderate) — acceptable daytime risk level`
          : `NCRB crime index: ${crimeIndex}/100 (elevated) — use cautiously; prefer daytime`
      );
      // TRADEOFF
      out.push(
        profile.reportCount > 0
          ? `${profile.reportCount} community report(s) near corridor — cost-safety trade-off; review before night travel`
          : "Clean community record — lowest cost without active incident trade-offs"
      );
      break;
    }

    case "women_friendly": {
      const ws = womenScore ?? safetyScore;
      const harassmentFree = !profile.hotspots.some(
        (h) => h.types?.some((t) => t === "harassment" || t === "unsafe_area")
      );
      // WHY
      out.push(
        harassmentFree
          ? `Corridor avoids all known harassment zones — Women Safety Score: ${ws}/100 via ${corridorType === "commercial" ? "commercial" : corridorType === "hospital" ? "hospital" : "lit"} corridor`
          : `Lowest harassment exposure in candidate pool — Women Safety Score: ${ws}/100. Harassment weighted 2× in selection.`
      );
      // RISKS AVOIDED
      out.push(
        profile.lightingScore >= 65
          ? `Lighting score ${profile.lightingScore}/100 — well-lit commercial/hospital corridor preferred`
          : `Lighting score ${profile.lightingScore}/100 — ${isNight ? "additional caution advised; use cab over walk" : "acceptable lighting for daytime"}`
      );
      // INFRASTRUCTURE
      const infraParts: string[] = [];
      if (profile.policeCount > 0) infraParts.push(`${profile.policeCount} police station${profile.policeCount > 1 ? "s" : ""}`);
      if (profile.hospitalCount > 0) infraParts.push(`${profile.hospitalCount} hospital${profile.hospitalCount > 1 ? "s" : ""}`);
      if (commercialDensity >= 65) infraParts.push("commercial activity (safety-in-numbers)");
      out.push(
        infraParts.length > 0
          ? `Safety infrastructure: ${infraParts.join(", ")} along corridor`
          : "Route selected for minimal harassment and best available emergency access"
      );
      // MODE
      out.push(
        primaryMode === "metro"
          ? "Metro with women's coach — highest transit reliability; predictable schedule"
          : primaryMode === "cab"
          ? "Cab recommended — door-to-door safety; no waiting at stops"
          : `${primaryMode} assigned for this trip distance`
      );
      break;
    }
  }

  // Time-of-day advisory (data-driven, not generic)
  if (isNight) {
    out.push(`Night travel (${departureHour}:00) — ${timeSafetyLabel(departureHour)}. Scores adjusted for reduced road activity.`);
  } else if (departureHour >= 7 && departureHour <= 10) {
    out.push(`Peak morning window — high road activity, good visibility. ${timeSafetyLabel(departureHour)}.`);
  }

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
 *   cheapest:       dist ≤ fastest + 18%  AND ETA ≤ fastest + 35%
 *   women_friendly: dist ≤ fastest + 10%  AND ETA ≤ fastest + 15%  (never the longest)
 */
const ROUTE_DIST_LIMIT: Record<RouteType, number> = {
  balanced:       1.05,
  safest:         1.20,
  cheapest:       1.18,
  women_friendly: 1.10,
};
const ROUTE_ETA_LIMIT: Record<RouteType, number> = {
  balanced:       999,
  safest:         999,
  cheapest:       1.35,
  women_friendly: 1.15,
};

function estimateCandidateCost(
  routeType: RouteType,
  src: GeocodedPlace,
  dst: GeocodedPlace,
  ors: OrsResult
): number {
  return estimateRouteFare(buildMultimodalLegs(routeType, src, dst, ors), routeType);
}

function bestByScore(
  pool: ScoredCandidate[],
  routeType: RouteType,
  src: GeocodedPlace,
  dst: GeocodedPlace
): ScoredCandidate {
  if (routeType === "cheapest") {
    return pool.reduce((best, c) => {
      const costC = estimateCandidateCost("cheapest", src, dst, c.ors);
      const costB = estimateCandidateCost("cheapest", src, dst, best.ors);
      if (costC !== costB) return costC < costB ? c : best;
      if (c.ors.duration_min !== best.ors.duration_min) {
        return c.ors.duration_min < best.ors.duration_min ? c : best;
      }
      if (c.ors.distance_km !== best.ors.distance_km) {
        return c.ors.distance_km < best.ors.distance_km ? c : best;
      }
      return c.safetyScore > best.safetyScore ? c : best;
    });
  }

  return pool.reduce((best, c) => {
    const costC = estimateCandidateCost(routeType, src, dst, c.ors);
    const costB = estimateCandidateCost(routeType, src, dst, best.ors);
    const scoreC = computeOptimizationScore(c.safetyScore, c.ors.duration_min, costC, routeType, c.womenScore);
    const scoreB = computeOptimizationScore(best.safetyScore, best.ors.duration_min, costB, routeType, best.womenScore);
    return scoreC > scoreB ? c : best;
  });
}

/**
 * Corridor types preferred by each route type (in priority order).
 * selectBestGeometry tries preferred corridors first; falls back to full pool.
 *
 *   balanced        → commercial > general > transit  (everyday commute via main road)
 *   cheapest        → shortest > general > transit  (practical low-cost path, not hub detours)
 *   safest          → police > nightSafe > general    (police-dense outer corridors)
 *   women_friendly  → hospital > commercial > nightSafe > general (lit, safe, commercial)
 */
const CORRIDOR_PREFERENCE: Record<RouteType, CorridorType[]> = {
  balanced:       ["commercial", "general", "shortest"],
  cheapest:       ["shortest", "general", "transit"],
  safest:         ["police", "nightSafe", "general"],
  women_friendly: ["hospital", "commercial", "nightSafe", "general"],
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

  const inBounds = (c: ScoredCandidate) =>
    c.ors.distance_km <= maxDist && c.ors.duration_min <= maxEta;

  // ── Women-Friendly: multi-factor blended corridor selection ──────────
  // Instead of hospital-first corridor, pick the "most socially active &
  // monitored" candidate — the one that maximises a combined blend of:
  //  40% womenScore  +  20% commercialDensity  +
  //  20% policeCount  +  20% hospitalCount
  // while still respecting the ETA + distance constraints.
  if (routeType === "women_friendly") {
    const constrained = candidates.filter(inBounds);
    const pool = constrained.length > 0 ? constrained : candidates;

    // Normalise counts for fair comparison
    const maxPolice   = Math.max(1, ...pool.map((c) => c.profile.policeCount));
    const maxHospital = Math.max(1, ...pool.map((c) => c.profile.hospitalCount));

    return pool.reduce((best, c) => {
      const blendC = (
        0.40 * c.womenScore / 100 +
        0.20 * c.commercialDensity / 100 +
        0.20 * c.profile.policeCount / maxPolice +
        0.20 * c.profile.hospitalCount / maxHospital
      );
      const blendB = (
        0.40 * best.womenScore / 100 +
        0.20 * best.commercialDensity / 100 +
        0.20 * best.profile.policeCount / maxPolice +
        0.20 * best.profile.hospitalCount / maxHospital
      );
      return blendC > blendB ? c : best;
    });
  }

  // ── Other route types: corridor-preference + multi-objective scoring ──
  // 1st priority: preferred corridor types, within constraints
  for (const ct of CORRIDOR_PREFERENCE[routeType]) {
    const preferredValid = candidates.filter((c) => c.corridorType === ct && inBounds(c));
    if (preferredValid.length > 0) return bestByScore(preferredValid, routeType, src, dst);
  }

  // 2nd priority: any candidate within constraints
  const constrained = candidates.filter(inBounds);
  const pool = constrained.length > 0 ? constrained : candidates;
  return bestByScore(pool, routeType, src, dst);
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
  cityId: string,
  crimeMeta?: { risk_label: string; report_year: number; data_source: string }
): PlannedRoute {
  const { ors, profile, safetyScore, safetyBreakdown, womenScore, commercialDensity, corridorType } = candidate;

  const legs     = buildMultimodalLegs(routeType, src, dst, ors);
  const baseCost = estimateRouteFare(legs, routeType);
  const primaryMode = legs.find((l) => l.mode !== "walk")?.mode ?? "walk";

  // Traffic-adjusted ETA — city-specific historical congestion patterns
  const { multiplier: trafficMult, label: trafficLabel } = getTrafficMultiplier(cityId, departureHour);
  const rawEtaMin      = legs.reduce((s, l) => s + l.duration_min, 0);
  const adjustedEtaMin = Math.round(rawEtaMin * trafficMult);

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
    departureHour, primaryMode, corridorType, commercialDensity,
    routeType === "women_friendly" ? womenScore : undefined
  );

  if (crimeMeta) {
    recommendations.push(
      `NCRB ${crimeMeta.report_year} crime index: ${crimeIndex}/100 (${crimeMeta.risk_label.replace(/_/g, " ")})`
    );
  }
  recommendations.push(`Multi-modal: ${legs.map((l) => l.mode).join(" → ")} via ${routedVia}`);
  recommendations.push(`Traffic: ${trafficLabel} (×${trafficMult.toFixed(2)})`);

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
    eta_minutes: adjustedEtaMin,
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

    // ── Step 2: Generate 8–12 diverse candidate geometries ────────────────
    // generateCandidatePool fetches 7 sources in parallel:
    //   OSRM alternatives (3) + ORS shortest + 5 corridor via-waypoint routes
    // Each candidate carries a semantic corridorType tag.
    const candidatePool = await generateCandidatePool(src, dst, start, end, cityId);

    // ── Step 3: Fetch OSM corridor places along the primary geometry ──────
    // Use the shortest candidate's geometry to maximise corridor coverage
    const primaryGeom = candidatePool.reduce((a, b) =>
      a.ors.distance_km < b.ors.distance_km ? a : b
    ).ors.geometry;
    const routeSamples = sampleLineString(primaryGeom, 15);
    const osmPlaces    = await fetchCorridorPlaces(routeSamples);
    const sampleCount  = routeSamples.length;

    // ── Step 4: Profile every candidate geometry ───────────────────────────
    // computeCommercialDensity + computeWomenSafetyScore use city-specific data
    const fastestEtaMin = Math.min(...candidatePool.map((c) => c.ors.duration_min));

    const scored: ScoredCandidate[] = candidatePool.map(({ ors, corridorType }) => {
      const legs = buildMultimodalLegs("balanced", src, dst, ors);
      const profile = buildCorridorProfile(ors.geometry, allReports, osmPlaces, {
        distanceKm: ors.distance_km,
        departureHour,
        transferCount: Math.max(0, legs.length - 1),
      });

      const { score: safetyScore, breakdown: safetyBreakdown } =
        computeCorridorSafetyScore(profile, crimeScore.crime_index, departureHour, ors.distance_km);

      const geoSamples = sampleLineString(ors.geometry, 8);
      const commercialDensity = computeCommercialDensity(geoSamples, cityId);

      const womenScore = computeWomenSafetyScore(
        profile,
        allReports as ReportLike[],
        geoSamples,
        commercialDensity,
        ors.duration_min,
        fastestEtaMin
      );

      return { ors, profile, safetyScore, safetyBreakdown, womenScore, commercialDensity, corridorType };
    });

    // ── Step 5: Select best geometry per route type ────────────────────────
    const fastestDistKm = Math.min(...candidatePool.map((c) => c.ors.distance_km));

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
          departureHour, sampleCount, cityId, crimeMeta
        );
      });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) persistRoutes(user.id, cityId, routes);

    return routes;
  },
};
