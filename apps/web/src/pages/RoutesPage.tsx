import { RoutesSubNav } from "@/components/layout/RoutesSubNav";
import { RouteMap } from "@/components/map/RouteMap";
import { RouteAssistant } from "@/components/routes/RouteAssistant";
import { RouteRiskTimeline } from "@/components/routes/RouteRiskTimeline";
import { SafetyStory } from "@/components/routes/SafetyStory";
import { SafarAIAnalysis } from "@/components/safety/safar-ai-analysis";
import { SafetyScoreBreakdown } from "@/components/safety/safety-score-breakdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { recommendRoute } from "@/lib/ai-insights";
import { sampleRoutePoints, isNearRoute } from "@/lib/route-assistant";
import { useI18n } from "@/i18n/use-i18n";
import { routeTypeKey } from "@/i18n/translations";
import { getCityConfig } from "@/config/cities";
import { useAuth } from "@/features/auth";
import { IS_DEMO_MODE } from "@/lib/config";
import { reportsService } from "@/services/supabase/reports.service";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { CityId, PlannedRoute, RouteType, SafetyReport } from "@/types/database";
import {
  AlertTriangle,
  BookOpen,
  Bot,
  Building2,
  Clock,
  IndianRupee,
  MapPin,
  Navigation,
  Route,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const ROUTE_COLOR: Record<RouteType, { text: string; border: string }> = {
  safest: { text: "text-[#22C55E]", border: "border-[#22C55E]/30" },
  cheapest: { text: "text-[#F59E0B]", border: "border-[#F59E0B]/30" },
  balanced: { text: "text-[#3B82F6]", border: "border-[#3B82F6]/30" },
  women_friendly: { text: "text-[#EC4899]", border: "border-[#EC4899]/30" },
};

type RightTab = "intelligence" | "ask" | "story";

/** Compact route card for the left selector panel */
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
    route.safety_score >= 80 ? "#22C55E" : route.safety_score >= 55 ? "#F59E0B" : "#EF4444";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full rounded-xl border p-3.5 text-left transition-all duration-150",
        isSelected
          ? "border-[#3B82F6]/50 bg-[#3B82F6]/08 ring-1 ring-[#3B82F6]/20"
          : `border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:${c.border} hover:bg-[var(--bg-surface)]`
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
          <IndianRupee className="h-3 w-3" />₹{route.estimated_cost_inr}
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
              color: route.corridor_profile.confidenceScore >= 75 ? "#86EFAC" : "#FCD34D",
            }}
          >
            {route.corridor_profile.confidenceScore}% conf.
          </span>
          {route.corridor_profile.hotspots.length > 0 ? (
            <span className="rounded-full bg-[#EF4444]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#FCA5A5]">
              {route.corridor_profile.hotspots.length} hotspot{route.corridor_profile.hotspots.length > 1 ? "s" : ""}
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

/** Realtime alert banner for new reports near the route */
function RouteAlert({
  report,
  onDismiss,
}: {
  report: SafetyReport;
  onDismiss: () => void;
}) {
  const typeLabel = report.report_type.replace(/_/g, " ");
  const minsAgo = Math.floor(
    (Date.now() - new Date(report.created_at).getTime()) / 60000
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="flex items-start gap-3 border-b border-[#F59E0B]/25 bg-[#F59E0B]/08 px-4 py-2.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#F59E0B]" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-[#FCD34D]">
            New report near your route
          </p>
          <p className="mt-0.5 text-[10px] capitalize text-[var(--text-muted)]">
            {typeLabel} · {minsAgo < 1 ? "just now" : `${minsAgo} min ago`}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-[var(--text-dim)] hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

/** Tabbed right intelligence panel */
function IntelligencePanel({
  route,
  allRoutes,
  cityId: city,
  departureHour,
  starting,
  onStart,
  activeTab,
  setActiveTab,
}: {
  route: PlannedRoute;
  allRoutes: PlannedRoute[];
  cityId: CityId;
  departureHour?: number;
  starting: boolean;
  onStart: () => void;
  activeTab: RightTab;
  setActiveTab: (t: RightTab) => void;
}) {
  const { t } = useI18n();
  const cp = route.corridor_profile;
  const scoreColor =
    route.safety_score >= 80 ? "#22C55E" : route.safety_score >= 55 ? "#F59E0B" : "#EF4444";
  const [focusSegIdx, setFocusSegIdx] = useState<number | null>(null);

  const TABS: { id: RightTab; label: string; icon: typeof Shield }[] = [
    { id: "intelligence", label: "Intelligence", icon: Shield },
    { id: "ask", label: "Ask AI", icon: Bot },
    { id: "story", label: "Story", icon: BookOpen },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 gap-0.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] p-1.5">
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

      {/* Tab content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── Intelligence Tab ── */}
          {activeTab === "intelligence" && (
            <motion.div
              key="intel"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {/* Score hero */}
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                  Safety Score
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold tabular-nums text-white">
                    {route.safety_score}
                  </span>
                  <span className="mb-1 text-lg font-bold text-[var(--text-dim)]">/100</span>
                  <span
                    className="mb-1 ml-auto rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${scoreColor}18`,
                      color: scoreColor,
                    }}
                  >
                    {route.safety_score >= 80 ? "Safe" : route.safety_score >= 55 ? "Moderate" : "High Risk"}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--border-subtle)]">
                  <motion.div
                    key={route.route_type}
                    className="h-full rounded-full"
                    style={{ backgroundColor: scoreColor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${route.safety_score}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
                {cp && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cp.confidenceScore}%`,
                          backgroundColor: cp.confidenceScore >= 75 ? "#22C55E" : "#F59E0B",
                        }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] font-semibold text-[var(--text-muted)]">
                      {cp.confidenceScore}% confidence
                    </span>
                  </div>
                )}
              </div>

              {/* Corridor metrics */}
              {cp && (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                    Corridor Profile
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: Shield, label: "Police", value: cp.policeCount, color: "#3B82F6" },
                      { icon: Building2, label: "Hospitals", value: cp.hospitalCount, color: "#22C55E" },
                      { icon: Users, label: "Reports", value: cp.reportCount, color: "#A78BFA" },
                      { icon: AlertTriangle, label: "Hotspots", value: cp.hotspots.length, color: cp.hotspots.length > 0 ? "#EF4444" : "#22C55E" },
                    ].map(({ icon: Icon, label, value, color }) => (
                      <div key={label} className="flex items-center gap-2 rounded-lg bg-[var(--bg)] p-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}14` }}>
                          <Icon className="h-3.5 w-3.5" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{value}</p>
                          <p className="text-[10px] text-[var(--text-dim)]">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Why X? breakdown */}
              {route.safety_breakdown?.length > 0 && (
                <SafetyScoreBreakdown
                  score={route.safety_score}
                  breakdown={route.safety_breakdown}
                />
              )}

              {/* Risk Timeline */}
              {cp && cp.segments.length > 0 && (
                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] p-3">
                  <RouteRiskTimeline
                    profile={cp}
                    onSegmentFocus={setFocusSegIdx}
                  />
                </div>
              )}

              {/* Data sources */}
              <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)] p-3">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                  Data Sources
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: "NCRB Historical Crime Data", color: "#F59E0B" },
                    { label: "Community Safety Reports", color: "#A78BFA" },
                    { label: "OpenStreetMap Infrastructure", color: "#22C55E" },
                    { label: "Police Station Locations", color: "#3B82F6" },
                    { label: "Hospital Locations", color: "#22C55E" },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-[10px] font-medium text-[var(--text-muted)]">✓ {label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI explanation */}
              <SafarAIAnalysis route={route} compact />
            </motion.div>
          )}

          {/* ── Ask AI Tab ── */}
          {activeTab === "ask" && (
            <motion.div
              key="ask"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden"
            >
              <RouteAssistant
                route={route}
                allRoutes={allRoutes}
                cityId={city}
                departureHour={departureHour}
              />
            </motion.div>
          )}

          {/* ── Story Tab ── */}
          {activeTab === "story" && (
            <motion.div
              key="story"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden"
            >
              {cp && cp.segments.length > 0 ? (
                <SafetyStory
                  profile={cp}
                  open
                  onClose={() => setActiveTab("intelligence")}
                  onSegmentChange={setFocusSegIdx}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <BookOpen className="mb-3 h-8 w-8 text-[var(--text-dim)]" />
                  <p className="text-[13px] font-semibold text-white">
                    Safety Story unavailable
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--text-dim)]">
                    Corridor segment data not available for this route.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Start trip CTA (not shown in story mode, story has own controls) */}
      {activeTab !== "story" && (
        <div className="shrink-0 border-t border-[var(--border-subtle)] p-4">
          <Button
            className="w-full gap-2 py-3 text-sm font-bold shadow-lg shadow-[#3B82F6]/20"
            onClick={onStart}
            disabled={starting}
          >
            <Navigation className="h-4 w-4" />
            {starting ? t("routes.starting") : t("routes.startTrip")}
          </Button>
        </div>
      )}

      {/* Hidden: store focusSegIdx for parent to pick up */}
      <div data-focus-seg={focusSegIdx ?? ""} className="hidden" />
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
  const [activeTab, setActiveTab] = useState<RightTab>("intelligence");
  const [focusSegIdx, setFocusSegIdx] = useState<number | null>(null);
  const [nearbyAlert, setNearbyAlert] = useState<SafetyReport | null>(null);
  const alertDismissed = useRef<Set<string>>(new Set());

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
      setRoutes([]); setSelected(null); setSearch(null); return;
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

  // ── Realtime safety alert subscription ──
  useEffect(() => {
    if (!selected || IS_DEMO_MODE) return;
    const routePoints = sampleRoutePoints(selected.geometry ?? undefined);
    if (!routePoints.length) return;

    const channel = reportsService.subscribe(city, async () => {
      // Re-fetch latest reports and check proximity
      try {
        const latest = await reportsService.listByCity(city);
        const recent = latest.filter(
          (r) => Date.now() - new Date(r.created_at).getTime() < 5 * 60_000
        );
        for (const r of recent) {
          if (alertDismissed.current.has(r.id)) continue;
          if (isNearRoute(r.latitude, r.longitude, routePoints)) {
            setNearbyAlert(r);
            break;
          }
        }
      } catch {}
    });

    return () => { void channel.unsubscribe(); };
  }, [selected, city]);

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
              {search.source} → {search.destination}
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

      {/* Realtime alert */}
      <AnimatePresence>
        {nearbyAlert && (
          <RouteAlert
            report={nearbyAlert}
            onDismiss={() => {
              alertDismissed.current.add(nearbyAlert.id);
              setNearbyAlert(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Three-column layout ── */}
      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[296px_1fr_368px]">

        {/* LEFT — Route list */}
        <aside className="overflow-y-auto border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] lg:border-b-0 lg:border-r lg:border-[var(--border-subtle)]">
          <div className="flex gap-2 overflow-x-auto px-3 py-2 lg:flex-col lg:gap-3 lg:overflow-x-visible lg:px-3 lg:py-4">
            <div className="hidden lg:block lg:px-1 lg:pb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
                {t("routes.eyebrow")}
              </p>
              <h1 className="mt-1 text-[15px] font-bold text-white">{t("routes.title")}</h1>
              {recommendation && (
                <button
                  type="button"
                  onClick={() => {
                    const rec = routes.find((r) => r.route_type === recommendation.route.route_type);
                    if (rec) setSelected(rec);
                  }}
                  className="mt-2 flex w-full items-center gap-2 rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/08 px-3 py-2 text-left transition hover:border-[#3B82F6]/50"
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-bold text-white">AI Recommended</p>
                    <p className="text-[10px] text-[var(--text-dim)]">{recommendation.reasons[0]}</p>
                  </div>
                </button>
              )}
            </div>

            {routes.map((r) => (
              <div key={r.route_type} className="w-56 shrink-0 sm:w-64 lg:w-auto">
                <RouteListCard
                  route={r}
                  isSelected={selected?.route_type === r.route_type}
                  isRecommended={recommendation?.route.route_type === r.route_type}
                  onClick={() => {
                    setSelected(r);
                    setFocusSegIdx(null);
                  }}
                />
              </div>
            ))}
          </div>

          {profile?.women_safety_mode &&
            recommendation?.route.route_type === selected?.route_type && (
              <div className="hidden border-t border-[var(--border-subtle)] px-4 py-3 lg:block">
                <p className="text-[11px] text-[#F9A8D4]">{t("routes.womenMode")}</p>
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
                className="h-[260px] sm:h-[300px] lg:h-full"
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
                  focusSegmentIdx={focusSegIdx}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Route type overlay */}
          {selected && (
            <div className="absolute left-3 top-3 z-[500] flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/90 px-3 py-2 backdrop-blur-md">
              <Shield className={cn("h-3.5 w-3.5", ROUTE_COLOR[selected.route_type].text)} />
              <span className="text-xs font-bold text-white">
                {t(routeTypeKey(selected.route_type))}
              </span>
            </div>
          )}

          {/* View Story shortcut button on map */}
          {selected?.corridor_profile?.segments?.length && (
            <button
              type="button"
              onClick={() => setActiveTab("story")}
              className="absolute bottom-4 left-4 z-[500] flex items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg)]/90 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur-md transition hover:bg-[var(--bg-surface)]"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#3B82F6]" />
              Safety Story
            </button>
          )}
        </div>

        {/* RIGHT — Tabbed intelligence panel */}
        <aside className="intel-panel overflow-hidden">
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
                  allRoutes={routes}
                  cityId={city}
                  departureHour={search?.departureHour}
                  starting={starting}
                  onStart={() => startTrip(selected)}
                  activeTab={activeTab}
                  setActiveTab={(tab) => {
                    setActiveTab(tab);
                    if (tab === "story") setFocusSegIdx(0);
                  }}
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

      {/* Mobile bottom panel — compact safety summary + CTA */}
      {selected && (
        <div className="safe-bottom border-t border-[var(--border-subtle)] px-4 pt-3 lg:hidden">
          {/* Score strip */}
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-[var(--bg-surface)] p-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">Safety</p>
              <p className="text-2xl font-bold text-white">{selected.safety_score}<span className="text-sm text-[var(--text-dim)]">/100</span></p>
            </div>
            {selected.corridor_profile && (
              <>
                <div className="h-8 w-px bg-[var(--border-subtle)]" />
                <div>
                  <p className="text-[10px] text-[var(--text-dim)]">Police</p>
                  <p className="text-sm font-bold text-white">{selected.corridor_profile.policeCount}</p>
                </div>
                <div className="h-8 w-px bg-[var(--border-subtle)]" />
                <div>
                  <p className="text-[10px] text-[var(--text-dim)]">Confidence</p>
                  <p className="text-sm font-bold text-white">{selected.corridor_profile.confidenceScore}%</p>
                </div>
                {selected.corridor_profile.hotspots.length === 0 ? (
                  <>
                    <div className="h-8 w-px bg-[var(--border-subtle)]" />
                    <span className="rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-bold text-[#86EFAC]">Clear</span>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-px bg-[var(--border-subtle)]" />
                    <span className="rounded-full bg-[#EF4444]/10 px-2 py-0.5 text-[10px] font-bold text-[#FCA5A5]">{selected.corridor_profile.hotspots.length} risk</span>
                  </>
                )}
              </>
            )}
            {/* Story shortcut */}
            {selected.corridor_profile?.segments?.length ? (
              <button
                type="button"
                onClick={() => setActiveTab("story")}
                className="ml-auto flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] px-2.5 py-1.5 text-[10px] font-semibold text-white"
              >
                <BookOpen className="h-3 w-3 text-[#3B82F6]" />
                Story
              </button>
            ) : null}
          </div>

          {/* AI explanation — compact */}
          <SafarAIAnalysis route={selected} compact />

          {/* CTA */}
          <Button
            className="mt-3 w-full gap-2 py-2.5 text-[13px] font-bold"
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
