"use client";

import { SafetyMapDynamic } from "@/components/map/map-dynamic";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export function MapPreview() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-12"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Live city map</h2>
          <p className="mt-1 text-sm text-[#A1A1AA]">CCTV · Transit stops · Community alerts</p>
        </div>
        <div className="hidden gap-4 text-xs text-[#A1A1AA] sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" /> CCTV
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-white" /> Stops
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#EF4444]" /> Alerts
          </span>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-[#262626] shadow-2xl">
        <SafetyMapDynamic height="280px" className="h-[280px]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-[#111111]/90 px-3 py-2 text-xs text-[#A1A1AA] backdrop-blur-md">
          <MapPin className="h-3.5 w-3.5 text-[#3B82F6]" />
          Real-time safety layer
        </div>
      </div>
    </motion.section>
  );
}
