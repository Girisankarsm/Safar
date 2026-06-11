"use client";

import { api, type SafetyReport } from "@/lib/api";
import { motion } from "framer-motion";
import { CheckCircle2, MessageCircle, Share2, ThumbsUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const TYPE_LABELS: Record<string, string> = {
  harassment: "Harassment",
  poor_lighting: "Poor lighting",
  broken_light: "Broken light",
  unsafe_bus_stop: "Unsafe bus stop",
  suspicious_activity: "Suspicious activity",
  flooded_road: "Flooded area",
  flooded_area: "Flooded area",
  road_damage: "Road damage",
  pothole: "Road damage",
  stray_animal: "Stray animal risk",
  construction: "Construction obstruction",
  unsafe_area: "Unsafe area",
  dangerous_crossing: "Dangerous crossing",
};

function timeAgo(iso?: string) {
  if (!iso) return "Just now";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function CommunityReportsFeed({ city }: { city: string }) {
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { reports: data } = await api.reports(city);
    setReports(data);
    setLoading(false);
  }, [city]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000);
    return () => clearInterval(interval);
  }, [load]);

  async function vote(id: string, type: "upvote" | "verify") {
    const { report } = await api.voteReport(id, type);
    setReports((prev) => prev.map((r) => (r.id === id ? report : r)));
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#111111]" />
        ))}
      </div>
    );
  }

  if (!reports.length) {
    return (
      <p className="rounded-2xl border border-[#262626] bg-[#111111] p-6 text-center text-sm text-[#A1A1AA]">
        No community reports yet. Be the first to flag a safety issue.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((r, i) => (
        <motion.article
          key={r.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="rounded-2xl border border-[#262626] bg-[#111111] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[#EF4444]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#EF4444]">
                  {TYPE_LABELS[r.report_type] ?? r.report_type.replace(/_/g, " ")}
                </span>
                {r.is_verified && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#22C55E]">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              {r.description && (
                <p className="mt-2 text-sm text-[#D4D4D8]">{r.description}</p>
              )}
              <p className="mt-1 text-[10px] text-[#71717A]">{timeAgo(r.created_at)}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-[#262626] pt-3">
            <button
              type="button"
              onClick={() => vote(r.id, "upvote")}
              className="flex items-center gap-1.5 rounded-lg border border-[#262626] px-3 py-1.5 text-[11px] font-semibold text-[#A1A1AA] transition hover:border-[#3B82F6]/40 hover:text-white"
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              {r.upvotes ?? 0}
            </button>
            <button
              type="button"
              onClick={() => vote(r.id, "verify")}
              className="flex items-center gap-1.5 rounded-lg border border-[#262626] px-3 py-1.5 text-[11px] font-semibold text-[#A1A1AA] transition hover:border-[#22C55E]/40 hover:text-white"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Verify {r.verifications ? `(${r.verifications})` : ""}
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-[#71717A]"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Safar Safety Report",
                    text: r.description ?? TYPE_LABELS[r.report_type] ?? "Safety report",
                  });
                }
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </button>
            <span className="ml-auto flex items-center gap-1 text-[10px] text-[#71717A]">
              <MessageCircle className="h-3 w-3" />
              Live
            </span>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
