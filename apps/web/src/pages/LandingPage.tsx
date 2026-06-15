import { ButtonLink } from "@/components/ui/button";
import { CountUp } from "@/components/ui/count-up";
import { DEMO_LANDING_METRICS } from "@/lib/demo-hackathon";
import { CITY_LIST } from "@/config/cities";
import { IS_DEMO_MODE } from "@/lib/config";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
  useMotionValue,
  animate,
} from "framer-motion";
import {
  ArrowRight,
  MapPin,
  Shield,
  Sparkles,
  Siren,
  Users,
  Route,
  CheckCircle2,
  Navigation,
  Activity,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const METRICS = IS_DEMO_MODE
  ? DEMO_LANDING_METRICS
  : { safeTrips: 1200, communityReports: 48, citiesCovered: CITY_LIST.length, emergencyResponses: 86 };

const FEATURES = [
  { icon: Route, title: "AI Route Intelligence", description: "Compare 4 route types with corridor-level safety scores, AI analysis, and police/hospital proximity data.", color: "#3B82F6" },
  { icon: MapPin, title: "Community Heatmap", description: "Live safety reports from real commuters — vote, verify, and shape city-wide intelligence.", color: "#22C55E" },
  { icon: Siren, title: "Emergency Shield", description: "One-tap SOS, WhatsApp alerts, nearest police & hospitals, and women's helplines.", color: "#EF4444" },
  { icon: Users, title: "Live Trip Sharing", description: "Share your journey with family via a public link — no login required for viewers.", color: "#EC4899" },
];

const STEPS = [
  { step: "01", title: "Search your route", body: "Pick from & to with city-biased autocomplete powered by OpenStreetMap." },
  { step: "02", title: "Compare with Safar AI", body: "Review safety scores, AI insights, and the recommended corridor for your trip." },
  { step: "03", title: "Travel & contribute", body: "Start live tracking, share your trip, and flag safety issues to help others." },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useMouseParallax(ref: React.RefObject<HTMLElement | null>, strength = 12) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useSpring(useTransform(y, [-1, 1], [strength / 2, -strength / 2]), { stiffness: 220, damping: 30 });
  const rotY = useSpring(useTransform(x, [-1, 1], [-strength / 2, strength / 2]), { stiffness: 220, damping: 30 });

  const onMove = useCallback((e: MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(((e.clientX - r.left) / r.width) * 2 - 1);
    y.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }, [reduced, ref, x, y]);

  const onLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [ref, onMove, onLeave]);

  return { rotX, rotY };
}

// ─── Route Network Background (SVG-based, GPU-friendly) ──────────────────────

const NODES = [
  { x: 8, y: 20 }, { x: 22, y: 45 }, { x: 38, y: 15 }, { x: 55, y: 55 },
  { x: 70, y: 25 }, { x: 85, y: 60 }, { x: 15, y: 70 }, { x: 48, y: 80 },
  { x: 78, y: 80 }, { x: 92, y: 35 }, { x: 33, y: 40 }, { x: 62, y: 65 },
];
const EDGES = [[0,1],[0,2],[1,10],[2,10],[2,4],[10,3],[3,11],[4,5],[11,5],[1,6],[6,7],[7,11],[5,8],[8,9],[4,9]];

function RouteNetworkBg() {
  const reduced = useReducedMotion();
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="nodeglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Edges */}
      {EDGES.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={NODES[a].x} y1={NODES[a].y}
          x2={NODES[b].x} y2={NODES[b].y}
          stroke="#3B82F6"
          strokeWidth="0.15"
          initial={{ opacity: 0, pathLength: 0 }}
          animate={reduced ? { opacity: 0.08 } : {
            opacity: [0.04, 0.12, 0.04],
            pathLength: [0, 1],
          }}
          transition={{
            opacity: { repeat: Infinity, duration: 4 + (i % 3), delay: i * 0.15, ease: "easeInOut" },
            pathLength: { duration: 1.5, delay: i * 0.06, ease: "easeOut" },
          }}
        />
      ))}
      {/* Nodes */}
      {NODES.map((n, i) => (
        <motion.circle
          key={i}
          cx={n.x} cy={n.y} r={reduced ? 0.4 : 0.5}
          fill="#3B82F6"
          initial={{ opacity: 0, scale: 0 }}
          animate={reduced ? { opacity: 0.25 } : {
            opacity: [0.2, 0.7, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            opacity: { repeat: Infinity, duration: 3 + (i % 4), delay: i * 0.2, ease: "easeInOut" },
            scale: { repeat: Infinity, duration: 3 + (i % 4), delay: i * 0.2, ease: "easeInOut" },
            default: { duration: 0.6, delay: i * 0.05 },
          }}
        />
      ))}
      {/* Moving packet dot along one edge */}
      {!reduced && (
        <motion.circle r="0.6" fill="#22C55E"
          animate={{ offsetDistance: ["0%", "100%"] }}
          style={{ offsetPath: `path("M ${NODES[1].x} ${NODES[1].y} L ${NODES[10].x} ${NODES[10].y} L ${NODES[3].x} ${NODES[3].y} L ${NODES[11].x} ${NODES[11].y} L ${NODES[5].x} ${NODES[5].y}")` }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          opacity={0.7}
        />
      )}
    </svg>
  );
}

// ─── Scroll Progress Bar ──────────────────────────────────────────────────────

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[9999] h-[2px] origin-left bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E]"
      style={{ scaleX }}
    />
  );
}

// ─── Animated section wrapper ────────────────────────────────────────────────

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.section
      initial={reduced ? false : { opacity: 0, y: 40, rotateX: 6, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 1200 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Feature Card 3D ─────────────────────────────────────────────────────────

function FeatureCard({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? {} : {
        y: -10,
        rotateX: 3,
        rotateY: -2,
        scale: 1.02,
        boxShadow: `0 24px 64px -12px ${f.color}30, 0 0 0 1px ${f.color}20`,
      }}
      style={{ transformStyle: "preserve-3d", perspective: "900px" }}
      className="surface-card relative cursor-default overflow-hidden rounded-2xl p-6 transition-shadow"
    >
      {/* Ambient color wash on hover */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: `radial-gradient(circle at 30% 30%, ${f.color}10, transparent 70%)` }}
      />
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${f.color}18` }}
      >
        <f.icon className="h-6 w-6" style={{ color: f.color }} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-white">{f.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#A1A1AA]">{f.description}</p>
    </motion.div>
  );
}

// ─── Animated Route Line between steps ───────────────────────────────────────

function StepConnector({ idx }: { idx: number }) {
  const reduced = useReducedMotion();
  if (idx >= STEPS.length - 1) return null;
  return (
    <div className="hidden items-center justify-center md:flex">
      <svg width="80" height="24" viewBox="0 0 80 24" className="overflow-visible">
        <motion.line
          x1="0" y1="12" x2="80" y2="12"
          stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="6 4"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.5 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 + idx * 0.15, ease: "easeOut" }}
        />
        {/* Moving dot */}
        {!reduced && (
          <motion.circle r="4" fill="#3B82F6"
            initial={{ cx: 0, opacity: 0 }}
            whileInView={{ cx: [0, 80], opacity: [0, 1, 0] }}
            viewport={{ once: true }}
            transition={{ duration: 1.8, delay: 1 + idx * 0.2, ease: "easeInOut", times: [0, 0.5, 1] }}
          />
        )}
      </svg>
    </div>
  );
}

// ─── Command Center floating dashboard ───────────────────────────────────────

function CommandCenter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { rotX, rotY } = useMouseParallax(containerRef, 10);

  const LIVE_COUNTERS = [
    { label: "Routes Analyzed", color: "#3B82F6", end: 247 },
    { label: "Active Trips", color: "#22C55E", end: 31 },
    { label: "Safety Reports", color: "#A78BFA", end: 148 },
    { label: "SOS Responses", color: "#EF4444", end: 12 },
  ];

  const [counts, setCounts] = useState(LIVE_COUNTERS.map((c) => c.end));

  useEffect(() => {
    if (reduced) return;
    const interval = setInterval(() => {
      setCounts((prev) => prev.map((v, i) => {
        const delta = Math.floor(Math.random() * 3) - 1;
        return Math.max(LIVE_COUNTERS[i].end - 5, v + delta);
      }));
    }, 2400);
    return () => clearInterval(interval);
  }, [reduced]);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center"
      style={{ perspective: "1400px" }}
    >
      <motion.div
        style={reduced ? {} : { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-sm"
      >
        {/* Background glow */}
        <div className="absolute -inset-12 rounded-full bg-[#3B82F6]/08 blur-3xl" />

        {/* Dashboard frame */}
        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.92, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative overflow-hidden rounded-2xl border border-[#3B82F6]/20 bg-gradient-to-br from-[#111118] to-[#080810] shadow-2xl"
        >
          {/* Header bar */}
          <div className="flex items-center gap-2 border-b border-[#1e1e2a] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#EF4444]/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#22C55E]/70" />
            </div>
            <span className="ml-2 text-[11px] font-semibold text-[#71717A]">Safar Command Center</span>
            <div className="ml-auto flex items-center gap-1 rounded-full bg-[#22C55E]/10 px-2 py-0.5">
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"
                animate={reduced ? {} : { opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.4 }}
              />
              <span className="text-[9px] font-bold text-[#22C55E]">LIVE</span>
            </div>
          </div>

          {/* Map preview (Layer 1 — deepest) */}
          <motion.div
            style={reduced ? {} : { translateZ: -8 }}
            className="relative mx-4 mt-4 overflow-hidden rounded-xl border border-[#1e1e2a]"
          >
            <div className="h-[90px] bg-gradient-to-br from-[#0d1117] to-[#0a0f1a]">
              <svg className="h-full w-full opacity-30" viewBox="0 0 200 90" preserveAspectRatio="xMidYMid slice">
                {/* Fake road grid */}
                {[20, 40, 60, 80, 120, 150, 170].map((x) => (
                  <line key={x} x1={x} y1="0" x2={x} y2="90" stroke="#3B82F6" strokeWidth="0.5" opacity="0.4" />
                ))}
                {[20, 45, 70].map((y) => (
                  <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="#3B82F6" strokeWidth="0.5" opacity="0.4" />
                ))}
                {/* Route line */}
                <motion.path
                  d="M 20 70 Q 60 20 120 45 T 185 25"
                  stroke="#22C55E" strokeWidth="2" fill="none" strokeLinecap="round"
                  initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }} transition={{ duration: 1.6, delay: 0.8 }}
                />
                <circle cx="20" cy="70" r="4" fill="#3B82F6" />
                <circle cx="185" cy="25" r="4" fill="#EF4444" />
              </svg>
            </div>
          </motion.div>

          {/* Score layer (Layer 2) */}
          <motion.div
            style={reduced ? {} : { translateZ: 4 }}
            className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-[#1e1e2a] bg-[#0f0f16] px-3 py-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22C55E]/15">
              <Shield className="h-4 w-4 text-[#22C55E]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#A1A1AA]">Safety Score</span>
                <span className="text-sm font-bold text-[#22C55E]">87/100</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#1e1e2a]">
                <motion.div
                  className="h-full rounded-full bg-[#22C55E]"
                  initial={{ width: 0 }} whileInView={{ width: "87%" }}
                  viewport={{ once: true }} transition={{ duration: 1, delay: 1 }}
                />
              </div>
            </div>
          </motion.div>

          {/* Live counters (Layer 3 — closest) */}
          <motion.div
            style={reduced ? {} : { translateZ: 12 }}
            className="mx-4 mb-4 mt-3 grid grid-cols-2 gap-2"
          >
            {LIVE_COUNTERS.map((c, i) => (
              <motion.div
                key={c.label}
                initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="rounded-xl border border-[#1e1e2a] bg-[#0d0d14] p-2.5"
              >
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">{c.label}</p>
                <motion.p
                  className="mt-0.5 text-base font-bold tabular-nums"
                  style={{ color: c.color }}
                  key={counts[i]}
                  animate={{ opacity: [0.5, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  {counts[i]}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating badge — top right */}
        <motion.div
          style={reduced ? {} : { translateZ: 24 }}
          initial={reduced ? false : { opacity: 0, x: 20, y: -10 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="absolute -right-4 -top-4 flex items-center gap-1.5 rounded-full border border-[#3B82F6]/30 bg-[#0d0d18]/90 px-3 py-1.5 shadow-xl backdrop-blur-md"
        >
          <Activity className="h-3 w-3 text-[#3B82F6]" />
          <span className="text-[10px] font-bold text-white">Safar AI</span>
        </motion.div>

        {/* Floating badge — bottom left */}
        <motion.div
          style={reduced ? {} : { translateZ: 20 }}
          initial={reduced ? false : { opacity: 0, x: -20, y: 10 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.4, duration: 0.5 }}
          className="absolute -bottom-4 -left-4 flex items-center gap-1.5 rounded-full border border-[#22C55E]/30 bg-[#0d0d18]/90 px-3 py-1.5 shadow-xl backdrop-blur-md"
        >
          <Zap className="h-3 w-3 text-[#22C55E]" />
          <span className="text-[10px] font-bold text-[#86EFAC]">Realtime</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── 3D Hero CTA Card ─────────────────────────────────────────────────────────

function HeroCTACard() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { rotX, rotY } = useMouseParallax(ref, 8);
  const z = useSpring(useMotionValue(0), { stiffness: 280, damping: 30 });

  const onEnter = () => { if (!reduced) void animate(z, 20, { duration: 0.25 }); };
  const onLeave = () => { void animate(z, 0, { duration: 0.3 }); };

  return (
    <div ref={ref} onMouseEnter={onEnter} onMouseLeave={onLeave} style={{ perspective: "900px" }}>
      <motion.div
        style={reduced ? {} : { rotateX: rotX, rotateY: rotY, translateZ: z, transformStyle: "preserve-3d" }}
        className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
      >
        <ButtonLink to="/login" size="lg" className="group relative overflow-hidden shadow-lg shadow-[#3B82F6]/25">
          <span className="relative z-10 flex items-center gap-2">
            Start planning routes
            <motion.span
              className="inline-block"
              animate={reduced ? {} : { x: [0, 3, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            >
              <ArrowRight className="h-4 w-4" />
            </motion.span>
          </span>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-[#2563EB] to-[#3B82F6]"
            initial={{ x: "-100%" }}
            whileHover={{ x: 0 }}
            transition={{ duration: 0.3 }}
          />
        </ButtonLink>
        <Link
          to="/login"
          className="flex items-center gap-2 rounded-xl border border-[#262626] px-5 py-2.5 text-sm font-semibold text-[#A1A1AA] transition hover:border-[#3B82F6]/40 hover:text-white"
        >
          <Navigation className="h-4 w-4" />
          Live demo
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Ambient background ───────────────────────────────────────────────────────

function AmbientBg() {
  const reduced = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)", backgroundSize: "64px 64px" }}
      />
      {/* Slow gradient orbs */}
      <motion.div
        className="absolute -left-32 -top-32 h-[600px] w-[600px] rounded-full bg-[#3B82F6] opacity-[0.06] blur-3xl"
        animate={reduced ? {} : { x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-32 top-1/2 h-[500px] w-[500px] rounded-full bg-[#8B5CF6] opacity-[0.05] blur-3xl"
        animate={reduced ? {} : { x: [0, -25, 0], y: [0, 30, 0] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[#22C55E] opacity-[0.04] blur-3xl"
        animate={reduced ? {} : { scale: [1, 1.15, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function LandingPage() {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const headerBg = useTransform(scrollY, [0, 80], ["rgba(5,5,5,0)", "rgba(8,8,12,0.88)"]);
  const headerBlur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(18px)"]);
  const headerBorder = useTransform(scrollY, [0, 80], ["rgba(38,38,38,0)", "rgba(38,38,38,0.7)"]);
  const heroRef = useRef<HTMLElement>(null);

  // Word-by-word reveal for hero headline
  const heroWords = ["Travel", "Smarter.", "Travel", "Safer."];
  const heroColors = [false, false, false, true]; // last word gets blue

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <ScrollProgress />
      <AmbientBg />

      {/* ── Navbar ── */}
      <motion.header
        style={reduced ? {} : { backgroundColor: headerBg, backdropFilter: headerBlur, borderColor: headerBorder }}
        className="fixed inset-x-0 top-2 z-50 mx-4 rounded-2xl border sm:mx-8 lg:mx-auto lg:max-w-5xl"
      >
        <div className="flex h-14 items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]/15"
              whileHover={reduced ? {} : { scale: 1.08, backgroundColor: "rgba(59,130,246,0.25)" }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Shield className="h-4 w-4 text-[#3B82F6]" />
            </motion.div>
            <span className="text-[15px] font-bold tracking-tight">Safar</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              to="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#A1A1AA] transition hover:text-white sm:block"
            >
              Sign in
            </Link>
            <motion.div whileHover={reduced ? {} : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <ButtonLink to="/login" size="sm">
                Get started
              </ButtonLink>
            </motion.div>
          </nav>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-36 text-center sm:pt-44"
      >
        {/* Route network lives behind hero text */}
        <div className="absolute inset-0 opacity-40">
          <RouteNetworkBg />
        </div>

        {/* Badge */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mb-8 inline-flex items-center gap-2 rounded-full border border-[#262626]/80 bg-[#111111]/80 px-4 py-2 text-xs font-semibold text-[#3B82F6] backdrop-blur-md"
        >
          <motion.span
            animate={reduced ? {} : { rotate: [0, 15, -15, 0] }}
            transition={{ repeat: Infinity, duration: 4, delay: 2 }}
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
          </motion.span>
          Community-powered mobility for India
        </motion.div>

        {/* H1 — word-by-word reveal */}
        <h1 className="relative text-5xl font-bold tracking-tight md:text-7xl">
          {heroWords.map((word, i) => (
            <motion.span
              key={i}
              initial={reduced ? false : { opacity: 0, y: 20, rotateX: 20 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ delay: 0.15 + i * 0.12, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ display: "inline-block", perspective: "600px", color: heroColors[i] ? "#3B82F6" : undefined }}
              className={i === 2 ? "ml-0 block" : "mr-3"}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        {/* Sub */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="mt-7 max-w-xl text-base leading-relaxed text-[#A1A1AA] sm:text-lg"
        >
          Safar helps Indian commuters choose safer routes with AI-powered corridor analysis,
          community heatmaps, and emergency tools — realtime by design.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.45 }}
          className="mt-10 w-full"
        >
          <HeroCTACard />
        </motion.div>

        {/* City chips */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {CITY_LIST.map((c, i) => (
            <motion.span
              key={c.id}
              initial={reduced ? false : { opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 + i * 0.06 }}
              className="flex items-center gap-1.5 rounded-full border border-[#262626]/70 bg-[#111111]/60 px-3 py-1 text-[11px] font-semibold text-[#71717A] backdrop-blur-sm"
            >
              <MapPin className="h-2.5 w-2.5 text-[#3B82F6]" />
              {c.name}
            </motion.span>
          ))}
        </motion.div>
      </section>

      {/* ── Statistics ── */}
      <motion.section
        initial={reduced ? false : { opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="border-y border-[#1e1e2a] bg-[#080810]/80"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px bg-[#1e1e2a] md:grid-cols-4">
          {[
            { label: "Safe Trips", value: METRICS.safeTrips, suffix: "+", color: "#22C55E", icon: Route },
            { label: "Community Reports", value: METRICS.communityReports, suffix: "+", color: "#3B82F6", icon: Users },
            { label: "Cities Live", value: METRICS.citiesCovered, suffix: "", color: "#EC4899", icon: MapPin },
            { label: "Emergency Responses", value: METRICS.emergencyResponses, suffix: "+", color: "#EF4444", icon: Siren },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.45 }}
              className="flex flex-col items-center justify-center gap-2 bg-[#080810] px-6 py-8"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${m.color}14` }}>
                <m.icon className="h-4.5 w-4.5" style={{ color: m.color }} />
              </div>
              <motion.p
                className="text-3xl font-bold tabular-nums text-white md:text-4xl"
                whileInView={{ opacity: [0.4, 1] }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.07 }}
              >
                <CountUp value={m.value} suffix={m.suffix} />
              </motion.p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#71717A]">{m.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* ── Feature Cards ── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <Section className="text-center">
          <p className="text-sm font-semibold tracking-wide text-[#3B82F6]">Platform Features</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Built for safer Indian commutes</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#71717A]">
            Every feature grounded in real data — NCRB crime statistics, OpenStreetMap infrastructure, and community intelligence.
          </p>
        </Section>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-[#1e1e2a] bg-[#080810]/60 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <Section className="text-center">
            <p className="text-sm font-semibold tracking-wide text-[#3B82F6]">How Safar Works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">Three steps to safer travel</h2>
          </Section>
          <div className="mt-14 grid items-start gap-0 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <>
                <motion.div
                  key={s.step}
                  initial={reduced ? false : { opacity: 0, y: 24, rotateX: 8 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.18, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformPerspective: 800 }}
                  className="relative md:col-span-1"
                >
                  <div className="flex flex-col items-center text-center">
                    {/* Step number with pulse ring */}
                    <div className="relative mb-4 flex h-14 w-14 items-center justify-center">
                      <motion.div
                        className="absolute inset-0 rounded-full border border-[#3B82F6]/30"
                        animate={reduced ? {} : { scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.5 }}
                      />
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#3B82F6]/25 bg-[#3B82F6]/10">
                        <span className="text-sm font-bold text-[#3B82F6]">{s.step}</span>
                      </div>
                    </div>
                    <h3 className="text-[15px] font-bold text-white">{s.title}</h3>
                    <p className="mt-2 text-sm text-[#71717A]">{s.body}</p>
                  </div>
                </motion.div>
                {/* Connector line between steps */}
                <div key={`conn-${i}`} className="hidden items-center justify-center md:flex">
                  <StepConnector idx={i} />
                </div>
              </>
            ))}
          </div>
        </div>
      </section>

      {/* ── Command Center Showcase ── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-[#3B82F6]/15 bg-gradient-to-br from-[#0d1117] via-[#0a0a12] to-[#050508]"
        >
          {/* Gradient top edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/50 to-transparent" />

          <div className="grid gap-12 px-8 py-12 md:grid-cols-2 md:items-center md:px-12">
            {/* Left: text */}
            <div>
              <motion.p
                initial={reduced ? false : { opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-sm font-semibold tracking-wide text-[#3B82F6]"
              >
                Premium Product Showcase
              </motion.p>
              <motion.h2
                initial={reduced ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.18 }}
                className="mt-2 text-3xl font-bold tracking-tight text-white"
              >
                Safar Command Center
              </motion.h2>
              <motion.p
                initial={reduced ? false : { opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.25 }}
                className="mt-4 text-sm leading-relaxed text-[#71717A]"
              >
                A unified dashboard for route planning, AI safety analysis, community heatmaps,
                live trip tracking, and emergency response.
              </motion.p>
              <ul className="mt-6 space-y-3">
                {[
                  "Safar AI route recommendations with confidence scoring",
                  "Realtime community reports & verified safety zones",
                  "One-tap SOS with WhatsApp emergency alerts",
                ].map((item, i) => (
                  <motion.li
                    key={item}
                    initial={reduced ? false : { opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-start gap-2.5 text-sm text-[#A1A1AA]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
                    {item}
                  </motion.li>
                ))}
              </ul>
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.65 }}
                whileHover={reduced ? {} : { scale: 1.02 }}
                className="mt-8 inline-block"
              >
                <ButtonLink to="/login">
                  Open Safar Dashboard
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </motion.div>
            </div>

            {/* Right: 3D dashboard */}
            <CommandCenter />
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1e1e2a] py-10 text-center">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#3B82F6]" />
            <span className="text-sm font-bold text-white">Safar</span>
          </div>
          <p className="text-xs text-[#71717A]">
            Travel Smarter. Travel Safer. · Community-powered urban mobility for India
          </p>
          <div className="mt-1 flex gap-6 text-[11px] text-[#71717A]">
            <span>Built with Supabase + OpenStreetMap + NCRB data</span>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
