/**
 * Safar Landing Page
 * Motion philosophy: human-designed, purposeful, physical.
 * Reference quality: Stripe · Linear · Arc · Apple · Vercel
 *
 * Principles applied:
 *  – Fewer, better animations over many decorative ones
 *  – Timing variation for organic feel (no mechanical repeating loops)
 *  – Depth over motion (z-layers, not bouncing)
 *  – Every motion serves the product story
 *  – transform + opacity only (60 fps)
 *  – prefers-reduced-motion respected everywhere
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
  useSpring,
  useReducedMotion,
  useMotionValue,
  animate,
  AnimatePresence,
  useInView,
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
  TrendingUp,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────

const METRICS = IS_DEMO_MODE
  ? DEMO_LANDING_METRICS
  : { safeTrips: 1200, communityReports: 48, citiesCovered: CITY_LIST.length, emergencyResponses: 86 };

const FEATURES = [
  { icon: Route,  title: "Route Safety Intelligence",  description: "Corridor-level safety scores across 4 route types with police, hospital, and NCRB crime data.", color: "#3B82F6" },
  { icon: MapPin, title: "Community Heatmap",       description: "Live safety reports from real commuters — vote, verify, and shape city-wide intelligence.",           color: "#22C55E" },
  { icon: Siren,  title: "Emergency Shield",        description: "One-tap SOS, WhatsApp alerts, nearest police & hospitals, and women's helplines at your fingertips.", color: "#EF4444" },
  { icon: Users,  title: "Live Trip Sharing",       description: "Share your journey with family via a public link — no login required for viewers.",                   color: "#EC4899" },
];

const STEPS = [
  { step: "01", icon: Route,      title: "Search your route",       body: "Pick from & to with city-biased autocomplete powered by OpenStreetMap." },
  { step: "02", icon: Shield,     title: "Analyse with Safar",      body: "Review safety scores, corridor insights, and the recommended route for your trip." },
  { step: "03", icon: Navigation, title: "Travel & contribute",     body: "Start live tracking, share your trip, and flag safety issues to help others." },
];

// Realistic Safar notifications — appear → stay → disappear sequentially
const LIVE_NOTIFS = [
  { icon: Shield,       color: "#22C55E", title: "Safer route found",      body: "87% confidence score"        },
  { icon: MapPin,       color: "#3B82F6", title: "Police station nearby",  body: "320m — Arumbakkam PS"        },
  { icon: Users,        color: "#F59E0B", title: "Community report",       body: "Poor lighting at junction"   },
  { icon: Activity,     color: "#22C55E", title: "Hospital 700m away",     body: "Sri Ramachandra Medical"     },
  { icon: Sparkles,     color: "#A78BFA", title: "Route confidence 92%",   body: "Safar verified"              },
  { icon: Siren,        color: "#EF4444", title: "Night travel advisory",  body: "2 active hotspots detected"  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useMouseParallax(ref: React.RefObject<HTMLElement | null>, strength = 10) {
  const reduced = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-1, 1], [strength * 0.5, -strength * 0.5]), { stiffness: 160, damping: 26 });
  const rotY = useSpring(useTransform(mx, [-1, 1], [-strength * 0.5, strength * 0.5]), { stiffness: 160, damping: 26 });

  const onMove = useCallback((e: MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  }, [reduced, ref, mx, my]);

  const onLeave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [ref, onMove, onLeave]);

  return { rotX, rotY, mx, my };
}

// ─── Scroll Progress ──────────────────────────────────────────────────────────

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 400, damping: 40 });
  if (useReducedMotion()) return null;
  return (
    <motion.div
      className="fixed left-0 right-0 top-0 z-[9999] h-[2px] origin-left"
      style={{ scaleX, background: "linear-gradient(90deg, #3B82F6, #8B5CF6, #22C55E)" }}
    />
  );
}

// ─── Cursor Spotlight ─────────────────────────────────────────────────────────

function CursorLight({ parentRef }: { parentRef: React.RefObject<HTMLElement | null> }) {
  const reduced = useReducedMotion();
  const cx = useMotionValue(50);
  const cy = useMotionValue(50);
  const opacity = useSpring(useMotionValue(0), { stiffness: 200, damping: 30 });

  useEffect(() => {
    if (reduced) return;
    const el = parentRef.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      cx.set(((e.clientX - r.left) / r.width) * 100);
      cy.set(((e.clientY - r.top) / r.height) * 100);
      void animate(opacity, 1, { duration: 0.2 });
    };
    const onLeave = () => void animate(opacity, 0, { duration: 0.6 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => { el.removeEventListener("mousemove", onMove); el.removeEventListener("mouseleave", onLeave); };
  }, [parentRef, reduced, cx, cy, opacity]);

  if (reduced) return null;
  return (
    <motion.div className="pointer-events-none absolute inset-0 z-0" style={{ opacity }}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: useTransform(
            [cx, cy],
            ([x, y]) => `radial-gradient(560px circle at ${x}% ${y}%, rgba(59,130,246,0.07), transparent 50%)`
          ),
        }}
      />
    </motion.div>
  );
}

// ─── Route Network Background ─────────────────────────────────────────────────
// Calmed down: no per-node scale loops, slower edge breathing, 2 packet dots only

const NET_NODES = [
  { x: 8,  y: 18 }, { x: 20, y: 42 }, { x: 35, y: 12 }, { x: 52, y: 52 },
  { x: 68, y: 22 }, { x: 83, y: 58 }, { x: 14, y: 68 }, { x: 47, y: 78 },
  { x: 76, y: 76 }, { x: 91, y: 32 }, { x: 31, y: 38 }, { x: 60, y: 62 },
  { x: 43, y: 28 }, { x: 72, y: 45 }, { x: 25, y: 82 }, { x: 88, y: 14 },
];
const NET_EDGES = [[0,1],[0,2],[1,10],[2,12],[12,4],[10,3],[3,11],[4,13],[11,5],[1,6],[6,7],[7,11],[5,8],[8,9],[4,9],[13,5],[2,10],[14,7],[15,9],[12,13],[0,15]];

function RouteNetworkBg({ opacity = 0.5 }: { opacity?: number }) {
  const reduced = useReducedMotion();
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
    >
      <defs>
        <filter id="net-glow">
          <feGaussianBlur stdDeviation="0.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Edges — draw once, then breathe very slowly */}
      {NET_EDGES.map(([a, b], i) => (
        <motion.line
          key={i}
          x1={NET_NODES[a].x} y1={NET_NODES[a].y}
          x2={NET_NODES[b].x} y2={NET_NODES[b].y}
          stroke="#3B82F6" strokeWidth="0.16"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={reduced ? { opacity: 0.08 } : {
            pathLength: [0, 1],
            opacity: [0, 0.12, 0.05, 0.12, 0],
          }}
          transition={{
            pathLength: { duration: 1.0, delay: i * 0.035, ease: "easeOut" },
            opacity: { repeat: Infinity, duration: 9 + (i % 6), delay: i * 0.15, ease: "easeInOut" },
          }}
        />
      ))}

      {/* Nodes — appear once, then hold (no scale loop) */}
      {NET_NODES.map((n, i) => (
        <motion.circle key={i} cx={n.x} cy={n.y} r="0.48" fill="#3B82F6" filter="url(#net-glow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: reduced ? 0.2 : 0.28 }}
          transition={{ duration: 0.6, delay: i * 0.04 }}
        />
      ))}

      {/* 2 packet dots — slow, purposeful traversal */}
      {!reduced && [
        { path: `M${NET_NODES[0].x} ${NET_NODES[0].y} L${NET_NODES[10].x} ${NET_NODES[10].y} L${NET_NODES[3].x} ${NET_NODES[3].y} L${NET_NODES[11].x} ${NET_NODES[11].y} L${NET_NODES[5].x} ${NET_NODES[5].y}`, color: "#22C55E", dur: 11 },
        { path: `M${NET_NODES[2].x} ${NET_NODES[2].y} L${NET_NODES[12].x} ${NET_NODES[12].y} L${NET_NODES[4].x} ${NET_NODES[4].y} L${NET_NODES[13].x} ${NET_NODES[13].y}`, color: "#3B82F6", dur: 8 },
      ].map((t, i) => (
        <motion.circle key={`pkt-${i}`} r="0.7" fill={t.color} opacity={0.65}
          animate={{ offsetDistance: ["0%", "100%"] }}
          style={{ offsetPath: `path("${t.path}")` }}
          transition={{ duration: t.dur, repeat: Infinity, ease: "linear", delay: i * 2.5 }}
        />
      ))}
    </svg>
  );
}

// ─── Ambient Background ───────────────────────────────────────────────────────

function AmbientBg() {
  const reduced = useReducedMotion();
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.018]"
        style={{ backgroundImage: "linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
      <motion.div className="absolute -left-40 -top-40 h-[700px] w-[700px] rounded-full bg-[#3B82F6]/5 blur-[100px]"
        animate={reduced ? {} : { x: [0, 36, 0], y: [0, 20, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute -right-40 top-[30%] h-[550px] w-[550px] rounded-full bg-[#8B5CF6]/[0.035] blur-[90px]"
        animate={reduced ? {} : { x: [0, -24, 0], y: [0, 32, 0] }}
        transition={{ duration: 44, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}

// ─── Story Notification ───────────────────────────────────────────────────────
// Sequential appear → stay → disappear. No orbiting.

function NotificationQueue() {
  const reduced = useReducedMotion();
  const [idx, setIdx] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const seqRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduced) return;

    let notifIdx = 0;

    const show = () => {
      setIdx(notifIdx % LIVE_NOTIFS.length);
      setVisible(true);

      // stay 3.8s then exit
      seqRef.current = setTimeout(() => {
        setVisible(false);

        // gap between notifications: 1.0s
        seqRef.current = setTimeout(() => {
          notifIdx++;
          show();
        }, 1000);
      }, 3800);
    };

    // first notification after 2s
    seqRef.current = setTimeout(show, 2000);

    return () => {
      if (seqRef.current) clearTimeout(seqRef.current);
    };
  }, [reduced]);

  if (reduced || idx === null) return null;

  const notif = LIVE_NOTIFS[idx];
  const Icon = notif.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 14, y: 0, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 14, scale: 0.96 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -right-2 top-10 z-20 flex w-[156px] items-center gap-2.5 rounded-2xl border border-[#ffffff07] bg-[#0c0c18]/96 px-3 py-2.5 shadow-2xl backdrop-blur-xl sm:-right-16"
        >
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: notif.color + "18" }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: notif.color }} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold text-white">{notif.title}</p>
            <p className="truncate text-[9px] text-[#71717A]">{notif.body}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Hero App Mockup ──────────────────────────────────────────────────────────
// Product-realistic: shows the actual UI state, story told by notifications.

function AppMockup({ rotX, rotY }: { rotX: ReturnType<typeof useSpring>; rotY: ReturnType<typeof useSpring> }) {
  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useInView(containerRef, { margin: "-10%" });

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-[300px]">
      {/* Notification queue — lives outside the phone frame */}
      <NotificationQueue />

      {/* Depth glow */}
      <div className="absolute -inset-8 rounded-full bg-[#3B82F6]/08 blur-3xl" />

      <motion.div
        style={reduced ? {} : { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
      >
        {/* App frame */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 28, scale: 0.92, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          transition={{ delay: 0.5, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[24px] border border-[#ffffff06] bg-gradient-to-b from-[#13131f] to-[#0a0a12] shadow-[0_32px_80px_-16px_rgba(0,0,0,0.85)]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-[10px] font-bold text-[#71717A]">9:41</span>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-4 rounded-sm bg-[#22C55E]/70" />
              <div className="h-1.5 w-1 rounded-sm bg-[#71717A]" />
            </div>
          </div>

          {/* Search bar */}
          <div className="mx-3 mt-2 flex items-center gap-2 rounded-xl bg-[#1a1a28] px-3 py-2.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-[#71717A]">From</p>
              <p className="truncate text-[11px] font-bold text-white">Central Station</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#2a2a3a]" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-[#71717A]">To</p>
              <p className="truncate text-[11px] font-bold text-white">Tech Park</p>
            </div>
          </div>

          {/* Map area */}
          <div className="relative mx-3 mt-2 h-[100px] overflow-hidden rounded-xl bg-[#0d0d18]">
            <RouteNetworkBg opacity={0.55} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0d0d18]/60" />
            {/* Route draws in once when visible */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
              <motion.path
                d="M 12 82 C 28 55 55 38 88 18"
                stroke="#22C55E" strokeWidth="2.5" fill="none" strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isVisible ? { pathLength: 1, opacity: 0.9 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 1.2, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              />
              {/* Origin */}
              <motion.circle cx="12" cy="82" r="4" fill="#3B82F6"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 1.0, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "12px 82px" }}
              />
              {/* Destination */}
              <motion.circle cx="88" cy="18" r="4" fill="#EF4444"
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ delay: 2.0, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformOrigin: "88px 18px" }}
              />
            </svg>
          </div>

          {/* Route card — slides in after route draws */}
          <div className="mx-3 mt-2 mb-3">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(3px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 2.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 rounded-xl border border-[#22C55E]/20 bg-[#22C55E]/06 p-3"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/14">
                <Shield className="h-4 w-4 text-[#22C55E]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-white">Safest Route</p>
                  <motion.p
                    className="text-[11px] font-bold tabular-nums text-[#22C55E]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.4 }}
                  >
                    87/100
                  </motion.p>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[#1e1e2a]">
                  <motion.div
                    className="h-full rounded-full bg-[#22C55E]"
                    initial={{ width: 0 }}
                    animate={{ width: "87%" }}
                    transition={{ duration: 0.9, delay: 2.5, ease: "easeOut" }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-[10px] text-[#71717A]">14 min</span>
            </motion.div>

            {/* Safar badge */}
            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.0, duration: 0.4 }}
              className="mt-2 flex items-center gap-1.5 rounded-xl bg-[#3B82F6]/06 px-3 py-1.5"
            >
              <Sparkles className="h-3 w-3 text-[#3B82F6]" />
              <p className="text-[10px] font-semibold text-[#93C5FD]">Safar recommends this route</p>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── Feature Card — cursor tilt + specular light ──────────────────────────────

function FeatureCard({ f, i }: { f: typeof FEATURES[0]; i: number }) {
  const reduced = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const [hovered, setHovered] = useState(false);

  // max 4° tilt — elegant, not aggressive
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-4, 4]), { stiffness: 260, damping: 28 });
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [3, -3]), { stiffness: 260, damping: 28 });

  // Specular highlight follows cursor
  const specularBg = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(130px circle at ${(x as number) * 100}% ${(y as number) * 100}%, ${f.color}11, transparent 65%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    setHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={reduced ? false : { opacity: 0, y: 24, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      style={reduced ? {} : {
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        transformPerspective: 900,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative overflow-hidden rounded-2xl border border-[#1c1c26] bg-gradient-to-b from-[#12121c] to-[#090910] p-6 cursor-default"
    >
      {/* Specular light follows cursor */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{ background: reduced ? "none" : specularBg }}
      />

      {/* Border glow on hover */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        style={{ boxShadow: `inset 0 0 0 1px ${f.color}22, 0 16px 48px -12px ${f.color}18` }}
      />

      {/* Content lifted slightly on hover */}
      <motion.div
        animate={reduced ? {} : { y: hovered ? -2 : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        style={{ transformStyle: "preserve-3d", translateZ: 4 }}
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${f.color}16` }}
        >
          <f.icon className="h-5.5 w-5.5 h-[22px] w-[22px]" style={{ color: f.color }} />
        </div>
        <h3 className="mt-4 text-[15px] font-bold text-white">{f.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6e6e82]">{f.description}</p>
      </motion.div>
    </motion.div>
  );
}

// ─── Step Connector ───────────────────────────────────────────────────────────
// Draws once. No repeating moving dots.

function StepConnector({ idx }: { idx: number }) {
  const reduced = useReducedMotion();
  if (idx >= STEPS.length - 1) return null;
  return (
    <div className="hidden items-center justify-center md:flex">
      <svg width="80" height="2" viewBox="0 0 80 2">
        <motion.line x1="0" y1="1" x2="80" y2="1"
          stroke="#3B82F6" strokeWidth="1" strokeDasharray="5 4"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.25 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 + idx * 0.15 }}
        />
      </svg>
    </div>
  );
}

// ─── Stat Card — completion ring + tick ──────────────────────────────────────

function StatCard({ label, value, suffix, color, icon: Icon, delay }: {
  label: string; value: number; suffix: string; color: string; icon: typeof Route; delay: number;
}) {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      onAnimationComplete={() => setTimeout(() => setDone(true), 900)}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col items-center gap-2.5 overflow-hidden bg-[#07070f] px-6 py-8"
    >
      {/* Completion glow — fires once */}
      <AnimatePresence>
        {done && !reduced && (
          <motion.div
            key="glow"
            initial={{ opacity: 0.5, scale: 0.5 }}
            animate={{ opacity: 0, scale: 2.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeOut" }}
            className="absolute inset-0 rounded-full blur-3xl"
            style={{ backgroundColor: color + "14" }}
          />
        )}
      </AnimatePresence>

      {/* Icon with completion ring */}
      <div className="relative">
        <svg
          className="absolute -inset-1.5 -rotate-90"
          width="56" height="56" viewBox="0 0 56 56"
          style={{ transformOrigin: "28px 28px" }}
        >
          <motion.circle
            cx="28" cy="28" r="24"
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={done ? { pathLength: 1, opacity: 0.35 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 1.1, ease: "easeOut" }}
          />
        </svg>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: color + "14" }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>

      <motion.p
        className="text-3xl font-bold tabular-nums text-white md:text-4xl"
        style={done && !reduced ? { textShadow: `0 0 24px ${color}38` } : {}}
      >
        <CountUp value={value} suffix={suffix} />
      </motion.p>

      {/* Label with subtle checkmark on done */}
      <div className="flex items-center gap-1.5">
        <AnimatePresence>
          {done && !reduced && (
            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <CheckCircle2 className="h-3 w-3" style={{ color }} />
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#71717A]">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Command Center ───────────────────────────────────────────────────────────
// Natural counter variation. No robotic setInterval.

function CommandCenter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { rotX, rotY } = useMouseParallax(containerRef, 7);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LIVE = [
    { label: "Routes Analyzed", color: "#3B82F6", base: 247 },
    { label: "Active Trips",    color: "#22C55E", base: 31  },
    { label: "Safety Reports",  color: "#A78BFA", base: 148 },
    { label: "SOS Alerts",      color: "#EF4444", base: 12  },
  ];
  const [counts, setCounts] = useState(LIVE.map((c) => c.base));

  useEffect(() => {
    if (reduced) return;

    const tick = () => {
      // Only update 1–2 random counters per tick (not all at once)
      setCounts((prev) => prev.map((v, i) => {
        if (Math.random() > 0.45) return v; // ~55% chance to skip
        const delta = Math.random() < 0.65 ? 1 : -1;
        return Math.max(LIVE[i].base - 3, Math.min(LIVE[i].base + 8, v + delta));
      }));
      // Random interval: 2.5–5s
      timerRef.current = setTimeout(tick, 2500 + Math.random() * 2500);
    };

    timerRef.current = setTimeout(tick, 3000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [reduced]);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center" style={{ perspective: "1600px" }}>
      <motion.div
        style={reduced ? {} : { rotateX: rotX, rotateY: rotY, transformStyle: "preserve-3d" }}
        className="relative w-full max-w-[340px]"
      >
        <div className="absolute -inset-10 rounded-full bg-[#3B82F6]/07 blur-3xl" />

        <motion.div
          initial={reduced ? false : { opacity: 0, scale: 0.92, y: 20, filter: "blur(4px)" }}
          whileInView={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[22px] border border-[#3B82F6]/12 bg-gradient-to-b from-[#10101a] to-[#07070f] shadow-[0_48px_120px_-24px_rgba(0,0,0,0.88)]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Chrome bar */}
          <div className="flex items-center gap-2.5 border-b border-[#1a1a28] px-4 py-3">
            <div className="flex gap-1.5">
              {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
                <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c + "99" }} />
              ))}
            </div>
            <span className="ml-2 flex-1 text-center text-[10px] font-semibold text-[#71717A]">
              Safar Command Center
            </span>
            <div className="flex items-center gap-1 rounded-full bg-[#22C55E]/08 px-2 py-0.5">
              <motion.div
                className="h-1.5 w-1.5 rounded-full bg-[#22C55E]"
                animate={reduced ? {} : { opacity: [1, 0.25, 1] }}
                transition={{ repeat: Infinity, duration: 2.2 }}
              />
              <span className="text-[9px] font-bold text-[#22C55E]">LIVE</span>
            </div>
          </div>

          {/* Layer 1 — map (deepest) */}
          <motion.div
            style={reduced ? {} : { translateZ: -8 }}
            className="relative mx-4 mt-4 h-[96px] overflow-hidden rounded-xl border border-[#1a1a28]"
          >
            <div className="absolute inset-0 bg-[#0b0b16]">
              <RouteNetworkBg opacity={0.65} />
            </div>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 200 96" preserveAspectRatio="xMidYMid slice">
              <motion.path d="M 15 78 Q 60 28 115 48 T 188 22"
                stroke="#22C55E" strokeWidth="2.5" fill="none" strokeLinecap="round"
                initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }}
                viewport={{ once: true }} transition={{ duration: 1.8, delay: 0.6 }} />
              <motion.circle cx="15" cy="78" r="5" fill="#3B82F6"
                initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                viewport={{ once: true }} transition={{ delay: 0.5, duration: 0.35 }}
                style={{ transformOrigin: "15px 78px" }} />
              <motion.circle cx="188" cy="22" r="5" fill="#EF4444"
                initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                viewport={{ once: true }} transition={{ delay: 1.8, duration: 0.35 }}
                style={{ transformOrigin: "188px 22px" }} />
            </svg>
            <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#0b0b16] to-transparent" />
          </motion.div>

          {/* Layer 2 — score */}
          <motion.div
            style={reduced ? {} : { translateZ: 6 }}
            className="mx-4 mt-3 flex items-center gap-3 rounded-xl border border-[#1a1a28] bg-[#0d0d18] px-3 py-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#22C55E]/12">
              <Shield className="h-4 w-4 text-[#22C55E]" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-[11px] font-bold">
                <span className="text-[#A1A1AA]">Safety Score</span>
                <span className="text-[#22C55E]">87/100</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#1a1a28]">
                <motion.div className="h-full rounded-full bg-[#22C55E]"
                  initial={{ width: 0 }} whileInView={{ width: "87%" }}
                  viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.9 }} />
              </div>
            </div>
          </motion.div>

          {/* Layer 3 — live counters (closest) */}
          <motion.div
            style={reduced ? {} : { translateZ: 16 }}
            className="mx-4 mb-4 mt-3 grid grid-cols-2 gap-2"
          >
            {LIVE.map((c, i) => (
              <motion.div key={c.label}
                initial={reduced ? false : { opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + i * 0.06, duration: 0.35 }}
                className="rounded-xl border border-[#1a1a28] bg-[#0a0a14] p-2.5"
              >
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#52526a]">{c.label}</p>
                <motion.p
                  className="mt-0.5 text-base font-bold tabular-nums"
                  style={{ color: c.color }}
                  key={counts[i]}
                  animate={{ opacity: [0.6, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  {counts[i]}
                </motion.p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Floating AI badge */}
        <motion.div
          style={reduced ? {} : { translateZ: 30 }}
          initial={reduced ? false : { opacity: 0, x: 14, y: -10 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.2, duration: 0.45 }}
          className="absolute -right-5 -top-4 flex items-center gap-2 rounded-2xl border border-[#3B82F6]/20 bg-[#0a0a16]/94 px-3 py-2 shadow-xl backdrop-blur-sm"
        >
          <Activity className="h-3.5 w-3.5 text-[#3B82F6]" />
          <div>
            <p className="text-[9px] font-semibold text-[#71717A]">Powered by</p>
            <p className="text-[10px] font-bold text-white">Safar</p>
          </div>
        </motion.div>

        {/* Floating realtime badge */}
        <motion.div
          style={reduced ? {} : { translateZ: 24 }}
          initial={reduced ? false : { opacity: 0, x: -14, y: 10 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 1.4, duration: 0.45 }}
          className="absolute -bottom-4 -left-5 flex items-center gap-2 rounded-2xl border border-[#22C55E]/20 bg-[#0a0a16]/94 px-3 py-2 shadow-xl backdrop-blur-sm"
        >
          <Zap className="h-3.5 w-3.5 text-[#22C55E]" />
          <div>
            <p className="text-[9px] font-semibold text-[#71717A]">Supabase</p>
            <p className="text-[10px] font-bold text-[#86EFAC]">Realtime</p>
          </div>
        </motion.div>

        {/* NCRB badge */}
        <motion.div
          style={reduced ? {} : { translateZ: 20 }}
          initial={reduced ? false : { opacity: 0, scale: 0.82 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1.6, duration: 0.4 }}
          className="absolute left-1/2 -top-7 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-[#A78BFA]/20 bg-[#0a0a16]/94 px-3 py-1.5 backdrop-blur-sm"
        >
          <TrendingUp className="h-3 w-3 text-[#A78BFA]" />
          <span className="text-[10px] font-bold text-white">NCRB verified</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: "Is Safar free to use?",
    a: "Yes — Safar is completely free for commuters. Sign up with your email, start planning safer routes, and contribute community safety reports at no cost.",
  },
  {
    q: "How does Safar calculate safety scores?",
    a: "Safar combines five real data sources: NCRB city-level crime statistics (official government data), OpenStreetMap police station and hospital proximity, crowdsourced community safety reports, estimated lighting coverage, and time-of-day risk factors. Every route gets a unique corridor-level profile — not a generic city score.",
  },
  {
    q: "Which cities are supported?",
    a: `Safar currently covers ${CITY_LIST.map((c) => c.name).join(", ")}. We are actively expanding to more Indian cities.`,
  },
  {
    q: "How do community safety reports work?",
    a: "Any signed-in user can file a safety report (poor lighting, harassment, unsafe bus stop, etc.) pinned to a location. Other users can verify reports, increasing their confidence score. Reports feed directly into route safety scoring in real time.",
  },
  {
    q: "What is the Emergency Shield feature?",
    a: "Emergency Shield lets you send a WhatsApp SOS alert with your live location to your saved emergency contacts, see the nearest police stations and hospitals, and access national women's helpline numbers — all from a single tap.",
  },
  {
    q: "Does Safar work offline?",
    a: "Safar is a Progressive Web App (PWA) with offline caching. Your last searched routes and safety data are available offline. Live maps and real-time reports require an internet connection.",
  },
  {
    q: "Is my data private and secure?",
    a: "Yes. Safar uses Supabase with Row-Level Security (RLS) so you only see and edit your own data. We never sell personal data. Location is only accessed when you explicitly use route planning or emergency features.",
  },
];

function FAQItem({
  item, i, isOpen, onToggle, panelId, triggerId,
}: {
  item: typeof FAQS[0]; i: number; isOpen: boolean;
  onToggle: () => void; panelId: string; triggerId: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ delay: i * 0.055, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      style={isOpen ? { boxShadow: "0 0 0 1px #3b82f618, 0 4px 24px #3b82f60e" } : {}}
      className={[
        "overflow-hidden rounded-2xl border transition-all duration-200",
        isOpen
          ? "border-[#3B82F6]/22 bg-gradient-to-b from-[#0e1423] to-[#090d18]"
          : "border-[#1e1e2a] bg-[#08080f] hover:border-[#2a2a38] hover:bg-[#0b0b14]",
      ].join(" ")}
    >
      <button
        id={triggerId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        className="flex w-full items-start justify-between gap-4 px-5 py-[18px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]/55 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
      >
        <span className={["text-[14px] font-semibold leading-snug transition-colors duration-150", isOpen ? "text-white" : "text-[#d4d4e0]"].join(" ")}>
          {item.q}
        </span>
        <motion.div
          animate={reduced ? {} : { rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
          className="mt-0.5 shrink-0" aria-hidden="true"
        >
          <ChevronDown className={["h-[18px] w-[18px] transition-colors duration-150", isOpen ? "text-[#3B82F6]" : "text-[#52526a]"].join(" ")} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={panelId} role="region" aria-labelledby={triggerId} key="panel"
            initial={reduced ? false : { height: 0, opacity: 0, y: -5 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={reduced ? {} : { height: 0, opacity: 0, y: -4 }}
            transition={{
              height:  { duration: 0.27, ease: [0.4, 0, 0.2, 1] },
              opacity: { duration: 0.2, ease: "easeOut" },
              y:       { duration: 0.2, ease: "easeOut" },
            }}
          >
            <div className="flex px-5 pb-5 pt-0">
              <div className="mr-4 mt-0.5 w-[2px] shrink-0 rounded-full bg-gradient-to-b from-[#3B82F6]/55 to-transparent" />
              <p className="text-[13.5px] leading-[1.65] text-[#8e8ea0]">{item.a}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function FAQSection() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const toggle = (i: number) => setActiveIdx((p) => (p === i ? null : i));

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 text-center"
      >
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#262636]/80 bg-[#0f0f1a]/80 px-4 py-2 text-xs font-semibold text-[#3B82F6] backdrop-blur-md">
          <HelpCircle className="h-3.5 w-3.5 shrink-0" />
          Frequently Asked Questions
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Everything you need to know</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-[#71717A]">
          Can't find your answer? Reach us via the community reports inside the app.
        </p>
      </motion.div>

      <div className="space-y-2" role="list">
        {FAQS.map((item, i) => (
          <FAQItem key={item.q} item={item} i={i}
            isOpen={activeIdx === i}
            onToggle={() => toggle(i)}
            triggerId={`faq-trigger-${i}`}
            panelId={`faq-panel-${i}`}
          />
        ))}
      </div>

      <motion.div
        initial={reduced ? false : { opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.25, duration: 0.45 }}
        className="mt-10 flex flex-col items-center gap-3"
      >
        <p className="text-sm text-[#71717A]">Ready to travel safer?</p>
        <ButtonLink to="/login" size="lg">
          Get started — it's free
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </motion.div>
    </section>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function LandingPage() {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const heroInnerRef = useRef<HTMLDivElement>(null);
  const { rotX: heroRotX, rotY: heroRotY } = useMouseParallax(heroInnerRef, 5);

  const navBg     = useTransform(scrollY, [0, 100], ["rgba(5,5,8,0)",     "rgba(8,8,14,0.92)"]);
  const navBlur   = useTransform(scrollY, [0, 100], ["blur(0px)",         "blur(20px)"]);
  const navBorder = useTransform(scrollY, [0, 100], ["rgba(38,38,50,0)",  "rgba(38,38,50,0.7)"]);
  const heroY     = useTransform(scrollY, [0, 400], [0, -36]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050508] text-white">
      <ScrollProgress />
      <AmbientBg />

      {/* ── Navbar ── */}
      <motion.header
        style={reduced ? {} : { backgroundColor: navBg, backdropFilter: navBlur, borderColor: navBorder }}
        className="fixed inset-x-0 top-2 z-50 mx-3 rounded-2xl border sm:mx-6 lg:mx-auto lg:max-w-5xl"
      >
        <div className="flex h-14 items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <motion.div
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3B82F6]/14"
              whileHover={reduced ? {} : { scale: 1.08 }}
              transition={{ type: "spring", stiffness: 500, damping: 24 }}
            >
              <Shield className="h-4 w-4 text-[#3B82F6]" />
            </motion.div>
            <span className="text-[15px] font-bold tracking-tight">Safar</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
              className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[#A1A1AA] transition hover:text-white sm:flex"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              FAQ
            </button>
            <Link to="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-[#A1A1AA] transition hover:text-white sm:block">
              Sign in
            </Link>
            <motion.div whileHover={reduced ? {} : { scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <ButtonLink to="/login" size="sm">Get started</ButtonLink>
            </motion.div>
          </nav>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section ref={heroRef} className="relative overflow-hidden">
        <CursorLight parentRef={heroRef as React.RefObject<HTMLElement | null>} />

        {/* Background network — lower opacity, less busy */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.28]">
          <RouteNetworkBg />
        </div>

        {/* Single top beam — architectural */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/35 to-transparent" />

        <div
          ref={heroInnerRef}
          className="mx-auto grid max-w-5xl items-center gap-12 px-6 pb-24 pt-36 sm:pt-44 lg:grid-cols-[1fr_400px] lg:gap-16"
        >
          {/* LEFT — text */}
          <motion.div
            style={reduced ? {} : { y: heroY }}
            className="flex flex-col items-center text-center lg:items-start lg:text-left"
          >
            {/* Badge — static after entrance, no repeating scale */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 8, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#262636]/90 bg-[#0f0f1a]/90 px-4 py-2 text-xs font-semibold text-[#3B82F6] backdrop-blur-md"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Community-powered mobility for India
            </motion.div>

            {/* H1 — line-level stagger, blur → sharp */}
            <h1 className="text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-[64px]">
              {[
                { text: "Travel Smarter.", blue: false },
                { text: "Travel Safer.",  blue: true  },
              ].map((line, li) => (
                <motion.span
                  key={li}
                  className={`block ${line.blue ? "text-[#3B82F6]" : ""}`}
                  initial={reduced ? false : { opacity: 0, y: 28, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.08 + li * 0.16, duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                >
                  {line.text}
                </motion.span>
              ))}
            </h1>

            {/* Subheading */}
            <motion.p
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.48, duration: 0.48 }}
              className="mt-6 max-w-md text-[15px] leading-relaxed text-[#A1A1AA]"
            >
              Safer routes, smart safety analysis, community heatmaps, and emergency tools —
              built for Indian commuters with real NCRB data.
            </motion.p>

            {/* CTA — clean, no bouncing arrow */}
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62, duration: 0.42 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <motion.div whileHover={reduced ? {} : { scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
                <ButtonLink to="/login" size="lg" className="shadow-lg shadow-[#3B82F6]/20">
                  Start planning routes
                  <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </motion.div>
              <motion.div whileHover={reduced ? {} : { scale: 1.02 }}>
                <Link to="/login"
                  className="flex items-center gap-2 rounded-xl border border-[#262636] px-5 py-2.5 text-sm font-semibold text-[#A1A1AA] transition hover:border-[#3B82F6]/35 hover:text-white">
                  <Navigation className="h-4 w-4" />
                  Live demo
                </Link>
              </motion.div>
            </motion.div>

            {/* City chips */}
            <motion.div
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
              className="mt-7 flex flex-wrap justify-center gap-2 lg:justify-start"
            >
              {CITY_LIST.map((c, i) => (
                <motion.span key={c.id}
                  initial={reduced ? false : { opacity: 0, scale: 0.84 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.92 + i * 0.06, duration: 0.35 }}
                  className="flex items-center gap-1.5 rounded-full border border-[#1e1e30]/80 bg-[#0f0f1a]/70 px-3 py-1 text-[11px] font-semibold text-[#71717A] backdrop-blur-sm"
                >
                  <MapPin className="h-2.5 w-2.5 text-[#3B82F6]" />
                  {c.name}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          {/* RIGHT — mockup */}
          <div className="hidden lg:block" style={{ perspective: "1200px" }}>
            <AppMockup rotX={heroRotX} rotY={heroRotY} />
          </div>
          <div className="lg:hidden" style={{ perspective: "900px" }}>
            <AppMockup rotX={heroRotX} rotY={heroRotY} />
          </div>
        </div>
      </section>

      {/* ── Statistics ── */}
      <div className="border-y border-[#1e1e2a] bg-[#07070f]/92">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px bg-[#1e1e2a] md:grid-cols-4">
          {[
            { label: "Safe Trips",          value: METRICS.safeTrips,          suffix: "+", color: "#22C55E", icon: Route  },
            { label: "Community Reports",   value: METRICS.communityReports,   suffix: "+", color: "#3B82F6", icon: Users  },
            { label: "Cities Live",         value: METRICS.citiesCovered,      suffix: "",  color: "#EC4899", icon: MapPin },
            { label: "Emergency Responses", value: METRICS.emergencyResponses, suffix: "+", color: "#EF4444", icon: Siren  },
          ].map((m, i) => (
            <StatCard key={m.label} {...m} delay={i * 0.07} />
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="text-sm font-semibold tracking-wide text-[#3B82F6]">Platform Features</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">Built for safer Indian commutes</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-[#71717A]">
            Every feature grounded in real data — NCRB crime statistics, OpenStreetMap infrastructure, and community intelligence.
          </p>
        </motion.div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2" style={{ perspective: "900px" }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.title} f={f} i={i} />)}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="border-t border-[#1e1e2a] bg-[#07070f]/70 py-24">
        <div className="mx-auto max-w-5xl px-6">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-sm font-semibold tracking-wide text-[#3B82F6]">How Safar Works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Three steps to safer travel</h2>
          </motion.div>

          <div className="mt-14 grid items-start md:grid-cols-5">
            {STEPS.map((s, i) => (
              <div key={s.step} className="contents">
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.18, duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                  className="md:col-span-1"
                >
                  <div className="flex flex-col items-center text-center py-4">
                    {/* Clean numbered icon — no repeating pulse */}
                    <div className="relative mb-5 flex h-14 w-14 items-center justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#3B82F6]/18 bg-[#3B82F6]/07">
                        <s.icon className="h-6 w-6 text-[#3B82F6]" />
                      </div>
                      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#3B82F6] text-[9px] font-bold text-white">
                        {i + 1}
                      </span>
                    </div>
                    <h3 className="text-[15px] font-bold text-white">{s.title}</h3>
                    <p className="mt-2 px-2 text-sm text-[#71717A]">{s.body}</p>
                  </div>
                </motion.div>
                <div className="hidden md:flex md:col-span-1 items-start pt-9">
                  <StepConnector idx={i} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Command Center ── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-[#3B82F6]/10 bg-gradient-to-br from-[#0e0e18] via-[#090910] to-[#050508]"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3B82F6]/40 to-transparent" />
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-[#3B82F6]/05 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[#22C55E]/04 blur-3xl" />

          <div className="grid gap-12 px-8 py-12 md:grid-cols-2 md:items-center md:px-12">
            <div>
              <motion.p initial={reduced ? false : { opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="text-sm font-semibold tracking-wide text-[#3B82F6]">
                Premium Product Showcase
              </motion.p>
              <motion.h2 initial={reduced ? false : { opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: 0.16 }}
                className="mt-2 text-3xl font-bold tracking-tight">
                Safar Command Center
              </motion.h2>
              <motion.p initial={reduced ? false : { opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: 0.22 }}
                className="mt-4 text-sm leading-relaxed text-[#71717A]">
                A unified dashboard for route planning, safety analysis, community heatmaps,
                live trip tracking, and emergency response.
              </motion.p>
              <ul className="mt-6 space-y-3">
                {[
                  "Safar route recommendations with confidence scoring",
                  "Realtime community reports & verified safety zones",
                  "One-tap SOS with WhatsApp emergency alerts",
                ].map((item, i) => (
                  <motion.li key={item}
                    initial={reduced ? false : { opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.09 }}
                    className="flex items-start gap-2.5 text-sm text-[#A1A1AA]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
                    {item}
                  </motion.li>
                ))}
              </ul>
              <motion.div initial={reduced ? false : { opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: 0.6 }}
                whileHover={reduced ? {} : { scale: 1.02, y: -1 }}
                className="mt-8 inline-block">
                <ButtonLink to="/login">
                  Open Safar Dashboard <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </motion.div>
            </div>
            <CommandCenter />
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── Footer ── */}
      <footer className="border-t border-[#1e1e2a] py-10">
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto flex max-w-5xl flex-col items-center gap-3 px-6 text-center"
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#3B82F6]" />
            <span className="text-sm font-bold text-white">Safar</span>
          </div>
          <p className="text-xs text-[#71717A]">
            Travel Smarter. Travel Safer. · Community-powered urban mobility for India
          </p>
          <p className="text-[11px] text-[#3a3a4a]">
            Built with Supabase · OpenStreetMap · NCRB Crime Data · Framer Motion
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
