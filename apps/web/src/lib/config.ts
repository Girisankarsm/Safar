/** App configuration — demo mode defaults to false (live data). */
export const IS_DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE === "true" || import.meta.env.VITE_DEMO_MODE === "1";

export const ORS_API_KEY = import.meta.env.VITE_OPENROUTESERVICE_API_KEY ?? "";

/** Cache TTLs */
export const OSM_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const ROUTE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const GEOCODE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
export const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
