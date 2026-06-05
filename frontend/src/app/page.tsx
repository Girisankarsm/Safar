"use client";

import { motion } from "framer-motion";
import { Shield, Map, Leaf, Users, ArrowRight, CheckCircle2, Zap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";

const features = [
  {
    icon: Shield,
    title: "AI Safety Scoring",
    desc: "Every route scored 0–100 using lighting, crowd density, community reports, and time-of-day intelligence.",
    color: "bg-blue-50 text-primary",
  },
  {
    icon: Map,
    title: "Multi-Modal Planning",
    desc: "Metro, bus, train, and walking combined into one seamless journey across Hyderabad.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    icon: Leaf,
    title: "Green Token Rewards",
    desc: "Earn carbon tokens for every sustainable trip. Redeem for ride discounts and bonuses.",
    color: "bg-green-50 text-accent",
  },
  {
    icon: Users,
    title: "Community Intelligence",
    desc: "Real-time safety reports from commuters. Upvote, verify, and make routes safer for everyone.",
    color: "bg-purple-50 text-purple-600",
  },
];

const steps = [
  { step: "01", title: "Plan", desc: "Enter source & destination. Compare 3 route types." },
  { step: "02", title: "Travel Safe", desc: "Live trip with SOS, sharing, and deviation alerts." },
  { step: "03", title: "Earn & Impact", desc: "Collect Green Tokens and track your CO₂ savings." },
];

const stats = [
  { value: "89/100", label: "Avg. Safety Score" },
  { value: "3", label: "Route Options" },
  { value: "47+", label: "Tokens per Trip" },
  { value: "1.8kg", label: "CO₂ Saved / Trip" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-hero">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 lg:px-6">
        <Logo size="md" showTagline />
        <div className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost" size="sm">Sign In</ButtonLink>
          <ButtonLink href="/login" size="sm">Get Started</ButtonLink>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pb-20 pt-12 lg:px-6 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light/50 px-4 py-1.5 text-xs font-semibold text-primary">
              <Zap className="h-3.5 w-3.5" />
              {siteConfig.hackathon}
            </span>
            <h1 className="text-display mb-5 text-4xl font-bold tracking-tight text-foreground lg:text-5xl xl:text-6xl">
              Commute smarter.
              <br />
              <span className="text-primary">Travel safer.</span>
              <br />
              <span className="text-accent">Earn greener.</span>
            </h1>
            <p className="mb-8 max-w-lg text-base leading-relaxed text-muted lg:text-lg">
              {siteConfig.description}
            </p>
            <div className="flex flex-wrap gap-3">
              <ButtonLink href="/login" size="lg">
                Start Planning <ArrowRight className="h-5 w-5" />
              </ButtonLink>
              <ButtonLink href="/dashboard" size="lg" variant="secondary">
                Live Demo
              </ButtonLink>
            </div>
            <div className="mt-8 flex flex-wrap gap-4 text-sm text-muted">
              {["Women Safety Mode", "Carbon Tokens", "Chennai + Hyderabad"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> {t}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Hero card preview */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="surface-elevated overflow-hidden rounded-3xl"
          >
            <div className="border-b border-border bg-slate-50 px-5 py-3">
              <p className="text-label">Route Comparison</p>
              <p className="font-semibold">T Nagar → Chennai Central</p>
            </div>
            <div className="space-y-3 p-5">
              {[
                { type: "Safest", score: 89, eta: "47 min", tokens: 42, rec: true },
                { type: "Fastest", score: 72, eta: "42 min", tokens: 47, rec: false },
                { type: "Greenest", score: 78, eta: "52 min", tokens: 58, rec: false },
              ].map((r) => (
                <div
                  key={r.type}
                  className={`rounded-xl border p-4 ${r.rec ? "border-primary/30 bg-primary-light/20" : "border-border bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{r.type}</span>
                    {r.rec && <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">BEST</span>}
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-muted">
                    <span>🛡 {r.score}/100</span>
                    <span>⏱ {r.eta}</span>
                    <span>🪙 +{r.tokens}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 lg:grid-cols-4 lg:px-6">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
        <div className="mb-12 text-center">
          <p className="text-label mb-2">Platform Capabilities</p>
          <h2 className="text-display text-3xl font-bold">Everything you need for safer commutes</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="surface group p-6 transition hover:shadow-md"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.color}`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 px-4 py-20 text-white lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="text-label mb-2 text-slate-400">How It Works</p>
            <h2 className="text-display text-3xl font-bold">Plan → Travel → Earn</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.step} className="text-center md:text-left">
                <span className="text-5xl font-black text-slate-700">{s.step}</span>
                <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <ButtonLink href="/login" size="lg" variant="accent">
              Try SafarAI Free <ArrowRight className="h-5 w-5" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-white py-10 text-center">
        <Logo size="sm" className="mx-auto mb-3 justify-center" />
        <p className="text-sm text-muted">
          {siteConfig.name} · {siteConfig.city} MVP · {siteConfig.hackathon}
        </p>
      </footer>
    </div>
  );
}
