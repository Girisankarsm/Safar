import { generateAIInsights } from "@/lib/ai-insights";
import type { PlannedRoute } from "@/types/database";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  FileWarning,
  Lightbulb,
  MapPin,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

const RISK_STYLES = {
  Low: { color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  Moderate: { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  High: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

function ConfidenceMeter({ value }: { value: number }) {
  const color = value >= 75 ? "#22C55E" : value >= 55 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#262626]">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="min-w-[38px] text-right text-xs font-bold" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

function CorridorPanel({ route }: { route: PlannedRoute }) {
  const profile = route.corridor_profile;
  if (!profile) return null;

  const hotspotCount = profile.hotspots.length;
  const highHotspots = profile.hotspots.filter((h) => h.riskLevel === "high").length;
  const riskSegs = profile.segments.filter((s) => s.riskLevel === "risk").length;
  const safeSegs = profile.segments.filter((s) => s.riskLevel === "safe").length;
  const totalSegs = profile.segments.length;

  return (
    <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-[#8B5CF6]" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B5CF6]">
          Corridor Intelligence
        </p>
        <span className="ml-auto rounded-full bg-[#8B5CF6]/20 px-2 py-0.5 text-[10px] font-bold text-[#A78BFA]">
          NCRB + OSM + Reports
        </span>
      </div>

      {/* Corridor metrics grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MetricTile
          label="Police Stations"
          value={profile.policeCount}
          unit="found"
          accent={profile.policeCount > 0 ? "#22C55E" : "#EF4444"}
        />
        <MetricTile
          label="Hospitals"
          value={profile.hospitalCount}
          unit="found"
          accent={profile.hospitalCount > 0 ? "#22C55E" : "#F59E0B"}
        />
        <MetricTile
          label="Community Reports"
          value={profile.reportCount}
          unit="on route"
          accent={profile.reportCount === 0 ? "#22C55E" : profile.reportCount > 3 ? "#EF4444" : "#F59E0B"}
        />
        <MetricTile
          label="Hotspot Clusters"
          value={hotspotCount}
          unit={highHotspots > 0 ? `(${highHotspots} high)` : "detected"}
          accent={hotspotCount === 0 ? "#22C55E" : highHotspots > 0 ? "#EF4444" : "#F59E0B"}
        />
      </div>

      {/* Segment risk bar */}
      {totalSegs > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-[#71717A]">
            Corridor segments — {totalSegs} total
          </p>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {safeSegs > 0 && (
              <div
                className="h-full bg-[#22C55E]"
                style={{ width: `${(safeSegs / totalSegs) * 100}%` }}
                title={`${safeSegs} safe`}
              />
            )}
            {(totalSegs - safeSegs - riskSegs) > 0 && (
              <div
                className="h-full bg-[#F59E0B]"
                style={{ width: `${((totalSegs - safeSegs - riskSegs) / totalSegs) * 100}%` }}
                title="moderate"
              />
            )}
            {riskSegs > 0 && (
              <div
                className="h-full bg-[#EF4444]"
                style={{ width: `${(riskSegs / totalSegs) * 100}%` }}
                title={`${riskSegs} risk`}
              />
            )}
          </div>
          <div className="flex gap-3 text-[10px] text-[#71717A]">
            <span className="text-[#22C55E]">{safeSegs} safe</span>
            <span className="text-[#F59E0B]">{totalSegs - safeSegs - riskSegs} moderate</span>
            <span className="text-[#EF4444]">{riskSegs} risk</span>
          </div>
        </div>
      )}

      {/* Lighting / infra scores */}
      <div className="grid grid-cols-3 gap-2">
        <ScoreBar label="Lighting" value={profile.lightingScore} />
        <ScoreBar label="Infrastructure" value={profile.infraScore} />
        <ScoreBar label="Community" value={profile.communityScore} />
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: number;
  unit: string;
  accent: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)]/50 px-3 py-2 text-center">
      <p className="text-lg font-bold" style={{ color: accent }}>
        {value}
      </p>
      <p className="text-[9px] font-semibold uppercase tracking-wider text-[#71717A]">{label}</p>
      <p className="text-[9px] text-[#52525B]">{unit}</p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? "#22C55E" : value >= 50 ? "#F59E0B" : "#EF4444";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[9px]">
        <span className="text-[#71717A]">{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#262626]">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export function SafarAIAnalysis({ route }: { route: PlannedRoute }) {
  const insights = generateAIInsights(route);
  const riskStyle = RISK_STYLES[insights.riskLevel];
  const hasProfile = !!route.corridor_profile;

  const rows = [
    { icon: AlertTriangle, label: "Risk Level", value: insights.riskLevel, accent: riskStyle.color },
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
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/20">
            <Sparkles className="h-4 w-4 text-[#3B82F6]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#3B82F6]">
              Safar AI Analysis
            </p>
            <p className="text-sm font-semibold text-white">Intelligence summary for this corridor</p>
          </div>
          {/* Data source badges */}
          <div className="flex flex-wrap gap-1.5">
            <span className="rounded-full bg-[#F59E0B]/10 px-2 py-0.5 text-[9px] font-bold text-[#FCD34D]">
              NCRB baseline
            </span>
            <span className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[9px] font-bold text-[#86EFAC]">
              OSM infrastructure
            </span>
            <span className="rounded-full bg-[#3B82F6]/10 px-2 py-0.5 text-[9px] font-bold text-[#93C5FD]">
              Community reports
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        {/* Confidence score bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#71717A]">
              <Shield className="h-3 w-3" />
              Safety Confidence Score
            </p>
            <span className="text-[10px] text-[#52525B]">
              {hasProfile ? "corridor-specific" : "estimated"}
            </span>
          </div>
          <ConfidenceMeter value={insights.safetyConfidence} />
        </div>

        {/* Corridor-specific explanation */}
        {hasProfile ? (
          <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/8 px-4 py-3">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#8B5CF6]" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B5CF6]">
                Corridor-Specific Explanation
              </p>
            </div>
            <p className="text-sm leading-relaxed text-[#C4B5FD]">
              {insights.corridorExplanation}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-[#A1A1AA]">{insights.summary}</p>
        )}

        {/* Corridor intelligence panel */}
        <CorridorPanel route={route} />

        {/* Generic crime narrative */}
        <p className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/8 px-3 py-2 text-xs leading-relaxed text-[#93C5FD]">
          {insights.crimeNarrative}
        </p>

        {/* Safety factor grid */}
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

        {/* AI highlights */}
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

        {/* Data source footer */}
        <div className="border-t border-[var(--border-subtle)] pt-3 text-[10px] text-[#52525B] space-y-0.5">
          <p>⚡ NCRB 2022 city-level crime index — baseline risk for corridor</p>
          <p>🗺 OSM police + hospital infrastructure — queried along route buffer</p>
          <p>👥 Community reports — real-time from Supabase, filtered to corridor</p>
          <p>🔍 Hotspot clusters — density analysis across {route.corridor_profile?.segments.length ?? 0} sampled corridor segments</p>
        </div>
      </div>
    </motion.div>
  );
}
