"use client";

import { motion } from "framer-motion";
import { TripMapDynamic } from "@/components/map/map-dynamic";
import { Button } from "@/components/ui/button";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { useLiveLocation } from "@/hooks/use-live-location";
import { whyThisRoute, safetyTier } from "@/lib/safety-copy";
import { api, type LiveTripUpdate, type Trip } from "@/lib/api";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function LiveTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const setTripId = useActiveTrip((s) => s.setTripId);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [live, setLive] = useState<LiveTripUpdate | null>(null);
  const [toast, setToast] = useState("");
  const { coords } = useLiveLocation(true);

  useEffect(() => {
    if (id) {
      setTripId(id);
      api.getTrip(id).then(setTrip).catch(() => null);
    }
  }, [id, setTripId]);

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
  const progress = route?.legs?.length ? Math.min(88, 18 + (live?.live_context.cctv_count ?? 0) * 6) : 0;
  const reasons = route ? whyThisRoute(route).slice(0, 2) : [];

  if (trip?.status === "completed") {
    router.replace(`/trip/${id}/complete`);
    return null;
  }

  return (
    <div className="relative flex h-[calc(100dvh-4.5rem)] flex-col lg:h-[calc(100dvh-2rem)]">
      {/* Full-screen map */}
      <div className="relative min-h-0 flex-1">
        <TripMapDynamic
          legs={route?.legs}
          currentLat={coords?.lat ?? trip?.current_lat}
          currentLng={coords?.lng ?? trip?.current_lng}
          cctv={live?.live_context.cctv_nodes ?? []}
          safetyScore={score}
          height="100%"
        />

        {/* Floating controls */}
        <div className="absolute right-4 top-4 z-[1001] flex flex-col gap-3">
          <Button
            variant="danger"
            size="lg"
            className="h-14 w-14 rounded-2xl p-0 shadow-2xl"
            onClick={() => triggerSOS(false)}
            aria-label="SOS"
          >
            <AlertTriangle className="h-6 w-6" />
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="h-12 w-12 rounded-2xl border-[#262626] bg-[#111111]/90 p-0 backdrop-blur-md"
            onClick={checkIn}
            aria-label="Check in"
          >
            <CheckCircle2 className="h-5 w-5 text-[#3B82F6]" />
          </Button>
        </div>
      </div>

      {/* Bottom sheet */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="relative z-10 -mt-6 rounded-t-3xl border border-b-0 border-[#262626] bg-[#111111] px-6 pb-8 pt-6 shadow-[0_-8px_40px_rgba(0,0,0,0.5)]"
      >
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-[#262626]" />

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#3B82F6]">Live trip</p>
            <h1 className="mt-1 text-xl font-bold text-white">
              {route ? `${route.source} → ${route.destination}` : "Loading…"}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">ETA</p>
            <p className="text-2xl font-bold text-white">{route?.eta_minutes ?? "—"} min</p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-[#A1A1AA]">
            <span>Trip progress</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#262626]">
            <motion.div
              className="h-full rounded-full bg-[#3B82F6]"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            />
          </div>
        </div>

        {/* Safety explanation */}
        <div className="mt-5 rounded-2xl border border-[#262626] bg-[#171717] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">Safety status</p>
          <p className="mt-2 text-lg font-bold text-white">
            {safetyTier(score)} · Score {score}
          </p>
          <p className="mt-1 text-sm text-[#A1A1AA]">
            {live?.live_context.cctv_count ?? 0} CCTV nearby · {live?.live_context.lighting ?? "monitoring"} lighting
          </p>
          {reasons.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-[#A1A1AA]">
              {reasons.map((r) => (
                <li key={r}>· {r}</li>
              ))}
            </ul>
          )}
        </div>

        <Button variant="ghost" className="mt-5 w-full text-[#A1A1AA]" onClick={complete}>
          Complete trip & earn GreenMiles
        </Button>
      </motion.div>

      {toast && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-32 left-4 right-4 z-50 rounded-2xl bg-[#3B82F6] px-5 py-4 text-center text-sm font-semibold text-white lg:bottom-8"
        >
          {toast}
        </motion.p>
      )}
    </div>
  );
}
