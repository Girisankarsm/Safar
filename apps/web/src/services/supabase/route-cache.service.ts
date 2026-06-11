import { ROUTE_CACHE_TTL_MS } from "@/lib/config";
import { supabase } from "@/lib/supabase/client";
import type { RouteType } from "@/types/database";

export type CachedRoute = {
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
};

export const routeCacheService = {
  async get(cacheKey: string): Promise<CachedRoute | null> {
    const { data } = await supabase
      .from("route_cache")
      .select("distance_km, duration_min, geometry")
      .eq("cache_key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (!data) return null;
    return {
      distance_km: data.distance_km,
      duration_min: data.duration_min,
      geometry: data.geometry as GeoJSON.LineString,
    };
  },

  async set(
    cacheKey: string,
    payload: {
      source_lat: number;
      source_lng: number;
      dest_lat: number;
      dest_lng: number;
      route_type: RouteType;
      ors_profile: string;
      distance_km: number;
      duration_min: number;
      geometry: GeoJSON.LineString;
    }
  ) {
    const expires_at = new Date(Date.now() + ROUTE_CACHE_TTL_MS).toISOString();
    await supabase.from("route_cache").upsert({
      cache_key: cacheKey,
      ...payload,
      expires_at,
    });
  },
};
