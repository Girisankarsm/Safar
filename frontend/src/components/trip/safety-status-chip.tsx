"use client";

import { safetyTier, tierColor, type SafetyTier } from "@/lib/safety-copy";
import { AnimatePresence, motion } from "framer-motion";

export function SafetyStatusChip({ score }: { score: number }) {
  const tier = safetyTier(score);
  const color = tierColor(tier);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tier}
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="pointer-events-none absolute left-1/2 top-4 z-[1000] -translate-x-1/2"
      >
        <div
          className="flex items-center gap-2 rounded-full border px-4 py-2 shadow-2xl backdrop-blur-md"
          style={{
            borderColor: `${color}55`,
            backgroundColor: "rgba(0,0,0,0.85)",
          }}
        >
          <TierDot tier={tier} color={color} />
          <span className="text-xs font-bold tracking-[0.2em] text-white">{tier}</span>
          <span className="text-xs text-[#a1a1aa]">· {score}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function TierDot({ tier, color }: { tier: SafetyTier; color: string }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {tier === "SAFE" && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-50"
          style={{ backgroundColor: color }}
        />
      )}
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}
