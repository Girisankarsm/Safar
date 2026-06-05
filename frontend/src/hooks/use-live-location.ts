"use client";

import { useEffect, useRef, useState } from "react";

export interface LivePosition {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
}

export function useLiveLocation(enabled: boolean) {
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device");
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setTracking(true);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 15000 }
    );

    return () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [enabled]);

  return { position, error, tracking };
}
