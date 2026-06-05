"use client";

import { TripLiveMapDynamic } from "@/components/map/map-dynamic";
import { TripMapLegend, TripRecentAlerts } from "@/components/trip/trip-map-panels";
import { TripMetricsRow } from "@/components/trip/trip-metrics-row";
import type { MapFilter } from "@/components/trip/trip-live-map";
import { Button } from "@/components/ui/button";
import { CITIES } from "@/config/cities";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { useCity } from "@/hooks/use-city";
import { useLiveLocation } from "@/hooks/use-live-location";
import { api, type LiveTripUpdate, type SafetyReport, type Trip } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Layers,
  Maximize2,
  Navigation,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const FILTERS: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "cctv", label: "CCTV" },
  { id: "transit", label: "Transit Stops" },
  { id: "incidents", label: "Incidents" },
  { id: "lighting", label: "Lighting" },
  { id: "women", label: "Women Safety" },
];

export default function LiveTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { city } = useCity();
  const cityName = CITIES[city].name;
  const setTripId = useActiveTrip((s) => s.setTripId);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [live, setLive] = useState<LiveTripUpdate | null>(null);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [cctvNodes, setCctvNodes] = useState<{ lat: number; lng: number }[]>([]);
  const [stops, setStops] = useState<
    { lat: number; lng: number; name: string; mode: string; women_only_coach?: boolean; well_lit?: boolean }[]
  >([]);
  const [filter, setFilter] = useState<MapFilter>("all");
  const [layerMode, setLayerMode] = useState<"all" | "heatmap">("all");
  const [toast, setToast] = useState("");
  const { coords } = useLiveLocation(true);

  useEffect(() => {
    if (id) {
      setTripId(id);
      api.getTrip(id).then(setTrip).catch(() => null);
    }
  }, [id, setTripId]);

  useEffect(() => {
    Promise.all([api.cctv(city), api.reports(city), api.transitStops(city)]).then(([c, r, t]) => {
      setCctvNodes(c.nodes ?? []);
      setReports(r.reports);
      const allStops = [
        ...t.metro_stops.map((s) => ({
          ...s,
          mode: "metro",
          well_lit: true,
        })),
        ...t.bus_stops.map((s) => ({
          ...s,
          mode: "bus",
          well_lit: s.night_service,
        })),
      ];
      setStops(allStops);
    });
  }, [city]);

  const pushLocation = useCallback(async () => {
    if (!coords || !id || trip?.status === "completed") return;
    const data = await api.updateTripLocation(id, coords.lat, coords.lng);
    setLive(data);
    setTrip(data.trip);
  }, [coords, id, trip?.status]);

  useEffect(() => {
    pushLocation();
  }, [pushLocation]);

  async function triggerSOS(silent: boolean) {
    await api.sos({ trip_id: id, silent, latitude: coords?.lat, longitude: coords?.lng });
    setToast(silent ? "Silent alert sent" : "SOS active — contacts notified");
  }

  async function checkIn() {
    if (!coords) return;
    await api.checkIn(id, coords.lat, coords.lng, "metro");
    setToast("Check-in verified · +5 GreenMiles");
  }

  async function complete() {
    await api.completeTrip(id);
    setTripId(null);
    router.push(`/trip/${id}/complete`);
  }

  const route = trip?.route;
  const score = live?.safety_score ?? route?.safety_score ?? 70;
  const cctvCount = live?.live_context.cctv_count ?? cctvNodes.length;
  const cctvOnMap = live?.live_context.cctv_nodes ?? cctvNodes;
  const lighting = live?.live_context.lighting ?? "good";
  const progress = route?.legs?.length ? Math.min(88, 18 + cctvCount * 6) : 0;

  const riskCount = useMemo(
    () =>
      reports.filter((r) =>
        ["unsafe_area", "harassment", "dangerous_crossing", "broken_light"].includes(r.report_type)
      ).length,
    [reports]
  );

  if (trip?.status === "completed") {
    router.replace(`/trip/${id}/complete`);
    return null;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#3B82F6]">Live Trip</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            {route ? `${route.source} → ${route.destination}` : `${cityName} Trip Map`}
          </h1>
          <p className="mt-1.5 text-sm text-[#A1A1AA]">
            Live safety insights along your route · CCTV, transit & community
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLayerMode("all")}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition",
              layerMode === "all"
                ? "border-[#3B82F6] bg-[#3B82F6]/15 text-white"
                : "border-[#262626] bg-[#111111] text-[#A1A1AA] hover:text-white"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            All Layers
          </button>
          <button
            type="button"
            onClick={() => setLayerMode("heatmap")}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-xs font-semibold transition",
              layerMode === "heatmap"
                ? "border-[#3B82F6] bg-[#3B82F6]/15 text-white"
                : "border-[#262626] bg-[#111111] text-[#A1A1AA] hover:text-white"
            )}
          >
            Heatmap
          </button>
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#262626] bg-[#111111] text-[#A1A1AA] transition hover:text-white"
            aria-label="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Map section */}
      <div className="relative h-[420px] lg:h-[520px]">
        {/* Filter pills */}
        <div className="absolute left-4 right-4 top-4 z-[1002] flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur-md transition",
                filter === f.id
                  ? "bg-[#3B82F6] text-white"
                  : "border border-[#262626] bg-[#111111]/90 text-[#A1A1AA] hover:text-white"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <TripLiveMapDynamic
          legs={route?.legs}
          currentLat={coords?.lat ?? trip?.current_lat}
          currentLng={coords?.lng ?? trip?.current_lng}
          cctv={cctvOnMap}
          reports={layerMode === "heatmap" || filter === "all" || filter === "incidents" ? reports : []}
          stops={stops}
          safetyScore={score}
          filter={filter}
          height="100%"
        />

        {/* Right panels */}
        <div className="absolute bottom-4 right-4 top-20 z-[1001] hidden w-52 flex-col gap-3 lg:flex">
          <TripMapLegend cctvCount={cctvCount} riskCount={riskCount} stopCount={stops.length} />
          <TripRecentAlerts reports={reports} />
        </div>

        {/* SOS + Check-in */}
        <div className="absolute right-4 top-20 z-[1002] flex flex-col gap-2 lg:top-auto lg:bottom-24">
          <Button
            variant="danger"
            size="lg"
            className="h-12 w-12 rounded-2xl p-0 shadow-2xl"
            onClick={() => triggerSOS(false)}
            aria-label="SOS"
          >
            <AlertTriangle className="h-5 w-5" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="h-11 w-11 rounded-2xl border-[#262626] bg-[#111111]/90 p-0 backdrop-blur-md"
            onClick={checkIn}
            aria-label="Check in"
          >
            <CheckCircle2 className="h-5 w-5 text-[#3B82F6]" />
          </Button>
        </div>

        {/* Re-center */}
        <button
          type="button"
          className="absolute bottom-4 left-4 z-[1002] flex items-center gap-1.5 rounded-xl border border-[#262626] bg-[#111111]/90 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur-md transition hover:border-[#3B82F6]/40"
        >
          <Navigation className="h-3.5 w-3.5 text-[#3B82F6]" />
          Re-center
        </button>
      </div>

      {/* Bottom metrics */}
      <TripMetricsRow route={route} cctvCount={cctvCount} lighting={lighting} safetyScore={score} />

      {/* Trip progress bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-[#262626] bg-[#111111] px-5 py-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex justify-between text-xs text-[#A1A1AA]">
              <span>Trip progress</span>
              <span className="font-semibold text-white">{progress}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#262626]">
              <motion.div
                className="h-full rounded-full bg-[#3B82F6]"
                animate={{ width: `${progress}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 22 }}
              />
            </div>
            <p className="mt-2 text-xs text-[#A1A1AA]">
              ETA <span className="font-semibold text-white">{route?.eta_minutes ?? "—"} min</span>
            </p>
          </div>
          <Button variant="ghost" className="shrink-0 text-[#A1A1AA]" onClick={complete}>
            Complete trip
          </Button>
        </div>
      </motion.div>

      {/* Mobile legend + alerts */}
      <div className="grid gap-3 lg:hidden">
        <TripMapLegend cctvCount={cctvCount} riskCount={riskCount} stopCount={stops.length} />
        <TripRecentAlerts reports={reports} />
      </div>

      {toast && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl bg-[#3B82F6] px-5 py-4 text-center text-sm font-semibold text-white lg:bottom-8"
        >
          {toast}
        </motion.p>
      )}
    </div>
  );
}
