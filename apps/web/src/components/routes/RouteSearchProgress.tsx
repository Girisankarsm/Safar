import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  MapPin,
  AlertTriangle,
  Shield,
  Star,
  Cpu,
  CheckCircle2,
} from "lucide-react";

const STEPS = [
  { icon: MapPin,        label: "Finding 12 route candidates…",    sub: "OSRM + commercial + transit + safety corridors" },
  { icon: AlertTriangle, label: "Analyzing community hotspots…",   sub: "Decay-weighted incident clustering" },
  { icon: Shield,        label: "Checking police & hospital coverage…", sub: "Overpass API corridor buffer query" },
  { icon: Cpu,           label: "Scoring all corridors…",          sub: "Safety · ETA · Cost · Harassment · Lighting" },
  { icon: Star,          label: "Selecting optimal routes…",        sub: "Multi-objective optimization (40/35/25 balanced)" },
];

const STEP_DURATION = 950; // ms per step

export function RouteSearchProgress() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [done, setDone] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => {
        const next = prev + 1;
        setDone((d) => [...d, prev]);
        if (next >= STEPS.length) clearInterval(interval);
        return next;
      });
    }, STEP_DURATION);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-sm px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3B82F6]/15 ring-1 ring-[#3B82F6]/30">
            <Cpu className="h-6 w-6 text-[#3B82F6]" />
          </div>
          <p className="text-[15px] font-bold text-white">Safar Intelligence</p>
          <p className="mt-0.5 text-[11px] text-[var(--text-dim)]">
            Candidate-search optimization engine running
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-2.5">
          {STEPS.map((step, i) => {
            const isDone   = done.includes(i);
            const isActive = activeIdx === i;
            const isPending = !isDone && !isActive;
            const Icon = step.icon;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] px-3.5 py-2.5 transition-all duration-300"
                style={{
                  backgroundColor: isDone
                    ? "rgba(34,197,94,0.06)"
                    : isActive
                    ? "rgba(59,130,246,0.08)"
                    : "var(--bg-surface)",
                  borderColor: isDone
                    ? "rgba(34,197,94,0.25)"
                    : isActive
                    ? "rgba(59,130,246,0.35)"
                    : "var(--border-subtle)",
                }}
              >
                {/* Icon / status */}
                <div
                  className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: isDone
                      ? "rgba(34,197,94,0.15)"
                      : isActive
                      ? "rgba(59,130,246,0.15)"
                      : "rgba(255,255,255,0.05)",
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                    >
                      <Icon className="h-3.5 w-3.5 text-[#3B82F6]" />
                    </motion.div>
                  ) : (
                    <Icon className="h-3.5 w-3.5 text-[var(--text-dim)]" />
                  )}
                </div>

                {/* Text */}
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[12px] font-semibold leading-tight"
                    style={{
                      color: isDone ? "#86EFAC" : isActive ? "white" : "var(--text-dim)",
                    }}
                  >
                    {step.label}
                  </p>
                  <AnimatePresence>
                    {(isActive || isDone) && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-0.5 text-[10px] text-[var(--text-dim)]"
                      >
                        {step.sub}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Active pulse */}
                {isActive && (
                  <motion.div
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]"
                    animate={{ opacity: [1, 0.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#3B82F6] to-[#22C55E]"
            animate={{ width: `${Math.min(100, ((activeIdx + done.length) / (STEPS.length * 2)) * 100 + done.length * (100 / STEPS.length))}%` }}
            transition={{ duration: 0.4 }}
            style={{ width: `${(done.length / STEPS.length) * 100}%` }}
          />
        </div>
        <p className="mt-1.5 text-center text-[10px] text-[var(--text-dim)]">
          {done.length} / {STEPS.length} complete
        </p>
      </div>
    </div>
  );
}
