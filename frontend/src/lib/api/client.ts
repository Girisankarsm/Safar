const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getMe: () => request<import("@/lib/types").User>("/auth/me"),

  getCities: () =>
    request<{ cities: Array<{ id: string; name: string; cctv_count: number; demo_corridor: string }>; default: string }>("/cities"),

  searchRoutes: (body: {
    source: string;
    destination: string;
    city?: string;
    women_safety_mode?: boolean;
    prefer_night_safe?: boolean;
  }) => request<{ routes: import("@/lib/types").RouteOption[] }>("/routes/search", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  startTrip: (route_id: string) =>
    request<import("@/lib/types").Trip>("/trips/start", {
      method: "POST",
      body: JSON.stringify({ route_id }),
    }),

  updateTripLocation: (tripId: string, latitude: number, longitude: number) =>
    request<{ deviation_alert: boolean }>(`/trips/${tripId}/location`, {
      method: "PATCH",
      body: JSON.stringify({ latitude, longitude }),
    }),

  completeTrip: (tripId: string) =>
    request<{ tokens_earned: number; co2_saved_kg: number; wallet_balance: number; message: string }>(
      `/trips/${tripId}/complete`,
      { method: "POST" }
    ),

  getReports: (city = "chennai") =>
    request<{ reports: import("@/lib/types").SafetyReport[] }>(`/safety/reports?city=${city}`),

  createReport: (body: { report_type: string; description?: string; latitude: number; longitude: number; city?: string }) =>
    request("/safety/reports", { method: "POST", body: JSON.stringify(body) }),

  voteReport: (id: string, vote_type: string) =>
    request(`/safety/reports/${id}/vote`, { method: "POST", body: JSON.stringify({ vote_type }) }),

  getRoadRatings: (city = "chennai") =>
    request<{ segments: Array<{ latitude: number; longitude: number; rating: number; condition: string; color: string }> }>(
      `/roads/ratings?city=${city}`
    ),

  getCctvCameras: (lat: number, lng: number, radius_m = 500) =>
    request<{ cameras: import("@/lib/types").CctvCamera[]; count: number; source: string }>(
      `/safety/cctv?lat=${lat}&lng=${lng}&radius_m=${radius_m}`
    ),

  getCctvMap: (city = "chennai") =>
    request<{ cameras: import("@/lib/types").CctvCamera[]; count: number; source: string }>(
      `/safety/cctv/map?city=${city}`
    ),

  getLocationSafetyContext: (lat: number, lng: number, radius_m = 400, city = "chennai") =>
    request<{
      cctv_count: number;
      cctv_cameras: import("@/lib/types").CctvCamera[];
      safety_score: number;
      safety_label: string;
      safety_breakdown: import("@/lib/types").SafetyFactor[];
      community_reports_nearby: number;
      harassment_reports_nearby: number;
    }>(`/safety/context?lat=${lat}&lng=${lng}&radius_m=${radius_m}&city=${city}`),

  getWallet: () => request<import("@/lib/types").Wallet>("/wallet"),

  getTransactions: () => request<{ transactions: Array<{ id: string; type: string; amount: number; description: string; created_at: string }> }>("/wallet/transactions"),

  redeem: (reward_type: string, tokens: number) =>
    request<{ success: boolean; tokens_spent: number; reward: string; balance: number }>(
      "/wallet/redeem",
      { method: "POST", body: JSON.stringify({ reward_type, tokens }) }
    ),

  getLeaderboard: (type: string) =>
    request<{ entries: import("@/lib/types").LeaderboardEntry[] }>(`/leaderboard?type=${type}`),

  triggerSOS: (body: { trip_id?: string; silent: boolean; latitude: number; longitude: number }) =>
    request("/sos/trigger", { method: "POST", body: JSON.stringify(body) }),

  updateSettings: (body: { women_safety_mode?: boolean; night_safe_preference?: boolean }) =>
    request("/users/settings", { method: "PATCH", body: JSON.stringify(body) }),

  getContacts: () => request<{ contacts: Array<{ id: string; name: string; phone: string; relationship?: string }> }>("/emergency-contacts"),
};
