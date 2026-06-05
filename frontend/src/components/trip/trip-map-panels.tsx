"use client";

import type { SafetyReport } from "@/lib/api";
import { AlertTriangle, Camera, Lightbulb, MapPin, Shield, Train } from "lucide-react";

export function TripMapLegend({
  cctvCount,
  riskCount,
  stopCount,
}: {
  cctvCount: number;
  riskCount: number;
  stopCount: number;
}) {
  return (
    <div className="rounded-2xl border border-[#262626] bg-[#111111]/95 p-4 shadow-xl backdrop-blur-md">
      <p className="text-xs font-bold uppercase tracking-wider text-white">Map Legend</p>
      <div className="mt-3 space-y-2.5">
        <LegendRow icon={Camera} color="#22C55E" label="CCTV Cameras" value={`${cctvCount} Active`} />
        <LegendRow icon={Train} color="#3B82F6" label="Transit Stops" value={`${stopCount} Nearby`} />
        <LegendRow icon={AlertTriangle} color="#EF4444" label="High Risk Area" value={`${riskCount} Areas`} />
        <LegendRow icon={Lightbulb} color="#EAB308" label="Well-lit Zones" value="Active" />
        <LegendRow icon={MapPin} color="#3B82F6" label="You are here" />
        <LegendRow icon={Shield} color="#EF4444" label="Destination" />
      </div>
    </div>
  );
}

export function TripRecentAlerts({ reports }: { reports: SafetyReport[] }) {
  const recent = reports.slice(0, 4);

  return (
    <div className="rounded-2xl border border-[#262626] bg-[#111111]/95 p-4 shadow-xl backdrop-blur-md">
      <p className="text-xs font-bold uppercase tracking-wider text-white">Recent Alerts</p>
      <div className="mt-3 max-h-48 space-y-3 overflow-y-auto">
        {recent.length === 0 && (
          <p className="text-xs text-[#A1A1AA]">No community alerts nearby</p>
        )}
        {recent.map((r, i) => (
          <div key={r.id || i} className="border-b border-[#262626] pb-2 last:border-0 last:pb-0">
            <p className="text-xs font-semibold text-white">
              {formatReportType(r.report_type)}
            </p>
            <p className="mt-0.5 text-[10px] text-[#A1A1AA]">
              {r.description || "Community report"} · {timeAgo(i)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function LegendRow({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Camera;
  color: string;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="flex items-center gap-2 text-[#A1A1AA]">
        <Icon className="h-3.5 w-3.5" style={{ color }} />
        {label}
      </span>
      {value && <span className="font-semibold text-white">{value}</span>}
    </div>
  );
}

function formatReportType(type: string) {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function timeAgo(idx: number) {
  const mins = [12, 28, 45, 90][idx] ?? 60;
  return mins < 60 ? `${mins} mins ago` : `${Math.floor(mins / 60)}h ago`;
}
