"use client";

import { HomeRouteMapDynamic } from "@/components/map/map-dynamic";
import { useCity } from "@/hooks/use-city";
import { CITIES } from "@/config/cities";
import type { Route } from "@/lib/api";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function MapPreview({
  variant = "inline",
  routes = [],
}: {
  variant?: "inline" | "dashboard";
  routes?: Route[];
}) {
  const { city } = useCity();
  const cityName = CITIES[city].name;
  const isDashboard = variant === "dashboard";
  const mapHeight = isDashboard ? 480 : 300;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.45 }}
      className={isDashboard ? "" : "mt-12"}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">
            {routes.length ? "Route preview" : "Live City Safety Map"}
          </h2>
          <p className="mt-0.5 text-xs text-[#A1A1AA]">
            {routes.length
              ? `${routes[0]?.source} → ${routes[0]?.destination} · ${routes.length} options`
              : `${cityName} · CCTV · Alerts · Transit`}
          </p>
        </div>
        <Link
          href={routes.length ? "/routes" : "/safety-map"}
          className="hidden items-center gap-1 text-xs font-semibold text-[#3B82F6] transition hover:text-white sm:flex"
        >
          {routes.length ? "Compare routes" : "Full map"} <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl border border-[#262626] shadow-2xl shadow-black/40"
        style={{ minHeight: mapHeight }}
      >
        <HomeRouteMapDynamic routes={routes} height={mapHeight} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/25 via-transparent to-transparent" />

        <div className="absolute bottom-4 right-4 rounded-xl border border-[#262626] bg-[#111111]/95 px-3 py-2.5 text-[10px] backdrop-blur-md">
          <p className="mb-2 font-bold uppercase tracking-wider text-[#A1A1AA]">Legend</p>
          <div className="space-y-1.5 text-[#A1A1AA]">
            {routes.length > 0 ? (
              <>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#3B82F6]" /> Safest route
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> Fastest
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#A855F7]" /> Greenest
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> CCTV
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FFFFFF]" /> Transit stops
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> High risk
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
