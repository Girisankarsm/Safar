import { OVERPASS_URL } from "@/lib/config";
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

export async function fetchOsmPlacesNear(
  lat: number,
  lng: number,
  placeType: OsmPlaceType,
  radiusM = 5000
): Promise<OverpassPlace[]> {
  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(buildQuery(lat, lng, placeType, radiusM))}`,
  });

  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);

  const json = await res.json();
  const elements: Array<{
    type: string;
    id: number;
    lat?: number;
    lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
  }> = json.elements ?? [];

  return elements
    .map((el) => {
      const coords =
        el.lat != null && el.lon != null
          ? { lat: el.lat, lng: el.lon }
          : el.center
            ? { lat: el.center.lat, lng: el.center.lon }
            : null;
      if (!coords) return null;
      const name =
        el.tags?.name ?? el.tags?.["name:en"] ?? `${placeType.replace(/_/g, " ")} #${el.id}`;
      return {
        osm_id: el.id,
        osm_type: (el.type === "way" ? "way" : el.type === "relation" ? "relation" : "node") as OverpassPlace["osm_type"],
        place_type: placeType,
        name,
        latitude: coords.lat,
        longitude: coords.lng,
        tags: el.tags ?? {},
      };
    })
    .filter(Boolean) as OverpassPlace[];
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
