"use client";

import { motion } from "framer-motion";
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
  { id: "broken_light", label: "Broken light" },
  { id: "harassment", label: "Harassment" },
  { id: "dangerous_crossing", label: "Dangerous crossing" },
];

function SafetyContent() {
  const { city } = useCity();
  const { coords } = useLiveLocation();
  const params = useSearchParams();
  const [showReport, setShowReport] = useState(params.get("report") === "1");
  const [stats, setStats] = useState({ cctv: 0, reports: 0, risk: 0 });
  const [type, setType] = useState(REPORT_TYPES[0].id);
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    Promise.all([api.cctv(city), api.reports(city)]).then(([c, r]) => {
      const risk = r.reports.filter((x) =>
        ["unsafe_area", "harassment", "dangerous_crossing"].includes(x.report_type)
      ).length;
      setStats({ cctv: c.count, reports: r.reports.length, risk });
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
    setMsg("Report verified — safety map updated");
    setShowReport(false);
    setDesc("");
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col md:h-[calc(100vh-6rem)]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative flex-1 overflow-hidden rounded-2xl border border-[#222222]"
      >
        <SafetyMapDynamic height="100%" />

        {/* Legend — heatmap storytelling */}
        <div className="absolute left-4 top-4 space-y-2 rounded-2xl border border-[#222222] bg-black/90 p-4 backdrop-blur-md">
          <p className="text-xs font-semibold text-white">Safety heatmap</p>
          <LegendItem color="#ef4444" label="High-risk areas" count={stats.risk} />
          <LegendItem color="#22c55e" label="CCTV clusters" count={stats.cctv} />
          <LegendItem color="#ffffff" label="Verified safe stops" />
        </div>

        <button
          type="button"
          onClick={() => setShowReport(true)}
          className="absolute bottom-5 right-5 rounded-full bg-white px-6 py-3.5 text-sm font-semibold !text-black shadow-2xl transition hover:scale-[1.02] active:scale-[0.98]"
        >
          Report issue
        </button>
      </motion.div>

      {showReport && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mt-5 !p-6">
            <h2 className="text-xl font-semibold text-white">Report a safety issue</h2>
            <p className="mt-2 text-sm text-[#a1a1aa]">Helps every commuter choose safer routes.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                    type === t.id ? "bg-white !text-black" : "border border-[#222222] text-[#a1a1aa]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Input className="mt-4" placeholder="Details (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div className="mt-5 flex gap-3">
              <Button className="flex-1" onClick={submitReport} disabled={!coords}>
                Submit report
              </Button>
              <Button variant="ghost" onClick={() => setShowReport(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {msg && <p className="mt-4 text-center text-sm text-[#22c55e]">{msg}</p>}
    </div>
  );
}

function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-[#a1a1aa]">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
      {count !== undefined && <span className="text-white">{count}</span>}
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
