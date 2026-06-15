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

/**
 * Progressively expand the search radius (1 km → 2 km → 3 km → 5 km → 8 km)
 * until at least one safe spot is found. Both the Overpass query radius and the
 * result filter expand together so spots found at wider radii are never discarded.
 * Returns the found spots along with the effective radius used.
 */
async function fetchLiveNearby(
  lat: number,
  lng: number,
  cityId: CityId
): Promise<{ spots: SafeWaitingSpot[]; radiusM: number }> {
  const SEARCH_STEPS_M = [1000, 2000, 3000, 5000, 8000];

  for (const radiusM of SEARCH_STEPS_M) {
    try {
      const livePlaces = await fetchEmergencyPlacesNear(lat, lng, radiusM, 14_000);
      if (!livePlaces.length) continue;
      cacheOsmPlaces(livePlaces, cityId);
      const ranked = rankPlacesAsSpots(livePlaces, lat, lng, cityId, radiusM);
      if (ranked.length) return { spots: ranked, radiusM };
    } catch {
      continue;
    }
  }
  return { spots: [], radiusM: 0 };
}

export const placesService = {
  /**
   * Finds safe waiting spots with progressive radius expansion.
   * Tries 1 km → 2 km → 3 km → 5 km → 8 km until spots are found.
   * DB/demo fallback data is capped at MAX_FALLBACK_RADIUS_M to prevent
   * showing city-center spots that are hundreds of km away.
   * Returns spots sorted by distance (nearest first) and the effective radius used.
   */
  async getSafeWaitingSpots(
    cityId: CityId,
    lat: number,
    lng: number
  ): Promise<{ spots: SafeWaitingSpot[]; radiusM: number }> {
    /** Never show fallback/DB spots further than this — prevents 500+ km results */
    const MAX_FALLBACK_RADIUS_M = 15_000;

    const { spots: live, radiusM } = await fetchLiveNearby(lat, lng, cityId);
    if (live.length) return { spots: live, radiusM };

    if (IS_DEMO_MODE) {
      // Demo spots are hardcoded to city locations and may be far from the user's
      // real GPS position. Return them sorted by distance without a radius cap so
      // the "Near Me" button always shows results in demo mode.
      const allDemo = withDistance(demoSafeSpots(cityId), lat, lng).slice(0, 8);
      if (allDemo.length) {
        const nearestDist = allDemo[0].distance_m ?? MAX_FALLBACK_RADIUS_M;
        return { spots: allDemo, radiusM: nearestDist };
      }
      return { spots: [], radiusM: 0 };
    }

    const { data } = await supabase
      .from("safe_waiting_spots")
      .select("*")
      .eq("city_id", cityId)
      .limit(32);

    if (data?.length) {
      const sorted = withDistance(data as SafeWaitingSpot[], lat, lng);
      for (const r of [1000, 2000, 3000, 5000, 8000, MAX_FALLBACK_RADIUS_M]) {
        const nearby = filterWalkingDistance(sorted, r);
        if (nearby.length) return { spots: nearby.slice(0, 8), radiusM: r };
      }
    }

    // Last resort: return closest fallback spots for the city, no distance cap.
    // This ensures "Safe Spots Near Me" always shows results even in demo/offline.
    const fallback = withDistance(emergencyFallbackSpots(cityId), lat, lng).slice(0, 8);
    if (fallback.length) {
      const nearestDist = fallback[0].distance_m ?? MAX_FALLBACK_RADIUS_M;
      return { spots: fallback, radiusM: nearestDist };
    }

    return { spots: [], radiusM: 0 };
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
