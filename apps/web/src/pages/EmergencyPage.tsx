import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { getCityConfig } from "@/config/cities";
import { IS_DEMO_MODE } from "@/lib/config";
import { contactsService } from "@/services/supabase/contacts.service";
import { placesService } from "@/services/supabase/places.service";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { SafeWaitingSpot } from "@/types/database";
import { Heart, MapPin, Phone, Siren } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function getCityCenter(city: Parameters<typeof getCityConfig>[0]) {
  const c = getCityConfig(city);
  return { lat: c.center_lat, lng: c.center_lng };
}

function requestLocation(timeoutMs = 5000): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    const timer = window.setTimeout(() => resolve(null), timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (p) => {
        window.clearTimeout(timer);
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: timeoutMs }
    );
  });
}

export function EmergencyPage() {
  const { city } = useCityStore();
  const [spots, setSpots] = useState<SafeWaitingSpot[]>([]);
  const [contacts, setContacts] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [spotNote, setSpotNote] = useState("");
  const tripId = sessionStorage.getItem("safar-active-trip");

  const loadSpots = useCallback(async () => {
    setLoading(true);
    setSpotNote("");
    try {
      const gps = await requestLocation();
      const coords = gps ?? getCityCenter(city);
      const results = await placesService.getSafeWaitingSpots(city, coords.lat, coords.lng);
      setSpots(results.slice(0, 8));
      if (!results.length) {
        setSpotNote("No safe spots found nearby. Try switching city or check back later.");
      } else if (!gps) {
        setSpotNote("Showing spots near city center — enable location for results near you.");
      }
    } catch {
      setSpots([]);
      setSpotNote("Could not load safe spots right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    loadSpots();
    contactsService.list().then((c) => setContacts(c.length)).catch(() => setContacts(0));
  }, [loadSpots]);

  async function sos() {
    if (!tripId) {
      setStatus("Start a trip to enable live SOS with location sharing.");
      return;
    }
    if (!navigator.geolocation) {
      setStatus("Geolocation is not available on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        try {
          const r = await tripsService.triggerSOS(tripId, p.coords.latitude, p.coords.longitude);
          setStatus(`SOS sent. ${r.notified} contacts notified.`);
        } catch (err) {
          setStatus(err instanceof Error ? err.message : "SOS failed. Please try again.");
        }
      },
      () => setStatus("Location permission denied. Enable GPS to send SOS with your position.")
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Safety first"
        title="Emergency Shield"
        subtitle={`Safe waiting spots from ${IS_DEMO_MODE ? "offline fallback" : "OpenStreetMap"} — hospitals, police, fuel, pharmacies, and transit.`}
      />

      <Card className="!border-[#EF4444]/30 text-center">
        <button
          type="button"
          onClick={sos}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#EF4444] shadow-xl"
        >
          <Siren className="h-12 w-12 text-white" />
        </button>
        <p className="mt-4 font-bold text-white">Tap for SOS</p>
        <p className="text-sm text-[#A1A1AA]">{contacts} trusted contacts</p>
        {status && <p className="mt-2 text-sm text-[#22C55E]">{status}</p>}
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <Heart className="text-[#EC4899]" />
          <h3 className="font-bold text-white">Women&apos;s Emergency</h3>
        </div>
        <a href="tel:1091" className="mb-2 flex items-center gap-3 rounded-xl border border-[#262626] p-4">
          <Phone className="text-[#EC4899]" />
          <div>
            <p className="font-semibold text-white">Women Helpline</p>
            <p className="text-xs text-[#A1A1AA]">1091</p>
          </div>
        </a>
        <a href="tel:181" className="flex items-center gap-3 rounded-xl border border-[#262626] p-4">
          <Phone className="text-[#EC4899]" />
          <div>
            <p className="font-semibold text-white">Domestic Violence</p>
            <p className="text-xs text-[#A1A1AA]">181</p>
          </div>
        </a>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#A1A1AA]">Safe Waiting Spots</h2>
          <button
            type="button"
            onClick={loadSpots}
            disabled={loading}
            className="text-xs font-semibold text-[#3B82F6] disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="text-sm text-[#A1A1AA]">Fetching nearby places from OpenStreetMap…</p>
        )}

        {spotNote && !loading && (
          <p className="mb-3 text-xs text-[#F59E0B]">{spotNote}</p>
        )}

        <div className="space-y-2">
          {!loading &&
            spots.map((s) => (
              <a
                key={s.id}
                href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 hover:border-[#22C55E]/30"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-[10px] text-[#A1A1AA]">
                      {s.spot_type.replace(/_/g, " ")} · Score {s.safe_waiting_score ?? "—"}/100
                      {s.is_24x7 ? " · 24/7" : ""}
                    </p>
                  </div>
                </div>
                {s.distance_m != null && (
                  <span className="ml-3 shrink-0 text-xs font-bold text-[#22C55E]">
                    {s.distance_m < 1000 ? `${s.distance_m}m` : `${(s.distance_m / 1000).toFixed(1)}km`}
                  </span>
                )}
              </a>
            ))}
        </div>

        {!loading && spots.length === 0 && (
          <p className="text-sm text-[#71717A]">No safe waiting spots to show.</p>
        )}
      </div>
    </div>
  );
}
