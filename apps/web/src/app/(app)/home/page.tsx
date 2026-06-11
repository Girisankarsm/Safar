"use client";

import { motion } from "framer-motion";
import { HeroSearch } from "@/components/home/hero-search";
import { MapPreview } from "@/components/home/map-preview";
import { MetricCards } from "@/components/home/metric-cards";
import { QuickActions } from "@/components/home/quick-actions";
import { SafeWaitingSpots } from "@/components/safety/safe-waiting-spots";
import { CommunityReportsFeed } from "@/components/safety/community-reports-feed";
import { useCity } from "@/hooks/use-city";
import type { Route } from "@/lib/api";
import { readSessionJson } from "@/lib/storage";
import { CITIES } from "@/config/cities";
import { Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [previewRoutes, setPreviewRoutes] = useState<Route[]>([]);
  const { city } = useCity();

  useEffect(() => {
    const cached = readSessionJson<Route[]>("safarai-routes");
    if (cached?.length) setPreviewRoutes(cached);
  }, []);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="text-sm font-semibold text-[#3B82F6]">Safar · Command Center</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            {CITIES[city].name} Dashboard
          </h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">
            Travel Smarter. Travel Safer.
          </p>
        </div>
        <Link
          href="/emergency"
          className="inline-flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm font-bold text-[#EF4444] transition hover:bg-[#EF4444]/20"
        >
          <Shield className="h-4 w-4" />
          Emergency Shield
        </Link>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          <div>
            <h2 className="text-xl font-bold text-white">Smart Route Planner</h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#A1A1AA]">
              Compare Safest, Cheapest, Balanced, and Women-Friendly routes with transparent safety scores.
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

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">
              Safety alerts
            </h2>
            <Link href="/safety" className="text-xs font-semibold text-[#3B82F6] hover:underline">
              View heatmap →
            </Link>
          </div>
          <CommunityReportsFeed city={city} />
        </section>
        <section>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">
            Safe waiting spots
          </h2>
          <SafeWaitingSpots city={city} />
        </section>
      </div>
    </div>
  );
}
