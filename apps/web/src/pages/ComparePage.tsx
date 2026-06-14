import { RoutesSubNav } from "@/components/layout/RoutesSubNav";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformFareComparison } from "@/components/routes/platform-fare-comparison";
import { EmptyState } from "@/components/ui/empty-state";
import { useCachedRoutes } from "@/hooks/use-cached-routes";
import { useI18n } from "@/i18n/use-i18n";
import { routeTypeKey } from "@/i18n/translations";
import { getCityConfig } from "@/config/cities";
import { useAuth } from "@/features/auth";
import { useCityStore } from "@/stores/city.store";
import { ArrowDownUp } from "lucide-react";

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
      <div className="space-y-6">
        <RoutesSubNav />
        <EmptyState
          icon={ArrowDownUp}
          title={t("compare.noRoutes")}
          description={t("compare.noRoutesDesc")}
          actionLabel={t("routes.planRoute")}
          actionTo="/home"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RoutesSubNav />
      <PageHeader
        eyebrow={t("compare.eyebrow")}
        title={t("compare.title")}
        subtitle={
          search
            ? `${search.source} → ${search.destination}`
            : t("compare.subtitle", { city: getCityConfig(city).name })
        }
      />

      <div className="flex flex-wrap gap-2">
        {routes.map((r) => {
          const isActive = selected.route_type === r.route_type;
          const isRec = recommendation?.route.route_type === r.route_type;
          return (
            <button
              key={r.route_type}
              type="button"
              onClick={() => setSelected(r)}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold transition ${
                isActive
                  ? "border-[#3B82F6]/50 bg-[#3B82F6]/15 text-white"
                  : "border-[var(--border-subtle)] text-[#A1A1AA] hover:border-[#3B82F6]/30 hover:text-white"
              }`}
            >
              {t(routeTypeKey(r.route_type))}
              {isRec ? ` · ${t("routes.safarPick")}` : ""}
            </button>
          );
        })}
      </div>

      <PlatformFareComparison
        route={selected}
        departureHour={search?.departureHour}
        womenSafetyMode={profile?.women_safety_mode}
      />
    </div>
  );
}
