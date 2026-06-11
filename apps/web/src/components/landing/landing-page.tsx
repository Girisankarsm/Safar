"use client";

import { ButtonLink } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  Building2,
  MapPin,
  Shield,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const CITIES = ["Chennai", "Trivandrum", "Bengaluru", "Hyderabad", "Mumbai", "Pune", "Kochi", "Delhi"];

const FEATURES = [
  {
    title: "Smart Route Planner",
    desc: "Four route types — Safest, Cheapest, Balanced, and Women-Friendly — scored for safety, cost, and reliability.",
    icon: MapPin,
  },
  {
    title: "Safety Heatmap",
    desc: "Live community intelligence layered with CCTV clusters and verified safe zones across your city.",
    icon: Shield,
  },
  {
    title: "Community Reports",
    desc: "Report harassment, poor lighting, flooded roads, and more. Upvote and verify in real time.",
    icon: Users,
  },
  {
    title: "Emergency Shield",
    desc: "One-tap SOS, trusted contacts, live trip sharing, and nearby safe waiting spots — always two taps away.",
    icon: Zap,
  },
];

const STATS = [
  { label: "Commuters protected", value: 48000, suffix: "+" },
  { label: "Safety reports verified", value: 12400, suffix: "+" },
  { label: "Cities covered", value: 8, suffix: "" },
  { label: "Avg. safety score lift", value: 34, suffix: "%" },
];

const TESTIMONIALS = [
  {
    quote: "Safar helped me pick a well-lit metro route home after my night shift. I finally feel in control.",
    name: "Priya S.",
    role: "Software engineer, Bengaluru",
  },
  {
    quote: "The community reports are spot-on. I avoided a flooded underpass because three people flagged it.",
    name: "Arjun M.",
    role: "MBA student, Chennai",
  },
  {
    quote: "Women-Friendly routing with safe waiting spots — this is what Indian cities needed years ago.",
    name: "Meera K.",
    role: "Healthcare worker, Hyderabad",
  },
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span ref={ref} className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
      {n.toLocaleString("en-IN")}
      {suffix}
    </span>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#262626]/80 bg-[#050505]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#3B82F6]/15">
              <Shield className="h-5 w-5 text-[#3B82F6]" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">Safar</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[#A1A1AA] md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#cities" className="transition hover:text-white">Cities</a>
            <a href="#testimonials" className="transition hover:text-white">Stories</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-[#A1A1AA] transition hover:text-white sm:block">
              Sign in
            </Link>
            <ButtonLink href="/login" size="sm">
              Get started
            </ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-20 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[#3B82F6]/8 blur-[120px]" />
          <HeroMapAnimation />
        </div>
        <div className="relative mx-auto max-w-6xl px-6">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#111111] px-4 py-1.5 text-xs font-semibold text-[#3B82F6]">
              <Sparkles className="h-3.5 w-3.5" />
              India&apos;s community-powered mobility platform
            </p>
            <h1 className="font-display mt-8 max-w-3xl text-5xl font-bold leading-[1.08] tracking-tight md:text-7xl">
              Travel Smarter.
              <br />
              <span className="text-[#3B82F6]">Travel Safer.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#A1A1AA]">
              Safar helps commuters in Indian cities choose safer, smarter, and more reliable routes —
              powered by community intelligence, not just speed.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <ButtonLink href="/login" size="lg" className="btn-glow">
                Start planning routes <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <a
                href="#features"
                className="inline-flex items-center gap-2 rounded-xl border border-[#262626] bg-[#111111] px-6 py-3.5 text-sm font-semibold text-white transition hover:border-[#3B82F6]/40"
              >
                See how it works
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-[#262626] bg-[#0A0A0A] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#EF4444]">The problem</p>
              <h2 className="font-display mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Navigation apps optimize for speed — not safety
              </h2>
              <p className="mt-5 text-[#A1A1AA] leading-relaxed">
                Every day, millions of Indians commute through poorly lit streets, unreliable transit,
                and areas with no community visibility. Women, night-shift workers, and students
                bear the highest risk — with no tool built for them.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Harassment hotspots with no warnings",
                "Flooded roads after monsoon rains",
                "Dark bus stops with broken lighting",
                "No safe place to wait during emergencies",
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-[#262626] bg-[#111111] p-5"
                >
                  <p className="text-sm font-medium text-white">{item}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#22C55E]">The solution</p>
          <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight md:text-4xl">
            Community intelligence meets smart routing
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-[#A1A1AA]">
            Safar scores every route on safety, reliability, cost, and accessibility — so you
            choose with confidence, not guesswork.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { pct: "35%", label: "Community safety ratings" },
              { pct: "25%", label: "Route popularity & foot traffic" },
              { pct: "20%", label: "Police & CCTV proximity" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-[#262626] bg-gradient-to-b from-[#111111] to-[#0A0A0A] p-8"
              >
                <p className="font-display text-4xl font-bold text-[#3B82F6]">{s.pct}</p>
                <p className="mt-2 text-sm text-[#A1A1AA]">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[#262626] bg-[#0A0A0A] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[#3B82F6]">Features</p>
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need for safer commutes
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group rounded-2xl border border-[#262626] bg-[#111111] p-8 transition hover:border-[#3B82F6]/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#3B82F6]/15">
                  <f.icon className="h-6 w-6 text-[#3B82F6]" />
                </div>
                <h3 className="mt-5 text-xl font-bold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Network */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="rounded-3xl border border-[#262626] bg-gradient-to-br from-[#111111] via-[#0A0A0A] to-[#111111] p-10 md:p-14">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#22C55E]">Safety network</p>
                <h2 className="font-display mt-4 text-3xl font-bold tracking-tight">
                  Safe waiting spots when you need them most
                </h2>
                <p className="mt-4 text-[#A1A1AA] leading-relaxed">
                  Petrol pumps, pharmacies, metro stations, police booths, hospitals, and popular
                  stores — navigate to the nearest safe location during any emergency.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["Petrol pumps", "Pharmacies", "Metro stations", "Police booths", "Hospitals", "Popular stores"].map(
                  (spot) => (
                    <div
                      key={spot}
                      className="flex items-center gap-2 rounded-xl border border-[#262626] bg-[#050505] px-4 py-3 text-sm font-medium text-white"
                    >
                      <Building2 className="h-4 w-4 shrink-0 text-[#22C55E]" />
                      {spot}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cities */}
      <section id="cities" className="border-t border-[#262626] bg-[#0A0A0A] py-20">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#3B82F6]">City coverage</p>
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight">Built for Indian cities</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {CITIES.map((city, i) => (
              <motion.span
                key={city}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="rounded-full border border-[#262626] bg-[#111111] px-5 py-2.5 text-sm font-semibold text-white"
              >
                {city}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="text-center"
              >
                <Counter value={s.value} suffix={s.suffix} />
                <p className="mt-2 text-sm text-[#A1A1AA]">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="border-t border-[#262626] bg-[#0A0A0A] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-center text-3xl font-bold tracking-tight">Trusted by commuters</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <motion.blockquote
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-[#262626] bg-[#111111] p-7"
              >
                <p className="text-sm leading-relaxed text-[#D4D4D8]">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-5 border-t border-[#262626] pt-4">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-[#A1A1AA]">{t.role}</p>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight md:text-5xl">
            Your safer commute starts now
          </h2>
          <p className="mt-5 text-lg text-[#A1A1AA]">
            Join thousands of commuters making smarter, safer travel decisions every day.
          </p>
          <ButtonLink href="/login" size="lg" className="btn-glow mt-10">
            Get started free <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </section>

      <footer className="border-t border-[#262626] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#3B82F6]" />
            <span className="font-display font-bold">Safar</span>
            <span className="text-[#A1A1AA]">· Travel Smarter. Travel Safer.</span>
          </div>
          <p className="text-xs text-[#71717A]">© 2026 Safar Mobility Pvt. Ltd.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroMapAnimation() {
  return (
    <svg className="absolute right-0 top-32 hidden h-[400px] w-[55%] opacity-40 lg:block" viewBox="0 0 600 400" fill="none">
      <motion.path
        d="M 50 300 Q 150 200 250 250 T 450 150 T 550 100"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeDasharray="8 6"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.8 }}
        transition={{ duration: 2.5, ease: "easeInOut" }}
      />
      <motion.path
        d="M 80 320 Q 200 280 320 200 T 520 180"
        stroke="#22C55E"
        strokeWidth="1.5"
        strokeDasharray="6 8"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.5 }}
        transition={{ duration: 3, delay: 0.4, ease: "easeInOut" }}
      />
      {[
        { cx: 250, cy: 250, color: "#22C55E", delay: 1.2 },
        { cx: 450, cy: 150, color: "#3B82F6", delay: 1.6 },
        { cx: 320, cy: 200, color: "#F59E0B", delay: 2 },
      ].map((dot) => (
        <motion.circle
          key={`${dot.cx}-${dot.cy}`}
          cx={dot.cx}
          cy={dot.cy}
          r="6"
          fill={dot.color}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
          transition={{ delay: dot.delay, duration: 0.5 }}
        />
      ))}
    </svg>
  );
}
