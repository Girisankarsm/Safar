"use client";

import { SafetyScoreBreakdown } from "@/components/safety/safety-score-breakdown";
import { useCity } from "@/hooks/use-city";
import type { Route } from "@/lib/api";
import { api } from "@/lib/api";
import { safetyTier } from "@/lib/safety-copy";
import { Camera, Clock, Lock, Shield, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function RouteSummaryPanel({ route }: { route: Route | null }) {
  const { city } = useCity();
  const [cctvNear, setCctvNear] = useState(0);
  const [cctvDensity, setCctvDensity] = useState(0);
  const [reportsNear, setReportsNear] = useState(0);

  useEffect(() => {
    if (!route) return;
    const lat = route.source_lat ?? route.legs?.[0]?.from_lat;
    const lng = route.source_lng ?? route.legs?.[0]?.from_lng;

    api.cctv(city, lat, lng).then((c) => {
      setCctvNear(c.count);
      setCctvDensity(c.density_score);
    });
    api.reports(city).then((r) => setReportsNear(r.reports.length));
  }, [route, city]);

  if (!route) return null;

  const tier = safetyTier(route.safety_score);
  const coverage = tier === "SAFE" ? "High" : tier === "MODERATE" ? "Moderate" : "Low";
  const typeLabels: Record<string, string> = {
    safest: "Safest",
    cheapest: "Cheapest",
    balanced: "Balanced",
    women_friendly: "Women-Friendly",
  };

  return (
    <div className="mt-8 space-y-3">
      {route.safety_breakdown && route.safety_breakdown.length > 0 && (
        <SafetyScoreBreakdown score={route.safety_score} breakdown={route.safety_breakdown} />
      )}

      <div className="flex flex-col gap-5 rounded-2xl border border-[#3B82F6]/25 bg-[#111111] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15">
            <Shield className="h-6 w-6 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-base font-bold text-white">
              {typeLabels[route.route_type] ?? route.route_type} route · {route.safety_score}/100
            </p>
            <div className="mt-2 max-w-xl">
              <p className="text-sm font-semibold text-white/90">Based on:</p>
              <ul className="mt-2 space-y-1 text-sm text-[#A1A1AA]">
                <li>• Transit infrastructure (GTFS)</li>
                <li>• Known CCTV locations (OpenStreetMap)</li>
                <li>• Community reports ({reportsNear} in {city})</li>
                <li>• Route connectivity</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 lg:gap-8">
          <Stat icon={Camera} value={`${cctvNear} (${cctvDensity}%)`} label="OSM CCTV density" />
          <Stat icon={Sun} value={coverage} label="Safety coverage" />
          <Stat icon={Clock} value={`${route.eta_minutes} min`} label="ETA" />
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-[#A1A1AA]">
        <Lock className="h-3.5 w-3.5" />
        CCTV from OSM Overpass (sparse in India) · supplemented with community reports & transit data.
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Camera;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-4 w-4 text-[#3B82F6]" />
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      <p className="text-[10px] font-medium text-[#A1A1AA]">{label}</p>
    </div>
  );
}
