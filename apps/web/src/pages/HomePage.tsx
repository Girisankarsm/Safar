import { CommunityActivityFeed } from "@/components/dashboard/community-activity-feed";
import { SafetyStatisticsPanel } from "@/components/dashboard/safety-statistics-panel";
import { LocationAutocomplete, type SelectedPlace } from "@/components/location/LocationAutocomplete";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { buildActivityFromReports, computePlatformStats } from "@/lib/community-activity";
import {
  DEMO_PLATFORM_STATS,
  demoActivityFeed,
} from "@/lib/demo-hackathon";
import { IS_DEMO_MODE } from "@/lib/config";
import { offlineCache } from "@/lib/offline-cache";
import { formatDepartureLabel } from "@/lib/time-safety";
import { debounce } from "@/lib/debounce-callback";
import { useI18n } from "@/i18n/use-i18n";
import { getCityConfig, CITY_LIST } from "@/config/cities";
import { reportsService } from "@/services/supabase/reports.service";
import { routesService } from "@/services/supabase/routes.service";
import { useCityStore } from "@/stores/city.store";
import { useSettingsStore } from "@/stores/settings.store";
import { Map, Shield, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function HomePage() {
  const { city } = useCityStore();
  const { departureHour, setDepartureHour, lowDataMode } = useSettingsStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [sourcePlace, setSourcePlace] = useState<SelectedPlace | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<SelectedPlace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activity, setActivity] = useState<ReturnType<typeof buildActivityFromReports>>([]);
  const [stats, setStats] = useState(computePlatformStats([], CITY_LIST.length));
  const [feedLoading, setFeedLoading] = useState(true);

  const loadCommunityData = useCallback(async () => {
    setFeedLoading(true);
    try {
      if (IS_DEMO_MODE) {
        setActivity(demoActivityFeed(city));
        setStats(DEMO_PLATFORM_STATS);
        return;
      }
      const reports = await reportsService.listByCity(city, 50);
      setActivity(buildActivityFromReports(reports));
      const allReports = reports.length ? reports : [];
      setStats(computePlatformStats(allReports, CITY_LIST.length));
    } catch {
      if (IS_DEMO_MODE) {
        setActivity(demoActivityFeed(city));
        setStats(DEMO_PLATFORM_STATS);
      }
    } finally {
      setFeedLoading(false);
    }
  }, [city]);

  const debouncedLoadRef = useRef<ReturnType<typeof debounce<() => void>> | null>(null);
  useEffect(() => {
    debouncedLoadRef.current = debounce(() => void loadCommunityData(), 900);
    return () => debouncedLoadRef.current?.cancel();
  }, [loadCommunityData]);

  useEffect(() => {
    setSource("");
    setDestination("");
    setSourcePlace(null);
    setDestinationPlace(null);
    setError("");
    loadCommunityData();
    const channel = reportsService.subscribe(city, () => {
      debouncedLoadRef.current?.();
    });
    return () => {
      debouncedLoadRef.current?.cancel();
      channel.unsubscribe();
    };
  }, [city, loadCommunityData]);

  async function search() {
    if (!source.trim() || !destination.trim()) {
      setError(t("home.errorBoth"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      const routes = await Promise.race([
        routesService.searchRoutes(source, destination, city, {
          source: sourcePlace ?? undefined,
          destination: destinationPlace ?? undefined,
        }, { departureHour }),
        new Promise<never>((_, reject) =>
          window.setTimeout(() => reject(new Error("Route search timed out. Please try again.")), 25_000)
        ),
      ]);
      sessionStorage.setItem("safar-routes", JSON.stringify(routes));
      sessionStorage.setItem("safar-routes-city", city);
      offlineCache.saveRoutes(city, routes);
      sessionStorage.setItem(
        "safar-search",
        JSON.stringify({
          source: sourcePlace?.label ?? source,
          destination: destinationPlace?.label ?? destination,
          departureHour,
        })
      );
      navigate("/routes");
    } catch (e) {
      if (!navigator.onLine) {
        const cached = offlineCache.getRoutes(city);
        if (cached?.length) {
          sessionStorage.setItem("safar-routes", JSON.stringify(cached));
          sessionStorage.setItem("safar-routes-city", city);
          navigate("/routes");
          return;
        }
      }
      setError(e instanceof Error ? e.message : "Route search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("home.eyebrow")}
        title={t("home.title")}
        subtitle={t("home.subtitle", { city: getCityConfig(city).name })}
        action={
          <Link
            to="/emergency"
            className="inline-flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/15"
          >
            <Shield className="h-4 w-4" />
            {t("home.emergencyShield")}
          </Link>
        }
      />

      <SafetyStatisticsPanel stats={stats} />

      <div className="surface-card space-y-5 rounded-2xl p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-medium text-[#71717A]">
          <Sparkles className="h-3.5 w-3.5 text-[#3B82F6]" />
          {t("home.pickPlaces")}
        </div>
        <LocationAutocomplete
          key={`${city}-from`}
          label={t("home.from")}
          placeholder={`Search in ${getCityConfig(city).name} — e.g. station, college, area`}
          cityId={city}
          value={source}
          selectedPlace={sourcePlace}
          onValueChange={setSource}
          onPlaceSelect={setSourcePlace}
          disabled={loading}
        />
        <LocationAutocomplete
          key={`${city}-to`}
          label={t("home.to")}
          placeholder={`Destination in ${getCityConfig(city).name}`}
          cityId={city}
          value={destination}
          selectedPlace={destinationPlace}
          onValueChange={setDestination}
          onPlaceSelect={setDestinationPlace}
          disabled={loading}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#A1A1AA]">
            {t("home.departure")}
            <input
              type="range"
              min={0}
              max={23}
              value={departureHour}
              onChange={(e) => setDepartureHour(Number(e.target.value))}
              className="mt-2 w-full accent-[#3B82F6]"
            />
            <span className="mt-1 block text-sm font-bold text-white">
              {formatDepartureLabel(departureHour)} — {t("home.timeSafety")}
            </span>
          </label>
          {lowDataMode && (
            <p className="rounded-xl border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-3 py-2 text-xs text-[#93C5FD]">
              {t("settings.lowDataHint")}
            </p>
          )}
        </div>
        {error && (
          <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
            {error}
          </p>
        )}
        <Button onClick={search} disabled={loading} className="w-full" size="lg">
          {loading ? t("home.searching") : t("home.search")}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CommunityActivityFeed items={activity} loading={feedLoading} />

        <div className="grid gap-4 sm:grid-cols-1">
          <Link
            to="/safety"
            className="group surface-card flex gap-4 rounded-2xl p-5 transition hover:border-[#3B82F6]/30"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15 transition group-hover:bg-[#3B82F6]/25">
              <Map className="h-5 w-5 text-[#3B82F6]" />
            </div>
            <div>
              <p className="font-bold text-white">{t("home.safetyHeatmap")}</p>
              <p className="mt-1 text-sm text-[#A1A1AA]">{t("home.safetyHeatmapDesc")}</p>
            </div>
          </Link>
          <Link
            to="/emergency"
            className="group surface-card flex gap-4 rounded-2xl p-5 transition hover:border-[#EF4444]/30"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EF4444]/15 transition group-hover:bg-[#EF4444]/25">
              <Shield className="h-5 w-5 text-[#EF4444]" />
            </div>
            <div>
              <p className="font-bold text-white">{t("home.safeWaiting")}</p>
              <p className="mt-1 text-sm text-[#A1A1AA]">{t("home.safeWaitingDesc")}</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
