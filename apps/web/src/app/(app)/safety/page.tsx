"use client";

import { CommunityReportsFeed } from "@/components/safety/community-reports-feed";
import { SafeWaitingSpots } from "@/components/safety/safe-waiting-spots";
import { motion } from "framer-motion";
import { SafetyMapDynamic } from "@/components/map/map-dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import { useLiveLocation } from "@/hooks/use-live-location";
import { api } from "@/lib/api";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

const REPORT_TYPES = [
  { id: "harassment", label: "Harassment" },
  { id: "poor_lighting", label: "Poor lighting" },
  { id: "unsafe_bus_stop", label: "Unsafe bus stop" },
  { id: "suspicious_activity", label: "Suspicious activity" },
  { id: "flooded_road", label: "Flooded area" },
  { id: "road_damage", label: "Road damage" },
  { id: "stray_animal", label: "Stray animal risk" },
  { id: "construction", label: "Construction" },
];

function SafetyContent() {
  const { city } = useCity();
  const { coords } = useLiveLocation();
  const params = useSearchParams();
  const [showReport, setShowReport] = useState(params.get("report") === "1");
  const [stats, setStats] = useState({ safe: 0, moderate: 0, high: 0, reports: 0 });
  const [type, setType] = useState(REPORT_TYPES[0].id);
  const [desc, setDesc] = useState("");
  const [msg, setMsg] = useState("");
  const [mapKey, setMapKey] = useState(0);

  const refreshStats = useCallback(() => {
    const { lat, lng } = CITIES[city].center;
    Promise.all([api.safetyZones(city), api.reports(city), api.cctv(city, lat, lng)]).then(
      ([zones, reports]) => {
        setStats({
          safe: zones.summary.safe,
          moderate: zones.summary.moderate,
          high: zones.summary.high_risk,
          reports: reports.reports.length,
        });
      }
    );
  }, [city]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  async function submitReport() {
    if (!coords) return;
    await api.createReport({
      report_type: type,
      description: desc,
      latitude: coords.lat,
      longitude: coords.lng,
      city,
    });
    setMsg("Report submitted — community map updated");
    setShowReport(false);
    setDesc("");
    setMapKey((k) => k + 1);
    refreshStats();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">Safety Heatmap</h1>
        <p className="mt-1 text-sm text-[#A1A1AA]">
          Live community intelligence for {CITIES[city].name}
        </p>
      </div>

      <div className="flex h-[calc(100vh-14rem)] flex-col lg:h-[480px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative flex-1 overflow-hidden rounded-2xl border border-[#222222]"
        >
          <SafetyMapDynamic
            key={mapKey}
            height="100%"
            userLat={coords?.lat}
            userLng={coords?.lng}
            showHeatmap
          />

          <div className="absolute left-4 top-4 z-[2] max-w-[240px] space-y-2 rounded-2xl border border-[#222222] bg-black/90 p-4 backdrop-blur-md">
            <p className="text-xs font-semibold text-white">Zone legend</p>
            <LegendItem color="#22c55e" label="Safe zones" count={stats.safe} />
            <LegendItem color="#f59e0b" label="Moderate zones" count={stats.moderate} />
            <LegendItem color="#ef4444" label="High-risk zones" count={stats.high} />
            <LegendItem color="#3b82f6" label="Community reports" count={stats.reports} />
          </div>

          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="absolute bottom-5 right-5 rounded-full bg-[#3B82F6] px-6 py-3.5 text-sm font-semibold text-white shadow-2xl shadow-[#3B82F6]/30 transition hover:bg-[#2563EB] active:scale-[0.98]"
          >
            Report issue
          </button>
        </motion.div>
      </div>

      {showReport && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="!p-6">
            <h2 className="text-xl font-semibold text-white">Community safety report</h2>
            <p className="mt-2 text-sm text-[#a1a1aa]">
              Your report helps every commuter choose safer routes.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition ${
                    type === t.id
                      ? "bg-[#3B82F6] text-white"
                      : "border border-[#262626] text-[#A1A1AA]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Input
              className="mt-4"
              placeholder="Describe what you observed (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <div className="mt-5 flex gap-3">
              <Button className="flex-1" onClick={submitReport} disabled={!coords}>
                Submit report
              </Button>
              <Button variant="ghost" onClick={() => setShowReport(false)}>
                Cancel
              </Button>
            </div>
            {!coords && (
              <p className="mt-2 text-xs text-[#F59E0B]">Enable location to attach GPS coordinates.</p>
            )}
          </Card>
        </motion.div>
      )}

      {msg && <p className="text-center text-sm text-[#22c55e]">{msg}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-[#A1A1AA]">
            Live community reports
          </h2>
          <CommunityReportsFeed city={city} />
        </div>
        <SafeWaitingSpots city={city} />
      </div>
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
