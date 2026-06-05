"use client";

import { SafetyMapDynamic } from "@/components/map/map-dynamic";
import { useCity } from "@/hooks/use-city";
import { CITIES } from "@/config/cities";
import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function MapPreview({ variant = "inline" }: { variant?: "inline" | "dashboard" }) {
  const { city } = useCity();
  const cityName = CITIES[city].name;
  const isDashboard = variant === "dashboard";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12, duration: 0.45 }}
      className={isDashboard ? "" : "mt-12"}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Live City Safety Map</h2>
          <p className="mt-0.5 text-xs text-[#A1A1AA]">{cityName} · CCTV · Alerts · Transit</p>
        </div>
        <Link
          href="/safety-map"
          className="hidden items-center gap-1 text-xs font-semibold text-[#3B82F6] transition hover:text-white sm:flex"
        >
          Full map <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl border border-[#262626] shadow-2xl shadow-black/40 ${
          isDashboard ? "min-h-[420px] lg:min-h-[480px]" : ""
        }`}
      >
        <SafetyMapDynamic
          height={isDashboard ? "100%" : "280px"}
          className={isDashboard ? "h-full min-h-[420px] lg:min-h-[480px]" : "h-[280px]"}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/70 via-transparent to-transparent" />

        {/* Legend — bottom right like reference */}
        <div className="absolute bottom-4 right-4 rounded-xl border border-[#262626] bg-[#111111]/95 px-3 py-2.5 text-[10px] backdrop-blur-md">
          <p className="mb-2 font-bold uppercase tracking-wider text-[#A1A1AA]">Legend</p>
          <div className="space-y-1.5 text-[#A1A1AA]">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> CCTV
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#3B82F6]" /> Transit stops
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> High risk
            </span>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
