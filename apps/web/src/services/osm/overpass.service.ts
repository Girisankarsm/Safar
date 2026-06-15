import { OVERPASS_PROXY_URL, OVERPASS_URL } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import type { OsmPlaceType } from "@/types/database";

const TYPE_FILTERS: Record<OsmPlaceType, string[]> = {
  // Comprehensive hospital detection for Indian OSM data:
  // amenity=hospital covers large hospitals, amenity=clinic covers nursing homes /
  // multi-specialty clinics, healthcare=hospital covers residual cases,
  // amenity=doctors covers standalone GP / specialist clinics.
  hospital: [
    'node["amenity"="hospital"]',
    'way["amenity"="hospital"]',
    'node["amenity"="clinic"]',
    'way["amenity"="clinic"]',
    'node["healthcare"="hospital"]',
    'way["healthcare"="hospital"]',
    'node["amenity"="doctors"]',
  ],
  police: ['node["amenity"="police"]', 'way["amenity"="police"]'],
  petrol_pump: ['node["amenity"="fuel"]', 'way["amenity"="fuel"]'],
  pharmacy: ['node["amenity"="pharmacy"]', 'way["amenity"="pharmacy"]'],
  railway: ['node["railway"="station"]', 'way["railway"="station"]'],
  metro: ['node["railway"="station"]["station"="subway"]', 'node["railway"="subway_entrance"]'],
  bus_stop: ['node["highway"="bus_stop"]', 'node["public_transport"="platform"]'],
  store: ['node["shop"="supermarket"]', 'node["shop"="mall"]', 'way["shop"="mall"]'],
};

export type OverpassPlace = {
  osm_id: number;
  osm_type: "node" | "way" | "relation";
  place_type: OsmPlaceType;
  name: string;
  latitude: number;
  longitude: number;
  tags: Record<string, string>;
};

function buildQuery(lat: number, lng: number, placeType: OsmPlaceType, radiusM: number): string {
  const filters = TYPE_FILTERS[placeType]
    .map((f) => `  ${f}(around:${radiusM},${lat},${lng});`)
    .join("\n");
  return `[out:json][timeout:30];\n(\n${filters}\n);\nout center 80;`;
}

const EMERGENCY_TYPES: OsmPlaceType[] = [
  "hospital",
  "police",
  "pharmacy",
  "petrol_pump",
  "metro",
  "railway",
];

/**
 * Build a corridor-based Overpass query.
 *
 * Instead of a single center-point circle, this uses Overpass's multi-point
 * `around:` syntax which creates a buffer zone along the ENTIRE route polyline.
 * This guarantees hospitals on the road ahead/behind are found, not just those
 * near the geometric centroid.
 *
 * Point list format: lat0,lng0,lat1,lng1,...
 */
function buildCorridorEmergencyQuery(
  points: { lat: number; lng: number }[],
  radiusM: number
): string {
  // Overpass around: polyline format = lat,lon,lat,lon,...
  const polyline = points.map((p) => `${p.lat},${p.lng}`).join(",");
  const around = `around:${radiusM},${polyline}`;

  const filters = EMERGENCY_TYPES.flatMap((placeType) =>
    TYPE_FILTERS[placeType].map((f) => {
      // Replace `(around:R,lat,lng)` with corridor-based `(around:R,pts...)`
      // f is like: node["amenity"="hospital"]
      return `  ${f}(${around});`;
    })
  ).join("\n");

  // Increased limit: 200 results covers any dense Indian city corridor
  return `[out:json][timeout:25];\n(\n${filters}\n);\nout center 200;`;
}

/** Legacy single-point query — kept for backward compat with fetchOsmPlacesNear */
function buildCombinedEmergencyQuery(lat: number, lng: number, radiusM: number): string {
  const filters = EMERGENCY_TYPES.flatMap((placeType) =>
    TYPE_FILTERS[placeType].map((f) => `  ${f}(around:${radiusM},${lat},${lng});`)
  ).join("\n");
  return `[out:json][timeout:25];\n(\n${filters}\n);\nout center 200;`;
}

function parseOverpassElements(
  elements: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }>,
  defaultType: OsmPlaceType
): OverpassPlace[] {
  return elements
    .map((el) => {
      const coords =
        el.lat != null && el.lon != null
          ? { lat: el.lat, lng: el.lon }
          : el.center
            ? { lat: el.center.lat, lng: el.center.lon }
            : null;
      if (!coords) return null;

      const tags = el.tags ?? {};
      let placeType = defaultType;
      // Hospital detection: covers all common Indian OSM tagging patterns
      if (
        tags.amenity === "hospital" ||
        tags.amenity === "clinic" ||
        tags.amenity === "doctors" ||
        tags.healthcare === "hospital"
      ) placeType = "hospital";
      else if (tags.amenity === "police") placeType = "police";
      else if (tags.amenity === "pharmacy") placeType = "pharmacy";
      else if (tags.amenity === "fuel") placeType = "petrol_pump";
      else if (tags.railway === "subway_entrance" || tags.station === "subway") placeType = "metro";
      else if (tags.railway === "station") placeType = "railway";

      const name = tags.name ?? tags["name:en"] ?? `${placeType.replace(/_/g, " ")} #${el.id}`;
      return {
        osm_id: el.id,
        osm_type: (el.type === "way" ? "way" : el.type === "relation" ? "relation" : "node") as OverpassPlace["osm_type"],
        place_type: placeType,
        name,
        latitude: coords.lat,
        longitude: coords.lng,
        tags,
      };
    })
    .filter(Boolean) as OverpassPlace[];
}

async function overpassFetch(query: string, timeoutMs = 10_000): Promise<Response> {
  if (OVERPASS_PROXY_URL && OVERPASS_PROXY_URL !== OVERPASS_URL) {
    return fetchWithTimeout(OVERPASS_PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      timeoutMs,
    });
  }
  return fetchWithTimeout(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
    timeoutMs,
  });
}

/** Single Overpass request for all emergency-safe place types (legacy — centroid-based) */
export async function fetchEmergencyPlacesNear(
  lat: number,
  lng: number,
  radiusM = 4000,
  timeoutMs = 10_000
): Promise<OverpassPlace[]> {
  const res = await overpassFetch(buildCombinedEmergencyQuery(lat, lng, radiusM), timeoutMs);

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

  const json = await res.json();
  return parseOverpassElements(json.elements ?? [], "hospital");
}

/**
 * Corridor-aware Overpass query — fetches all emergency POIs within `radiusM`
 * of ANY point along the route polyline.
 *
 * This replaces the centroid approach: for a 7 km route, the centroid-circle
 * can miss hospitals near the start/end of the route while picking up unrelated
 * places near the centre. The corridor query buffers every sample point.
 *
 * @param points  Route sample points (lat/lng), typically 8–15 samples
 * @param radiusM Buffer radius around each point (default 600 m)
 * @param timeoutMs Fetch timeout (default 18s — corridor queries are larger)
 */
export async function fetchEmergencyPlacesAlongCorridor(
  points: { lat: number; lng: number }[],
  radiusM = 600,
  timeoutMs = 18_000
): Promise<OverpassPlace[]> {
  if (!points.length) return [];

  // Overpass has a URL length limit — downsample to at most 20 points
  // (covers any route up to ~6 km at 300 m intervals)
  const sampled =
    points.length <= 20
      ? points
      : points.filter((_, i) => i % Math.ceil(points.length / 20) === 0 || i === points.length - 1);

  try {
    const res = await overpassFetch(buildCorridorEmergencyQuery(sampled, radiusM), timeoutMs);
    if (!res.ok) {
      // Fall back to centroid approach on error
      const centLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
      const centLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
      return fetchEmergencyPlacesNear(centLat, centLng, Math.min(8000, radiusM * 4), timeoutMs);
    }
    const json = await res.json();
    return parseOverpassElements(json.elements ?? [], "hospital");
  } catch {
    // Graceful fallback to centroid
    const centLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
    const centLng = points.reduce((s, p) => s + p.lng, 0) / points.length;
    return fetchEmergencyPlacesNear(centLat, centLng, Math.min(8000, radiusM * 4), timeoutMs).catch(() => []);
  }
}

export async function fetchOsmPlacesNear(
  lat: number,
  lng: number,
  placeType: OsmPlaceType,
  radiusM = 5000
): Promise<OverpassPlace[]> {
  const res = await overpassFetch(buildQuery(lat, lng, placeType, radiusM));

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

  const json = await res.json();
  return parseOverpassElements(json.elements ?? [], placeType);
}

export async function fetchAllPlaceTypesNear(
  lat: number,
  lng: number,
  types: OsmPlaceType[],
  radiusM = 5000
): Promise<OverpassPlace[]> {
  const results = await Promise.all(
    types.map((t) => fetchOsmPlacesNear(lat, lng, t, radiusM).catch(() => [] as OverpassPlace[]))
  );
  return results.flat();
}
