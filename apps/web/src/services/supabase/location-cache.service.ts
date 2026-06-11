import { GEOCODE_CACHE_TTL_MS } from "@/lib/config";
import { supabase } from "@/lib/supabase/client";
import type { CityId } from "@/types/database";

export const locationCacheService = {
  async get(queryKey: string) {
    const { data } = await supabase
      .from("location_cache")
      .select("*")
      .eq("query_key", queryKey)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    return data;
  },

  async set(
    queryKey: string,
    payload: { display_name: string; latitude: number; longitude: number; city_id: CityId }
  ) {
    const expires_at = new Date(Date.now() + GEOCODE_CACHE_TTL_MS).toISOString();
    await supabase.from("location_cache").upsert({
      query_key: queryKey,
      ...payload,
      expires_at,
      source: "nominatim",
    });
  },
};
