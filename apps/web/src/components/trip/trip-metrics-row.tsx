"use client";

import type { Route } from "@/lib/api";
import { safetyTier } from "@/lib/safety-copy";
import { Camera, Leaf, Shield, Sun } from "lucide-react";

export function TripMetricsRow({
  route,
  cctvCount,
  cctvDensity,
  lighting,
  safetyScore,
}: {
  route: Route | null | undefined;
  cctvCount: number;
  cctvDensity?: number;
  lighting: string;
  safetyScore: number;
}) {
  const tier = safetyTier(safetyScore);
  const lightingLabel = lighting === "good" || lighting === "high" ? "High" : "Moderate";
  const density = cctvDensity ?? Math.min(100, cctvCount * 10);

  const items = [
    {
      icon: Camera,
      label: "CCTV Coverage",
      value: density >= 70 ? "Good" : density >= 40 ? "Moderate" : "Sparse",
      sub: `${cctvCount} OSM cameras · ${density}% density`,
      color: "#22C55E",
    },
    {
      icon: Sun,
      label: "Lighting Score",
      value: lightingLabel,
      sub: "Well lit roads & stations",
      color: "#EAB308",
    },
    {
      icon: Shield,
      label: "Women Safety Score",
      value: `${safetyScore}/100`,
      sub: `${tier === "SAFE" ? "High" : "Moderate"} safety along route`,
      color: "#3B82F6",
    },
    {
      icon: Leaf,
      label: "CO₂ Saved",
      value: `${route?.carbon_saved_kg ?? "—"} kg`,
      sub: "Choosing safer & greener route",
      color: "#22C55E",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-[#262626] bg-[#111111] px-4 py-3.5"
        >
          <div className="flex items-center gap-2">
            <item.icon className="h-4 w-4" style={{ color: item.color }} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">{item.label}</p>
          </div>
          <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
          <p className="mt-0.5 text-[10px] text-[#A1A1AA]">{item.sub}</p>
        </div>
      ))}
    </div>
  );
}
