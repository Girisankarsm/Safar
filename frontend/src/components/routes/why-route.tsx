"use client";

import { whyThisRoute } from "@/lib/safety-copy";
import type { Route } from "@/lib/api";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

export function WhyRoute({ route }: { route: Route }) {
  const reasons = whyThisRoute(route);
  if (!reasons.length) return null;

  return (
    <div className="mt-5 border-t border-[#222222] pt-5">
      <p className="text-[10px] font-medium uppercase tracking-widest text-[#a1a1aa]">Why this route?</p>
      <ul className="mt-3 space-y-2">
        {reasons.map((r, i) => (
          <motion.li
            key={r}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="flex items-start gap-2 text-sm text-[#a1a1aa]"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3B82F6]" strokeWidth={2.5} />
            <span>{r}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
