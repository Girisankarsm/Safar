import { IS_DEMO_MODE, NOMINATIM_URL } from "@/lib/config";
import { DEMO_CITY_CENTERS, DEMO_GEOCODE } from "@/lib/demo-data";
import { cacheKey } from "@/lib/geo";
import { locationCacheService } from "@/services/supabase/location-cache.service";
import type { CityId } from "@/types/database";

export type GeocodedPlace = {
  name: string;
  display_name: string;
  lat: number;
  lng: number;
  source: "nominatim" | "cache" | "demo";
};

async function nominatimSearch(query: string, cityId: CityId): Promise<GeocodedPlace | null> {
  const center = DEMO_CITY_CENTERS[cityId];
  const params = new URLSearchParams({
    q: `${query}, ${center.name}, India`,
    format: "json",
    limit: "1",
    countrycodes: "in",
  });

  const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
    headers: { "User-Agent": "Safar/3.0 (urban-mobility; contact:safar@app)" },
  });

  if (!res.ok) return null;
  const data = await res.json();
  const hit = data[0];
  if (!hit) return null;

  return {
    name: query,
    display_name: hit.display_name,
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    source: "nominatim",
  };
}

function demoGeocode(query: string, cityId: CityId): GeocodedPlace | null {
  const key = query.trim().toLowerCase();
  const hits = DEMO_GEOCODE[cityId] ?? {};
  if (hits[key]) {
    return { ...hits[key], display_name: hits[key].name, source: "demo" };
  }
  for (const [k, v] of Object.entries(hits)) {
    if (key.includes(k) || k.includes(key)) {
      return { ...v, display_name: v.name, source: "demo" };
    }
  }
  const c = DEMO_CITY_CENTERS[cityId];
  return { name: query, display_name: query, lat: c.lat, lng: c.lng, source: "demo" };
}

export const nominatimService = {
  async geocode(query: string, cityId: CityId): Promise<GeocodedPlace> {
    const qKey = cacheKey(["geocode", cityId, query]);
    const cached = await locationCacheService.get(qKey);
    if (cached) {
      return {
        name: query,
        display_name: cached.display_name,
        lat: cached.latitude,
        lng: cached.longitude,
        source: "cache",
      };
    }

    let result = await nominatimSearch(query, cityId);

    if (!result && IS_DEMO_MODE) {
      result = demoGeocode(query, cityId);
    }

    if (!result) {
      const c = DEMO_CITY_CENTERS[cityId];
      result = { name: query, display_name: query, lat: c.lat, lng: c.lng, source: "nominatim" };
    }

    await locationCacheService.set(qKey, {
      display_name: result.display_name,
      latitude: result.lat,
      longitude: result.lng,
      city_id: cityId,
    });

    return result;
  },
};
