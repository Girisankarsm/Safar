/**
 * Safety Story — animated segment-by-segment walkthrough.
 * Visualises the route as a sequence of explainable safety moments.
 */

import type { CorridorProfile, CorridorSegment } from "@/lib/corridor-risk";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, ChevronLeft, ChevronRight, Pause, Play, Shield, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const RISK_COLOR: Record<CorridorSegment["riskLevel"], string> = {
  safe: "#22C55E",
  moderate: "#F59E0B",
  risk: "#EF4444",
};

const RISK_BG: Record<CorridorSegment["riskLevel"], string> = {
  safe: "rgba(34,197,94,0.08)",
  moderate: "rgba(245,158,11,0.08)",
  risk: "rgba(239,68,68,0.08)",
};

const RISK_LABEL: Record<CorridorSegment["riskLevel"], string> = {
  safe: "Safe Segment",
  moderate: "Moderate Risk",
  risk: "High Risk",
};

const RISK_EMOJI: Record<CorridorSegment["riskLevel"], string> = {
  safe: "🟢",
  moderate: "🟡",
  risk: "🔴",
};

function buildSegmentStory(seg: CorridorSegment, idx: number, total: number): string[] {
  const lines: string[] = [];

  if (idx === 0) lines.push("You start your journey here.");
  else if (idx === total - 1) lines.push("Approaching your destination.");
  else lines.push(`${Math.round((idx / total) * 100)}% through your route.`);

  if (seg.riskLevel === "safe") {
    if (seg.policeNearby > 0) lines.push(`${seg.policeNearby} police station${seg.policeNearby > 1 ? "s are" : " is"} close by.`);
    if (seg.hospitalNearby > 0) lines.push(`${seg.hospitalNearby} hospital${seg.hospitalNearby > 1 ? "s are" : " is"} reachable.`);
    if (seg.reportCount === 0) lines.push("No community incidents reported here.");
  } else if (seg.riskLevel === "moderate") {
    if (seg.reportCount > 0) lines.push(`${seg.reportCount} community report${seg.reportCount > 1 ? "s" : ""} detected nearby.`);
    if (seg.policeNearby === 0) lines.push("No police station in immediate range — stay aware.");
    else lines.push(`${seg.policeNearby} police station${seg.policeNearby > 1 ? "s" : ""} nearby.`);
  } else {
    lines.push("Reduced safety infrastructure in this area.");
    if (seg.policeNearby === 0 && seg.hospitalNearby === 0) lines.push("No police or hospital coverage detected.");
    if (seg.reportCount >= 2) lines.push(`${seg.reportCount} incidents reported — stay alert.`);
    lines.push("Move through this area promptly.");
  }

  return lines;
}

function SegmentCard({
  seg,
  idx,
  total,
}: {
  seg: CorridorSegment;
  idx: number;
  total: number;
}) {
  const color = RISK_COLOR[seg.riskLevel];
  const bg = RISK_BG[seg.riskLevel];
  const story = buildSegmentStory(seg, idx, total);

  return (
    <motion.div
      key={idx}
      initial={{ opacity: 0, scale: 0.97, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: -12 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col rounded-2xl border p-5"
      style={{ borderColor: color + "35", backgroundColor: bg }}
    >
      {/* Risk badge */}
      <div className="flex items-center gap-2">
        <span className="text-xl">{RISK_EMOJI[seg.riskLevel]}</span>
        <span className="text-[13px] font-bold" style={{ color }}>
          {RISK_LABEL[seg.riskLevel]}
        </span>
        <span className="ml-auto text-[10px] font-semibold text-[var(--text-dim)]">
          Segment {idx + 1} / {total}
        </span>
      </div>

      {/* Story lines */}
      <div className="mt-3 space-y-2">
        {story.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            className="text-[13px] leading-relaxed text-white"
          >
            {line}
          </motion.p>
        ))}
      </div>

      {/* Infrastructure row */}
      <div className="mt-4 flex gap-4 border-t border-white/5 pt-3 text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-[#3B82F6]" />
          {seg.policeNearby} police
        </span>
        <span className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-[#22C55E]" />
          {seg.hospitalNearby} hospital{seg.hospitalNearby !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-[#A78BFA]" />
          {seg.reportCount} report{seg.reportCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Coordinates */}
      <p className="mt-2 text-[10px] text-[var(--text-dim)]">
        {seg.lat.toFixed(5)}°, {seg.lng.toFixed(5)}°
      </p>
    </motion.div>
  );
}

export function SafetyStory({
  profile,
  open,
  onClose,
  onSegmentChange,
}: {
  profile: CorridorProfile;
  open: boolean;
  onClose: () => void;
  onSegmentChange?: (idx: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const segs = profile.segments;

  function goTo(i: number) {
    const next = Math.max(0, Math.min(segs.length - 1, i));
    setIdx(next);
    onSegmentChange?.(next);
  }

  function prev() { goTo(idx - 1); }
  function next() {
    if (idx === segs.length - 1) {
      setPlaying(false);
    } else {
      goTo(idx + 1);
    }
  }

  useEffect(() => {
    if (playing) {
      timerRef.current = setInterval(() => {
        setIdx((cur) => {
          if (cur >= segs.length - 1) {
            setPlaying(false);
            return cur;
          }
          const next = cur + 1;
          onSegmentChange?.(next);
          return next;
        });
      }, 2500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, segs.length, onSegmentChange]);

  // Reset when opened
  useEffect(() => {
    if (open) { setIdx(0); setPlaying(false); onSegmentChange?.(0); }
  }, [open, onSegmentChange]);

  if (!open) return null;

  const seg = segs[idx];
  const progress = segs.length > 1 ? (idx / (segs.length - 1)) * 100 : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <div>
          <p className="text-[12px] font-bold text-white">Route Safety Story</p>
          <p className="text-[10px] text-[var(--text-dim)]">
            {segs.length} segments · {profile.confidenceScore}% confidence
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-[var(--text-dim)] transition hover:bg-[var(--bg-surface)] hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 shrink-0 bg-[var(--border-subtle)]">
        <motion.div
          className="h-full bg-[#3B82F6]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Segment summary strip */}
      <div className="flex shrink-0 gap-px overflow-x-auto border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">
        {segs.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { goTo(i); setPlaying(false); }}
            className={`h-4 flex-1 min-w-[8px] rounded-sm transition ${
              i === idx ? "opacity-100 ring-1 ring-white/30" : "opacity-60 hover:opacity-80"
            }`}
            style={{ backgroundColor: RISK_COLOR[s.riskLevel] }}
            title={`Segment ${i + 1}: ${RISK_LABEL[s.riskLevel]}`}
          />
        ))}
      </div>

      {/* Current segment card */}
      <div className="flex-1 overflow-y-auto p-4">
        {seg && (
          <AnimatePresence mode="wait">
            <SegmentCard key={idx} seg={seg} idx={idx} total={segs.length} />
          </AnimatePresence>
        )}

        {/* Summary at end */}
        {idx === segs.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3"
          >
            <p className="text-[11px] font-bold text-white">Journey Summary</p>
            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
              {(["safe", "moderate", "risk"] as CorridorSegment["riskLevel"][]).map((lvl) => {
                const count = segs.filter((s) => s.riskLevel === lvl).length;
                return (
                  <div key={lvl} className="rounded-lg p-2" style={{ backgroundColor: RISK_COLOR[lvl] + "12" }}>
                    <p className="text-base font-bold" style={{ color: RISK_COLOR[lvl] }}>{count}</p>
                    <p className="text-[9px] text-[var(--text-dim)] capitalize">{lvl === "risk" ? "high risk" : lvl}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="flex shrink-0 items-center justify-between border-t border-[var(--border-subtle)] px-4 py-3">
        <button
          type="button"
          onClick={prev}
          disabled={idx === 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-white transition hover:bg-[var(--bg-surface)] disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-white">
            {idx + 1} / {segs.length}
          </span>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-[#3B82F6] px-3 text-[11px] font-bold text-white transition hover:bg-[#2563EB]"
          >
            {playing ? (
              <><Pause className="h-3 w-3" /> Pause</>
            ) : (
              <><Play className="h-3 w-3" /> {idx === segs.length - 1 ? "Replay" : "Play"}</>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={next}
          disabled={idx === segs.length - 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] text-white transition hover:bg-[var(--bg-surface)] disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
