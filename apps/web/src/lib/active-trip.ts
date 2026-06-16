export const ACTIVE_TRIP_KEY = "safar-active-trip";
export const ACTIVE_ROUTE_KEY = "safar-active-route";

export function getStoredActiveTripId(): string | null {
  try {
    return sessionStorage.getItem(ACTIVE_TRIP_KEY);
  } catch {
    return null;
  }
}

export function setStoredActiveTripId(id: string) {
  sessionStorage.setItem(ACTIVE_TRIP_KEY, id);
}

export function clearStoredActiveTrip() {
  sessionStorage.removeItem(ACTIVE_TRIP_KEY);
  sessionStorage.removeItem(ACTIVE_ROUTE_KEY);
}
