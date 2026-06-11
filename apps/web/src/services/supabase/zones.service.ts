import { supabase } from "@/lib/supabase/client";
import type { CityId, SafeWaitingSpot, SafetyZone } from "@/types/database";

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const zonesService = {
  async getZones(cityId: CityId): Promise<SafetyZone[]> {
    const { data, error } = await supabase
      .from("safety_zones")
      .select("*")
      .eq("city_id", cityId);
    if (error) throw error;
    return (data ?? []) as SafetyZone[];
  },

  async getSafeSpots(cityId: CityId, lat?: number, lng?: number): Promise<SafeWaitingSpot[]> {
    const { data, error } = await supabase
      .from("safe_waiting_spots")
      .select("*")
      .eq("city_id", cityId);
    if (error) throw error;

    let spots = (data ?? []) as SafeWaitingSpot[];
    if (lat != null && lng != null) {
      spots = spots
        .map((s) => ({
          ...s,
          distance_m: Math.round(haversineM(lat, lng, s.latitude, s.longitude)),
        }))
        .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0));
    }
    return spots;
  },

  async getCities() {
    const { data, error } = await supabase.from("cities").select("*").eq("is_active", true);
    if (error) throw error;
    return data ?? [];
  },
};
