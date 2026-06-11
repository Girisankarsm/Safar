import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { contactsService } from "@/services/supabase/contacts.service";
import { tripsService } from "@/services/supabase/trips.service";
import { zonesService } from "@/services/supabase/zones.service";
import { useCityStore } from "@/stores/city.store";
import type { SafeWaitingSpot } from "@/types/database";
import { Heart, Phone, Shield, Siren } from "lucide-react";
import { useEffect, useState } from "react";
export function EmergencyPage() {
  const { city } = useCityStore();
  const tripId = sessionStorage.getItem("safar-active-trip");
  const [spots, setSpots] = useState<SafeWaitingSpot[]>([]);
  const [contacts, setContacts] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(async (p) => {
      const s = await zonesService.getSafeSpots(city, p.coords.latitude, p.coords.longitude);
      setSpots(s.slice(0, 6));
    });
    contactsService.list().then((c) => setContacts(c.length));
  }, [city]);

  async function sos() {
    if (!tripId) {
      setStatus("Start a trip first to enable live SOS sharing.");
      return;
    }
    navigator.geolocation?.getCurrentPosition(async (p) => {
      const r = await tripsService.triggerSOS(tripId, p.coords.latitude, p.coords.longitude);
      setStatus(`SOS sent. ${r.notified} contacts notified.`);
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-white flex items-center gap-2">
        <Shield className="text-[#EF4444]" /> Emergency Shield
      </h1>

      <Card className="text-center !border-[#EF4444]/30">
        <button type="button" onClick={sos} className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#EF4444] shadow-xl">
          <Siren className="h-12 w-12 text-white" />
        </button>
        <p className="mt-4 font-bold text-white">Tap for SOS</p>
        <p className="text-sm text-[#A1A1AA]">{contacts} trusted contacts configured</p>
        {status && <p className="mt-2 text-sm text-[#22C55E]">{status}</p>}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4"><Heart className="text-[#EC4899]" /><h3 className="font-bold text-white">Women&apos;s Emergency</h3></div>
        <a href="tel:1091" className="flex items-center gap-3 rounded-xl border border-[#262626] p-4 mb-2">
          <Phone className="text-[#EC4899]" /><div><p className="font-semibold text-white">Women Helpline</p><p className="text-xs text-[#A1A1AA]">1091</p></div>
        </a>
        <a href="tel:181" className="flex items-center gap-3 rounded-xl border border-[#262626] p-4">
          <Phone className="text-[#EC4899]" /><div><p className="font-semibold text-white">Domestic Violence</p><p className="text-xs text-[#A1A1AA]">181</p></div>
        </a>
      </Card>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#A1A1AA] mb-3">Safe Waiting Spots</h2>
        <div className="space-y-2">
          {spots.map((s) => (
            <a key={s.id} href={`https://www.google.com/maps/dir/?api=1&destination=${s.latitude},${s.longitude}`}
              target="_blank" rel="noreferrer"
              className="flex justify-between rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 hover:border-[#22C55E]/30">
              <span className="text-sm font-semibold text-white">{s.name}</span>
              {s.distance_m != null && <span className="text-xs text-[#22C55E]">{s.distance_m < 1000 ? `${s.distance_m}m` : `${(s.distance_m/1000).toFixed(1)}km`}</span>}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
