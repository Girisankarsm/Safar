"use client";

import { motion } from "framer-motion";
import { ButtonLink } from "@/components/ui/button";
import { api, type Wallet } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  Bus,
  Gift,
  Leaf,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);

  useEffect(() => {
    api.wallet().then(setWallet).catch(() => setWallet(null));
  }, []);

  const balance = wallet?.balance ?? 0;
  const lifetime = wallet?.lifetime_tokens ?? 0;
  const co2 = wallet?.lifetime_co2_kg ?? 0;
  const trips = wallet?.green_trips_count ?? 0;
  const transactions = wallet?.transactions ?? [];

  const earnedThisWeek = transactions
    .filter((t) => isWithinDays(t.created_at, 7))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const level = Math.max(1, Math.min(7, Math.floor(balance / 120) + 1));
  const levelLabel = ["Starter", "Eco Rider", "Eco Commuter", "Green Pro", "Trailblazer", "City Guardian", "Legend"][
    level - 1
  ];
  const nextLevelTarget = (level + 1) * 120;
  const progress = clamp01(balance / nextLevelTarget);

  const weeklyGoal = 57;
  const weeklyEarned = Math.min(weeklyGoal, earnedThisWeek);
  const weeklyPct = clamp01(weeklyEarned / weeklyGoal);

  const rewards = [
    { title: "₹50 Metro Pass", cost: 500, accent: "#22C55E", icon: Bus },
    { title: "Priority Safety Route", cost: 250, accent: "#A855F7", icon: Shield },
    { title: "Free Auto Coupon", cost: 800, accent: "#EAB308", icon: Gift },
    { title: "Café Coupon", cost: 300, accent: "#3B82F6", icon: Sparkles },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#A1A1AA]">Wallet</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">
            GreenMiles <span className="text-[#3B82F6]">Wallet</span>
          </h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">Earn tokens for every safer green trip.</p>
        </div>
        <ButtonLink href="/home" variant="secondary" className="h-11">
          Earn more <ArrowUpRight className="h-4 w-4" />
        </ButtonLink>
      </div>

      {/* Balance + level */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 overflow-hidden rounded-3xl border border-[#262626] bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#0A0A0A] shadow-2xl shadow-black/40"
      >
        <div className="grid gap-6 p-6 md:grid-cols-[1.1fr_1fr] md:p-8">
          <div className="rounded-2xl border border-[#262626] bg-[#050505]/35 p-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">Available balance</p>
            <div className="mt-3 flex items-end gap-3">
              <p className="text-5xl font-bold tracking-tight text-white md:text-6xl">{wallet ? balance : "—"}</p>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#22C55E]/25 bg-[#22C55E]/10 px-3 py-1 text-[11px] font-semibold text-[#22C55E]">
                <Leaf className="h-3.5 w-3.5" />
                GreenMiles
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#111111] px-3 py-1.5 text-xs text-[#A1A1AA]">
              <TrendingUp className="h-4 w-4 text-[#22C55E]" />
              +{earnedThisWeek} earned this week
            </div>
          </div>

          <div className="rounded-2xl border border-[#262626] bg-[#050505]/35 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">Your level</p>
                <p className="mt-2 text-2xl font-bold text-white">Level {level}</p>
                <p className="mt-1 text-sm font-semibold text-[#22C55E]">{levelLabel}</p>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#22C55E]/20 bg-[#22C55E]/10">
                <Leaf className="h-8 w-8 text-[#22C55E]" />
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-[#A1A1AA]">
                <span>Next level</span>
                <span className="font-semibold text-white">
                  {balance} / {nextLevelTarget} Miles
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#262626]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#3B82F6]"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>

            <ButtonLink href="/wallet" variant="primary" className="mt-5 w-full">
              <Gift className="h-4 w-4" />
              Redeem Rewards <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InsightCard
          icon={Leaf}
          title="CO₂ Saved"
          value={`${format1(co2)} kg`}
          subtitle="Total impact"
          accent="#22C55E"
          series={[12, 16, 14, 18, 22, 20, 28]}
        />
        <InsightCard
          icon={Bus}
          title="Public Transit Trips"
          value={String(trips || Math.min(99, transactions.length))}
          subtitle="Total trips"
          accent="#3B82F6"
          series={[7, 9, 8, 11, 10, 12, 14]}
        />
        <InsightCard
          icon={Shield}
          title="Safe Routes Chosen"
          value={String(Math.max(0, Math.round((trips || 0) * 0.75)))}
          subtitle="Trips"
          accent="#A855F7"
          series={[6, 8, 9, 10, 12, 15, 16]}
        />
        <InsightCard
          icon={Sparkles}
          title="Lifetime Earned"
          value={String(lifetime)}
          subtitle="GreenMiles"
          accent="#EAB308"
          series={[10, 12, 11, 14, 16, 18, 22]}
        />
      </div>

      {/* Rewards Marketplace */}
      <div className="mt-8 rounded-3xl border border-[#262626] bg-[#111111] p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white">Rewards Marketplace</h2>
          <button type="button" className="text-sm font-semibold text-[#3B82F6] hover:text-white">
            View all rewards →
          </button>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rewards.map((r) => (
            <div
              key={r.title}
              className="group relative overflow-hidden rounded-2xl border border-[#262626] bg-[#0A0A0A] p-5 transition hover:border-[#3B82F6]/30"
            >
              <div
                className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl"
                style={{ background: r.accent }}
              />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#262626] bg-[#111111]">
                  <r.icon className="h-6 w-6" style={{ color: r.accent }} />
                </div>
                <p className="mt-4 text-sm font-bold text-white">{r.title}</p>
                <p className="mt-2 text-xs font-semibold" style={{ color: r.accent }}>
                  {r.cost} Miles
                </p>
                <ButtonLink
                  href="/wallet"
                  variant={balance >= r.cost ? "primary" : "secondary"}
                  className="mt-4 w-full"
                >
                  Redeem
                </ButtonLink>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom split */}
      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-[#262626] bg-[#111111] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">Recent Activity</h2>
            <button type="button" className="text-sm font-semibold text-[#3B82F6] hover:text-white">
              View all
            </button>
          </div>

          <ul className="mt-5 space-y-3">
            {transactions.slice(0, 6).map((t, i) => (
              <li
                key={`${t.created_at}-${i}`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[#262626] bg-[#0A0A0A] px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{t.description || "Trip completed"}</p>
                  <p className="mt-0.5 text-xs text-[#A1A1AA]">{timeAgo(t.created_at)}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-[#22C55E]">+{t.amount}</span>
              </li>
            ))}
            {!transactions.length && (
              <li className="py-12 text-center text-[#A1A1AA]">Complete a trip to earn GreenMiles</li>
            )}
          </ul>
        </div>

        <div className="rounded-3xl border border-[#262626] bg-[#111111] p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">This Week Progress</h2>
            <p className="text-xs font-semibold text-[#A1A1AA]">Weekly goal</p>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-[200px_1fr] sm:items-center">
            <div className="flex justify-center sm:justify-start">
              <ProgressRing pct={weeklyPct} label={`${Math.round(weeklyPct * 100)}%`} sub={`${weeklyEarned} / ${weeklyGoal} Miles`} />
            </div>

            <div className="space-y-3">
              <MiniStat label="Miles Earned" value={String(weeklyEarned)} accent="#22C55E" />
              <MiniStat label="CO₂ Saved" value={`${format1(Math.max(0, co2 * 0.26))} kg`} accent="#22C55E" />
              <MiniStat label="Trips Completed" value={String(Math.max(0, Math.round((trips || 0) * 0.17)))} accent="#3B82F6" />
              <MiniStat label="Safe Routes Chosen" value={String(Math.max(0, Math.round((trips || 0) * 0.12)))} accent="#A855F7" />

              <div className="mt-4 rounded-2xl border border-[#262626] bg-[#0A0A0A] p-4">
                <p className="text-sm font-semibold text-[#22C55E]">Great job! You’re making a real impact.</p>
                <p className="mt-1 text-xs text-[#A1A1AA]">You’ve saved {format1(Math.max(0, co2 * 0.26))} kg of CO₂ this week.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InsightCard({
  icon: Icon,
  title,
  value,
  subtitle,
  accent,
  series,
}: {
  icon: typeof Leaf;
  title: string;
  value: string;
  subtitle: string;
  accent: string;
  series: number[];
}) {
  return (
    <div className="rounded-3xl border border-[#262626] bg-[#111111] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#A1A1AA]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
          <p className="mt-1 text-xs text-[#A1A1AA]">{subtitle}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#262626] bg-[#0A0A0A]">
          <Icon className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>
      <div className="mt-4">
        <Sparkline series={series} accent={accent} />
      </div>
    </div>
  );
}

function Sparkline({ series, accent }: { series: number[]; accent: string }) {
  const w = 180;
  const h = 44;
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = Math.max(1, max - min);
  const pts = series
    .map((v, i) => {
      const x = (i / (series.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-11 w-full">
      <polyline points={pts} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <polyline
        points={`${pts} ${w},${h} 0,${h}`}
        fill={accent}
        opacity="0.08"
      />
    </svg>
  );
}

function ProgressRing({ pct, label, sub }: { pct: number; label: string; sub: string }) {
  const r = 62;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <div className="relative h-[170px] w-[170px]">
      <svg viewBox="0 0 160 160" className="h-full w-full">
        <circle cx="80" cy="80" r={r} stroke="#262626" strokeWidth="12" fill="none" />
        <circle
          cx="80"
          cy="80"
          r={r}
          stroke="#22C55E"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-3xl font-bold text-white">{label}</p>
        <p className="mt-1 text-xs text-[#A1A1AA]">{sub}</p>
      </div>
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#262626] bg-[#0A0A0A] px-4 py-3">
      <p className="text-xs font-semibold text-[#A1A1AA]">{label}</p>
      <p className="text-sm font-bold" style={{ color: accent }}>
        {value}
      </p>
    </div>
  );
}

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function isWithinDays(iso: string, days: number) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= days * 24 * 60 * 60 * 1000;
}

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "—";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function format1(n: number) {
  return Number.isFinite(n) ? n.toFixed(1) : "0.0";
}
