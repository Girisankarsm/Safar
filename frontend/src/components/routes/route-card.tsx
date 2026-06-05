"use client";

import { motion } from "framer-motion";
import { RouteTimeline } from "@/components/routes/route-timeline";
import { ScoreGauge } from "@/components/routes/score-gauge";
import { WhyRoute } from "@/components/routes/why-route";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { safetyTier, tierColor } from "@/lib/safety-copy";
import { cn } from "@/lib/utils";
import type { Route } from "@/lib/api";
import { ArrowRight, ChevronDown, ChevronUp, Clock, Leaf, Shield, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const META = {
  fastest: {
    icon: Zap,
    label: "Fastest",
    subtitle: "Quickest travel time",
    color: "#A1A1AA",
  },
  safest: {
    icon: Shield,
    label: "Safest",
    subtitle: "Most secure for you",
    color: "#3B82F6",
  },
  greenest: {
    icon: Leaf,
    label: "Greenest",
    subtitle: "Lowest carbon footprint",
    color: "#22C55E",
  },
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
  const tierClr = tierColor(tier);
  const [open, setOpen] = useState(false);
  const legs = useMemo(() => route.legs || [], [route.legs]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="h-full"
    >
      <Card
        className={cn(
          "relative flex h-full flex-col overflow-hidden",
          recommended
            ? "border-[#3B82F6]/50 shadow-xl shadow-[#3B82F6]/15 ring-1 ring-[#3B82F6]/20"
            : ""
        )}
        hover
      >
        {recommended && (
          <>
            <span className="absolute left-4 top-4 z-10 inline-flex items-center rounded-md bg-[#3B82F6] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
              Recommended
            </span>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#3B82F6]/10 to-transparent" />
          </>
        )}

        <div className={cn("flex items-start justify-between gap-3", recommended ? "mt-8" : "")}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${meta.color}18` }}
            >
              <meta.icon className="h-5 w-5" style={{ color: meta.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-white">{meta.label}</p>
              <p className="text-xs text-[#A1A1AA]">{meta.subtitle}</p>
            </div>
          </div>
          <ScoreGauge score={route.safety_score} />
        </div>

        <RouteTimeline legs={legs} />

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <Metric icon={Clock} label="ETA" value={`${route.eta_minutes} min`} />
          <Metric label="Safety Level" value={tier} accent={tierClr} />
          <Metric label="CO₂ Saved" value={`${route.carbon_saved_kg} kg`} accent="#22C55E" />
          <Metric label="GreenMiles" value={`+${route.reward_tokens}`} accent="#22C55E" />
        </div>

        {open && (
          <div className="mt-4 rounded-xl border border-[#262626] bg-[#111111] p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Route steps</p>
            <ol className="mt-2 space-y-2">
              {legs.map((l, idx) => (
                <li key={`${l.mode}-${idx}`} className="flex items-start justify-between gap-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">
                      {l.from} → {l.to}
                    </p>
                    <p className="mt-0.5 text-[#A1A1AA]">
                      {l.mode}
                      {l.women_only_coach ? " · Women coach" : ""}
                      {l.well_lit_stop ? " · Well-lit" : ""}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#262626] bg-[#171717] px-2 py-0.5 text-[10px] font-semibold text-white">
                    {l.duration_min}m
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        <WhyRoute route={route} />

        <div className="mt-auto pt-5">
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              className="w-full"
              size="lg"
              variant="outline"
              onClick={() => setOpen((v) => !v)}
              disabled={loading}
            >
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
            <Button
              className={cn("w-full", recommended && "btn-glow")}
              size="lg"
              variant={recommended ? "primary" : "secondary"}
              onClick={onStart}
              disabled={loading}
            >
              {loading ? "Starting…" : (
                <>
                  Start Trip
                  {recommended && <ArrowRight className="h-4 w-4" />}
                </>
              )}
            </Button>
          </div>
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
    <div className="rounded-xl border border-[#262626] bg-[#111111] px-3 py-2.5">
      <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-[#A1A1AA]">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </p>
      <p className="mt-0.5 text-sm font-bold" style={{ color: accent || "#FFFFFF" }}>
        {value}
      </p>
    </div>
  );
}
