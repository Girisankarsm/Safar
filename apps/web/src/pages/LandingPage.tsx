import { ButtonLink } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { DEMO_LANDING_METRICS } from "@/lib/demo-hackathon";
import { IS_DEMO_MODE } from "@/lib/config";
import { motion } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Shield,
  Sparkles,
  Siren,
  Users,
  Route,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

const METRICS = IS_DEMO_MODE
  ? DEMO_LANDING_METRICS
  : { safeTrips: 1200, communityReports: 48, citiesCovered: 3, emergencyResponses: 86 };

const FEATURES = [
  {
    icon: Route,
    title: "AI Route Intelligence",
    description: "Compare 4 route types with Safar AI analysis, safety scores, and smart recommendations.",
    color: "#3B82F6",
  },
  {
    icon: MapPin,
    title: "Community Heatmap",
    description: "Live safety reports from real commuters — vote, verify, and shape city-wide intelligence.",
    color: "#22C55E",
  },
  {
    icon: Siren,
    title: "Emergency Shield",
    description: "One-tap SOS, WhatsApp alerts, nearest police & hospitals, and women's helplines.",
    color: "#EF4444",
  },
  {
    icon: Users,
    title: "Live Trip Sharing",
    description: "Share your journey with family via a public link — no login required for viewers.",
    color: "#EC4899",
  },
];

const STEPS = [
  { step: "01", title: "Search your route", body: "Pick from & to with city-biased autocomplete powered by OpenStreetMap." },
  { step: "02", title: "Compare with Safar AI", body: "Review safety scores, AI insights, and the recommended corridor for your trip." },
  { step: "03", title: "Travel & contribute", body: "Start live tracking, share your trip, and flag safety issues to help others." },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <header className="border-b border-[#262626]/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <Shield className="h-6 w-6 shrink-0 text-[#3B82F6]" />
            <span className="text-xl font-bold leading-none">Safar</span>
          </div>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="inline-flex min-h-9 items-center px-3 text-sm font-medium text-[#A1A1AA] transition hover:text-white"
            >
              Sign in
            </Link>
            <ButtonLink to="/login" size="sm">
              Get started
            </ButtonLink>
          </nav>
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center sm:py-28">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#111111] px-4 py-1.5 text-xs font-semibold text-[#3B82F6]"
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          Community-powered mobility for India
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-8 text-5xl font-bold tracking-tight md:text-7xl"
        >
          Travel Smarter.
          <br />
          <span className="text-[#3B82F6]">Travel Safer.</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-[#A1A1AA]"
        >
          Safar helps Indian commuters choose safer routes with AI intelligence, community heatmaps, and emergency tools — powered by Supabase realtime.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-10 flex w-full justify-center"
        >
          <ButtonLink to="/login" size="lg" className="btn-glow">
            Start planning routes
            <ArrowRight className="h-4 w-4 shrink-0" />
          </ButtonLink>
        </motion.div>
      </section>

      <section className="border-y border-[#262626]/60 bg-[#0a0a0c] py-12">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 md:grid-cols-4">
          {[
            { label: "Safe Trips", value: METRICS.safeTrips, suffix: "+" },
            { label: "Community Reports", value: METRICS.communityReports, suffix: "+" },
            { label: "Cities Covered", value: METRICS.citiesCovered, suffix: "" },
            { label: "Emergency Responses", value: METRICS.emergencyResponses, suffix: "+" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="text-center"
            >
              <p className="text-3xl font-bold text-white md:text-4xl">
                <CountUp value={m.value} suffix={m.suffix} />
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#71717A]">{m.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <p className="text-sm font-semibold text-[#3B82F6]">Platform Features</p>
          <h2 className="mt-2 text-3xl font-bold">Built for safer Indian commutes</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="surface-card rounded-2xl p-6"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${f.color}18` }}
              >
                <f.icon className="h-6 w-6" style={{ color: f.color }} />
              </div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-[#262626]/60 bg-[#0a0a0c] py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <p className="text-sm font-semibold text-[#3B82F6]">How Safar Works</p>
            <h2 className="mt-2 text-3xl font-bold">Three steps to safer travel</h2>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center md:text-left"
              >
                <span className="text-4xl font-bold text-[#3B82F6]/40">{s.step}</span>
                <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-[#A1A1AA]">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="overflow-hidden rounded-3xl border border-[#3B82F6]/25 bg-gradient-to-br from-[#3B82F6]/15 via-[#111111] to-[#050505] p-8 md:p-12"
        >
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-semibold text-[#3B82F6]">Premium Product Showcase</p>
              <h2 className="mt-2 text-3xl font-bold">Safar Command Center</h2>
              <p className="mt-4 text-sm leading-relaxed text-[#A1A1AA]">
                A unified dashboard for route planning, AI safety analysis, community heatmaps, live trip tracking, and emergency response — designed for Chennai, Trivandrum, and Bengaluru.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Safar AI route recommendations with confidence scoring",
                  "Realtime community reports & verified safety zones",
                  "One-tap SOS with WhatsApp emergency alerts",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-[#A1A1AA]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink to="/login" className="mt-8">
                Open Safar Dashboard
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "AI Routes", value: "4 types", color: "#3B82F6" },
                { label: "Live Maps", value: "Realtime", color: "#22C55E" },
                { label: "SOS Shield", value: "24/7", color: "#EF4444" },
                { label: "Cities", value: "3 live", color: "#EC4899" },
              ].map((tile) => (
                <div
                  key={tile.label}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[#111111]/80 p-4"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">{tile.label}</p>
                  <p className="mt-1 text-xl font-bold" style={{ color: tile.color }}>
                    {tile.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-[#262626]/60 py-8 text-center text-xs text-[#71717A]">
        Safar — Travel Smarter. Travel Safer. · Community-powered urban mobility
      </footer>
    </div>
  );
}
