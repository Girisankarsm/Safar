"use client";

import type { Route } from "@/lib/api";
import { whyThisRoute } from "@/lib/safety-copy";
import { Camera, Lock, Shield, Sun } from "lucide-react";

export function RouteSummaryPanel({ route }: { route: Route | null }) {
  if (!route) return null;

  const cctvCount = Math.max(4, Math.round(route.safety_score / 6));
  const reasons = whyThisRoute(route);

  return (
    <div className="mt-8 space-y-3">
      <div className="flex flex-col gap-5 rounded-2xl border border-[#3B82F6]/25 bg-[#111111] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15">
            <Shield className="h-6 w-6 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-base font-bold text-white">Safest choice for you tonight</p>
            <p className="mt-1 max-w-xl text-sm text-[#A1A1AA]">
              Based on CCTV coverage, lighting, women safety, and night-shift availability.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 lg:gap-8">
          <Stat icon={Camera} value={String(cctvCount)} label="CCTV Cameras" />
          <Stat icon={Sun} value="High" label="Lighting Score" />
          <Stat icon={Shield} value="2.4k+" label="Safe Rides Today" />
        </div>
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs text-[#A1A1AA]">
        <Lock className="h-3.5 w-3.5" />
        All routes are safety-scored in real-time using live data and community insights.
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
