"use client";

import { SafetyMapDynamic } from "@/components/map/map-dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCity } from "@/hooks/use-city";
import { useLiveLocation } from "@/hooks/use-live-location";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const REPORT_TYPES = [
  { id: "unsafe_area", label: "Unsafe area" },
  { id: "broken_light", label: "Broken streetlight" },
  { id: "harassment", label: "Harassment reported" },
  { id: "dangerous_crossing", label: "Dangerous crossing" },
];

function SafetyContent() {
  const { city } = useCity();
  const { coords } = useLiveLocation();
  const params = useSearchParams();
  const [showReport, setShowReport] = useState(params.get("report") === "1");
  const [stats, setStats] = useState({ cctv: 0, reports: 0 });
  const [type, setType] = useState(REPORT_TYPES[0].id);
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([api.cctv(city), api.reports(city)]).then(([c, r]) => {
      setStats({ cctv: c.count, reports: r.reports.length });
    });
  }, [city]);

  async function submitReport() {
    if (!coords) return;
    await api.createReport({
      report_type: type,
      description: desc,
      latitude: coords.lat,
      longitude: coords.lng,
      city,
    });
    setMsg("Report submitted — thank you for keeping commuters safe");
    setShowReport(false);
    setDesc("");
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-6rem)]">
      {/* Map full bleed */}
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-[#222222]">
        <SafetyMapDynamic height="100%" />
        <div className="absolute left-4 top-4 rounded-xl bg-black/90 px-3 py-2 backdrop-blur">
          <p className="text-xs font-medium text-white">Safety layer</p>
          <p className="text-[10px] text-[#a1a1aa]">
            {stats.cctv} CCTV · {stats.reports} community reports
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowReport(true)}
          className="absolute bottom-4 right-4 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg transition hover:bg-white/90"
        >
          Report issue
        </button>
      </div>

      {/* Report sheet */}
      {showReport && (
        <Card className="mt-4 !p-5">
          <h2 className="text-lg font-semibold text-white">Report a safety issue</h2>
          <p className="mt-1 text-sm text-[#a1a1aa]">Your report improves scores for everyone nearby.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {REPORT_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  type === t.id
                    ? "bg-white text-black"
                    : "border border-[#222222] text-[#a1a1aa] hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Input
            className="mt-4"
            placeholder="Add details (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          <div className="mt-4 flex gap-3">
            <Button className="flex-1" onClick={submitReport} disabled={!coords}>
              Submit
            </Button>
            <Button variant="ghost" onClick={() => setShowReport(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {msg && <p className="mt-3 text-center text-sm text-[#22c55e]">{msg}</p>}
    </div>
  );
}

export default function SafetyPage() {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-[#111111]" />}>
      <SafetyContent />
    </Suspense>
  );
}
