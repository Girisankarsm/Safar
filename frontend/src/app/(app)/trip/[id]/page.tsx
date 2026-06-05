"use client";

import { motion } from "framer-motion";
import { TripMapDynamic } from "@/components/map/map-dynamic";
import { SafetyScore } from "@/components/safety/safety-score";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { useLiveLocation } from "@/hooks/use-live-location";
import { api, type Contact, type LiveTripUpdate, type Trip } from "@/lib/api";
import {
  AlertTriangle,
  CheckCircle2,
  Phone,
  Share2,
  Shield,
} from "lucide-react";
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
    const result = await api.completeTrip(id);
    setTripId(null);
    router.push(`/trip/${id}/complete`);
  }

  const route = trip?.route;
  const progress = route?.legs?.length ? Math.min(85, 20 + (live?.live_context.cctv_count ?? 0) * 5) : 0;

  if (trip?.status === "completed") {
    router.replace(`/trip/${id}/complete`);
    return null;
  }

  return (
    <div className="mx-auto max-w-lg pb-8">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-[#a1a1aa]">Live trip</p>
          <h1 className="mt-1 text-xl font-semibold text-white">
            {route ? `${route.source} → ${route.destination}` : "Loading…"}
          </h1>
        </div>
        {live && <SafetyScore score={live.safety_score} size="md" showLabel />}
      </div>

      {/* Map — hero */}
      <TripMapDynamic
        legs={route?.legs}
        currentLat={coords?.lat ?? trip?.current_lat}
        currentLng={coords?.lng ?? trip?.current_lng}
        cctv={live?.live_context.cctv_nodes ?? []}
        height="340px"
      />

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-[#a1a1aa]">
          <span>Route progress</span>
          <span>{progress}%</span>
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[#222222]">
          <motion.div
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      {/* Live stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Card className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">Nearby CCTV</p>
          <p className="mt-1 text-2xl font-semibold text-[#22c55e]">
            {live?.live_context.cctv_count ?? "—"}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">Lighting</p>
          <p className="mt-1 text-sm font-medium capitalize text-white">
            {live?.live_context.lighting?.replace("_", " ") ?? "—"}
          </p>
        </Card>
      </div>

      {live?.carbon_nudge && (
        <p className="mt-4 rounded-xl border border-[#222222] bg-[#111111] px-4 py-3 text-sm text-[#a1a1aa]">
          {live.carbon_nudge}
        </p>
      )}

      {/* Floating SOS */}
      <div className="mt-6 flex gap-3">
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

      {/* Emergency contacts */}
      <Card className="mt-4 !p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Shield className="h-4 w-4" /> Emergency contacts
        </div>
        <ul className="mt-3 space-y-2">
          {contacts.map((c) => (
            <li key={c.phone} className="flex items-center justify-between text-sm">
              <span className="text-[#a1a1aa]">
                {c.name} · {c.relationship}
              </span>
              <Phone className="h-3.5 w-3.5 text-[#a1a1aa]" />
            </li>
          ))}
        </ul>
        {trip?.share_token && (
          <button
            type="button"
            className="mt-3 flex items-center gap-2 text-xs text-[#a1a1aa] hover:text-white"
            onClick={() => {
              const url = `${window.location.origin}/trip/share/${trip.share_token}`;
              navigator.clipboard?.writeText(url);
              setToast("Share link copied");
            }}
          >
            <Share2 className="h-3.5 w-3.5" /> Copy trip share link
          </button>
        )}
      </Card>

      <Button variant="ghost" className="mt-6 w-full" onClick={complete}>
        End trip & earn GreenMiles
      </Button>

      {toast && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-4 right-4 rounded-xl bg-white px-4 py-3 text-center text-sm font-medium text-black md:bottom-8"
        >
          {toast}
        </motion.p>
      )}
    </div>
  );
}
