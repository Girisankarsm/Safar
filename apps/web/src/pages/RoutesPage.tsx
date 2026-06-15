import { RoutesSubNav } from "@/components/layout/RoutesSubNav";
import { RouteMap } from "@/components/map/RouteMap";
import { SafarAIAnalysis } from "@/components/safety/safar-ai-analysis";
import { SafetyScoreBreakdown } from "@/components/safety/safety-score-breakdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { recommendRoute } from "@/lib/ai-insights";
import { useI18n } from "@/i18n/use-i18n";
import { routeTypeKey } from "@/i18n/translations";
import { getCityConfig } from "@/config/cities";
import { useAuth } from "@/features/auth";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { PlannedRoute, RouteType } from "@/types/database";
import {
  AlertTriangle,
  Building2,
  Clock,
  IndianRupee,
  MapPin,
  Navigation,
  Route,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ROUTE_COLOR: Record<RouteType, { text: string; bg: string; border: string }> = {
  safest: {
    text: "text-[#22C55E]",
    bg: "bg-[#22C55E]/10",
    border: "border-[#22C55E]/30",
  },
  cheapest: {
    text: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
    border: "border-[#F59E0B]/30",
  },
  balanced: {
    text: "text-[#3B82F6]",
    bg: "bg-[#3B82F6]/10",
    border: "border-[#3B82F6]/30",
  },
  women_friendly: {
    text: "text-[#EC4899]",
    bg: "bg-[#EC4899]/10",
    border: "border-[#EC4899]/30",
  },
};

/** Compact route card for the left list panel */
function RouteListCard({
  route,
  isSelected,
  isRecommended,
  onClick,
}: {
  route: PlannedRoute;
  isSelected: boolean;
  isRecommended: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const c = ROUTE_COLOR[route.route_type];
  const scoreColor =
    route.safety_score >= 80
      ? "#22C55E"
      : route.safety_score >= 55
        ? "#F59E0B"
        : "#EF4444";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl border p-3.5 text-left transition-all duration-150",
        isSelected
          ? "border-[#3B82F6]/50 bg-[#3B82F6]/08 ring-1 ring-[#3B82F6]/20"
          : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[#3B82F6]/30 hover:bg-[var(--bg-surface)]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Shield className={cn("h-3.5 w-3.5 shrink-0", c.text)} />
            <span className="truncate text-[13px] font-semibold text-white">
              {t(routeTypeKey(route.route_type))}
            </span>
          </div>
          {isRecommended && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#3B82F6]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">
              <Sparkles className="h-2.5 w-2.5" />
              {t("routes.safarPick")}
            </span>
          )}
        </div>
        <span
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-bold tabular-nums"
          style={{ backgroundColor: `${scoreColor}14`, color: scoreColor }}
        >
          {route.safety_score}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {route.eta_minutes} min
        </span>
        <span className="flex items-center gap-1">
          <IndianRupee className="h-3 w-3" />
          ₹{route.estimated_cost_inr}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {route.distance_km} km
        </span>
      </div>

      {route.corridor_profile && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              backgroundColor:
                route.corridor_profile.confidenceScore >= 75
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(245,158,11,0.1)",
              color:
                route.corridor_profile.confidenceScore >= 75
                  ? "#86EFAC"
                  : "#FCD34D",
            }}
          >
            {route.corridor_profile.confidenceScore}% conf.
          </span>
          {route.corridor_profile.hotspots.length > 0 ? (
            <span className="rounded-full bg-[#EF4444]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#FCA5A5]">
              {route.corridor_profile.hotspots.length} hotspot
              {route.corridor_profile.hotspots.length > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="rounded-full bg-[#22C55E]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#86EFAC]">
              Clear
            </span>
          )}
        </div>
      )}
    </button>
  );
}

/** Right-panel intelligence section */
function IntelligencePanel({
  route,
  starting,
  onStart,
}: {
  route: PlannedRoute;
  starting: boolean;
  onStart: () => void;
}) {
  const { t } = useI18n();
  const cp = route.corridor_profile;
  const scoreColor =
    route.safety_score >= 80
      ? "#22C55E"
      : route.safety_score >= 55
        ? "#F59E0B"
        : "#EF4444";
  const scoreLabel =
    route.safety_score >= 80 ? "Safe" : route.safety_score >= 55 ? "Moderate" : "High Risk";

  return (
    <div className="flex h-full flex-col">
      {/* Score hero */}
      <div className="border-b border-[var(--border-subtle)] p-5">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
          Safety Intelligence
        </p>
        <div className="flex items-end gap-3">
          <span className="text-4xl font-bold tabular-nums text-white">
            {route.safety_score}
          </span>
          <span className="mb-1 text-lg font-bold text-[var(--text-dim)]">/100</span>
          <span
            className="mb-1 ml-auto rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
            style={{
              backgroundColor: `${scoreColor}18`,
              color: scoreColor,
            }}
          >
            {scoreLabel}
          </span>
        </div>

        {/* Score bar */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <motion.div
            key={route.route_type}
            className="h-full rounded-full"
            style={{ backgroundColor: scoreColor }}
            initial={{ width: 0 }}
            animate={{ width: `${route.safety_score}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {cp && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${cp.confidenceScore}%`,
                  backgroundColor:
                    cp.confidenceScore >= 75
                      ? "#22C55E"
                      : cp.confidenceScore >= 55
                        ? "#F59E0B"
                        : "#EF4444",
                }}
              />
            </div>
            <span className="shrink-0 text-[11px] font-bold text-[var(--text-muted)]">
              {cp.confidenceScore}% confidence
            </span>
          </div>
        )}
      </div>

      {/* Corridor metrics */}
      {cp && (
        <div className="border-b border-[var(--border-subtle)] p-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
            Corridor Profile
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                icon: Shield,
                label: "Police",
                value: cp.policeCount,
                color: "#3B82F6",
              },
              {
                icon: Building2,
                label: "Hospitals",
                value: cp.hospitalCount,
                color: "#22C55E",
              },
              {
                icon: Users,
                label: "Reports",
                value: cp.reportCount,
                color: "#A78BFA",
              },
              {
                icon: AlertTriangle,
                label: "Hotspots",
                value: cp.hotspots.length,
                color: cp.hotspots.length > 0 ? "#EF4444" : "#22C55E",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-lg bg-[var(--bg-surface)] p-2.5"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${color}14` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{value}</p>
                  <p className="text-[10px] text-[var(--text-dim)]">{label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Segment risk bar */}
          {cp.segments.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                Segment Risk
              </p>
              <div className="flex h-3 overflow-hidden rounded-full">
                {(() => {
                  const safeCount = cp.segments.filter((s) => s.riskLevel === "safe").length;
                  const modCount = cp.segments.filter((s) => s.riskLevel === "moderate").length;
                  const riskCount = cp.segments.filter((s) => s.riskLevel === "risk").length;
                  const total = cp.segments.length;
                  return (
                    <>
                      {safeCount > 0 && (
                        <div
                          className="bg-[#22C55E] transition-all"
                          style={{ width: `${(safeCount / total) * 100}%` }}
                          title={`Safe: ${safeCount} segments`}
                        />
                      )}
                      {modCount > 0 && (
                        <div
                          className="bg-[#F59E0B] transition-all"
                          style={{ width: `${(modCount / total) * 100}%` }}
                          title={`Moderate: ${modCount} segments`}
                        />
                      )}
                      {riskCount > 0 && (
                        <div
                          className="bg-[#EF4444] transition-all"
                          style={{ width: `${(riskCount / total) * 100}%` }}
                          title={`High risk: ${riskCount} segments`}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="mt-1.5 flex gap-3 text-[9px] font-semibold text-[var(--text-dim)]">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                  Safe
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" />
                  Moderate
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
                  High
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Safety breakdown */}
      {route.safety_breakdown?.length > 0 && (
        <div className="border-b border-[var(--border-subtle)] p-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
            Risk Breakdown
          </p>
          <div className="space-y-2.5">
            {route.safety_breakdown.map((item, i) => (
              <motion.div
                key={item.factor}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-muted)]">
                    {item.factor}
                    <span className="ml-1 text-[var(--text-dim)]">({item.weight_pct}%)</span>
                  </span>
                  <span className="font-bold text-white">{item.score}</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
                  <motion.div
                    className="h-full rounded-full bg-[#3B82F6]"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.score}%` }}
                    transition={{ delay: 0.15 + i * 0.05, duration: 0.45 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* AI explanation */}
      <div className="flex-1 overflow-y-auto p-5">
        <SafarAIAnalysis route={route} compact />
      </div>

      {/* Start trip CTA */}
      <div className="border-t border-[var(--border-subtle)] p-4">
        <Button
          className="w-full gap-2 py-3 text-sm font-bold shadow-lg shadow-[#3B82F6]/20"
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

export function RoutesPage() {
  const { t } = useI18n();
  const { city } = useCityStore();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<PlannedRoute[]>([]);
  const [search, setSearch] = useState<{
    source: string;
    destination: string;
    departureHour?: number;
  } | null>(null);
  const [selected, setSelected] = useState<PlannedRoute | null>(null);
  const [starting, setStarting] = useState(false);

  const recommendation = useMemo(
    () =>
      routes.length
        ? recommendRoute(routes, {
            womenSafetyMode: profile?.women_safety_mode,
            nightSafePreference: profile?.night_safe_preference,
          })
        : null,
    [routes, profile?.women_safety_mode, profile?.night_safe_preference]
  );

  useEffect(() => {
    const cachedCity = sessionStorage.getItem("safar-routes-city");
    const cached = sessionStorage.getItem("safar-routes");
    const s = sessionStorage.getItem("safar-search");

    if (!cached || cachedCity !== city) {
      setRoutes([]);
      setSelected(null);
      setSearch(null);
      return;
    }

    const parsed = JSON.parse(cached) as PlannedRoute[];
    setRoutes(parsed);
    const rec = recommendRoute(parsed, {
      womenSafetyMode: profile?.women_safety_mode,
      nightSafePreference: profile?.night_safe_preference,
    });
    setSelected(rec?.route ?? parsed[0] ?? null);
    if (s) setSearch(JSON.parse(s));
  }, [city, profile?.women_safety_mode, profile?.night_safe_preference]);

  async function startTrip(route: PlannedRoute) {
    setStarting(true);
    try {
      const trip = await tripsService.start(city, route);
      sessionStorage.setItem("safar-active-trip", trip.id);
      sessionStorage.setItem("safar-active-route", JSON.stringify(route));
      navigate(`/trip/${trip.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not start trip");
    } finally {
      setStarting(false);
    }
  }

  const hasStraightLineCache = routes.some(
    (r) => (r.geometry?.coordinates?.length ?? 0) <= 2
  );

  if (!routes.length) {
    return (
      <div className="px-5 py-8 md:px-8">
        <RoutesSubNav />
        <div className="mt-6">
          <EmptyState
            icon={Route}
            title={t("routes.noRoutes", { city: getCityConfig(city).name })}
            description={t("routes.noRoutesDesc")}
            actionLabel={t("routes.planRoute")}
            actionTo="/home"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--shell-top))] flex-col overflow-hidden">

      {/* Sub-nav strip */}
      <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg)] px-5 py-2 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <RoutesSubNav />
          {search && (
            <p className="hidden truncate text-xs text-[var(--text-dim)] lg:block">
              <MapPin className="mr-1 inline h-3 w-3" />
              {search.source}
              <span className="mx-1.5">→</span>
              {search.destination}
            </p>
          )}
        </div>
      </div>

      {/* Stale cache warning */}
      {hasStraightLineCache && (
        <div className="shrink-0 border-b border-[#F59E0B]/20 bg-[#F59E0B]/08 px-5 py-2 text-xs text-[#FCD34D] md:px-6">
          {t("routes.staleCache")}{" "}
          <Link to="/home" className="font-semibold text-[#F59E0B] underline">
            {t("routes.dashboard")}
          </Link>
        </div>
      )}

      {/* ── Three-column desktop layout ── */}
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[296px_1fr_368px]">

        {/* LEFT — Route list */}
        <aside className="overflow-y-auto border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] lg:border-b-0 lg:border-r lg:border-[var(--border-subtle)]">
          {/* Mobile: horizontal scroll, Desktop: vertical list */}
          <div className="flex gap-3 overflow-x-auto px-4 py-3 lg:flex-col lg:overflow-x-visible lg:px-3 lg:py-4">
            {/* Page header (desktop only) */}
            <div className="hidden lg:block lg:px-1 lg:pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                {t("routes.eyebrow")}
              </p>
              <h1 className="mt-1 text-[15px] font-bold text-white">
                {t("routes.title")}
              </h1>
            </div>

            {routes.map((r) => (
              <div key={r.route_type} className="w-64 shrink-0 lg:w-auto">
                <RouteListCard
                  route={r}
                  isSelected={selected?.route_type === r.route_type}
                  isRecommended={
                    recommendation?.route.route_type === r.route_type
                  }
                  onClick={() => setSelected(r)}
                />
              </div>
            ))}

            {/* Mobile start button */}
            {selected && (
              <div className="hidden shrink-0 pt-1 lg:hidden">
                <Button
                  className="w-64 gap-2"
                  onClick={() => startTrip(selected)}
                  disabled={starting}
                >
                  <Navigation className="h-4 w-4" />
                  {t("routes.startTrip")}
                </Button>
              </div>
            )}
          </div>

          {/* Women safety note */}
          {profile?.women_safety_mode &&
            recommendation?.route.route_type === selected?.route_type && (
              <div className="hidden border-t border-[var(--border-subtle)] px-4 py-3 lg:block">
                <p className="text-[11px] text-[#F9A8D4]">
                  {t("routes.womenMode")}
                </p>
              </div>
            )}
        </aside>

        {/* CENTER — Map hero */}
        <div className="relative flex-1 lg:flex-none">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.route_type}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-[320px] lg:h-full"
              >
                <RouteMap
                  geometry={selected.geometry}
                  source={{ lat: selected.source_lat, lng: selected.source_lng }}
                  destination={{ lat: selected.dest_lat, lng: selected.dest_lng }}
                  sourceName={selected.source_name}
                  destinationName={selected.destination_name}
                  corridorProfile={selected.corridor_profile}
                  height="100%"
                  className="h-full rounded-none"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Route type overlay badge on map */}
          {selected && (
            <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/90 px-3 py-2 backdrop-blur-md">
              <Shield
                className={cn("h-3.5 w-3.5", ROUTE_COLOR[selected.route_type].text)}
              />
              <span className="text-xs font-bold text-white">
                {t(routeTypeKey(selected.route_type))}
              </span>
            </div>
          )}
        </div>

        {/* RIGHT — Intelligence panel */}
        <aside className="intel-panel overflow-y-auto">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.route_type}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <IntelligencePanel
                  route={selected}
                  starting={starting}
                  onStart={() => startTrip(selected)}
                />
              </motion.div>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-center">
                <p className="text-sm text-[var(--text-dim)]">
                  Select a route to see safety intelligence
                </p>
              </div>
            )}
          </AnimatePresence>
        </aside>
      </div>

      {/* Mobile: score breakdown + AI analysis (below map) */}
      {selected && (
        <div className="overflow-y-auto border-t border-[var(--border-subtle)] px-4 py-4 pb-24 lg:hidden">
          <SafetyScoreBreakdown
            score={selected.safety_score}
            breakdown={selected.safety_breakdown}
          />
          <div className="mt-4">
            <SafarAIAnalysis route={selected} />
          </div>
          <Button
            className="mt-4 w-full gap-2 py-3 font-bold"
            onClick={() => startTrip(selected)}
            disabled={starting}
          >
            <Navigation className="h-4 w-4" />
            {starting ? t("routes.starting") : t("routes.startTrip")}
          </Button>
        </div>
      )}
    </div>
  );
}
