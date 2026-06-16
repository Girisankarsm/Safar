import { getStoredActiveTripId } from "@/lib/active-trip";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

/** Trip nav href — uses stored active trip id so returning to Trip keeps the session. */
export function useActiveTripHref(): string {
  const path = useLocation().pathname;
  const [tripId, setTripId] = useState(getStoredActiveTripId);

  useEffect(() => {
    setTripId(getStoredActiveTripId());
  }, [path]);

  return tripId ? `/trip/${tripId}` : "/trip";
}
