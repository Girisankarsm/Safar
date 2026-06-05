"use client";

import { motion } from "framer-motion";
import { WhyRoute } from "@/components/routes/why-route";
import { SafetyScore } from "@/components/safety/safety-score";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { safetyTier } from "@/lib/safety-copy";
import type { Route } from "@/lib/api";
import { ChevronDown, ChevronUp, Clock, Leaf, Shield, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const META = {
  fastest: { icon: Zap, label: "Fastest", color: "#A1A1AA" },
  safest: { icon: Shield, label: "Safest", color: "#3B82F6" },
  greenest: { icon: Leaf, label: "Greenest", color: "#22C55E" },
} as const;

export function RouteCard({
  route,
  onStart,
  loading,
  recommended,
}: {
  route: Route;
  onStart: () => void;
  loading?: boolean;
  recommended?: boolean;
}) {
  const type = route.route_type as keyof typeof META;
  const meta = META[type] || META.safest;
  const tier = safetyTier(route.safety_score);
  const [open, setOpen] = useState(false);
  const legs = useMemo(() => route.legs || [], [route.legs]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card className={recommended ? "border-[#3B82F6]/40 shadow-xl shadow-[#3B82F6]/10" : ""} hover>
        {recommended && (
          <span className="mb-4 inline-flex items-center rounded-full bg-[#3B82F6] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Recommended
          </span>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${meta.color}18` }}
            >
              <meta.icon className="h-5 w-5" style={{ color: meta.color }} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{meta.label}</p>
              <p className="mt-1 text-sm text-[#A1A1AA]">
                {route.source} → {route.destination}
              </p>
            </div>
          </div>
          <SafetyScore score={route.safety_score} size="sm" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Metric icon={Clock} label="ETA" value={`${route.eta_minutes} min`} />
          <Metric label="Safety" value={tier} accent="#3B82F6" />
          <Metric label="CO₂ Saved" value={`${route.carbon_saved_kg} kg`} accent="#22C55E" />
          <Metric label="GreenMiles" value={`+${route.reward_tokens}`} accent="#22C55E" />
        </div>

        {open && (
          <div className="mt-5 rounded-2xl border border-[#262626] bg-[#111111] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Route steps</p>
            <ol className="mt-3 space-y-2">
              {legs.map((l, idx) => (
                <li key={`${l.mode}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {l.from} → {l.to}
                    </p>
                    <p className="mt-0.5 text-xs text-[#A1A1AA]">
                      {l.mode.toUpperCase()}
                      {l.women_only_coach ? " · Women coach" : ""}
                      {l.well_lit_stop ? " · Well-lit" : ""}
                      {l.night_service ? " · Night service" : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#262626] bg-[#171717] px-3 py-1 text-xs font-semibold text-white">
                    {l.duration_min}m
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <WhyRoute route={route} />

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button className="w-full" size="lg" variant="outline" onClick={() => setOpen((v) => !v)} disabled={loading}>
            {open ? (
              <>
                Hide Route <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                View Route <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
          <Button className="w-full" size="lg" variant={recommended ? "primary" : "secondary"} onClick={onStart} disabled={loading}>
            {loading ? "Starting…" : "Start Trip"}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon?: typeof Clock;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#111111] px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-1 text-base font-bold" style={{ color: accent || "#FFFFFF" }}>
        {value}
      </p>
    </div>
  );
}
