"use client";

import { motion } from "framer-motion";
import { HeroSearch } from "@/components/home/hero-search";
import { MapPreview } from "@/components/home/map-preview";
import { MetricCards } from "@/components/home/metric-cards";
import { QuickActions } from "@/components/home/quick-actions";
import type { Route } from "@/lib/api";
import { readSessionJson } from "@/lib/storage";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [previewRoutes, setPreviewRoutes] = useState<Route[]>([]);

  useEffect(() => {
    const cached = readSessionJson<Route[]>("safarai-routes");
    if (cached?.length) setPreviewRoutes(cached);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div>
            <p className="text-sm font-semibold text-[#3B82F6]">SafarAI · India&apos;s safest commute</p>
            <h1 className="mt-3 flex flex-wrap items-center gap-2 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
              Travel Safer
              <span className="text-[#3B82F6]">Tonight</span>
              <Sparkles className="h-7 w-7 text-[#3B82F6]/80" />
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-[#A1A1AA]">
              Real-time safety-aware public transit routing powered by CCTV, transit, and community
              intelligence.
            </p>
          </div>
          <HeroSearch onRoutesFound={setPreviewRoutes} />
        </motion.div>

        <MapPreview variant="dashboard" routes={previewRoutes} />
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
      >
        <MetricCards />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.45 }}
      >
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">Quick actions</h2>
        <QuickActions />
      </motion.section>
    </div>
  );
}
