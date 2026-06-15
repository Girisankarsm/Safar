/**
 * Safety Score Breakdown — "Why X?" format.
 * Shows each factor's contribution to the final score with animated bars.
 */

import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useState } from "react";

export type BreakdownItem = {
  factor: string;
  weight_pct: number;
  score: number;
  contribution: number;
};

const FACTOR_TOOLTIPS: Record<string, string> = {
  "Historical Crime (NCRB)": "NCRB Crime in India city-level statistics (2022)",
  "Community Reports": "Crowdsourced safety incidents within 500m of this corridor",
  "Police Access": "Number of police stations within corridor buffer (OpenStreetMap)",
  "Hospital Access": "Number of hospitals reachable from the corridor (OpenStreetMap)",
  "Night Travel Risk": "Estimated safety impact based on departure time and lighting",
  "Infrastructure Quality": "Combined infrastructure score (lighting, road quality, OSM density)",
  "Lighting Quality": "Estimated lighting coverage along the corridor",
};

function factorColor(score: number): string {
  if (score >= 75) return "#22C55E";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

function contributionSentiment(score: number, weight: number): "positive" | "neutral" | "negative" {
  const maxContrib = weight; // max possible contribution
  const actual = (score / 100) * weight;
  const ratio = actual / maxContrib;
  if (ratio >= 0.7) return "positive";
  if (ratio >= 0.4) return "neutral";
  return "negative";
}

export function SafetyScoreBreakdown({
  score,
  breakdown,
}: {
  score: number;
  breakdown: BreakdownItem[];
}) {
  const [hoveredFactor, setHoveredFactor] = useState<string | null>(null);

  const scoreColor = score >= 80 ? "#22C55E" : score >= 55 ? "#F59E0B" : "#EF4444";
  const scoreLabel = score >= 80 ? "Safe" : score >= 55 ? "Moderate" : "High Risk";

  // Sort by contribution descending
  const sorted = [...breakdown].sort((a, b) => b.contribution - a.contribution);
  const maxContrib = sorted[0]?.contribution ?? 1;

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
      {/* Score hero — "Why X?" */}
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
          Why {score}?
        </p>
        <div className="mt-1.5 flex items-end gap-2">
          <span className="text-4xl font-bold tabular-nums text-white">{score}</span>
          <span className="mb-1 text-lg font-bold text-[var(--text-dim)]">/100</span>
          <span
            className="mb-1 ml-auto rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
            style={{ backgroundColor: scoreColor + "18", color: scoreColor }}
          >
            {scoreLabel}
          </span>
        </div>

        {/* Overall score bar */}
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: scoreColor }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Factor contributions */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
          Score breakdown
        </p>

        {sorted.map((item, i) => {
          const color = factorColor(item.score);
          const sentiment = contributionSentiment(item.score, item.weight_pct);
          const barWidth = (item.contribution / maxContrib) * 100;
          const tooltip = FACTOR_TOOLTIPS[item.factor] ?? `${item.weight_pct}% weight in final score`;
          const isHovered = hoveredFactor === item.factor;

          return (
            <motion.div
              key={item.factor}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onMouseEnter={() => setHoveredFactor(item.factor)}
              onMouseLeave={() => setHoveredFactor(null)}
              className="relative"
            >
              {/* Tooltip */}
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full left-0 z-10 mb-1.5 max-w-[220px] rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-2 text-[10px] text-[var(--text-muted)] shadow-xl"
                >
                  {tooltip}
                </motion.div>
              )}

              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate text-[11px] font-medium text-[var(--text-muted)]">
                    {item.factor}
                  </span>
                  <Info className="h-2.5 w-2.5 shrink-0 text-[var(--text-dim)] opacity-50" />
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {/* Contribution badge */}
                  <span
                    className="rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums"
                    style={{
                      backgroundColor:
                        sentiment === "positive"
                          ? "rgba(34,197,94,0.12)"
                          : sentiment === "negative"
                            ? "rgba(239,68,68,0.12)"
                            : "rgba(245,158,11,0.12)",
                      color:
                        sentiment === "positive"
                          ? "#86EFAC"
                          : sentiment === "negative"
                            ? "#FCA5A5"
                            : "#FCD34D",
                    }}
                  >
                    +{item.contribution.toFixed(1)}
                  </span>
                  <span className="w-8 text-right text-[11px] font-bold text-white tabular-nums">
                    {item.score}
                  </span>
                </div>
              </div>

              {/* Contribution bar */}
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color + "90" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ delay: 0.2 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                />
              </div>

              {/* Weight label */}
              <p className="mt-0.5 text-right text-[9px] text-[var(--text-dim)]">
                {item.weight_pct}% weight · {item.contribution.toFixed(1)} pts contributed
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Total check */}
      <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
        <span className="text-[10px] text-[var(--text-dim)]">
          Sum of contributions
        </span>
        <span className="text-[11px] font-bold text-white">
          {sorted.reduce((s, i) => s + i.contribution, 0).toFixed(1)} pts = {score}/100
        </span>
      </div>
    </div>
  );
}
