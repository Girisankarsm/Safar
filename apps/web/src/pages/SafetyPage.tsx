import { SafetyHeatmap } from "@/components/map/SafetyHeatmap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IS_DEMO_MODE } from "@/lib/config";
import { DEMO_CITY_CENTERS } from "@/lib/demo-data";
import { heatmapService, type HeatmapPoint } from "@/services/supabase/heatmap.service";
import { placesService } from "@/services/supabase/places.service";
import { reportsService } from "@/services/supabase/reports.service";
import { storageService } from "@/services/supabase/storage.service";
import { useCityStore } from "@/stores/city.store";
import type { ReportType, SafetyReport } from "@/types/database";
import { CheckCircle2, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: "harassment", label: "Harassment" },
  { id: "poor_lighting", label: "Poor lighting" },
  { id: "unsafe_bus_stop", label: "Unsafe bus stop" },
  { id: "flooded_area", label: "Flooded area" },
  { id: "road_damage", label: "Road damage" },
];

export function SafetyPage() {
  const { city } = useCityStore();
  const [heatPoints, setHeatPoints] = useState<HeatmapPoint[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [center, setCenter] = useState(DEMO_CITY_CENTERS[city]);
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<ReportType>("harassment");
  const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const load = useCallback(async () => {
    const [heat, r, cities] = await Promise.all([
      heatmapService.getHeatmapPoints(city),
      reportsService.listByCity(city),
      placesService.getCities(),
    ]);
    setHeatPoints(heat);
    setReports(r);
    const c = cities.find((x) => x.id === city);
    if (c) setCenter({ lat: c.center_lat, lng: c.center_lng, name: c.name });
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
    const lat = coords?.lat ?? center.lat;
    const lng = coords?.lng ?? center.lng;
    let image_url: string | undefined;
    if (file) image_url = await storageService.uploadReportImage(file);
    await reportsService.create({
      city_id: city,
      report_type: type,
      description: desc,
      latitude: lat,
      longitude: lng,
      image_url,
    });
    setShowForm(false);
    setDesc("");
    setFile(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Community Safety Heatmap</h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          {IS_DEMO_MODE
            ? "Demo mode — heatmap uses sample data. Set VITE_DEMO_MODE=false for live community intelligence."
            : "Generated from real user reports, votes, and verifications. No hardcoded zones."}
        </p>
      </div>

      <div className="h-[420px] overflow-hidden rounded-2xl border border-[#262626]">
        <SafetyHeatmap
          center={center}
          heatPoints={heatPoints}
          reports={reports}
          userLat={coords?.lat}
          userLng={coords?.lng}
        />
      </div>

      {!reports.length && !IS_DEMO_MODE && (
        <p className="rounded-xl border border-[#262626] bg-[#111111] p-4 text-sm text-[#A1A1AA]">
          No community reports yet in {center.name}. Be the first to flag a safety issue — the heatmap grows with every submission.
        </p>
      )}

      <Button onClick={() => setShowForm(true)}>Report issue</Button>

      {showForm && (
        <Card>
          <div className="mb-4 flex flex-wrap gap-2">
            {REPORT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${type === t.id ? "bg-[#3B82F6] text-white" : "border border-[#262626] text-[#A1A1AA]"}`}
              >
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
        {reports.length === 0 ? (
          <p className="text-sm text-[#71717A]">No reports yet.</p>
        ) : (
          reports.map((r) => (
            <Card key={r.id}>
              <p className="text-sm font-semibold text-[#EF4444]">{r.report_type.replace(/_/g, " ")}</p>
              {r.description && <p className="mt-1 text-sm text-[#A1A1AA]">{r.description}</p>}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => reportsService.vote(r.id, "upvote").then(load)}
                  className="flex items-center gap-1 rounded-lg border border-[#262626] px-3 py-1.5 text-xs text-[#A1A1AA]">
                  <ThumbsUp className="h-3 w-3" /> {r.upvotes}
                </button>
                <button type="button" onClick={() => reportsService.vote(r.id, "verify").then(load)}
                  className="flex items-center gap-1 rounded-lg border border-[#262626] px-3 py-1.5 text-xs text-[#A1A1AA]">
                  <CheckCircle2 className="h-3 w-3" /> Verify
                </button>
                {r.is_verified && <span className="text-xs text-[#22C55E]">Verified</span>}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
