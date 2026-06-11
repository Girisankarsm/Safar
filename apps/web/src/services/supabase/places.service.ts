import { IS_DEMO_MODE, OSM_CACHE_TTL_MS } from "@/lib/config";
import { demoSafeSpots } from "@/lib/demo-data";
import { haversineM } from "@/lib/geo";
import { supabase } from "@/lib/supabase/client";
import { fetchAllPlaceTypesNear, type OverpassPlace } from "@/services/osm/overpass.service";
import type { CityId, OsmPlaceType, SafeWaitingSpot } from "@/types/database";

const SAFE_PLACE_TYPES: OsmPlaceType[] = [
  "hospital",
  "police",
  "petrol_pump",
  "pharmacy",
  "railway",
  "metro",
  "bus_stop",
];

const SCORE_BASE: Record<OsmPlaceType, number> = {
  police: 92,
  hospital: 88,
  metro: 82,
  railway: 80,
  petrol_pump: 76,
  pharmacy: 72,
  bus_stop: 58,
  store: 55,
};

function computeSafeWaitingScore(place: OverpassPlace, distanceM: number): number {
  let score = SCORE_BASE[place.place_type] ?? 60;
  if (place.tags.opening_hours === "24/7" || place.tags["fuel:lpg"] === "yes") score += 5;
  if (distanceM < 500) score += 3;
  else if (distanceM > 3000) score -= 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function getCachedPlacesNear(
  lat: number,
  lng: number,
  placeType: OsmPlaceType,
  radiusM: number,
  cityId: CityId
): Promise<OverpassPlace[]> {
  const staleBefore = new Date(Date.now() - OSM_CACHE_TTL_MS).toISOString();

  const { data: cached } = await supabase
    .from("osm_places")
    .select("*")
    .eq("place_type", placeType)
    .eq("city_id", cityId)
    .gte("fetched_at", staleBefore);

  const fromDb = (cached ?? [])
    .filter((p) => haversineM(lat, lng, p.latitude, p.longitude) <= radiusM)
    .map((p) => ({
      osm_id: Number(p.osm_id),
      osm_type: p.osm_type as OverpassPlace["osm_type"],
      place_type: p.place_type as OsmPlaceType,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      tags: (p.tags as Record<string, string>) ?? {},
    }));

  if (fromDb.length >= 3) return fromDb;

  const fresh = await fetchAllPlaceTypesNear(lat, lng, [placeType], radiusM);

  if (fresh.length) {
    await supabase.from("osm_places").upsert(
      fresh.map((p) => ({
        osm_id: p.osm_id,
        osm_type: p.osm_type,
        place_type: p.place_type,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        city_id: cityId,
        tags: p.tags,
        fetched_at: new Date().toISOString(),
      })),
      { onConflict: "osm_id,place_type" }
    );
  }

  return fresh.length ? fresh : fromDb;
}

async function upsertSafeWaitingSpots(
  places: OverpassPlace[],
  userLat: number,
  userLng: number,
  cityId: CityId
): Promise<SafeWaitingSpot[]> {
  const ranked = places
    .map((p) => {
      const distance_m = Math.round(haversineM(userLat, userLng, p.latitude, p.longitude));
      const safe_waiting_score = computeSafeWaitingScore(p, distance_m);
      return { ...p, distance_m, safe_waiting_score };
    })
    .sort((a, b) => b.safe_waiting_score - a.safe_waiting_score || a.distance_m - b.distance_m)
    .slice(0, 20);

  const spots: SafeWaitingSpot[] = [];

  for (const p of ranked) {
    const { data: osmRow } = await supabase
      .from("osm_places")
      .select("id")
      .eq("osm_id", p.osm_id)
      .eq("place_type", p.place_type)
      .maybeSingle();

    const spotType = p.place_type === "petrol_pump" ? "petrol_pump" : p.place_type;
    await supabase.from("safe_waiting_spots").insert({
      city_id: cityId,
      spot_type: spotType,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      is_24x7: p.tags.opening_hours === "24/7",
      osm_place_id: osmRow?.id ?? null,
      safe_waiting_score: p.safe_waiting_score,
      computed_at: new Date().toISOString(),
    });

    spots.push({
      id: `osm-${p.osm_id}`,
      city_id: cityId,
      spot_type: spotType as SafeWaitingSpot["spot_type"],
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      is_24x7: p.tags.opening_hours === "24/7",
      safe_waiting_score: p.safe_waiting_score,
      distance_m: p.distance_m,
    });
  }

  return spots;
}

export const placesService = {
  async getPlacesNear(lat: number, lng: number, cityId: CityId, type: OsmPlaceType, radiusM = 5000) {
    if (IS_DEMO_MODE) return [];
    return getCachedPlacesNear(lat, lng, type, radiusM, cityId);
  },

  async countPlacesNearRoute(
    samplePoints: { lat: number; lng: number }[],
    cityId: CityId,
    type: OsmPlaceType
  ): Promise<number> {
    if (IS_DEMO_MODE) return 2;
    let total = 0;
    for (const pt of samplePoints.slice(0, 6)) {
      const places = await getCachedPlacesNear(pt.lat, pt.lng, type, 800, cityId);
      total += places.length;
    }
    return total;
  },

  async getSafeWaitingSpots(
    cityId: CityId,
    lat: number,
    lng: number
  ): Promise<SafeWaitingSpot[]> {
    if (IS_DEMO_MODE) {
      return demoSafeSpots(cityId).map((s) => ({
        ...s,
        distance_m: Math.round(haversineM(lat, lng, s.latitude, s.longitude)),
      }));
    }

    const allPlaces: OverpassPlace[] = [];
    for (const t of SAFE_PLACE_TYPES) {
      const batch = await getCachedPlacesNear(lat, lng, t, 4000, cityId);
      allPlaces.push(...batch);
    }

    if (!allPlaces.length) {
      const { data } = await supabase
        .from("safe_waiting_spots")
        .select("*")
        .eq("city_id", cityId)
        .order("safe_waiting_score", { ascending: false })
        .limit(12);
      return (data ?? []).map((s) => ({
        ...s,
        distance_m: Math.round(haversineM(lat, lng, s.latitude, s.longitude)),
      })) as SafeWaitingSpot[];
    }

    return upsertSafeWaitingSpots(allPlaces, lat, lng, cityId);
  },

  async getCities() {
    const { data, error } = await supabase.from("cities").select("*").eq("is_active", true);
    if (error) throw error;
    return data ?? [];
  },
};
