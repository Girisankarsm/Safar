"use client";

import { motion } from "framer-motion";
import { HeroSearch } from "@/components/home/hero-search";
import { LiveStatusBar } from "@/components/home/live-status-bar";
import { QuickActions } from "@/components/home/quick-actions";
import { api } from "@/lib/api";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    api.me().then((r) => setGreeting(r.user.name.split(" ")[0])).catch(() => setGreeting("there"));
  }, []);

  return (
    <div className="mx-auto max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10"
      >
        <p className="text-sm text-[#a1a1aa]">Good {getTimeOfDay()}, {greeting}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white md:text-5xl">
          Where are you
          <br />
          going?
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-[#a1a1aa]">
          SafarAI finds the safest public transit route — lighting, CCTV, and community data included.
        </p>
      </motion.div>

      <LiveStatusBar />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.5 }}
      >
        <HeroSearch />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.22, duration: 0.45 }}
        className="mt-8"
      >
        <QuickActions />
      </motion.div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
