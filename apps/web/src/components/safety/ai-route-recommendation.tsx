import type { RouteRecommendation } from "@/lib/ai-insights";
import { motion } from "framer-motion";
import { Sparkles, CheckCircle2 } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  safest: "Safest Route",
  cheapest: "Cheapest Route",
  balanced: "Balanced Route",
  women_friendly: "Women-Friendly Route",
};

export function AIRouteRecommendation({
  recommendation,
  onSelect,
}: {
  recommendation: RouteRecommendation;
  onSelect: () => void;
}) {
  const { route, reasons } = recommendation;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className="w-full rounded-2xl border border-[#3B82F6]/40 bg-gradient-to-br from-[#3B82F6]/15 via-[#111111] to-[#111111] p-5 text-left shadow-lg shadow-[#3B82F6]/10 transition hover:border-[#3B82F6]/60"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3B82F6] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white">
          <Sparkles className="h-3 w-3" />
          AI Recommended
        </span>
        <span className="text-sm font-bold text-white">
          {ROUTE_LABELS[route.route_type] ?? route.route_type}
        </span>
        <span className="ml-auto text-lg font-bold text-[#22C55E]">{route.safety_score}/100</span>
      </div>

      <p className="mt-3 text-sm text-[#A1A1AA]">
        Safar AI selected this route based on safety, travel time, cost, and your preferences.
      </p>

      <ul className="mt-3 space-y-1.5">
        {reasons.slice(0, 3).map((reason) => (
          <li key={reason} className="flex items-start gap-2 text-xs text-[#A1A1AA]">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#22C55E]" />
            {reason}
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs font-semibold text-[#3B82F6]">Tap to view on map →</p>
    </motion.button>
  );
}
