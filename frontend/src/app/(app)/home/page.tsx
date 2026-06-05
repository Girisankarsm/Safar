"use client";

import { motion } from "framer-motion";
import { HeroSearch } from "@/components/home/hero-search";
import { MapPreview } from "@/components/home/map-preview";
import { MetricCards } from "@/components/home/metric-cards";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl">
      {/* Section 1 — Hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 md:mb-16"
      >
        <p className="text-sm font-medium text-[#3B82F6]">SafarAI · India&apos;s safest commute</p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl">
          Travel Safer
          <br />
          <span className="text-[#A1A1AA]">Tonight</span>
        </h1>
        <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#A1A1AA]">
          Real-time safety-aware public transit routing.
        </p>
      </motion.section>

      {/* Section 2 — Search */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <HeroSearch />
      </motion.section>

      {/* Section 3 — Metrics */}
      <section className="mt-12 md:mt-16">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-[#A1A1AA]">City safety at a glance</h2>
        <MetricCards />
      </section>

      {/* Section 4 — Map preview */}
      <MapPreview />
    </div>
  );
}
