import { SafetyHeatmap } from "@/components/map/SafetyHeatmap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { reportsService } from "@/services/supabase/reports.service";
import { storageService } from "@/services/supabase/storage.service";
import { zonesService } from "@/services/supabase/zones.service";
import { useCityStore } from "@/stores/city.store";
import type { ReportType, SafetyReport, SafetyZone } from "@/types/database";
import { CheckCircle2, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: "harassment", label: "Harassment" },
  { id: "poor_lighting", label: "Poor lighting" },
  { id: "unsafe_bus_stop", label: "Unsafe bus stop" },
  { id: "flooded_area", label: "Flooded area" },
  { id: "road_damage", label: "Road damage" },
];

const CITY_CENTERS = {
  chennai: { lat: 13.0827, lng: 80.2707 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
};

export function SafetyPage() {
  const { city } = useCityStore();
  const [zones, setZones] = useState<SafetyZone[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ReportType>("harassment");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const load = useCallback(async () => {
    const [z, r] = await Promise.all([
      zonesService.getZones(city),
      reportsService.listByCity(city),
    ]);
    setZones(z);
    setReports(r);
  }, [city]);

  useEffect(() => {
    load();
    navigator.geolocation?.getCurrentPosition((p) =>
      setCoords({ lat: p.coords.latitude, lng: p.coords.longitude })
    );
    const channel = reportsService.subscribe(city, load);
    return () => { channel.unsubscribe(); };
  }, [city, load]);

  async function submit() {
    const lat = coords?.lat ?? CITY_CENTERS[city].lat;
    const lng = coords?.lng ?? CITY_CENTERS[city].lng;
    let image_url: string | undefined;
    if (file) image_url = await storageService.uploadReportImage(file);
    await reportsService.create({ city_id: city, report_type: type, description: desc, latitude: lat, longitude: lng, image_url });
    setShowForm(false);
    setDesc("");
    setFile(null);
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Safety Heatmap</h1>
      <div className="h-[420px] overflow-hidden rounded-2xl border border-[#262626]">
        <SafetyHeatmap center={CITY_CENTERS[city]} zones={zones} reports={reports} userLat={coords?.lat} userLng={coords?.lng} />
      </div>

      <Button onClick={() => setShowForm(true)}>Report issue</Button>

      {showForm && (
        <Card>
          <div className="flex flex-wrap gap-2 mb-4">
            {REPORT_TYPES.map((t) => (
              <button key={t.id} type="button" onClick={() => setType(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${type === t.id ? "bg-[#3B82F6] text-white" : "border border-[#262626] text-[#A1A1AA]"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <Input placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <input type="file" accept="image/*" className="mt-3 text-sm text-[#A1A1AA]" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <div className="mt-4 flex gap-2">
            <Button onClick={submit}>Submit</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#A1A1AA]">Live community reports</h2>
        {reports.map((r) => (
          <Card key={r.id}>
            <p className="text-sm font-semibold text-[#EF4444]">{r.report_type.replace(/_/g, " ")}</p>
            {r.description && <p className="text-sm text-[#A1A1AA] mt-1">{r.description}</p>}
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => reportsService.vote(r.id, "upvote").then(load)}
                className="flex items-center gap-1 text-xs text-[#A1A1AA] border border-[#262626] rounded-lg px-3 py-1.5">
                <ThumbsUp className="h-3 w-3" /> {r.upvotes}
              </button>
              <button type="button" onClick={() => reportsService.vote(r.id, "verify").then(load)}
                className="flex items-center gap-1 text-xs text-[#A1A1AA] border border-[#262626] rounded-lg px-3 py-1.5">
                <CheckCircle2 className="h-3 w-3" /> Verify
              </button>
              {r.is_verified && <span className="text-xs text-[#22C55E]">Verified</span>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
