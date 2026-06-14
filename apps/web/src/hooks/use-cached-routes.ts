import { recommendRoute } from "@/lib/ai-insights";
import { useCityStore } from "@/stores/city.store";
import type { PlannedRoute } from "@/types/database";
import { useEffect, useMemo, useState } from "react";

export type CachedSearch = {
  source: string;
  destination: string;
  departureHour?: number;
};

export function useCachedRoutes(options?: {
  womenSafetyMode?: boolean;
  nightSafePreference?: boolean;
}) {
  const { city } = useCityStore();
  const [routes, setRoutes] = useState<PlannedRoute[]>([]);
  const [search, setSearch] = useState<CachedSearch | null>(null);
  const [selected, setSelected] = useState<PlannedRoute | null>(null);

  useEffect(() => {
    const cachedCity = sessionStorage.getItem("safar-routes-city");
    const cached = sessionStorage.getItem("safar-routes");
    const s = sessionStorage.getItem("safar-search");

    if (!cached || cachedCity !== city) {
      setRoutes([]);
      setSelected(null);
      setSearch(null);
      return;
    }

    const parsed = JSON.parse(cached) as PlannedRoute[];
    setRoutes(parsed);
    const rec = recommendRoute(parsed, {
      womenSafetyMode: options?.womenSafetyMode,
      nightSafePreference: options?.nightSafePreference,
    });
    setSelected(rec?.route ?? parsed[0] ?? null);
    if (s) setSearch(JSON.parse(s));
  }, [city, options?.womenSafetyMode, options?.nightSafePreference]);

  const recommendation = useMemo(
    () =>
      routes.length
        ? recommendRoute(routes, {
            womenSafetyMode: options?.womenSafetyMode,
            nightSafePreference: options?.nightSafePreference,
          })
        : null,
    [routes, options?.womenSafetyMode, options?.nightSafePreference]
  );

  return { routes, search, selected, setSelected, recommendation };
}
