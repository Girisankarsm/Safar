/**
 * Minimal demo fallback — only used when VITE_DEMO_MODE=true.
 * Production must use live OSM + user-generated Supabase data.
 */
import type { CityId, SafeWaitingSpot } from "@/types/database";

export const DEMO_CITY_CENTERS: Record<CityId, { lat: number; lng: number; name: string }> = {
  chennai: { lat: 13.0827, lng: 80.2707, name: "Chennai" },
  trivandrum: { lat: 8.5241, lng: 76.9366, name: "Trivandrum" },
  bangalore: { lat: 12.9716, lng: 77.5946, name: "Bengaluru" },
};

/** Demo-only geocode when Nominatim unavailable */
export const DEMO_GEOCODE: Record<CityId, Record<string, { lat: number; lng: number; name: string }>> = {
  chennai: {
    "t nagar": { lat: 13.0418, lng: 80.2341, name: "T Nagar" },
    "chennai central": { lat: 13.0827, lng: 80.2751, name: "Chennai Central" },
  },
  trivandrum: {
    technopark: { lat: 8.5241, lng: 76.9366, name: "Technopark" },
    palayam: { lat: 8.5099, lng: 76.9655, name: "Palayam" },
  },
  bangalore: {
    "mg road": { lat: 12.9756, lng: 77.6063, name: "MG Road" },
    indiranagar: { lat: 12.9784, lng: 77.6408, name: "Indiranagar" },
  },
};

export function demoZones(cityId: CityId) {
  const c = DEMO_CITY_CENTERS[cityId];
  return [
    {
      id: "demo-1",
      city_id: cityId,
      zone_type: "moderate",
      label: "Demo zone (enable live mode for real data)",
      latitude: c.lat,
      longitude: c.lng,
      risk_weight: 0.5,
    },
  ];
}

export function demoSafeSpots(cityId: CityId): SafeWaitingSpot[] {
  const c = DEMO_CITY_CENTERS[cityId];
  return [
    {
      id: "demo-spot-1",
      city_id: cityId,
      spot_type: "hospital",
      name: "Demo Hospital (VITE_DEMO_MODE)",
      latitude: c.lat + 0.01,
      longitude: c.lng + 0.01,
      is_24x7: true,
      safe_waiting_score: 75,
    },
  ];
}
