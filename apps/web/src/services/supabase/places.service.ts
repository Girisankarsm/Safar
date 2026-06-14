import { IS_DEMO_MODE } from "@/lib/config";
import { DEMO_CITY_CENTERS, demoSafeSpots, emergencyFallbackSpots } from "@/lib/demo-data";
import { haversineM, MAX_WALKING_DISTANCE_M } from "@/lib/geo";
import { supabase } from "@/lib/supabase/client";
import { fetchEmergencyPlacesNear, type OverpassPlace } from "@/services/osm/overpass.service";
import type { CityId, OsmPlaceType, SafeWaitingSpot } from "@/types/database";

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
  if (distanceM < 300) score += 5;
  else if (distanceM < 600) score += 3;
  else if (distanceM > 800) score -= 3;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function rankPlacesAsSpots(
  places: OverpassPlace[],
  userLat: number,
  userLng: number,
  cityId: CityId,
  maxDistanceM: number,
  limit = 8
): SafeWaitingSpot[] {
  return places
    .map((p) => {
      const distance_m = Math.round(haversineM(userLat, userLng, p.latitude, p.longitude));
      const spotType =
        p.place_type === "bus_stop" ? "store" : (p.place_type as SafeWaitingSpot["spot_type"]);
      return {
        id: `osm-${p.osm_id}-${p.place_type}`,
        city_id: cityId,
        spot_type: spotType,
        name: p.name,
        latitude: p.latitude,
        longitude: p.longitude,
        is_24x7: p.tags.opening_hours === "24/7",
        safe_waiting_score: computeSafeWaitingScore(p, distance_m),
        distance_m,
      };
    })
    .filter((s) => (s.distance_m ?? 0) <= maxDistanceM)
    .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0))
    .slice(0, limit);
}

function withDistance(spots: SafeWaitingSpot[], lat: number, lng: number): SafeWaitingSpot[] {
  return spots
    .map((s) => ({
      ...s,
      distance_m: Math.round(haversineM(lat, lng, s.latitude, s.longitude)),
    }))
    .sort((a, b) => (a.distance_m ?? 0) - (b.distance_m ?? 0));
}

function filterWalkingDistance(spots: SafeWaitingSpot[], maxM = MAX_WALKING_DISTANCE_M) {
  return spots.filter((s) => (s.distance_m ?? Infinity) <= maxM);
}

function cacheOsmPlaces(places: OverpassPlace[], cityId: CityId) {
  if (!places.length) return;
  void supabase.from("osm_places").upsert(
    places.map((p) => ({
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

async function fetchLiveNearby(
  lat: number,
  lng: number,
  cityId: CityId,
  maxDistanceM: number
): Promise<SafeWaitingSpot[]> {
  for (const radiusM of [maxDistanceM, maxDistanceM + 500, maxDistanceM + 1000]) {
    try {
      const livePlaces = await fetchEmergencyPlacesNear(lat, lng, radiusM, 12_000);
      if (!livePlaces.length) continue;
      cacheOsmPlaces(livePlaces, cityId);
      const ranked = rankPlacesAsSpots(livePlaces, lat, lng, cityId, maxDistanceM);
      if (ranked.length) return ranked;
    } catch {
      continue;
    }
  }
  return [];
}

export const placesService = {
  async getSafeWaitingSpots(
    cityId: CityId,
    lat: number,
    lng: number,
    maxDistanceM = MAX_WALKING_DISTANCE_M
  ): Promise<SafeWaitingSpot[]> {
    const live = await fetchLiveNearby(lat, lng, cityId, maxDistanceM);
    if (live.length) return live;

    if (IS_DEMO_MODE) {
      const demo = filterWalkingDistance(withDistance(demoSafeSpots(cityId), lat, lng), maxDistanceM);
      if (demo.length) return demo;
    }

    const { data } = await supabase
      .from("safe_waiting_spots")
      .select("*")
      .eq("city_id", cityId)
      .limit(24);

    if (data?.length) {
      const nearby = filterWalkingDistance(withDistance(data as SafeWaitingSpot[], lat, lng), maxDistanceM);
      if (nearby.length) return nearby.slice(0, 8);
    }

    return filterWalkingDistance(
      withDistance(emergencyFallbackSpots(cityId), lat, lng),
      maxDistanceM
    ).slice(0, 8);
  },

  async getCities() {
    const { data, error } = await supabase.from("cities").select("*").eq("is_active", true);
    if (error) {
      return Object.entries(DEMO_CITY_CENTERS).map(([id, c]) => ({
        id,
        name: c.name,
        center_lat: c.lat,
        center_lng: c.lng,
        is_active: true,
      }));
    }
    return data ?? [];
  },
};
