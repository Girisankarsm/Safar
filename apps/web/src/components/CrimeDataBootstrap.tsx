import { startCrimeDataSync, stopCrimeDataSync } from "@/services/crime-sync.service";
import { useEffect } from "react";

/** Keeps NCRB crime scores in Supabase fresh while the app is running. */
export function CrimeDataBootstrap() {
  useEffect(() => {
    startCrimeDataSync();
    return () => stopCrimeDataSync();
  }, []);
  return null;
}
