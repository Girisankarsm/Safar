import { supabase } from "@/lib/supabase/client";
import { crimeService } from "@/services/supabase/crime.service";
import { reportsService } from "@/services/supabase/reports.service";

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours while app is open
const STORAGE_KEY = "safar:crime-sync:last";

let started = false;
let timer: ReturnType<typeof setInterval> | null = null;

function shouldRefresh(): boolean {
  try {
    const last = Number(localStorage.getItem(STORAGE_KEY) ?? 0);
    return !last || Date.now() - last > REFRESH_INTERVAL_MS;
  } catch {
    return true;
  }
}

async function refreshFromRpc(): Promise<boolean> {
  const { data, error } = await supabase.rpc("refresh_ncrb_crime_seed");
  if (error) {
    if (import.meta.env.DEV) {
      console.warn(
        "[Safar] NCRB auto-sync skipped:",
        error.message,
        "— run supabase/migrations/20240615000008_crime_seed_rpc.sql in SQL Editor."
      );
    }
    return false;
  }
  const result = data as { ok?: boolean; error?: string } | null;
  if (result?.ok === false) {
    if (import.meta.env.DEV) console.warn("[Safar] NCRB seed RPC:", result.error);
    return false;
  }
  crimeService.clearCache();
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* private mode */
  }
  if (import.meta.env.DEV) {
    console.info("[Safar] NCRB crime data synced to Supabase.", result);
  }
  return true;
}

async function ensureCrimeData() {
  void reportsService.expireOld();
  const scores = await crimeService.listCityScores();
  const hasAllCities =
    scores.length >= 4 && scores.every((s) => !s.id.startsWith("fallback-"));

  if (!hasAllCities || shouldRefresh()) {
    await refreshFromRpc();
  }
}

/** Start background NCRB sync — runs on app boot and every 6h while tab is open. */
export function startCrimeDataSync() {
  if (started) return;
  started = true;

  void ensureCrimeData();

  timer = setInterval(() => {
    void ensureCrimeData();
  }, REFRESH_INTERVAL_MS);
}

export function stopCrimeDataSync() {
  if (timer) clearInterval(timer);
  timer = null;
  started = false;
}
