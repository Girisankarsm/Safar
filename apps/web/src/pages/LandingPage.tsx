/**
 * Safar Landing Page — premium, human-designed, trust-first.
 * Reference: Linear · Notion · Stripe · Apple · Airbnb
 */

import { ButtonLink } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { DEMO_LANDING_METRICS } from "@/lib/demo-hackathon";
import { CITY_LIST } from "@/config/cities";
import { IS_DEMO_MODE } from "@/lib/config";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  AnimatePresence,
  useInView,
} from "framer-motion";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Database,
  Lightbulb,
  MapPin,
  Shield,
  ShieldCheck,
  Siren,
  Users,
  Route,
  CheckCircle2,
  Navigation,
  AlertTriangle,
  Phone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useRef, useState } from "react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const METRICS = IS_DEMO_MODE
  ? DEMO_LANDING_METRICS
  : { safeTrips: 1200, communityReports: 48, citiesCovered: CITY_LIST.length, emergencyResponses: 86 };

const ROUTE_OPTIONS = [
  { id: "balanced", label: "Balanced Route", score: 72, eta: "18 min", color: "#64748B" },
  { id: "safest", label: "Safest Route", score: 89, eta: "22 min", color: "#22C55E", recommended: true },
  { id: "women", label: "Women-Friendly Route", score: 92, eta: "24 min", color: "#EC4899" },
  { id: "cheapest", label: "Cheapest Route", score: 64, eta: "15 min", color: "#F59E0B" },
] as const;

const OUTCOMES = [
  {
    icon: Shield,
    headline: "Know which road is safer before you travel",
    body: "Compare up to four route types with corridor-level safety scores — not generic city averages.",
    proof: "Safety scores 64–92 on real Chennai routes",
  },
  {
    icon: MapPin,
    headline: "See where incidents were reported recently",
    body: "Community reports for poor lighting, harassment, and unsafe stops appear on the heatmap in real time.",
    proof: "48+ verified reports across 4 cities",
  },
  {
    icon: Siren,
    headline: "Get help quickly during emergencies",
    body: "One-tap SOS, nearest police and hospitals, and women's helpline numbers — without digging through settings.",
    proof: "Emergency contacts ready in under 3 taps",
  },
  {
    icon: Users,
    headline: "Share your trip so someone knows you're safe",
    body: "Send a live trip link to family. They see your route without needing a Safar account.",
    proof: "Works from any phone browser",
  },
];

const TRUST_SOURCES = [
  {
    icon: Database,
    title: "NCRB Crime Data",
    what: "Official crime statistics published by India's National Crime Records Bureau, city and district level.",
    how: "Safar uses NCRB indices as a baseline layer — roughly 25% of each route's safety score.",
    why: "Government-published data, not scraped rumours. You can verify sources in-app.",
  },
  {
    icon: Users,
    title: "Community Reports",
    what: "Safety reports filed by commuters — poor lighting, harassment, road damage, and more.",
    how: "Reports near your route are weighted by recency, verifications, and report type severity.",
    why: "Street-level reality updates faster than annual government datasets.",
  },
  {
    icon: Building2,
    title: "OpenStreetMap Infrastructure",
    what: "Police stations, hospitals, street lighting proxies, and road network data from OSM.",
    how: "Safar measures how close help is along each corridor and flags poorly lit stretches.",
    why: "Open, auditable map data used by millions of navigation products worldwide.",
  },
  {
    icon: Route,
    title: "Realtime Route Analysis",
    what: "Live scoring as you search — time of day, departure hour, and corridor profile combined.",
    how: "Each route gets a radar profile: safety, speed, cost, infrastructure, and confidence.",
    why: "The same trip at 6 PM and 10 PM gets different recommendations.",
  },
];

const STORY_STEPS = [
  {
    icon: Navigation,
    title: "A student searches her route home",
    detail: "T Nagar → Anna Nagar, departing 9 PM. Safar pulls four route candidates instantly.",
  },
  {
    icon: AlertTriangle,
    title: "Safar flags a harassment report",
    detail: "A verified report near the fastest road causes that corridor's score to drop.",
  },
  {
    icon: Lightbulb,
    title: "She picks a better-lit alternative",
    detail: "Women-Friendly Route scores 92 — avoids the hotspot, adds 6 minutes, passes 2 hospitals.",
  },
  {
    icon: Phone,
    title: "Emergency contacts stay one tap away",
    detail: "She shares the live trip link with her roommate and keeps SOS ready on the trip screen.",
  },
];

const PIPELINE = [
  "User Search",
  "Route Engine",
  "Safety Analysis",
  "Community Intelligence",
  "Infrastructure Analysis",
  "Route Ranking",
  "Safar Recommendation",
];

const FAQS = [
  {
    q: "Is Safar free to use?",
    a: "Yes. Create an account with your email, plan routes, file safety reports, and use emergency tools at no cost.",
  },
  {
    q: "How does Safar calculate safety scores?",
    a: "Five inputs: NCRB city crime index, OSM police/hospital proximity, community reports on your corridor, lighting estimates, and departure time. Each route gets its own profile — not one score for the whole city.",
  },
  {
    q: "Which cities are supported?",
    a: `Safar covers ${CITY_LIST.map((c) => c.name).join(", ")} today, with more cities planned.`,
  },
  {
    q: "How do community reports work?",
    a: "Signed-in users pin reports to a location. Others verify them, which raises confidence. Reports feed route scoring within minutes via Supabase realtime.",
  },
  {
    q: "What happens when I tap SOS?",
    a: "Emergency Shield opens nearest police and hospitals, women's helplines, and lets you send a WhatsApp alert with your live location to saved contacts.",
  },
  {
    q: "Is my location data private?",
    a: "Location is only used when you search routes, track a trip, or use emergency features. Supabase Row-Level Security keeps your data scoped to your account.",
  },
];

const EASE = [0.22, 1, 0.36, 1] as const;

// ─── Route comparison mockup (hero) ───────────────────────────────────────────

function RouteComparisonMockup() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-5%" });
  const [activeId, setActiveId] = useState<string>("safest");
  const active = ROUTE_OPTIONS.find((r) => r.id === activeId) ?? ROUTE_OPTIONS[1];

  return (
    <div ref={ref} className="mx-auto w-full max-w-[380px]">
      <div className="overflow-hidden rounded-2xl border border-[#22222c] bg-[#0c0c10] shadow-[0_24px_64px_-24px_rgba(0,0,0,0.7)]">
        {/* Chrome */}
        <div className="flex items-center justify-between border-b border-[#1a1a22] px-4 py-3">
          <div className="flex items-center gap-2">
            <img src="/safar-logo.png" alt="" className="h-5 w-5 rounded-md object-cover" />
            <span className="text-[11px] font-semibold text-[#a1a1aa]">Route comparison · Chennai</span>
          </div>
          <span className="rounded-md bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-semibold text-[#22C55E]">Live</span>
        </div>

        {/* Search strip */}
        <div className="border-b border-[#1a1a22] px-4 py-3">
          <div className="flex items-center gap-2 text-[11px]">
            <div className="flex-1 rounded-lg bg-[#141418] px-3 py-2">
              <p className="text-[9px] font-medium uppercase tracking-wide text-[#52525b]">From</p>
              <p className="font-semibold text-white">T Nagar</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#3f3f46]" />
            <div className="flex-1 rounded-lg bg-[#141418] px-3 py-2">
              <p className="text-[9px] font-medium uppercase tracking-wide text-[#52525b]">To</p>
              <p className="font-semibold text-white">Anna Nagar</p>
            </div>
          </div>
        </div>

        {/* Map + route line */}
        <div className="relative h-[120px] border-b border-[#1a1a22] bg-[#09090d]">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 120" preserveAspectRatio="none">
            <motion.path
              key={activeId}
              d={
                activeId === "safest"
                  ? "M 30 95 Q 120 40 200 55 T 330 25"
                  : activeId === "women"
                    ? "M 30 95 Q 90 70 160 45 T 330 30"
                    : activeId === "cheapest"
                      ? "M 30 95 L 330 20"
                      : "M 30 95 Q 160 60 330 35"
              }
              fill="none"
              stroke={active.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={reduced ? false : { pathLength: 0, opacity: 0.4 }}
              animate={inView ? { pathLength: 1, opacity: 1 } : {}}
              transition={{ duration: 0.55, ease: EASE }}
            />
            <circle cx="30" cy="95" r="5" fill="#3B82F6" />
            <circle cx="330" cy={activeId === "cheapest" ? 20 : activeId === "safest" ? 25 : 30} r="5" fill="#EF4444" />
          </svg>
        </div>

        {/* Route cards */}
        <div className="space-y-1.5 p-3">
          {ROUTE_OPTIONS.map((route) => {
            const selected = route.id === activeId;
            return (
              <button
                key={route.id}
                type="button"
                onClick={() => setActiveId(route.id)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all duration-200",
                  selected
                    ? "border-[#2a2a36] bg-[#141418] shadow-sm"
                    : "border-transparent bg-transparent hover:border-[#1f1f28] hover:bg-[#0f0f14]",
                ].join(" ")}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums text-white"
                  style={{ backgroundColor: route.color + "22", color: route.color }}
                >
                  {route.score}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[12px] font-semibold text-white">{route.label}</p>
                    {"recommended" in route && route.recommended && (
                      <span className="shrink-0 rounded bg-[#22C55E]/12 px-1.5 py-0.5 text-[9px] font-semibold text-[#22C55E]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-[#71717a]">Safety score {route.score} · {route.eta}</p>
                </div>
                {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-[#3B82F6]" />}
              </button>
            );
          })}
        </div>

        {/* Detail panel for selected route */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? {} : { opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="border-t border-[#1a1a22] bg-[#0a0a0e] px-4 py-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-white">{active.label}</p>
              <p className="text-[11px] font-bold tabular-nums" style={{ color: active.color }}>
                {inView ? <CountUp value={active.score} suffix="/100" duration={700} /> : `${active.score}/100`}
              </p>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-[#1a1a22]">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: active.color }}
                initial={{ width: 0 }}
                animate={inView ? { width: `${active.score}%` } : {}}
                transition={{ duration: 0.65, ease: "easeOut", delay: 0.1 }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              {[
                { label: "Police nearby", value: activeId === "cheapest" ? "1 station" : "2 stations" },
                { label: "Hospitals nearby", value: activeId === "women" ? "3 within 1 km" : "2 within 1 km" },
                { label: "Reports avoided", value: activeId === "safest" || activeId === "women" ? "2 hotspots" : "0" },
                { label: "Confidence", value: `${active.score >= 85 ? 91 : active.score >= 70 ? 78 : 62}%` },
              ].map((row) => (
                <div key={row.label} className="rounded-lg bg-[#111116] px-2.5 py-2">
                  <p className="text-[#52525b]">{row.label}</p>
                  <p className="mt-0.5 font-semibold text-[#d4d4d8]">{row.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();

  return (
    <section id="faq" className="mx-auto max-w-2xl px-6 py-20">
      <div className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#71717a]">FAQ</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Common questions</h2>
      </div>

      <div className="divide-y divide-[#1e1e26] rounded-2xl border border-[#1e1e26] bg-[#0a0a0e]">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#0f0f14]"
              >
                <span className="text-[14px] font-medium leading-snug text-[#e4e4e7]">{item.q}</span>
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="mt-0.5 shrink-0"
                >
                  <ChevronDown className="h-4 w-4 text-[#52525b]" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduced ? {} : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-4 text-[13px] leading-relaxed text-[#71717a]">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Pipeline (how it works) ──────────────────────────────────────────────────

function PipelineSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduced = useReducedMotion();

  return (
    <section ref={ref} className="border-t border-[#1a1a22] bg-[#08080c] py-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#71717a]">How it works</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            From search to recommendation
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#71717a]">
            Every route passes through the same analysis pipeline — transparent, repeatable, and auditable.
          </p>
        </div>

        <div className="mt-12 flex flex-col items-center gap-0">
          {PIPELINE.map((step, i) => (
            <div key={step} className="flex flex-col items-center">
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.07, duration: 0.35, ease: EASE }}
                className={[
                  "rounded-xl border px-5 py-3 text-center text-[13px] font-semibold",
                  i === PIPELINE.length - 1
                    ? "border-[#22C55E]/30 bg-[#22C55E]/08 text-[#86efac]"
                    : "border-[#22222c] bg-[#0f0f14] text-[#d4d4d8]",
                ].join(" ")}
              >
                {step}
              </motion.div>
              {i < PIPELINE.length - 1 && (
                <motion.div
                  initial={reduced ? false : { scaleY: 0 }}
                  animate={inView ? { scaleY: 1 } : {}}
                  transition={{ delay: i * 0.07 + 0.05, duration: 0.25 }}
                  className="h-5 w-px origin-top bg-[#2a2a36]"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function LandingPage() {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const navBg = useTransform(scrollY, [0, 80], ["rgba(8,8,12,0)", "rgba(8,8,12,0.88)"]);
  const navBlur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(12px)"]);

  return (
    <div className="relative bg-[#08080c] text-white">
      {/* Nav */}
      <motion.header
        style={reduced ? {} : { backgroundColor: navBg, backdropFilter: navBlur }}
        className="fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[border-color]"
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/safar-logo.png" alt="Safar" className="h-7 w-7 rounded-lg object-cover" />
            <span className="text-[15px] font-semibold tracking-tight">Safar</span>
          </Link>
          <nav className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
              className="hidden rounded-lg px-3 py-2 text-sm text-[#a1a1aa] transition hover:text-white sm:block"
            >
              FAQ
            </button>
            <Link to="/login" className="hidden rounded-lg px-3 py-2 text-sm text-[#a1a1aa] transition hover:text-white sm:block">
              Sign in
            </Link>
            <ButtonLink to="/login" size="sm">Get started</ButtonLink>
          </nav>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="mx-auto grid max-w-5xl items-center gap-12 px-6 pb-16 pt-28 lg:grid-cols-2 lg:gap-16 lg:pb-20 lg:pt-32">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#71717a]">
            Urban safety · {CITY_LIST.length} cities live
          </p>
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[52px]">
            Plan your commute with safety you can verify.
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#a1a1aa]">
            Safar compares routes using government crime data, OpenStreetMap infrastructure, and
            real community reports — so you choose the road, not guess it.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/login" size="lg">
              Start planning routes
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <Link
              to="/login"
              className="inline-flex min-h-12 items-center rounded-xl border border-[#2a2a36] px-5 text-sm font-semibold text-[#a1a1aa] transition hover:border-[#3f3f46] hover:text-white"
            >
              View live demo
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            {CITY_LIST.map((c) => (
              <span
                key={c.id}
                className="rounded-full border border-[#1f1f28] bg-[#0f0f14] px-3 py-1 text-[11px] font-medium text-[#71717a]"
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>
        <RouteComparisonMockup />
      </section>

      {/* Metrics */}
      <section className="border-y border-[#1a1a22] bg-[#0a0a0e]">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-[#1a1a22] md:grid-cols-4">
          {[
            { label: "Safe trips", value: METRICS.safeTrips, suffix: "+", icon: Route },
            { label: "Community reports", value: METRICS.communityReports, suffix: "+", icon: Users },
            { label: "Cities live", value: METRICS.citiesCovered, suffix: "", icon: MapPin },
            { label: "Emergency responses", value: METRICS.emergencyResponses, suffix: "+", icon: Siren },
          ].map((m) => (
            <div key={m.label} className="flex flex-col items-center gap-2 px-4 py-8 text-center">
              <m.icon className="h-4 w-4 text-[#52525b]" />
              <p className="text-2xl font-bold tabular-nums text-white md:text-3xl">
                <CountUp value={m.value} suffix={m.suffix} />
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#52525b]">{m.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#71717a]">Why trust Safar</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Real sources. Clear explanations. No black box.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#71717a]">
            Every score traces back to data you can understand — not a marketing claim.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {TRUST_SOURCES.map((src, i) => (
            <motion.article
              key={src.title}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
              whileHover={reduced ? {} : { y: -2 }}
              className="rounded-2xl border border-[#1e1e26] bg-[#0a0a0e] p-5 transition-shadow duration-200 hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.5)]"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#141418]">
                  <src.icon className="h-4 w-4 text-[#a1a1aa]" />
                </div>
                <h3 className="text-[15px] font-semibold text-white">{src.title}</h3>
              </div>
              <dl className="space-y-2.5 text-[13px] leading-relaxed">
                <div>
                  <dt className="font-medium text-[#52525b]">What it is</dt>
                  <dd className="mt-0.5 text-[#a1a1aa]">{src.what}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[#52525b]">How Safar uses it</dt>
                  <dd className="mt-0.5 text-[#a1a1aa]">{src.how}</dd>
                </div>
                <div>
                  <dt className="font-medium text-[#52525b]">Why you can trust it</dt>
                  <dd className="mt-0.5 text-[#a1a1aa]">{src.why}</dd>
                </div>
              </dl>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Product story */}
      <section className="border-t border-[#1a1a22] bg-[#0a0a0e] py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-12 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#71717a]">A real scenario</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Home at 9 PM. Safar changes the decision.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {STORY_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={reduced ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.35, ease: EASE }}
                className="flex gap-4 rounded-2xl border border-[#1e1e26] bg-[#0c0c10] p-5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#141418]">
                  <step.icon className="h-4 w-4 text-[#71717a]" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-[#52525b]">Step {i + 1}</p>
                  <h3 className="mt-1 text-[14px] font-semibold text-white">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#71717a]">{step.detail}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#71717a]">What you get</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Outcomes, not feature labels</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {OUTCOMES.map((o, i) => (
            <motion.article
              key={o.headline}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.35, ease: EASE }}
              whileHover={reduced ? {} : { y: -3 }}
              className="rounded-2xl border border-[#1e1e26] bg-[#0a0a0e] p-6 transition-shadow duration-200 hover:border-[#2a2a36] hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.6)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#141418]">
                <o.icon className="h-5 w-5 text-[#a1a1aa]" />
              </div>
              <h3 className="text-[16px] font-semibold leading-snug text-white">{o.headline}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-[#71717a]">{o.body}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[11px] font-medium text-[#52525b]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#22C55E]" />
                {o.proof}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <PipelineSection />

      {/* CTA */}
      <section className="border-t border-[#1a1a22] py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Safer commutes start with one route search.
          </h2>
          <p className="mt-3 text-sm text-[#71717a]">
            Free for commuters. Built for Chennai, Bengaluru, Hyderabad, and Trivandrum.
          </p>
          <div className="mt-8">
            <ButtonLink to="/login" size="lg">
              Get started — it's free
              <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      </section>

      <FAQSection />

      <footer className="border-t border-[#1a1a22] py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 text-center">
          <div className="flex items-center gap-2">
            <img src="/safar-logo.png" alt="Safar" className="h-5 w-5 rounded object-cover" />
            <span className="text-sm font-semibold">Safar</span>
          </div>
          <p className="text-xs text-[#52525b]">Travel Smarter. Travel Safer.</p>
          <p className="text-[11px] text-[#3f3f46]">NCRB · OpenStreetMap · Supabase · Community verified</p>
        </div>
      </footer>
    </div>
  );
}
