import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IS_DEMO_MODE } from "@/lib/config";
import { contactsService } from "@/services/supabase/contacts.service";
import { placesService } from "@/services/supabase/places.service";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { SafeWaitingSpot } from "@/types/database";
import { Heart, Phone, Shield, Siren } from "lucide-react";
import { useEffect, useState } from "react";

export function EmergencyPage() {
  const { city } = useCityStore();
  const [spots, setSpots] = useState<SafeWaitingSpot[]>([]);
  const [contacts, setContacts] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const tripId = sessionStorage.getItem("safar-active-trip");

  useEffect(() => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const s = await placesService.getSafeWaitingSpots(city, p.coords.latitude, p.coords.longitude);
        setSpots(s.slice(0, 8));
        setLoading(false);
      },
      async () => {
        const cities = await placesService.getCities();
        const c = cities.find((x) => x.id === city);
        if (c) {
          const s = await placesService.getSafeWaitingSpots(city, c.center_lat, c.center_lng);
          setSpots(s.slice(0, 8));
        }
        setLoading(false);
      }
    );
    contactsService.list().then((c) => setContacts(c.length));
  }, [city]);

  async function sos() {
    if (!tripId) {
      setStatus("Start a trip to enable live SOS with location sharing.");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (p) => {
      const r = await tripsService.triggerSOS(tripId, p.coords.latitude, p.coords.longitude);
      setStatus(`SOS sent. ${r.notified} contacts notified.`);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="flex items-center gap-2 text-3xl font-bold text-white">
        <Shield className="text-[#EF4444]" /> Emergency Shield
      </h1>
      <p className="text-sm text-[#A1A1AA]">
        Safe waiting spots from {IS_DEMO_MODE ? "demo fallback" : "OpenStreetMap"} — hospitals, police, fuel, pharmacies, transit.
      </p>

      <Card className="!border-[#EF4444]/30 text-center">
        <button type="button" onClick={sos} className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#EF4444] shadow-xl">
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
          <div><p className="font-semibold text-white">Women Helpline</p><p className="text-xs text-[#A1A1AA]">1091</p></div>
        </a>
        <a href="tel:181" className="flex items-center gap-3 rounded-xl border border-[#262626] p-4">
          <Phone className="text-[#EC4899]" />
          <div><p className="font-semibold text-white">Domestic Violence</p><p className="text-xs text-[#A1A1AA]">181</p></div>
        </a>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-[#A1A1AA]">Safe Waiting Spots</h2>
        {loading && <p className="text-sm text-[#A1A1AA]">Fetching nearby places from OpenStreetMap…</p>}
        <div className="space-y-2">
          {spots.map((s) => (
            <a
              key={s.id}
              href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 hover:border-[#22C55E]/30"
            >
              <div>
                <p className="text-sm font-semibold text-white">{s.name}</p>
                <p className="text-[10px] text-[#A1A1AA]">{s.spot_type.replace(/_/g, " ")} · Score {s.safe_waiting_score ?? "—"}/100</p>
              </div>
              {s.distance_m != null && (
                <span className="text-xs font-bold text-[#22C55E]">
                  {s.distance_m < 1000 ? `${s.distance_m}m` : `${(s.distance_m / 1000).toFixed(1)}km`}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
