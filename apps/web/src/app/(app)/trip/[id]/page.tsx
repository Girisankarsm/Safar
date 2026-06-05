"use client";

import { TripLiveMapDynamic } from "@/components/map/map-dynamic";
import { TripMapLegend, TripRecentAlerts } from "@/components/trip/trip-map-panels";
import { TripMetricsRow } from "@/components/trip/trip-metrics-row";
import type { MapFilter } from "@/components/trip/trip-live-map";
import { Button, ButtonLink } from "@/components/ui/button";
import { CITIES } from "@/config/cities";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { useCity } from "@/hooks/use-city";
import { useLiveLocation } from "@/hooks/use-live-location";
import { api, type LiveTripUpdate, type SafetyReport, type Trip } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Navigation } from "lucide-react";
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
  const [toast, setToast] = useState("");
  const [tripError, setTripError] = useState<string | null>(null);
  const [tripLoaded, setTripLoaded] = useState(false);
  const [recenterKey, setRecenterKey] = useState(0);
  const { coords } = useLiveLocation(true);

  useEffect(() => {
    if (!id) return;
    setTripId(id);
    setTripError(null);
    setTripLoaded(false);
    api
      .getTrip(id)
      .then((data) => {
        setTrip(data);
        setTripError(null);
      })
      .catch(() => {
        setTrip(null);
        setTripError("This trip is no longer active. Start a new one from Routes.");
        setTripId(null);
      })
      .finally(() => setTripLoaded(true));
  }, [id, setTripId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const r = await api.reports(city);
      if (!alive) return;
      setReports(r.reports);

      try {
        const t = await api.transitStops(city);
        if (!alive) return;
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
      } catch {
        setStops([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [city]);

  useEffect(() => {
    if (!trip?.route) return;
    const route = trip.route;
    const lat = route.source_lat ?? route.legs?.[0]?.from_lat ?? CITIES[city].center.lat;
    const lng = route.source_lng ?? route.legs?.[0]?.from_lng ?? CITIES[city].center.lng;
    api.cctv(city, lat, lng).then((c) => setCctvNodes(c.nodes ?? []));
  }, [trip?.route, city]);

  const pushLocation = useCallback(async () => {
    if (!coords || !id || !trip || trip.status !== "active") return;
    try {
      const data = await api.updateTripLocation(id, coords.lat, coords.lng);
      setLive(data);
      setTrip(data.trip);
    } catch {
      // Stale trip IDs or completed trips should not crash the page.
    }
  }, [coords, id, trip]);

  useEffect(() => {
    pushLocation();
  }, [pushLocation]);

  async function triggerSOS(silent: boolean) {
    try {
      await api.sos({ trip_id: id, silent, latitude: coords?.lat, longitude: coords?.lng });
      setToast(silent ? "Silent alert sent" : "SOS active — contacts notified");
    } catch {
      setToast("Could not send SOS — try again");
    }
  }

  async function checkIn() {
    if (!coords) return;
    try {
      await api.checkIn(id, coords.lat, coords.lng, "metro");
      setToast("Check-in verified · +5 GreenMiles");
    } catch {
      setToast("Check-in failed — trip may have ended");
    }
  }

  async function complete() {
    try {
      await api.completeTrip(id);
      setTripId(null);
      router.push(`/trip/${id}/complete`);
    } catch {
      setToast("Could not complete trip — refresh and try again");
    }
  }

  const route = trip?.route;
  const cityCenter = CITIES[city].center;
  const routeStart = useMemo(() => {
    const firstLeg = route?.legs?.[0];
    if (firstLeg?.from_lat != null && firstLeg?.from_lng != null) {
      return { lat: firstLeg.from_lat, lng: firstLeg.from_lng };
    }
    if (route?.source_lat != null && route?.source_lng != null) {
      return { lat: route.source_lat, lng: route.source_lng };
    }
    if (trip?.current_lat != null && trip?.current_lng != null) {
      return { lat: trip.current_lat, lng: trip.current_lng };
    }
    return cityCenter;
  }, [route, trip, cityCenter]);

  const mapPosition = useMemo(() => {
    if (coords && distanceKm(coords.lat, coords.lng, cityCenter.lat, cityCenter.lng) <= 40) {
      return coords;
    }
    return routeStart;
  }, [coords, cityCenter, routeStart]);

  const score = live?.safety_score ?? route?.safety_score ?? 70;
  const cctvCount = live?.live_context.cctv_count ?? cctvNodes.length;
  const cctvDensity = live?.live_context.cctv_density;
  const cctvOnMap =
    live?.live_context.cctv_nodes?.length ? live.live_context.cctv_nodes : cctvNodes;
  const lighting = live?.live_context.lighting ?? "moderate";
  const progress = route?.eta_minutes
    ? Math.min(90, 12 + (live ? 18 : 0) + Math.min(40, cctvCount * 2))
    : 0;

  const riskCount = useMemo(
    () =>
      reports.filter((r) =>
        ["unsafe_area", "harassment", "dangerous_crossing", "broken_light"].includes(r.report_type)
      ).length,
    [reports]
  );

  if (tripLoaded && trip?.status === "completed") {
    router.replace(`/trip/${id}/complete`);
    return null;
  }

  if (tripLoaded && tripError) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-20 text-center">
        <h1 className="text-2xl font-bold text-white">Trip not found</h1>
        <p className="mt-3 text-sm text-[#A1A1AA]">{tripError}</p>
        <ButtonLink href="/routes" className="mt-8" size="lg">
          Go to Routes
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6]">Live trip</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
            {route ? `${route.source} → ${route.destination}` : "Loading route…"}
          </h1>
          <p className="mt-1.5 text-sm text-[#A1A1AA]">
            {cityName} · Mapbox · OSM Overpass CCTV · GTFS transit
          </p>
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
          currentLat={mapPosition.lat}
          currentLng={mapPosition.lng}
          cctv={cctvOnMap}
          reports={filter === "all" || filter === "incidents" ? reports : []}
          stops={stops}
          safetyScore={score}
          filter={filter}
          height="100%"
          recenterKey={recenterKey}
        />

        {/* Right panels */}
        <div className="pointer-events-none absolute bottom-4 right-4 top-20 z-[1001] hidden w-52 flex-col gap-3 lg:flex [&>*]:pointer-events-auto">
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
          onClick={() => setRecenterKey((k) => k + 1)}
          className="absolute bottom-4 left-4 z-[1002] flex items-center gap-1.5 rounded-xl border border-[#262626] bg-[#111111]/90 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur-md transition hover:border-[#3B82F6]/40"
        >
          <Navigation className="h-3.5 w-3.5 text-[#3B82F6]" />
          Re-center
        </button>
      </div>

      {/* Bottom metrics */}
      <TripMetricsRow
        route={route}
        cctvCount={cctvCount}
        cctvDensity={cctvDensity}
        lighting={lighting}
        safetyScore={score}
      />

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
      <div className="pointer-events-none grid gap-3 lg:hidden [&>*]:pointer-events-auto">
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

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}
