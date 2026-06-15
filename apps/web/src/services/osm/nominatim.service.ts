import { getCityConfig } from "@/config/cities";
import { IS_DEMO_MODE, NOMINATIM_URL } from "@/lib/config";
import { DEMO_GEOCODE, filterLocalSuggestions } from "@/lib/demo-data";
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

export type LocationSuggestion = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  source: "nominatim" | "demo" | "local";
};

const NOMINATIM_HEADERS = { "User-Agent": "Safar/3.0 (urban-mobility; contact:safar@app)" };

function formatAddress(hit: {
  display_name: string;
  address?: Record<string, string>;
}): string {
  const addr = hit.address;
  if (!addr) return hit.display_name;

  const parts = [
    addr.road,
    addr.suburb ?? addr.neighbourhood ?? addr.quarter,
    addr.city ?? addr.town ?? addr.village ?? addr.county,
    addr.state,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : hit.display_name;
}

function hitToSuggestion(hit: {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}): LocationSuggestion {
  const name = hit.name || hit.display_name.split(",")[0]?.trim() || hit.display_name;
  return {
    id: String(hit.place_id),
    name,
    address: formatAddress(hit),
    lat: parseFloat(hit.lat),
    lng: parseFloat(hit.lon),
    source: "nominatim",
  };
}

function localToSuggestions(cityId: CityId, query: string, limit: number): LocationSuggestion[] {
  return filterLocalSuggestions(cityId, query, limit).map((place) => ({
    ...place,
    source: "local" as const,
  }));
}

function nominatimParams(query: string, cityId: CityId, limit: string) {
  const city = getCityConfig(cityId);
  const { west, north, east, south } = city.viewbox;
  return new URLSearchParams({
    q: `${query}, ${city.name}, ${city.state}, India`,
    format: "jsonv2",
    limit,
    countrycodes: "in",
    viewbox: `${west},${north},${east},${south}`,
    bounded: "1",
    addressdetails: "1",
    namedetails: "1",
    dedupe: "1",
  });
}

async function nominatimSearch(query: string, cityId: CityId): Promise<GeocodedPlace | null> {
  const params = nominatimParams(query, cityId, "1");

  const res = await fetch(`${NOMINATIM_URL}/search?${params}`, { headers: NOMINATIM_HEADERS });
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

async function nominatimAutocomplete(
  query: string,
  cityId: CityId,
  limit: number,
  signal?: AbortSignal
): Promise<LocationSuggestion[]> {
  const params = nominatimParams(query, cityId, String(limit));

  const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
    headers: NOMINATIM_HEADERS,
    signal,
  });

  if (!res.ok) throw new Error("Location search is temporarily unavailable");

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map(hitToSuggestion);
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
  const c = getCityConfig(cityId);
  return { name: query, display_name: query, lat: c.center_lat, lng: c.center_lng, source: "demo" };
}

export function suggestionToGeocoded(suggestion: LocationSuggestion, query: string): GeocodedPlace {
  return {
    name: suggestion.name || query,
    display_name: suggestion.address,
    lat: suggestion.lat,
    lng: suggestion.lng,
    source: suggestion.source === "nominatim" ? "nominatim" : "demo",
  };
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
      const local = filterLocalSuggestions(cityId, query, 1)[0];
      if (local) {
        result = {
          name: local.name,
          display_name: local.address,
          lat: local.lat,
          lng: local.lng,
          source: "demo",
        };
      } else {
        const c = getCityConfig(cityId);
        result = { name: query, display_name: query, lat: c.center_lat, lng: c.center_lng, source: "nominatim" };
      }
    }

    await locationCacheService.set(qKey, {
      display_name: result.display_name,
      latitude: result.lat,
      longitude: result.lng,
      city_id: cityId,
    });

    return result;
  },

  /**
   * Reverse geocode a lat/lng coordinate into a human-readable place name.
   * Used for "Use my current location" — converts GPS coords to a named place.
   */
  async reverseGeocode(lat: number, lng: number): Promise<{ name: string; display_name: string } | null> {
    try {
      const base = NOMINATIM_URL ?? "https://nominatim.openstreetmap.org";
      const url = `${base}/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1&zoom=16`;
      const res = await fetch(url, { headers: NOMINATIM_HEADERS });
      if (!res.ok) return null;
      const hit = await res.json();
      if (!hit?.lat) return null;

      // Build a short, human-readable label
      const addr = hit.address ?? {};
      const parts = [
        hit.name,
        addr.road ?? addr.pedestrian,
        addr.suburb ?? addr.neighbourhood ?? addr.quarter,
        addr.city ?? addr.town ?? addr.village,
      ].filter(Boolean);

      const shortName = parts.slice(0, 2).join(", ") || hit.display_name;
      return { name: shortName, display_name: hit.display_name };
    } catch {
      return null;
    }
  },

  async autocomplete(
    query: string,
    cityId: CityId,
    options?: { limit?: number; signal?: AbortSignal }
  ): Promise<{ suggestions: LocationSuggestion[]; fallback: boolean; message?: string }> {
    const trimmed = query.trim();
    const limit = options?.limit ?? 8;

    if (trimmed.length < 2) {
      return { suggestions: [], fallback: false };
    }

    if (IS_DEMO_MODE) {
      const local = localToSuggestions(cityId, trimmed, limit);
      return {
        suggestions: local,
        fallback: true,
        message: local.length ? "Demo mode — showing offline suggestions" : undefined,
      };
    }

    try {
      const results = await nominatimAutocomplete(trimmed, cityId, limit, options?.signal);
      if (results.length > 0) {
        return { suggestions: results, fallback: false };
      }

      const local = localToSuggestions(cityId, trimmed, limit);
      return {
        suggestions: local,
        fallback: true,
        message: local.length
          ? "No live matches — showing saved places for this city"
          : "No places found. Try a landmark, station, or area name.",
      };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { suggestions: [], fallback: false };
      }

      const local = localToSuggestions(cityId, trimmed, limit);
      return {
        suggestions: local,
        fallback: true,
        message: local.length
          ? "Search unavailable — showing offline suggestions"
          : "Location search is temporarily unavailable. Check your connection and try again.",
      };
    }
  },
};
