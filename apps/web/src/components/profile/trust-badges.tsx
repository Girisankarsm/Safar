import type { UserProfile } from "@/types/database";
import { motion } from "framer-motion";
import { Award, Compass, Shield, Star, Trophy } from "lucide-react";

export type Badge = {
  id: string;
  label: string;
  description: string;
  icon: typeof Shield;
  earned: boolean;
  color: string;
};

export function getEarnedBadges(profile: UserProfile | null): Badge[] {
  const trips = profile?.total_trips ?? 0;
  const reports = profile?.reports_submitted ?? 0;
  const trust = profile?.trust_score ?? 50;
  const contribution = profile?.safety_contribution_score ?? 0;

  return [
    {
      id: "explorer",
      label: "Explorer",
      description: "Completed 3+ trips with Safar",
      icon: Compass,
      earned: trips >= 3,
      color: "#3B82F6",
    },
    {
      id: "guardian",
      label: "Community Guardian",
      description: "Submitted 2+ safety reports",
      icon: Shield,
      earned: reports >= 2,
      color: "#22C55E",
    },
    {
      id: "champion",
      label: "Safety Champion",
      description: "Safety contribution score 50+",
      icon: Trophy,
      earned: contribution >= 50,
      color: "#F59E0B",
    },
    {
      id: "reporter",
      label: "Trusted Reporter",
      description: "Trust score 70+",
      icon: Star,
      earned: trust >= 70,
      color: "#EC4899",
    },
  ];
}

export function getCommunityRank(profile: UserProfile | null): string {
  const score = (profile?.trust_score ?? 50) + (profile?.safety_contribution_score ?? 0);
  if (score >= 120) return "Elite Guardian";
  if (score >= 90) return "Safety Advocate";
  if (score >= 60) return "Active Commuter";
  return "New Explorer";
}

export function TrustBadges({ profile }: { profile: UserProfile | null }) {
  const badges = getEarnedBadges(profile);
  const rank = getCommunityRank(profile);
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">Trust Score</p>
          <p className="mt-1 text-3xl font-bold text-[#22C55E]">{profile?.trust_score ?? 50}</p>
        </div>
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">Community Rank</p>
          <p className="mt-1 text-lg font-bold text-white">{rank}</p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/60 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
          Safety Contribution
        </p>
        <div className="mt-2 flex items-end gap-2">
          <p className="text-3xl font-bold text-[#3B82F6]">{profile?.safety_contribution_score ?? 0}</p>
          <p className="mb-1 text-xs text-[#71717A]">points earned</p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#262626]">
          <motion.div
            className="h-full rounded-full bg-[#3B82F6]"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, profile?.safety_contribution_score ?? 0)}%` }}
            transition={{ duration: 0.7 }}
          />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-bold text-white">
            <Award className="h-4 w-4 text-[#F59E0B]" />
            Achievement Badges
          </p>
          <span className="text-xs text-[#71717A]">
            {earnedCount}/{badges.length} earned
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-3 ${badge.earned ? "border-[var(--border-subtle)]" : "border-[var(--border-subtle)] opacity-45"}`}
              style={badge.earned ? { borderColor: `${badge.color}44` } : undefined}
            >
              <badge.icon className="h-5 w-5" style={{ color: badge.earned ? badge.color : "#71717A" }} />
              <p className="mt-2 text-sm font-semibold text-white">{badge.label}</p>
              <p className="mt-0.5 text-[10px] text-[#71717A]">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
