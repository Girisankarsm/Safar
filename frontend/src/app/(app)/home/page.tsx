"use client";

import { motion } from "framer-motion";
import { HeroSearch } from "@/components/home/hero-search";
import { MapPreview } from "@/components/home/map-preview";
import { MetricCards } from "@/components/home/metric-cards";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Section 1 — Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="mb-10 text-center md:mb-14 md:text-left"
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-sm font-semibold text-[#3B82F6]"
        >
          SafarAI · India&apos;s safest commute
        </motion.p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-6xl">
          Travel Safer
          <br />
          <span className="bg-gradient-to-r from-[#A1A1AA] to-white bg-clip-text text-transparent">
            Tonight
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-[#A1A1AA] md:mx-0 md:text-lg">
          Real-time safety-aware public transit routing.
        </p>
      </motion.section>

      {/* Section 2 — Search */}
      <HeroSearch />

      {/* Section 3 — Metrics */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="mt-14 md:mt-16"
      >
        <h2 className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-[#A1A1AA] md:text-left">
          City safety at a glance
        </h2>
        <MetricCards />
      </motion.section>

      {/* Section 4 — Map */}
      <MapPreview />
    </div>
  );
}
