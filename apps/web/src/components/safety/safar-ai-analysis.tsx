import { generateAIInsights } from "@/lib/ai-insights";
import type { PlannedRoute } from "@/types/database";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  Clock,
  FileWarning,
  Lightbulb,
  MapPin,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

const RISK_STYLES = {
  Low: { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  Moderate: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  High: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

export function SafarAIAnalysis({ route }: { route: PlannedRoute }) {
  const insights = generateAIInsights(route);
  const riskStyle = RISK_STYLES[insights.riskLevel];

  const rows = [
    { icon: AlertTriangle, label: "Risk Level", value: insights.riskLevel, accent: riskStyle.color },
    { icon: Shield, label: "Safety Confidence", value: `${insights.safetyConfidence}%` },
    { icon: Building2, label: "Nearby Infrastructure", value: insights.nearbyInfrastructure },
    { icon: Users, label: "Community Reports", value: insights.communityReportDensity },
    { icon: FileWarning, label: "Historical Crime (NCRB)", value: insights.historicalCrime },
    { icon: Lightbulb, label: "Lighting Estimate", value: insights.lightingQuality },
    { icon: Clock, label: "Best Travel Window", value: insights.recommendedTravelTime },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="surface-card overflow-hidden rounded-2xl border border-[#3B82F6]/20"
    >
      <div className="border-b border-[var(--border-subtle)] bg-gradient-to-r from-[#3B82F6]/10 to-transparent px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/20">
            <Sparkles className="h-4 w-4 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#3B82F6]">
              Safar AI Analysis
            </p>
            <p className="text-sm font-semibold text-white">Intelligence summary for this corridor</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-sm leading-relaxed text-[#A1A1AA]">{insights.summary}</p>
        <p className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/8 px-3 py-2 text-xs leading-relaxed text-[#93C5FD]">
          {insights.crimeNarrative}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/50 p-3"
            >
              <div className="flex items-start gap-2.5">
                <row.icon
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: row.accent ?? "#3B82F6" }}
                />
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
                    {row.label}
                  </p>
                  <p
                    className="mt-0.5 text-sm font-semibold text-white"
                    style={row.accent ? { color: row.accent } : undefined}
                  >
                    {row.value}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)] p-3">
          <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#71717A]">
            <MapPin className="h-3 w-3" /> AI Highlights
          </p>
          <ul className="space-y-1.5">
            {insights.highlights.map((h) => (
              <li key={h} className="flex items-start gap-2 text-xs text-[#A1A1AA]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#3B82F6]" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}
