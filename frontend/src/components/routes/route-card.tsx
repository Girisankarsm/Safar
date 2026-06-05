"use client";

import { motion } from "framer-motion";
import { SafetyScore } from "@/components/safety/safety-score";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WhyRoute } from "@/components/routes/why-route";
import type { Route } from "@/lib/api";
import { Leaf, Shield, Zap } from "lucide-react";

const META = {
  fastest: { icon: Zap, label: "Fastest", emoji: "⚡" },
  safest: { icon: Shield, label: "Safest", emoji: "🛡" },
  greenest: { icon: Leaf, label: "Greenest", emoji: "🌱" },
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={recommended ? "border-white/20 ring-1 ring-white/10" : ""}
        hover
      >
        {recommended && (
          <span className="mb-3 inline-block rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-black">
            Recommended for you
          </span>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-white">
              {meta.emoji} {meta.label}
            </p>
            <p className="mt-1 text-sm text-[#a1a1aa]">
              {route.source} → {route.destination}
            </p>
          </div>
          <SafetyScore score={route.safety_score} size="sm" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric label="ETA" value={`${route.eta_minutes} min`} />
          <Metric label="Distance" value={`${route.distance_km} km`} />
          <Metric label="CO₂ saved" value={`${route.carbon_saved_kg} kg`} accent />
          <Metric label="GreenMiles" value={`+${route.reward_tokens}`} accent />
        </div>

        <WhyRoute route={route} />

        <Button
          className="mt-5 w-full"
          variant={recommended ? "primary" : "secondary"}
          onClick={onStart}
          disabled={loading}
        >
          {loading ? "Starting…" : "Start this route"}
        </Button>
      </Card>
    </motion.div>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-black/50 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#a1a1aa]">{label}</p>
      <p className={accent ? "text-sm font-semibold text-[#22c55e]" : "text-sm font-semibold text-white"}>
        {value}
      </p>
    </div>
  );
}
