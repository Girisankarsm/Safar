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

export type LocalPlaceSuggestion = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
};

/** Offline autocomplete fallback when Nominatim is unavailable */
export const LOCAL_PLACE_SUGGESTIONS: Record<CityId, LocalPlaceSuggestion[]> = {
  chennai: [
    { id: "chen-central", name: "Chennai Central Railway Station", address: "Park Town, Chennai, Tamil Nadu", lat: 13.0827, lng: 80.2751 },
    { id: "chen-airport", name: "Chennai Airport", address: "Meenambakkam, Chennai, Tamil Nadu", lat: 12.9941, lng: 80.1709 },
    { id: "chen-egmore", name: "Chennai Egmore", address: "Egmore, Chennai, Tamil Nadu", lat: 13.0732, lng: 80.2609 },
    { id: "chen-trade", name: "Chennai Trade Centre", address: "Nandambakkam, Chennai, Tamil Nadu", lat: 13.0174, lng: 80.1848 },
    { id: "srm-easwari", name: "SRM Easwari Engineering College", address: "Guduvancheri, Chengalpattu, Tamil Nadu", lat: 12.8456, lng: 80.0602 },
    { id: "srm-ktr", name: "SRM Institute of Science and Technology", address: "Kattankulathur, Chengalpattu, Tamil Nadu", lat: 12.8231, lng: 80.0445 },
    { id: "srm-med", name: "SRM Medical College", address: "Kattankulathur, Chengalpattu, Tamil Nadu", lat: 12.8205, lng: 80.0462 },
    { id: "srm-hotel", name: "SRM Hotel", address: "Kattankulathur, Chengalpattu, Tamil Nadu", lat: 12.824, lng: 80.043 },
    { id: "anna-nagar", name: "Anna Nagar", address: "Anna Nagar, Chennai, Tamil Nadu", lat: 13.085, lng: 80.2101 },
    { id: "anna-uni", name: "Anna University", address: "Guindy, Chennai, Tamil Nadu", lat: 13.0112, lng: 80.2335 },
    { id: "anna-salai", name: "Anna Salai", address: "Mount Road, Chennai, Tamil Nadu", lat: 13.0569, lng: 80.2598 },
    { id: "t-nagar", name: "T Nagar", address: "Thyagaraya Nagar, Chennai, Tamil Nadu", lat: 13.0418, lng: 80.2341 },
    { id: "omr", name: "OMR IT Corridor", address: "Old Mahabalipuram Road, Chennai, Tamil Nadu", lat: 12.9496, lng: 80.2372 },
  ],
  trivandrum: [
    { id: "tvm-central", name: "Thiruvananthapuram Central", address: "Thampanoor, Trivandrum, Kerala", lat: 8.4875, lng: 76.9525 },
    { id: "technopark", name: "Technopark", address: "Kazhakkoottam, Trivandrum, Kerala", lat: 8.5581, lng: 76.8816 },
    { id: "palayam", name: "Palayam", address: "Palayam, Trivandrum, Kerala", lat: 8.5099, lng: 76.9655 },
    { id: "kovalam", name: "Kovalam Beach", address: "Kovalam, Trivandrum, Kerala", lat: 8.4004, lng: 76.9787 },
    { id: "med-college", name: "Medical College", address: "Medical College, Trivandrum, Kerala", lat: 8.5241, lng: 76.9366 },
  ],
  bangalore: [
    { id: "blr-city", name: "Bengaluru City Railway Station", address: "Majestic, Bengaluru, Karnataka", lat: 12.9772, lng: 77.5665 },
    { id: "mg-road", name: "MG Road", address: "MG Road, Bengaluru, Karnataka", lat: 12.9756, lng: 77.6063 },
    { id: "indiranagar", name: "Indiranagar", address: "Indiranagar, Bengaluru, Karnataka", lat: 12.9784, lng: 77.6408 },
    { id: "koramangala", name: "Koramangala", address: "Koramangala, Bengaluru, Karnataka", lat: 12.9352, lng: 77.6245 },
    { id: "whitefield", name: "Whitefield", address: "Whitefield, Bengaluru, Karnataka", lat: 12.9698, lng: 77.7499 },
    { id: "airport-blr", name: "Kempegowda International Airport", address: "Devanahalli, Bengaluru, Karnataka", lat: 13.1986, lng: 77.7066 },
  ],
};

export function filterLocalSuggestions(cityId: CityId, query: string, limit = 8): LocalPlaceSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored = LOCAL_PLACE_SUGGESTIONS[cityId]
    .map((place) => {
      const name = place.name.toLowerCase();
      const address = place.address.toLowerCase();
      let score = 0;
      if (name.startsWith(q)) score += 100;
      else if (name.includes(q)) score += 60;
      if (address.includes(q)) score += 30;
      return { place, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.place);
}

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
  return emergencyFallbackSpots(cityId);
}

/** Curated safe spots used when Overpass is slow or unavailable */
export function emergencyFallbackSpots(cityId: CityId): SafeWaitingSpot[] {
  const spots: Record<CityId, SafeWaitingSpot[]> = {
    chennai: [
      { id: "fb-apollo", city_id: "chennai", spot_type: "hospital", name: "Apollo Hospitals Greams Road", latitude: 13.0604, longitude: 80.2517, is_24x7: true, safe_waiting_score: 92 },
      { id: "fb-egmore-police", city_id: "chennai", spot_type: "police", name: "Egmore Police Station", latitude: 13.0735, longitude: 80.2612, is_24x7: true, safe_waiting_score: 90 },
      { id: "fb-central", city_id: "chennai", spot_type: "railway", name: "Chennai Central Railway Station", latitude: 13.0827, longitude: 80.2751, is_24x7: true, safe_waiting_score: 85 },
      { id: "fb-airport", city_id: "chennai", spot_type: "metro", name: "Chennai Airport", latitude: 12.9941, longitude: 80.1709, is_24x7: true, safe_waiting_score: 84 },
      { id: "fb-kilpauk", city_id: "chennai", spot_type: "hospital", name: "Kilpauk Medical College Hospital", latitude: 13.0778, longitude: 80.2422, is_24x7: true, safe_waiting_score: 88 },
      { id: "fb-anna-nagar", city_id: "chennai", spot_type: "police", name: "Anna Nagar Police Station", latitude: 13.0872, longitude: 80.2115, is_24x7: false, safe_waiting_score: 86 },
      { id: "fb-tnagar", city_id: "chennai", spot_type: "pharmacy", name: "T Nagar 24/7 Pharmacy Zone", latitude: 13.0418, longitude: 80.2341, is_24x7: true, safe_waiting_score: 74 },
      { id: "fb-omr-fuel", city_id: "chennai", spot_type: "petrol_pump", name: "OMR BP Fuel Station", latitude: 12.9496, longitude: 80.2372, is_24x7: true, safe_waiting_score: 78 },
    ],
    trivandrum: [
      { id: "fb-tvm-hosp", city_id: "trivandrum", spot_type: "hospital", name: "Medical College Hospital", latitude: 8.5241, longitude: 76.9366, is_24x7: true, safe_waiting_score: 90 },
      { id: "fb-tvm-police", city_id: "trivandrum", spot_type: "police", name: "Thampanoor Police Station", latitude: 8.4875, longitude: 76.9525, is_24x7: true, safe_waiting_score: 88 },
      { id: "fb-technopark", city_id: "trivandrum", spot_type: "metro", name: "Technopark Campus Security", latitude: 8.5581, longitude: 76.8816, is_24x7: true, safe_waiting_score: 82 },
      { id: "fb-palayam", city_id: "trivandrum", spot_type: "pharmacy", name: "Palayam Medical Stores", latitude: 8.5099, longitude: 76.9655, is_24x7: false, safe_waiting_score: 72 },
    ],
    bangalore: [
      { id: "fb-victoria", city_id: "bangalore", spot_type: "hospital", name: "Victoria Hospital", latitude: 12.9592, longitude: 77.5841, is_24x7: true, safe_waiting_score: 90 },
      { id: "fb-kg-police", city_id: "bangalore", spot_type: "police", name: "Majestic Police Station", latitude: 12.9772, longitude: 77.5665, is_24x7: true, safe_waiting_score: 88 },
      { id: "fb-mg-metro", city_id: "bangalore", spot_type: "metro", name: "MG Road Metro Station", latitude: 12.9756, longitude: 77.6063, is_24x7: true, safe_waiting_score: 84 },
      { id: "fb-indira", city_id: "bangalore", spot_type: "hospital", name: "Indiranagar 100 Feet Road Clinic", latitude: 12.9784, longitude: 77.6408, is_24x7: false, safe_waiting_score: 80 },
      { id: "fb-whitefield", city_id: "bangalore", spot_type: "petrol_pump", name: "Whitefield 24/7 Fuel Station", latitude: 12.9698, longitude: 77.7499, is_24x7: true, safe_waiting_score: 76 },
    ],
  };
  return spots[cityId] ?? [];
}
