import { RoutesSubNav } from "@/components/layout/RoutesSubNav";
import { PlatformFareComparison } from "@/components/routes/platform-fare-comparison";
import { EmptyState } from "@/components/ui/empty-state";
import { useCachedRoutes } from "@/hooks/use-cached-routes";
import { useI18n } from "@/i18n/use-i18n";
import { routeTypeKey } from "@/i18n/translations";
import { getCityConfig } from "@/config/cities";
import { useAuth } from "@/features/auth";
import { useCityStore } from "@/stores/city.store";
import { ArrowDownUp, MapPin, Sparkles } from "lucide-react";

export function ComparePage() {
  const { t } = useI18n();
  const { city } = useCityStore();
  const { profile } = useAuth();
  const { routes, search, selected, setSelected, recommendation } = useCachedRoutes({
    womenSafetyMode: profile?.women_safety_mode,
    nightSafePreference: profile?.night_safe_preference,
  });

  if (!routes.length || !selected) {
    return (
      <div className="px-5 py-8 md:px-8">
        <RoutesSubNav />
        <div className="mt-6">
          <EmptyState
            icon={ArrowDownUp}
            title={t("compare.noRoutes")}
            description={t("compare.noRoutesDesc")}
            actionLabel={t("routes.planRoute")}
            actionTo="/home"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-var(--shell-top)-var(--bottom-nav-h))] flex-col overflow-hidden lg:h-[calc(100vh-var(--shell-top))]">

      {/* Sub-nav + header strip */}
      <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-5 py-2.5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <RoutesSubNav />
            {search && (
              <p className="hidden items-center gap-1 text-xs text-[var(--text-dim)] lg:flex">
                <MapPin className="h-3 w-3" />
                {search.source}
                <span className="mx-1">→</span>
                {search.destination}
              </p>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-dim)]">
            {getCityConfig(city).name} · estimated fares
          </p>
        </div>
      </div>

      {/* Route selector strip */}
      <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg)] px-5 py-2.5 md:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
            Route:
          </p>
          {routes.map((r) => {
            const isActive = selected.route_type === r.route_type;
            const isRec = recommendation?.route.route_type === r.route_type;
            return (
              <button
                key={r.route_type}
                type="button"
                onClick={() => setSelected(r)}
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-semibold transition ${
                  isActive
                    ? "border-[#3B82F6]/50 bg-[#3B82F6]/15 text-white"
                    : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#3B82F6]/30 hover:text-white"
                }`}
              >
                {isRec && <Sparkles className="h-2.5 w-2.5 text-[#3B82F6]" />}
                {t(routeTypeKey(r.route_type))}
                <span className="font-normal text-[var(--text-dim)]">
                  · {r.distance_km} km
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main comparison content */}
      <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
        <div className="mx-auto max-w-[1400px]">
          {/* Dashboard header */}
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
              {t("compare.eyebrow")}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight text-white">
              {t("compare.title")}
            </h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {search
                ? `Comparing platforms for ${search.source} → ${search.destination}`
                : t("compare.subtitle", { city: getCityConfig(city).name })}
            </p>
          </div>

          <PlatformFareComparison
            route={selected}
            departureHour={search?.departureHour}
            womenSafetyMode={profile?.women_safety_mode}
          />
        </div>
      </div>
    </div>
  );
}
