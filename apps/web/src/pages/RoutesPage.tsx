import { PageHeader } from "@/components/layout/page-header";
import { RouteMap } from "@/components/map/RouteMap";
import { AIRouteRecommendation } from "@/components/safety/ai-route-recommendation";
import { SafarAIAnalysis } from "@/components/safety/safar-ai-analysis";
import { SafetyLevelBadge } from "@/components/safety/safety-level-badge";
import { SafetyScoreBreakdown } from "@/components/safety/safety-score-breakdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { recommendRoute } from "@/lib/ai-insights";
import { getCityConfig } from "@/config/cities";
import { useAuth } from "@/features/auth";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { PlannedRoute, RouteType } from "@/types/database";
import { Clock, IndianRupee, MapPin, Route, Shield, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const LABELS: Record<RouteType, string> = {
  safest: "Safest Route",
  cheapest: "Cheapest Route",
  balanced: "Balanced Route",
  women_friendly: "Women-Friendly",
};

const BADGE: Record<RouteType, string> = {
  safest: "text-[#22C55E]",
  cheapest: "text-[#F59E0B]",
  balanced: "text-[#3B82F6]",
  women_friendly: "text-[#EC4899]",
};

export function RoutesPage() {
  const { city } = useCityStore();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<PlannedRoute[]>([]);
  const [search, setSearch] = useState<{ source: string; destination: string } | null>(null);
  const [selected, setSelected] = useState<PlannedRoute | null>(null);
  const [starting, setStarting] = useState(false);
  const [mapHighlight, setMapHighlight] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement>(null);

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

  function selectRouteAndShowMap(route: PlannedRoute) {
    setSelected(route);
    setMapHighlight(true);
    window.setTimeout(() => setMapHighlight(false), 1600);
    window.requestAnimationFrame(() => {
      mapSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function startTrip(route: PlannedRoute) {
    setStarting(true);
    try {
      const trip = await tripsService.start(city, route);
      sessionStorage.setItem("safar-active-trip", trip.id);
      navigate(`/trip/${trip.id}`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not start trip");
    } finally {
      setStarting(false);
    }
  }

  if (!routes.length) {
    return (
      <EmptyState
        icon={Route}
        title={`No routes for ${getCityConfig(city).name}`}
        description="Search from the dashboard to compare AI-scored route options with live community safety intelligence."
        actionLabel="Plan a route"
        actionTo="/home"
      />
    );
  }

  const isAiPick = recommendation?.route.route_type === selected?.route_type;
  const hasStraightLineCache = routes.some(
    (r) => (r.geometry?.coordinates?.length ?? 0) <= 2
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Route comparison"
        title="Pick your route"
        subtitle={
          search
            ? `${search.source} → ${search.destination}`
            : "Safety scored with live OSM + community data"
        }
      />

      {hasStraightLineCache && (
        <p className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-3 text-xs text-[#FCD34D]">
          Showing an estimated direct path. Go to{" "}
          <Link to="/home" className="font-semibold text-[#F59E0B] underline">
            Dashboard
          </Link>{" "}
          and search your route again to load real road paths via OpenRouteService.
        </p>
      )}

      {recommendation && (
        <AIRouteRecommendation
          recommendation={recommendation}
          onSelect={() => {
            const route =
              routes.find((r) => r.route_type === recommendation.route.route_type) ??
              recommendation.route;
            selectRouteAndShowMap(route);
          }}
        />
      )}

      {selected && (
        <div
          ref={mapSectionRef}
          id="route-map"
          className={`space-y-6 scroll-mt-24 rounded-2xl transition-shadow duration-500 ${
            mapHighlight ? "ring-2 ring-[#3B82F6]/60 ring-offset-2 ring-offset-[var(--bg)]" : ""
          }`}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              key={selected.route_type}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] shadow-lg"
            >
              <RouteMap
                geometry={selected.geometry}
                source={{ lat: selected.source_lat, lng: selected.source_lng }}
                destination={{ lat: selected.dest_lat, lng: selected.dest_lng }}
                height={340}
              />
            </motion.div>
            <div className="space-y-4">
              <SafetyScoreBreakdown
                score={selected.safety_score}
                breakdown={selected.safety_breakdown}
              />
            </div>
          </div>
          <SafarAIAnalysis route={selected} />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {routes.map((r, i) => {
          const isSelected = selected?.route_type === r.route_type;
          const isRecommended = recommendation?.route.route_type === r.route_type;
          return (
            <motion.div
              key={r.route_type}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className={`flex h-full cursor-pointer flex-col transition hover:border-[#3B82F6]/25 ${
                  isSelected ? "border-[#3B82F6]/50 ring-2 ring-[#3B82F6]/20" : ""
                }`}
                onClick={() => selectRouteAndShowMap(r)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Shield className={`h-5 w-5 ${BADGE[r.route_type]}`} />
                  <p className="font-bold text-white">{LABELS[r.route_type]}</p>
                  {isRecommended && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#3B82F6]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#3B82F6]">
                      <Sparkles className="h-3 w-3" />
                      Safar Pick
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <SafetyLevelBadge score={r.safety_score} size="sm" showBar={false} />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-[#A1A1AA]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {r.eta_minutes} min
                  </span>
                  <span className="flex items-center gap-1.5">
                    <IndianRupee className="h-3.5 w-3.5" />₹{r.estimated_cost_inr}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {r.distance_km} km
                  </span>
                  <span>{r.transfer_count} transfers</span>
                </div>
                <Button
                  className="mt-5 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    startTrip(r);
                  }}
                  disabled={starting}
                >
                  {starting && isSelected ? "Starting…" : "Start trip"}
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {isAiPick && profile?.women_safety_mode && (
        <p className="rounded-xl border border-[#EC4899]/25 bg-[#EC4899]/8 px-4 py-3 text-xs text-[#F9A8D4]">
          Women Safety Mode is on — AI recommendations prioritize well-lit, women-friendly corridors.
        </p>
      )}
    </div>
  );
}
