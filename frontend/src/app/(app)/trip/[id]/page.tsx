"use client";

import { motion } from "framer-motion";
import { TripMapDynamic } from "@/components/map/map-dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { useLiveLocation } from "@/hooks/use-live-location";
import { api, type Contact, type LiveTripUpdate, type Trip } from "@/lib/api";
import { AlertTriangle, CheckCircle2, Share2, Shield } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function LiveTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const setTripId = useActiveTrip((s) => s.setTripId);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [live, setLive] = useState<LiveTripUpdate | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [toast, setToast] = useState("");
  const { coords } = useLiveLocation(true);

  useEffect(() => {
    if (id) {
      setTripId(id);
      api.getTrip(id).then(setTrip).catch(() => null);
      api.contacts().then((r) => setContacts(r.contacts));
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
    const res = await api.sos({
      trip_id: id,
      silent,
      latitude: coords?.lat,
      longitude: coords?.lng,
    });
    setToast(
      silent
        ? `Silent alert sent to ${res.notified} contact(s)`
        : `SOS active — location shared with contacts`
    );
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

  if (trip?.status === "completed") {
    router.replace(`/trip/${id}/complete`);
    return null;
  }

  return (
    <div className="mx-auto max-w-lg pb-10">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-5"
      >
        <p className="text-[10px] font-medium uppercase tracking-widest text-[#a1a1aa]">Live trip</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white">
          {route ? `${route.source} → ${route.destination}` : "Loading…"}
        </h1>
      </motion.div>

      <TripMapDynamic
        legs={route?.legs}
        currentLat={coords?.lat ?? trip?.current_lat}
        currentLng={coords?.lng ?? trip?.current_lng}
        cctv={live?.live_context.cctv_nodes ?? []}
        safetyScore={score}
        height="380px"
      />

      <div className="mt-6">
        <div className="flex justify-between text-xs text-[#a1a1aa]">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#222222]">
          <motion.div
            className="h-full bg-white"
            animate={{ width: `${progress}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 22 }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Card className="!p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">CCTV nearby</p>
          <p className="mt-2 text-3xl font-semibold text-[#22c55e]">
            {live?.live_context.cctv_count ?? "—"}
          </p>
        </Card>
        <Card className="!p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#a1a1aa]">Community</p>
          <p className="mt-2 text-3xl font-semibold text-white">
            {live?.live_context.community_reports ?? 0}
          </p>
          <p className="text-xs text-[#a1a1aa]">reports nearby</p>
        </Card>
      </div>

      <div className="mt-8 flex gap-3">
        <Button variant="danger" className="flex-1" size="lg" onClick={() => triggerSOS(false)}>
          <AlertTriangle className="h-5 w-5" /> SOS
        </Button>
        <Button variant="outline" size="lg" onClick={() => triggerSOS(true)}>
          Silent
        </Button>
        <Button variant="secondary" size="lg" onClick={checkIn}>
          <CheckCircle2 className="h-5 w-5" />
        </Button>
      </div>

      <Card className="mt-4 !p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Shield className="h-4 w-4" /> Emergency contacts
        </div>
        <ul className="mt-4 space-y-3">
          {contacts.map((c) => (
            <li key={c.phone} className="flex justify-between text-sm text-[#a1a1aa]">
              <span>{c.name}</span>
              <span>{c.relationship}</span>
            </li>
          ))}
        </ul>
        {trip?.share_token && (
          <button
            type="button"
            className="mt-4 flex items-center gap-2 text-xs text-[#a1a1aa] transition hover:text-white"
            onClick={() => {
              navigator.clipboard?.writeText(
                `${window.location.origin}/trip/share/${trip.share_token}`
              );
              setToast("Share link copied");
            }}
          >
            <Share2 className="h-3.5 w-3.5" /> Share live trip
          </button>
        )}
      </Card>

      <Button variant="ghost" className="mt-8 w-full" onClick={complete}>
        Complete trip
      </Button>

      {toast && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl bg-white px-5 py-4 text-center text-sm font-medium text-black md:bottom-8"
        >
          {toast}
        </motion.p>
      )}
    </div>
  );
}
