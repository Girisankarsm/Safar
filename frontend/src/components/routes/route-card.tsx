"use client";

import { motion } from "framer-motion";
import { Clock, Route, Leaf, Coins, ChevronRight, Zap, Shield, Sprout, TrainFront, Bus, Footprints, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SafetyMeter } from "./safety-meter";
import { cn, routeTypeLabel } from "@/lib/utils";
import type { RouteOption } from "@/lib/types";

const routeMeta = {
  fastest: { icon: Zap, color: "text-amber-600 bg-amber-50 border-amber-200" },
  safest: { icon: Shield, color: "text-primary bg-primary-light border-primary/30" },
  greenest: { icon: Sprout, color: "text-accent bg-accent-light border-accent/30" },
};

const modeIcons: Record<string, typeof TrainFront> = {
  metro: TrainFront,
  bus: Bus,
  walk: Footprints,
};

export function RouteCard({
  route,
  onSelect,
  highlighted,
  index = 0,
}: {
  route: RouteOption;
  onSelect: (route: RouteOption) => void;
  highlighted?: boolean;
  index?: number;
}) {
  const meta = routeMeta[route.route_type];
  const RouteIcon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-md",
          highlighted && "ring-2 ring-primary ring-offset-2"
        )}
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl border", meta.color)}>
              <RouteIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{routeTypeLabel(route.route_type)}</h3>
                {route.route_type === "safest" && (
                  <Badge variant="safe">Recommended</Badge>
                )}
              </div>
              <p className="text-sm text-muted">{route.legs.length} segments · {route.distance_km} km total</p>
            </div>
          </div>
        </div>

        {/* Safety meter */}
        <div className="mb-5">
          <SafetyMeter score={route.safety_score} label={route.safety_label} />
        </div>

        {(route.cctv_nearby != null && route.cctv_nearby > 0) && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-800">
            <Video className="h-4 w-4 shrink-0" />
            {route.cctv_nearby} real OSM CCTV camera{route.cctv_nearby === 1 ? "" : "s"} near route endpoints
          </div>
        )}

        {/* Metrics grid */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Clock, label: "ETA", value: `${route.eta_minutes} min` },
            { icon: Route, label: "Distance", value: `${route.distance_km} km` },
            { icon: Leaf, label: "CO₂ Saved", value: `${route.carbon_saved_kg} kg`, accent: true },
            { icon: Coins, label: "Tokens", value: `+${route.reward_tokens}`, accent: true },
          ].map(({ icon: Icon, label, value, accent }) => (
            <div key={label} className="rounded-xl bg-slate-50 px-3 py-2.5">
              <p className="text-label">{label}</p>
              <p className={cn("mt-0.5 flex items-center gap-1 text-sm font-bold", accent && "text-accent")}>
                <Icon className="h-3.5 w-3.5" />
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Route legs */}
        <div className="mb-5 space-y-2">
          <p className="text-label">Route Breakdown</p>
          {route.legs.map((leg, i) => {
            const ModeIcon = modeIcons[leg.mode] ?? Route;
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-white px-3 py-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                  <ModeIcon className="h-4 w-4 text-muted" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium capitalize">{leg.mode}</p>
                  <p className="truncate text-xs text-muted">{leg.from} → {leg.to}</p>
                </div>
                <span className="text-xs font-semibold text-muted">{leg.duration_min}m</span>
              </div>
            );
          })}
        </div>

        {/* Recommendations */}
        {route.recommendations.length > 0 && (
          <div className="mb-5 space-y-1.5 rounded-xl border border-primary/10 bg-primary-light/30 px-4 py-3">
            {route.recommendations.map((r) => (
              <p key={r} className="text-xs font-medium text-blue-800">→ {r}</p>
            ))}
          </div>
        )}

        <Button className="w-full" size="lg" onClick={() => onSelect(route)}>
          Start This Route <ChevronRight className="h-4 w-4" />
        </Button>
      </Card>
    </motion.div>
  );
}
