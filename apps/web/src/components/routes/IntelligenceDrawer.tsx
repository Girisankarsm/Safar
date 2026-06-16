import { IntelligencePanel } from "@/components/routes/intelligence-panel";
import type { PlannedRoute } from "@/types/database";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, X } from "lucide-react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  route: PlannedRoute;
  starting: boolean;
  onStart: () => void;
};

export function IntelligenceTrigger({
  score,
  onClick,
  className,
  compact = false,
}: {
  score: number;
  onClick: () => void;
  className?: string;
  /** Icon-only — for map overlay */
  compact?: boolean;
}) {
  const scoreColor =
    score >= 80 ? "#22C55E" : score >= 55 ? "#F59E0B" : "#EF4444";

  if (compact) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`Open route intelligence — ${score} out of 100`}
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/95 shadow-lg backdrop-blur-md transition hover:border-[#3B82F6]/40",
          className
        )}
      >
        <Shield className="h-5 w-5" style={{ color: scoreColor }} />
        <span
          className="absolute -right-1 -top-1 min-w-[1.25rem] rounded-md px-1 py-0.5 text-[10px] font-bold tabular-nums text-white"
          style={{ backgroundColor: scoreColor }}
        >
          {score}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open route intelligence"
      className={cn(
        "flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/95 px-3 py-2 shadow-lg backdrop-blur-md transition hover:border-[#3B82F6]/40",
        className
      )}
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${scoreColor}18` }}
      >
        <Shield className="h-4 w-4" style={{ color: scoreColor }} />
      </span>
      <span className="text-left leading-tight">
        <span className="block text-[10px] font-bold uppercase tracking-wide text-[var(--text-dim)]">
          Intelligence
        </span>
        <span className="text-sm font-bold tabular-nums text-white">{score}/100</span>
      </span>
    </button>
  );
}

export function IntelligenceDrawer({
  open,
  onClose,
  route,
  starting,
  onStart,
}: Props) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close intelligence panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-black/55 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Route intelligence"
            initial={{ opacity: 0, y: 24, x: 0 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 24, x: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className={cn(
              "fixed z-[100001] flex flex-col overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-panel)] shadow-2xl",
              "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-2xl",
              "lg:inset-x-auto lg:bottom-0 lg:right-0 lg:top-[var(--shell-top)] lg:max-h-none lg:w-[min(100%,380px)] lg:rounded-none lg:rounded-l-2xl lg:border-l lg:border-t-0"
            )}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                  Route intelligence
                </p>
                <p className="text-sm font-semibold text-white">
                  Why {route.safety_score}?
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[var(--text-dim)] transition hover:bg-[var(--bg-surface)] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <IntelligencePanel
              route={route}
              starting={starting}
              onStart={onStart}
              drawer
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
