const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;
    const message =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).join(", ")
          : `API ${res.status}`;
    throw new Error(message || `API ${res.status}`);
  }
  return res.json();
}

async function safeRequest<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    return await request<T>(path, init);
  } catch {
    return fallback;
  }
}

export const api = {
  me: () => request<{ user: User }>("/auth/me"),
  cities: () => request<{ cities: CityMeta[] }>("/cities"),
  searchRoutes: (body: RouteSearch) =>
    request<{ routes: Route[] }>("/routes/search", { method: "POST", body: JSON.stringify(body) }),
  placeSuggestions: (city: string, q: string) =>
    safeRequest<PlaceSuggestResponse>(
      `/routes/suggest?city=${encodeURIComponent(city)}&q=${encodeURIComponent(q)}`,
      { city, query: q, suggestions: [] }
    ),
  getRoute: (id: string) => request<Route>(`/routes/${id}`),
  startTrip: (routeId: string) =>
    request<Trip>("/trips/start", { method: "POST", body: JSON.stringify({ route_id: routeId }) }),
  getTrip: (id: string) => request<Trip>(`/trips/${id}`),
  updateTripLocation: (id: string, lat: number, lng: number) =>
    request<LiveTripUpdate>(`/trips/${id}/location`, {
      method: "PATCH",
      body: JSON.stringify({ latitude: lat, longitude: lng }),
    }),
  checkIn: (id: string, lat: number, lng: number, mode: string) =>
    request(`/trips/${id}/check-in`, {
      method: "POST",
      body: JSON.stringify({ latitude: lat, longitude: lng, mode }),
    }),
  completeTrip: (id: string) => request(`/trips/${id}/complete`, { method: "POST" }),
  safetyContext: (lat: number, lng: number, city: string) =>
    request<LiveContext>(`/safety/context?lat=${lat}&lng=${lng}&city=${city}`),
  cctv: (city: string, lat?: number, lng?: number) => {
    const coords =
      lat != null && lng != null ? `&lat=${lat}&lng=${lng}` : "";
    return safeRequest<CCTVResponse>(`/safety/cctv?city=${city}${coords}`, {
      city,
      count: 0,
      density_score: 0,
      nodes: [],
      source: "openstreetmap_overpass",
    });
  },
  reports: (city: string) =>
    safeRequest<{ reports: SafetyReport[] }>(`/safety/reports?city=${city}`, { reports: [] }),
  createReport: (body: ReportInput) =>
    request("/safety/reports", { method: "POST", body: JSON.stringify(body) }),
  transitStops: (city: string) => request<TransitData>(`/transit/stops?city=${city}`),
  wallet: () => request<Wallet>("/wallet"),
  leaderboard: (city: string) => request<{ entries: LeaderEntry[] }>(`/leaderboard?city=${city}`),
  esg: () => request<ESG>("/esg/dashboard"),
  sos: (body: SOSInput) =>
    request<SOSResult>("/sos/trigger", { method: "POST", body: JSON.stringify(body) }),
  contacts: () => request<{ contacts: Contact[] }>("/sos/contacts"),
};

export type User = {
  id: string;
  name: string;
  email: string;
  college?: string;
  avatar_url?: string;
  women_safety_mode: boolean;
  night_safe_preference: boolean;
  trust_score: number;
  city: string;
  demo?: boolean;
};

export type CityMeta = {
  id: string;
  name: string;
  metro: string;
  default: boolean;
  center: { lat: number; lng: number };
  metro_stops: number;
  cctv_cached: number;
};

export type RouteLeg = {
  mode: string;
  from: string;
  to: string;
  duration_min: number;
  distance_km: number;
  women_only_coach?: boolean;
  well_lit_stop?: boolean;
  night_service?: boolean;
  from_lat?: number;
  from_lng?: number;
  to_lat?: number;
  to_lng?: number;
};

export type Route = {
  id: string;
  route_type: string;
  source: string;
  destination: string;
  source_lat?: number;
  source_lng?: number;
  dest_lat?: number;
  dest_lng?: number;
  legs: RouteLeg[];
  safety_score: number;
  safety_label: string;
  distance_km: number;
  eta_minutes: number;
  carbon_saved_kg: number;
  car_co2_kg?: number;
  reward_tokens: number;
  recommendations: string[];
  city: string;
  night_safe?: boolean;
};

export type RouteSearch = {
  source: string;
  destination: string;
  city: string;
  night_mode?: boolean;
  women_mode?: boolean;
};

export type PlaceSuggestion = {
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  source: "landmark" | "metro" | "bus" | "osm";
};

export type PlaceSuggestResponse = {
  city: string;
  query: string;
  suggestions: PlaceSuggestion[];
};

export type Trip = {
  id: string;
  route_id: string;
  status: string;
  route?: Route;
  share_token?: string;
  current_lat?: number;
  current_lng?: number;
  co2_saved_kg?: number;
  tokens_earned?: number;
};

export type CCTVResponse = {
  city: string;
  count: number;
  radius_count?: number;
  density_score: number;
  nodes: { lat: number; lng: number; distance_m?: number }[];
  source: string;
  coverage_note?: string;
};

export type LiveContext = {
  cctv_count: number;
  cctv_density?: number;
  cctv_nodes?: { lat: number; lng: number }[];
  cctv_source?: string;
  coverage_note?: string;
  crowd_level: string;
  lighting: string;
  community_reports: number;
  live: boolean;
};

export type LiveTripUpdate = {
  trip: Trip;
  live_context: LiveContext;
  safety_score: number;
  safety_label: string;
  carbon_nudge: string;
};

export type SafetyReport = {
  id: string;
  report_type: string;
  description?: string;
  latitude: number;
  longitude: number;
  created_at?: string;
};

export type ReportInput = {
  report_type: string;
  description?: string;
  latitude: number;
  longitude: number;
  city: string;
};

export type TransitData = {
  metro_stops: { id: string; name: string; lat: number; lng: number; women_only_coach?: boolean }[];
  bus_stops: { id: string; name: string; lat: number; lng: number; night_service?: boolean }[];
};

export type Wallet = {
  balance: number;
  lifetime_tokens: number;
  lifetime_co2_kg: number;
  green_trips_count: number;
  transactions: { type: string; amount: number; description: string; created_at: string }[];
};

export type LeaderEntry = {
  entity_type: string;
  entity_name: string;
  carbon_saved_kg: number;
  tokens_earned: number;
  green_trips: number;
  rank: number;
};

export type ESG = {
  total_co2_saved_kg: number;
  total_green_trips: number;
  top_college?: LeaderEntry;
  top_company?: LeaderEntry;
  employee_participation_pct: number;
  monthly_trend: number[];
};

export type SOSInput = {
  trip_id?: string;
  silent?: boolean;
  latitude?: number;
  longitude?: number;
};

export type Contact = { name: string; phone: string; relationship?: string };

export type SOSResult = {
  alert_id: string;
  notified: number;
  total_contacts: number;
  share_url?: string;
  twilio_enabled: boolean;
};
