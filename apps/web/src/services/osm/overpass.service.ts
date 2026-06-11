import { OVERPASS_URL } from "@/lib/config";
import { fetchWithTimeout } from "@/lib/fetch-timeout";
import type { OsmPlaceType } from "@/types/database";

const TYPE_FILTERS: Record<OsmPlaceType, string[]> = {
  hospital: ['node["amenity"="hospital"]', 'way["amenity"="hospital"]'],
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

function buildCombinedEmergencyQuery(lat: number, lng: number, radiusM: number): string {
  const filters = EMERGENCY_TYPES.flatMap((placeType) =>
    TYPE_FILTERS[placeType].map((f) => `  ${f}(around:${radiusM},${lat},${lng});`)
  ).join("\n");
  return `[out:json][timeout:15];\n(\n${filters}\n);\nout center 40;`;
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
      if (tags.amenity === "hospital") placeType = "hospital";
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

/** Single Overpass request for all emergency-safe place types */
export async function fetchEmergencyPlacesNear(
  lat: number,
  lng: number,
  radiusM = 4000,
  timeoutMs = 10_000
): Promise<OverpassPlace[]> {
  const res = await fetchWithTimeout(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(buildCombinedEmergencyQuery(lat, lng, radiusM))}`,
    timeoutMs,
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

  const json = await res.json();
  return parseOverpassElements(json.elements ?? [], "hospital");
}

export async function fetchOsmPlacesNear(
  lat: number,
  lng: number,
  placeType: OsmPlaceType,
  radiusM = 5000
): Promise<OverpassPlace[]> {
  const res = await fetchWithTimeout(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(buildQuery(lat, lng, placeType, radiusM))}`,
    timeoutMs: 10_000,
  });

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
