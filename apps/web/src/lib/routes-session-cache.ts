import type { PlannedRoute } from "@/types/database";

/** Bump when route selection logic changes — clears stale sessionStorage routes. */
export const ROUTES_CACHE_VERSION = "v3";

export function saveRoutesSession(city: string, routes: PlannedRoute[]) {
  sessionStorage.setItem("safar-routes-version", ROUTES_CACHE_VERSION);
  sessionStorage.setItem("safar-routes-city", city);
  sessionStorage.setItem("safar-routes", JSON.stringify(routes));
}

export function loadRoutesSession(city: string): PlannedRoute[] | null {
  if (sessionStorage.getItem("safar-routes-version") !== ROUTES_CACHE_VERSION) {
    return null;
  }
  if (sessionStorage.getItem("safar-routes-city") !== city) {
    return null;
  }
  const raw = sessionStorage.getItem("safar-routes");
  if (!raw) return null;

  try {
    const routes = JSON.parse(raw) as PlannedRoute[];
    if (!Array.isArray(routes) || !routes.length) return null;
    if (!isValidRouteSet(routes)) return null;
    return routes;
  } catch {
    return null;
  }
}

/** Reject legacy/corrupt sets where cheapest is an absurd detour vs balanced. */
function isValidRouteSet(routes: PlannedRoute[]): boolean {
  const balanced = routes.find((r) => r.route_type === "balanced");
  const cheapest = routes.find((r) => r.route_type === "cheapest");
  if (!balanced || !cheapest) return true;
  const maxOk = balanced.distance_km * 1.15 + 0.3;
  return cheapest.distance_km <= maxOk;
}
