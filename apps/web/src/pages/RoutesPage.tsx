import { RoutesSubNav } from "@/components/layout/RoutesSubNav";
import { IntelligenceDrawer, IntelligenceTrigger } from "@/components/routes/IntelligenceDrawer";
import { RouteMap } from "@/components/map/RouteMap";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { sampleRoutePoints, isNearRoute } from "@/lib/route-assistant";
import { recommendRoute, routeTrustTagline } from "@/lib/ai-insights";
import { useI18n } from "@/i18n/use-i18n";
import { routeTypeKey } from "@/i18n/translations";
import { modeLabel, primaryTransitMode } from "@/lib/multimodal-legs";
import { getCityConfig } from "@/config/cities";
import { useAuth } from "@/features/auth";
import { IS_DEMO_MODE } from "@/lib/config";
import { loadRoutesSession } from "@/lib/routes-session-cache";
import { reportsService } from "@/services/supabase/reports.service";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { PlannedRoute, RouteType, SafetyReport } from "@/types/database";
import {
  AlertTriangle,
  Clock,
  IndianRupee,
  MapPin,
  Navigation,
  Route,
  Shield,
  Sparkles,
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

/** Compact route card for the left selector panel */
function RouteListCard({
  route,
  allRoutes,
  isSelected,
  isRecommended,
  onClick,
}: {
  route: PlannedRoute;
  allRoutes: PlannedRoute[];
  isSelected: boolean;
  isRecommended: boolean;
  onClick: () => void;
}) {
  const { t } = useI18n();
  const c = ROUTE_COLOR[route.route_type];
  const scoreColor =
    route.safety_score >= 80 ? "#22C55E" : route.safety_score >= 55 ? "#F59E0B" : "#EF4444";

  const tagline = routeTrustTagline(route, allRoutes);
  const profile = route.corridor_profile;
  const transitMode = primaryTransitMode(route.legs ?? []);
  const otherCosts = allRoutes
    .filter((r) => r.route_type !== "cheapest")
    .map((r) => r.estimated_cost_inr);
  const costSave =
    route.route_type === "cheapest" && otherCosts.length
      ? Math.max(0, Math.min(...otherCosts) - route.estimated_cost_inr)
      : 0;

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
          {/* Trust tagline — data-driven one-liner per route type */}
          <span className={cn("text-[10px] font-medium leading-tight", c.text)}>
            {tagline}
          </span>
          {route.route_type === "cheapest" && transitMode && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[#F59E0B]/12 px-2 py-0.5 text-[10px] font-bold text-[#FCD34D]">
              {modeLabel(transitMode)}
              {costSave > 0 ? ` · saves ₹${costSave}` : " · lowest fare"}
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

      {/* Trust metrics row: police, hospitals, confidence, hotspots */}
      <div className="mt-2 flex flex-wrap gap-1">
        {(profile?.policeCount ?? 0) > 0 && (
          <span className="rounded-full bg-[#3B82F6]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#93C5FD]">
            {profile!.policeCount} police
          </span>
        )}
        {(profile?.hospitalCount ?? 0) > 0 && (
          <span className="rounded-full bg-[#06B6D4]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#67E8F9]">
            {profile!.hospitalCount} hospital{profile!.hospitalCount > 1 ? "s" : ""}
          </span>
        )}
        {profile && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
            style={{
              backgroundColor:
                profile.confidenceScore >= 75 ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
              color: profile.confidenceScore >= 75 ? "#86EFAC" : "#FCD34D",
            }}
          >
            {profile.confidenceScore}% conf.
          </span>
        )}
        {(profile?.hotspots.length ?? 0) > 0 ? (
          <span className="rounded-full bg-[#EF4444]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#FCA5A5]">
            {profile!.hotspots.length} hotspot{profile!.hotspots.length > 1 ? "s" : ""}
          </span>
        ) : profile ? (
          <span className="rounded-full bg-[#22C55E]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#86EFAC]">
            Clear
          </span>
        ) : null}
      </div>
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

/** Structured map block — trip summary + map between A and B */
function RouteMapPanel({
  route,
  className,
  mapClassName,
  onOpenIntel,
  onStart,
  starting,
  showMapActions = false,
}: {
  route: PlannedRoute;
  className?: string;
  mapClassName?: string;
  onOpenIntel?: () => void;
  onStart?: () => void;
  starting?: boolean;
  showMapActions?: boolean;
}) {
  const { t } = useI18n();
  const c = ROUTE_COLOR[route.route_type];

  return (
    <div className={cn("flex min-h-0 flex-col bg-[var(--bg)]", className)}>
      <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2.5 md:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
              {t("routes.mapRoute")}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-white md:text-xs">
              <span className="text-[#22C55E]">A</span>{" "}
              {route.source_name}
              <span className="mx-1.5 text-[var(--text-dim)]">→</span>
              <span className="text-[#EF4444]">B</span>{" "}
              {route.destination_name}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-medium text-[var(--text-muted)] md:text-[11px]">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {route.eta_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {route.distance_km} km
            </span>
            <span className="flex items-center gap-1">
              <IndianRupee className="h-3 w-3" />₹{route.estimated_cost_inr}
            </span>
          </div>
        </div>
      </div>

      <div className={cn("relative min-h-0 flex-1", mapClassName)}>
        <RouteMap
          geometry={route.geometry}
          routeType={route.route_type}
          source={{ lat: route.source_lat, lng: route.source_lng }}
          destination={{ lat: route.dest_lat, lng: route.dest_lng }}
          sourceName={route.source_name}
          destinationName={route.destination_name}
          corridorProfile={route.corridor_profile}
          height="100%"
          className="absolute inset-0 h-full w-full rounded-none"
          focusSegmentIdx={null}
        />
        <div className="absolute left-2 top-2 z-[500] flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg)]/92 px-2 py-1 backdrop-blur-md md:left-3 md:top-3 md:rounded-xl md:px-3 md:py-2">
          <Shield className={cn("h-3 w-3 md:h-3.5 md:w-3.5", c.text)} />
          <span className="text-[10px] font-bold text-white md:text-xs">
            {t(routeTypeKey(route.route_type))}
          </span>
        </div>
        {showMapActions && onOpenIntel && onStart && (
          <div className="absolute bottom-3 right-3 z-[500] flex items-center gap-2 md:bottom-4 md:right-4">
            <IntelligenceTrigger
              compact
              score={route.safety_score}
              onClick={onOpenIntel}
            />
            <Button
              className="gap-2 px-4 py-2.5 text-sm font-bold shadow-lg shadow-[#3B82F6]/25"
              onClick={onStart}
              disabled={starting}
            >
              <Navigation className="h-4 w-4" />
              {starting ? t("routes.starting") : t("routes.startTrip")}
            </Button>
          </div>
        )}
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
  const [intelOpen, setIntelOpen] = useState(false);
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
    setIntelOpen(false);
  }, [selected?.route_type]);

  useEffect(() => {
    const parsed = loadRoutesSession(city);
    const s = sessionStorage.getItem("safar-search");
    if (!parsed) {
      setRoutes([]); setSelected(null); setSearch(null); return;
    }
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

    // Dynamic learning — persist route selection preference for intelligence feedback
    try {
      const pref = {
        selected_route_type: route.route_type,
        city,
        hour: search?.departureHour ?? new Date().getHours(),
        distance_km: route.distance_km,
        chosen_at: new Date().toISOString(),
      };
      const stored = JSON.parse(sessionStorage.getItem("safar-route-prefs") ?? "[]") as unknown[];
      stored.unshift(pref);
      sessionStorage.setItem("safar-route-prefs", JSON.stringify(stored.slice(0, 20)));
    } catch { /* non-critical */ }

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
      <div className="app-page-scroll px-5 py-8 md:px-8">
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
    <div className="app-page-fill">

      {/* Sub-nav strip */}
      <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg)] px-4 py-2 md:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <RoutesSubNav />
          {search && (
            <p className="truncate text-[11px] text-[var(--text-dim)] lg:text-xs">
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

      {/* ── MOBILE: single scroll column ── */}
      <div className="safar-scroll-y flex min-h-0 flex-1 flex-col overflow-y-auto lg:hidden">
        {/* Route picker — horizontal pills */}
        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2.5">
          {recommendation && (
            <button
              type="button"
              onClick={() => {
                const rec = routes.find((r) => r.route_type === recommendation.route.route_type);
                if (rec) setSelected(rec);
              }}
              className="mb-2 flex w-full items-center gap-2 rounded-lg border border-[#3B82F6]/25 bg-[#3B82F6]/08 px-2.5 py-1.5 text-left"
            >
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-[#3B82F6]" />
              <p className="truncate text-[10px] font-semibold text-[#93C5FD]">
                Safar recommends {t(routeTypeKey(recommendation.route.route_type))}
              </p>
            </button>
          )}
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {routes.map((r) => (
              <div key={r.route_type} className="w-[220px] shrink-0">
                <RouteListCard
                  route={r}
                  allRoutes={routes}
                  isSelected={selected?.route_type === r.route_type}
                  isRecommended={recommendation?.route.route_type === r.route_type}
                  onClick={() => setSelected(r)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Map — structured panel */}
        {selected && (
          <>
            <RouteMapPanel
              route={selected}
              mapClassName="h-[240px] sm:h-[300px]"
            />
            <div className="sticky bottom-0 z-20 flex items-center gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-panel)]/98 px-3 py-2.5 backdrop-blur-md pb-[var(--bottom-safe)]">
              <IntelligenceTrigger
                compact
                score={selected.safety_score}
                onClick={() => setIntelOpen(true)}
              />
              <Button
                className="min-w-0 flex-1 gap-2 py-2.5 text-sm font-bold"
                onClick={() => startTrip(selected)}
                disabled={starting}
              >
                <Navigation className="h-4 w-4 shrink-0" />
                {starting ? t("routes.starting") : t("routes.startTrip")}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* ── DESKTOP: two-column layout ── */}
      <div className="desktop-3col hidden min-h-0 flex-1 lg:grid">

        {/* LEFT — Route list */}
        <aside className="overflow-y-auto border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] lg:border-b-0 lg:border-r">
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
                    <p className="truncate text-[11px] font-bold text-white">Safar Recommends</p>
                    <p className="text-[10px] text-[var(--text-dim)]">{recommendation.reasons[0]}</p>
                  </div>
                </button>
              )}
            </div>

            {routes.map((r) => (
              <div key={r.route_type} className="w-56 shrink-0 sm:w-64 lg:w-auto">
                <RouteListCard
                  route={r}
                  allRoutes={routes}
                  isSelected={selected?.route_type === r.route_type}
                  isRecommended={recommendation?.route.route_type === r.route_type}
                  onClick={() => setSelected(r)}
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
        <div className="routes-map-column relative min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.route_type}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="h-full min-h-0"
              >
                <RouteMapPanel
                  route={selected}
                  className="h-full"
                  showMapActions
                  onOpenIntel={() => setIntelOpen(true)}
                  onStart={() => startTrip(selected)}
                  starting={starting}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {selected && (
        <IntelligenceDrawer
          open={intelOpen}
          onClose={() => setIntelOpen(false)}
          route={selected}
          starting={starting}
          onStart={() => startTrip(selected)}
        />
      )}
    </div>
  );
}
