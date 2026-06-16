/** App configuration — demo mode defaults to false (live data). */
export const IS_DEMO_MODE =
  import.meta.env.VITE_DEMO_MODE === "true" || import.meta.env.VITE_DEMO_MODE === "1";

/** @deprecated ORS key exposed client-side only as a dev fallback. Production uses the ors-proxy Edge Function. */
export const ORS_API_KEY = import.meta.env.VITE_OPENROUTESERVICE_API_KEY ?? "";

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";

/**
 * Edge Function proxy URL for ORS routing.
 * When deployed this keeps the ORS API key server-side.
 * Falls back to direct ORS calls in local dev if VITE_OPENROUTESERVICE_API_KEY is set.
 */
export const ORS_PROXY_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/ors-proxy`
  : "";

/**
 * Edge Function proxy URL for Overpass (OSM).
 * Routes Overpass queries through the server to avoid CORS and rate-limit centrally.
 */
export const OVERPASS_PROXY_URL = SUPABASE_URL
  ? `${SUPABASE_URL}/functions/v1/overpass-proxy`
  : "https://overpass-api.de/api/interpreter";

/** Cache TTLs */
export const OSM_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const ROUTE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
export const GEOCODE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
export const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

/** Safar pitch / demo deck (Google Slides) */
export const PRESENTATION_DECK_URL =
  "https://docs.google.com/presentation/d/1XY18c7GKHgzhzwkFZOJvO7xIkPqXmeHL/edit?usp=sharing";
