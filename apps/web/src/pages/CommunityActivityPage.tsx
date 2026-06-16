import { CommunityActivityFeed } from "@/components/dashboard/community-activity-feed";
import { SafetyStatisticsPanel } from "@/components/dashboard/safety-statistics-panel";
import { useCommunityActivity } from "@/hooks/use-community-activity";
import { useI18n } from "@/i18n/use-i18n";
import { getCityConfig } from "@/config/cities";
import { useCityStore } from "@/stores/city.store";

export function CommunityActivityPage() {
  const { city } = useCityStore();
  const { t } = useI18n();
  const { activity, stats, loading } = useCommunityActivity(80);

  return (
    <div className="app-page-scroll mx-auto max-w-3xl px-4 py-4 md:px-8 md:py-6 lg:pb-8">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] md:text-xs">
          {t("community.eyebrow")}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold leading-tight text-white md:text-2xl">
              {t("community.title")}
            </h1>
            <p className="mt-1 text-xs text-[var(--text-muted)] md:text-sm">
              {t("community.subtitle", { city: getCityConfig(city).name })}
            </p>
          </div>
          <span className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full border border-[#22C55E]/25 bg-[#22C55E]/10 px-2.5 py-1 text-[10px] font-semibold text-[#22C55E]">
            <span className="status-live inline-flex h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
            {t("community.live")}
          </span>
        </div>
      </div>

      <SafetyStatisticsPanel stats={stats} />

      <div className="mt-6">
        <CommunityActivityFeed items={activity} loading={loading} variant="full" />
      </div>
    </div>
  );
}
