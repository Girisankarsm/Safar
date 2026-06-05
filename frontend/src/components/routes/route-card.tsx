"use client";

import { motion } from "framer-motion";
import { WhyRoute } from "@/components/routes/why-route";
import { SafetyScore } from "@/components/safety/safety-score";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { safetyTier } from "@/lib/safety-copy";
import type { Route } from "@/lib/api";
import { Clock, Leaf, Shield, Zap } from "lucide-react";

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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
      <Card
        className={recommended ? "border-[#3B82F6]/40 shadow-xl shadow-[#3B82F6]/10" : ""}
        hover
      >
        {recommended && (
          <span className="mb-4 inline-flex items-center rounded-full bg-[#3B82F6] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Recommended
          </span>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${meta.color}20` }}
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

        <WhyRoute route={route} />

        <Button
          className="mt-6 w-full !font-bold"
          size="lg"
          variant={recommended ? "primary" : "secondary"}
          onClick={onStart}
          disabled={loading}
        >
          <span className="!text-white">{loading ? "Starting…" : "Start this route"}</span>
        </Button>
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
