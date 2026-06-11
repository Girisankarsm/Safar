import { supabase } from "@/lib/supabase/client";
import type { CityId, PlannedRoute, RouteType, SafetyBreakdownItem } from "@/types/database";

const ORS_KEY = import.meta.env.VITE_OPENROUTESERVICE_API_KEY;

const CITY_CENTERS: Record<CityId, { lat: number; lng: number }> = {
  chennai: { lat: 13.0827, lng: 80.2707 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
};

const LANDMARKS: Record<CityId, Record<string, { lat: number; lng: number; name: string }>> = {
  chennai: {
    "t nagar": { lat: 13.0418, lng: 80.2341, name: "T Nagar" },
    "chennai central": { lat: 13.0827, lng: 80.2751, name: "Chennai Central" },
    "anna nagar": { lat: 13.0896, lng: 80.2209, name: "Anna Nagar" },
    airport: { lat: 12.9941, lng: 80.1709, name: "Chennai Airport" },
    guindy: { lat: 13.0067, lng: 80.2206, name: "Guindy" },
  },
  trivandrum: {
    technopark: { lat: 8.5241, lng: 76.9366, name: "Technopark" },
    palayam: { lat: 8.5099, lng: 76.9655, name: "Palayam" },
    "central station": { lat: 8.5036, lng: 76.9498, name: "Central Station" },
  },
  bangalore: {
    "mg road": { lat: 12.9756, lng: 77.6063, name: "MG Road" },
    indiranagar: { lat: 12.9784, lng: 77.6408, name: "Indiranagar" },
    koramangala: { lat: 12.9349, lng: 77.6090, name: "Koramangala" },
    whitefield: { lat: 12.9698, lng: 77.7499, name: "Whitefield" },
    airport: { lat: 13.1986, lng: 77.7066, name: "Bengaluru Airport" },
  },
};

function resolvePlace(query: string, cityId: CityId) {
  const key = query.trim().toLowerCase();
  const landmarks = LANDMARKS[cityId] ?? {};
  if (landmarks[key]) return landmarks[key];
  for (const [k, v] of Object.entries(landmarks)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return { ...CITY_CENTERS[cityId], name: query };
}

function scoreRoute(
  distanceKm: number,
  durationMin: number,
  routeType: RouteType,
  reportsNear: number
): { score: number; breakdown: SafetyBreakdownItem[] } {
  const community = Math.max(20, 100 - reportsNear * 10);
  const popularity = Math.min(95, 55 + distanceKm * 2);
  const police = 65;
  const transit = 70;
  const timeRisk = new Date().getHours() >= 22 ? 55 : 85;

  let weighted =
    community * 0.35 + popularity * 0.25 + police * 0.2 + transit * 0.1 + timeRisk * 0.1;

  if (routeType === "safest") weighted += 8;
  if (routeType === "women_friendly") weighted += 10;
  if (routeType === "cheapest") weighted -= 5;

  const score = Math.max(15, Math.min(98, Math.round(weighted)));
  return {
    score,
    breakdown: [
      { factor: "Community Safety Rating", weight_pct: 35, score: community, contribution: Math.round(community * 0.35) },
      { factor: "Route Popularity", weight_pct: 25, score: popularity, contribution: Math.round(popularity * 0.25) },
      { factor: "Police Station Proximity", weight_pct: 20, score: police, contribution: Math.round(police * 0.2) },
      { factor: "Public Transport Activity", weight_pct: 10, score: transit, contribution: Math.round(transit * 0.1) },
      { factor: "Time-of-Day Risk", weight_pct: 10, score: timeRisk, contribution: Math.round(timeRisk * 0.1) },
    ],
  };
}

async function fetchORSRoute(
  start: [number, number],
  end: [number, number],
  preference: string
): Promise<{ distance: number; duration: number; geometry: GeoJSON.LineString } | null> {
  if (!ORS_KEY) return null;
  try {
    const res = await fetch(
      `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
      {
        method: "POST",
        headers: {
          Authorization: ORS_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates: [start, end],
          preference,
          units: "km",
        }),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const feature = json.features?.[0];
    if (!feature) return null;
    return {
      distance: feature.properties.summary.distance,
      duration: feature.properties.summary.duration / 60,
      geometry: feature.geometry,
    };
  } catch {
    return null;
  }
}

function estimateFallback(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
  const dLat = end.lat - start.lat;
  const dLng = end.lng - start.lng;
  const km = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
  return { distance: km, duration: km * 3.5 };
}

export const routesService = {
  resolvePlace,

  async searchRoutes(
    source: string,
    destination: string,
    cityId: CityId,
    reportsNear = 0
  ): Promise<PlannedRoute[]> {
    const src = resolvePlace(source, cityId);
    const dst = resolvePlace(destination, cityId);
    const start: [number, number] = [src.lng, src.lat];
    const end: [number, number] = [dst.lng, dst.lat];

    const variants: { type: RouteType; preference: string; costMul: number }[] = [
      { type: "balanced", preference: "recommended", costMul: 1 },
      { type: "safest", preference: "recommended", costMul: 1.1 },
      { type: "cheapest", preference: "shortest", costMul: 0.7 },
      { type: "women_friendly", preference: "recommended", costMul: 1.05 },
    ];

    const routes: PlannedRoute[] = [];

    for (const v of variants) {
      const ors = await fetchORSRoute(start, end, v.preference);
      const fb = estimateFallback(src, dst);
      const distance_km = Math.round((ors?.distance ?? fb.distance) * 100) / 100;
      const eta_minutes = Math.round(ors?.duration ?? fb.duration);
      const { score, breakdown } = scoreRoute(distance_km, eta_minutes, v.type, reportsNear);

      const baseCost = Math.max(15, Math.round(25 + distance_km * 8 * v.costMul));
      const walkKm = v.type === "safest" ? distance_km * 0.08 : distance_km * 0.15;

      routes.push({
        route_type: v.type,
        source_name: src.name,
        destination_name: dst.name,
        source_lat: src.lat,
        source_lng: src.lng,
        dest_lat: dst.lat,
        dest_lng: dst.lng,
        legs: [
          {
            mode: v.type === "cheapest" ? "bus" : "metro",
            from: src.name,
            to: dst.name,
            duration_min: eta_minutes,
            distance_km,
          },
        ],
        safety_score: score,
        safety_breakdown: breakdown,
        distance_km,
        eta_minutes,
        estimated_cost_inr: baseCost,
        reliability_score: Math.min(98, 70 + Math.round(score / 5)),
        crowd_level: eta_minutes < 30 ? "High" : "Moderate",
        walking_distance_km: Math.round(walkKm * 100) / 100,
        transfer_count: v.type === "cheapest" ? 1 : 0,
        geometry: ors?.geometry,
        recommendations: [
          score >= 70 ? "Well-traveled corridor" : "Share live trip with contacts",
          v.type === "women_friendly" ? "Active roads with public visibility" : "Metro preferred after 10 PM",
        ],
      });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      for (const r of routes) {
        await supabase.from("routes").insert({
          user_id: user.id,
          city_id: cityId,
          route_type: r.route_type,
          source_name: r.source_name,
          destination_name: r.destination_name,
          source_lat: r.source_lat,
          source_lng: r.source_lng,
          dest_lat: r.dest_lat,
          dest_lng: r.dest_lng,
          legs: r.legs,
          safety_score: r.safety_score,
          safety_breakdown: r.safety_breakdown,
          distance_km: r.distance_km,
          eta_minutes: r.eta_minutes,
          estimated_cost_inr: r.estimated_cost_inr,
          reliability_score: r.reliability_score,
          crowd_level: r.crowd_level,
          walking_distance_km: r.walking_distance_km,
          transfer_count: r.transfer_count,
          geometry: r.geometry,
        });
      }
    }

    return routes;
  },
};
