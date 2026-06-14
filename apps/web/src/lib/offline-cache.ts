import type { CityId, PlannedRoute, SafetyReport } from "@/types/database";

const ROUTES_KEY = "safar:offline:routes";
const SAFETY_KEY = "safar:offline:safety";
const META_KEY = "safar:offline:meta";

type OfflineMeta = { savedAt: string; cityId: CityId };

type SafetySnapshot = {
  reports: SafetyReport[];
  savedAt: string;
};

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode */
  }
}

export const offlineCache = {
  saveRoutes(cityId: CityId, routes: PlannedRoute[]) {
    writeJson(ROUTES_KEY, { cityId, routes, savedAt: new Date().toISOString() });
    writeJson(META_KEY, { savedAt: new Date().toISOString(), cityId } satisfies OfflineMeta);
  },

  getRoutes(cityId?: CityId): PlannedRoute[] | null {
    const data = readJson<{ cityId: CityId; routes: PlannedRoute[] }>(ROUTES_KEY);
    if (!data?.routes?.length) return null;
    if (cityId && data.cityId !== cityId) return null;
    return data.routes;
  },

  saveSafetySnapshot(cityId: CityId, reports: SafetyReport[]) {
    writeJson(`${SAFETY_KEY}:${cityId}`, {
      reports: reports.slice(0, 80),
      savedAt: new Date().toISOString(),
    } satisfies SafetySnapshot);
  },

  getSafetySnapshot(cityId: CityId): SafetyReport[] | null {
    const data = readJson<SafetySnapshot>(`${SAFETY_KEY}:${cityId}`);
    return data?.reports ?? null;
  },

  getMeta(): OfflineMeta | null {
    return readJson<OfflineMeta>(META_KEY);
  },

  isStale(maxAgeMs = 7 * 24 * 60 * 60 * 1000): boolean {
    const meta = this.getMeta();
    if (!meta?.savedAt) return true;
    return Date.now() - new Date(meta.savedAt).getTime() > maxAgeMs;
  },
};
