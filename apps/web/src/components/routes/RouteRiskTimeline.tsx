/**
 * Route Risk Timeline
 * Interactive horizontal visualization of segment-by-segment risk.
 * Clicking a dot zooms the map to that segment.
 */

import type { CorridorSegment } from "@/lib/corridor-risk";
import type { CorridorProfile } from "@/lib/corridor-risk";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, MapPin, Shield, Users } from "lucide-react";
import { useState } from "react";

const RISK_COLOR: Record<CorridorSegment["riskLevel"], string> = {
  safe: "#22C55E",
  moderate: "#F59E0B",
  risk: "#EF4444",
};

const RISK_LABEL: Record<CorridorSegment["riskLevel"], string> = {
  safe: "Safe",
  moderate: "Moderate",
  risk: "High Risk",
};

function segmentExplanation(seg: CorridorSegment): string {
  if (seg.riskLevel === "risk") {
    const reasons: string[] = [];
    if (seg.policeNearby === 0) reasons.push("no police nearby");
    if (seg.reportCount >= 2) reasons.push(`${seg.reportCount} incident reports`);
    if (seg.hospitalNearby === 0) reasons.push("no hospital access");
    return reasons.length ? `Risk factors: ${reasons.join(", ")}` : "Limited safety infrastructure";
  }
  if (seg.riskLevel === "moderate") {
    if (seg.reportCount >= 1) return `${seg.reportCount} report${seg.reportCount > 1 ? "s" : ""} nearby — stay alert`;
    if (seg.policeNearby === 0) return "No police station in immediate range";
    return "Partial infrastructure coverage";
  }
  const goods: string[] = [];
  if (seg.policeNearby > 0) goods.push(`${seg.policeNearby} police nearby`);
  if (seg.hospitalNearby > 0) goods.push(`${seg.hospitalNearby} hospital${seg.hospitalNearby > 1 ? "s" : ""} nearby`);
  if (seg.reportCount === 0) goods.push("no incidents reported");
  return goods.length ? goods.join(", ") : "No risk factors detected";
}

export function RouteRiskTimeline({
  profile,
  onSegmentFocus,
}: {
  profile: CorridorProfile;
  onSegmentFocus?: (segIdx: number) => void;
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const segs = profile.segments;

  if (!segs.length) return null;

  const activeSeg = activeIdx !== null ? segs[activeIdx] : null;

  function handleDotClick(idx: number) {
    setActiveIdx(idx === activeIdx ? null : idx);
    onSegmentFocus?.(idx);
  }

  return (
    <div>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
        Route Risk Timeline
      </p>

      {/* Timeline strip */}
      <div className="relative py-2">
        {/* Connecting line */}
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 overflow-hidden rounded-full">
          <div className="flex h-full w-full">
            {segs.map((seg, i) => (
              <div
                key={i}
                className="flex-1"
                style={{ backgroundColor: RISK_COLOR[seg.riskLevel] + "60" }}
              />
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="relative flex items-center justify-between">
          {/* Start label */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
            <span className="text-[8px] font-bold text-[#3B82F6]">Start</span>
          </div>

          {segs.map((seg, idx) => {
            const color = RISK_COLOR[seg.riskLevel];
            const isActive = activeIdx === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDotClick(idx)}
                className="group relative flex flex-col items-center gap-0.5 focus:outline-none"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.4 : 1,
                    boxShadow: isActive ? `0 0 10px ${color}60` : "none",
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="h-2.5 w-2.5 cursor-pointer rounded-full border-2 border-[var(--bg)] transition-transform"
                  style={{ backgroundColor: color }}
                />
                {/* Risk label on hover */}
                <span
                  className="absolute -top-5 hidden whitespace-nowrap rounded px-1 py-0.5 text-[8px] font-bold group-hover:block"
                  style={{ backgroundColor: color + "22", color }}
                >
                  {idx + 1}
                </span>
              </button>
            );
          })}

          {/* End label */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="h-2 w-2 rounded-full bg-[#EF4444]" />
            <span className="text-[8px] font-bold text-[#EF4444]">End</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-1 flex gap-3 text-[9px] font-semibold text-[var(--text-dim)]">
        {(["safe", "moderate", "risk"] as CorridorSegment["riskLevel"][]).map((lvl) => {
          const count = segs.filter((s) => s.riskLevel === lvl).length;
          return count > 0 ? (
            <span key={lvl} className="flex items-center gap-1">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: RISK_COLOR[lvl] }}
              />
              {RISK_LABEL[lvl]} ({count})
            </span>
          ) : null;
        })}
        <button
          type="button"
          onClick={() => setActiveIdx(null)}
          className="ml-auto text-[9px] text-[var(--text-dim)] underline underline-offset-2 hover:text-white"
        >
          Click dot to inspect
        </button>
      </div>

      {/* Segment detail card */}
      <AnimatePresence>
        {activeSeg && (
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-xl border p-3"
            style={{
              borderColor: RISK_COLOR[activeSeg.riskLevel] + "40",
              backgroundColor: RISK_COLOR[activeSeg.riskLevel] + "08",
            }}
          >
            <div className="flex items-center justify-between">
              <span
                className="text-[11px] font-bold"
                style={{ color: RISK_COLOR[activeSeg.riskLevel] }}
              >
                Segment {(activeIdx ?? 0) + 1} — {RISK_LABEL[activeSeg.riskLevel]}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--text-dim)]">
                <MapPin className="h-3 w-3" />
                {activeSeg.lat.toFixed(4)}°, {activeSeg.lng.toFixed(4)}°
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
              {segmentExplanation(activeSeg)}
            </p>
            <div className="mt-2 flex gap-3 text-[10px] text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-[#3B82F6]" />
                {activeSeg.policeNearby} police
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="h-3 w-3 text-[#22C55E]" />
                {activeSeg.hospitalNearby} hospital{activeSeg.hospitalNearby !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-[#A78BFA]" />
                {activeSeg.reportCount} report{activeSeg.reportCount !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
