import { RouteAssistant } from "@/components/routes/RouteAssistant";
import { SafarAIAnalysis } from "@/components/safety/safar-ai-analysis";
import { SafetyScoreBreakdown } from "@/components/safety/safety-score-breakdown";
import { Button } from "@/components/ui/button";
import { generateRouteComparison } from "@/lib/ai-insights";
import { useI18n } from "@/i18n/use-i18n";
import { cn } from "@/lib/utils";
import type { CityId, PlannedRoute } from "@/types/database";
import {
  AlertTriangle,
  Bot,
  Building2,
  ChevronDown,
  Lightbulb,
  Navigation,
  Shield,
  ShoppingBag,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useState, type ReactNode } from "react";

export type IntelligenceTab = "intelligence" | "ask";

function CollapsibleBlock({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
          {title}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-[var(--text-dim)] transition-transform", open && "rotate-180")}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-[var(--border-subtle)]"
          >
            <div className="space-y-2 p-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function IntelligencePanel({
  route,
  allRoutes,
  cityId: city,
  departureHour,
  starting,
  onStart,
  activeTab,
  setActiveTab,
  drawer = false,
}: {
  route: PlannedRoute;
  allRoutes: PlannedRoute[];
  cityId: CityId;
  departureHour?: number;
  starting: boolean;
  onStart: () => void;
  activeTab: IntelligenceTab;
  setActiveTab: (t: IntelligenceTab) => void;
  drawer?: boolean;
}) {
  const { t } = useI18n();
  const cp = route.corridor_profile;
  const scoreColor =
    route.safety_score >= 80 ? "#22C55E" : route.safety_score >= 55 ? "#F59E0B" : "#EF4444";
  const scoreLabel =
    route.safety_score >= 80 ? "Safe" : route.safety_score >= 55 ? "Moderate" : "High Risk";

  const TABS: { id: IntelligenceTab; label: string; icon: typeof Shield }[] = [
    { id: "intelligence", label: "Overview", icon: Shield },
    { id: "ask", label: "Ask Safar", icon: Bot },
  ];

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", drawer && "overflow-hidden")}>
      <div className="flex shrink-0 gap-1 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] p-1.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition",
              activeTab === id
                ? "bg-[#3B82F6]/15 text-white ring-1 ring-[#3B82F6]/25"
                : "text-[var(--text-dim)] hover:bg-[var(--bg-surface)] hover:text-white"
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === "intelligence" && (
            <motion.div
              key="intel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3 p-3"
            >
              {/* Compact score strip */}
              <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] p-3">
                <div
                  className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${scoreColor}14` }}
                >
                  <span className="text-lg font-bold tabular-nums leading-none text-white">
                    {route.safety_score}
                  </span>
                  <span className="text-[9px] text-[var(--text-dim)]">/100</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white">{scoreLabel}</p>
                  {cp && (
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {cp.confidenceScore}% confidence · {route.eta_minutes} min · ₹
                      {route.estimated_cost_inr}
                    </p>
                  )}
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--border-subtle)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${route.safety_score}%`, backgroundColor: scoreColor }}
                    />
                  </div>
                </div>
              </div>

              {/* Corridor pills — single row */}
              {cp && (
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { icon: Shield, label: "Police", value: cp.policeCount, color: "#3B82F6" },
                    { icon: Building2, label: "Hospitals", value: cp.hospitalCount, color: "#22C55E" },
                    { icon: Users, label: "Reports", value: cp.reportCount, color: "#A78BFA" },
                    {
                      icon: AlertTriangle,
                      label: "Hotspots",
                      value: cp.hotspots.length,
                      color: cp.hotspots.length > 0 ? "#EF4444" : "#22C55E",
                    },
                  ].map(({ icon: Icon, label, value, color }) => (
                    <div
                      key={label}
                      className="flex flex-col items-center rounded-lg bg-[var(--bg-surface)] px-1 py-2 text-center"
                    >
                      <Icon className="mb-0.5 h-3.5 w-3.5" style={{ color }} />
                      <p className="text-sm font-bold text-white">{value}</p>
                      <p className="text-[8px] font-medium uppercase tracking-wide text-[var(--text-dim)]">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {cp && (
                <CollapsibleBlock title="Route quality">
                  {(() => {
                    const lightingScore =
                      cp.confidenceScore >= 75 ? "High" : cp.confidenceScore >= 50 ? "Medium" : "Low";
                    const commercialTag =
                      cp.policeCount + cp.hospitalCount >= 4
                        ? "Dense"
                        : cp.policeCount + cp.hospitalCount >= 2
                          ? "Moderate"
                          : "Sparse";
                    const avoided = Math.max(0, 5 - cp.hotspots.length);
                    const trafficLine = route.recommendations?.find((r) => r.startsWith("Traffic:"));
                    const trafficLabel = trafficLine
                      ?.replace("Traffic: ", "")
                      .replace(/\s*\(×[\d.]+\)/, "");

                    return (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { icon: XCircle, label: "Hotspots avoided", value: avoided, color: "#22C55E" },
                          { icon: Shield, label: "Police", value: cp.policeCount, color: "#3B82F6" },
                          { icon: Building2, label: "Hospitals", value: cp.hospitalCount, color: "#22C55E" },
                          { icon: Lightbulb, label: "Lighting", value: lightingScore, color: "#F59E0B" },
                          { icon: ShoppingBag, label: "Commercial", value: commercialTag, color: "#A78BFA" },
                          { icon: TrendingUp, label: "Traffic", value: trafficLabel ?? "Normal", color: "#22C55E" },
                        ].map(({ icon: Icon, label, value, color }) => (
                          <div
                            key={label}
                            className="flex items-center gap-2 rounded-lg bg-[var(--bg)] p-2"
                          >
                            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color }} />
                            <div className="min-w-0">
                              <p className="text-[9px] text-[var(--text-dim)]">{label}</p>
                              <p className="text-xs font-bold text-white">{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CollapsibleBlock>
              )}

              {route.safety_breakdown?.length > 0 && (
                <CollapsibleBlock title="Score breakdown">
                  <SafetyScoreBreakdown
                    score={route.safety_score}
                    breakdown={route.safety_breakdown}
                  />
                </CollapsibleBlock>
              )}

              {allRoutes.length > 1 && (
                <CollapsibleBlock title="Why this route?">
                  <ul className="space-y-1.5">
                    {generateRouteComparison(route, allRoutes).map((line, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#3B82F6]" />
                        <span className="text-[11px] leading-snug text-[var(--text-muted)]">{line}</span>
                      </li>
                    ))}
                  </ul>
                </CollapsibleBlock>
              )}

              <CollapsibleBlock title="Safar AI insight">
                <SafarAIAnalysis route={route} compact />
              </CollapsibleBlock>
            </motion.div>
          )}

          {activeTab === "ask" && (
            <motion.div
              key="ask"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-[min(420px,50dvh)] min-h-[280px] flex-col overflow-hidden lg:h-[calc(100vh-var(--shell-top)-140px)]"
            >
              <RouteAssistant
                route={route}
                allRoutes={allRoutes}
                cityId={city}
                departureHour={departureHour}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-[var(--border-subtle)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button
          className="w-full gap-2 py-2.5 text-sm font-bold"
          onClick={onStart}
          disabled={starting}
        >
          <Navigation className="h-4 w-4" />
          {starting ? t("routes.starting") : t("routes.startTrip")}
        </Button>
      </div>
    </div>
  );
}
