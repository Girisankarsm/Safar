"use client";

import { useCallback, useEffect, useState } from "react";

export function useLiveLocation(enabled = true) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!enabled || !navigator.geolocation) {
      setError("Geolocation unavailable");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => setError(e.message),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const id = setInterval(refresh, 8000);
    return () => clearInterval(id);
  }, [enabled, refresh]);

  return { coords, error, refresh };
}
