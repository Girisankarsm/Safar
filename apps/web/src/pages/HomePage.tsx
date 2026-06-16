import { CommunityActivityFeed } from "@/components/dashboard/community-activity-feed";
import { SafetyStatisticsPanel } from "@/components/dashboard/safety-statistics-panel";
import { LocationAutocomplete, type SelectedPlace } from "@/components/location/LocationAutocomplete";
import { RouteSearchProgress } from "@/components/routes/RouteSearchProgress";
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
import { nominatimService } from "@/services/osm/nominatim.service";
import { routesService } from "@/services/supabase/routes.service";
import { useCityStore } from "@/stores/city.store";
import { useSettingsStore } from "@/stores/settings.store";
import { AnimatePresence, motion } from "framer-motion";
import { Crosshair, Map, Shield, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function HomePage() {
  const { city } = useCityStore();
  const { departureHour, departureHourCustom, setDepartureHour, lowDataMode } = useSettingsStore();
  const [liveHour, setLiveHour] = useState(() => new Date().getHours());

  useEffect(() => {
    if (departureHourCustom) return;
    const sync = () => setLiveHour(new Date().getHours());
    sync();
    const id = window.setInterval(sync, 60_000);
    return () => window.clearInterval(id);
  }, [departureHourCustom]);

  const effectiveDepartureHour = departureHourCustom ? departureHour : liveHour;
  const { t } = useI18n();
  const navigate = useNavigate();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [sourcePlace, setSourcePlace] = useState<SelectedPlace | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<SelectedPlace | null>(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
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
        }, { departureHour: effectiveDepartureHour }),
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
          departureHour: effectiveDepartureHour,
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

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const result = await nominatimService.reverseGeocode(latitude, longitude);
          const label = result?.name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setSource(label);
          setSourcePlace({
            name: label,
            display_name: result?.display_name ?? label,
            lat: latitude,
            lng: longitude,
            source: "nominatim",
            label,
          });
        } catch {
          // If reverse geocode fails, still use the coordinates
          const label = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setSource(label);
          setSourcePlace({
            name: label,
            display_name: label,
            lat: latitude,
            lng: longitude,
            source: "nominatim",
            label,
          });
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError("Location access denied. Please enable location permission in your browser.");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Current location unavailable. Try again or enter manually.");
        } else {
          setError("Could not get your location. Please try again.");
        }
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
  }

  return (
    <div className="app-page-scroll mx-auto max-w-[1400px] px-4 py-4 md:space-y-8 md:px-8 md:py-6 lg:pb-8">

      {/* Route Evolution Animation overlay — shown during candidate search */}
      <AnimatePresence>
        {loading && (
          <motion.div
            key="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md"
            style={{ backgroundColor: "rgba(9,9,11,0.85)" }}
          >
            <div className="w-full max-w-sm">
              <RouteSearchProgress />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page header — compact on mobile */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dim)] md:text-xs">
            {t("home.eyebrow")}
          </p>
          <h1 className="mt-0.5 text-[20px] font-bold leading-tight text-white md:text-2xl">
            {t("home.title")}
          </h1>
          <p className="mt-0.5 text-xs text-[var(--text-muted)] md:text-sm">
            {t("home.subtitle", { city: getCityConfig(city).name })}
          </p>
        </div>
        <Link
          to="/emergency"
          className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/15 md:px-4 md:py-2.5 md:text-sm"
        >
          <Shield className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span className="hidden sm:inline">{t("home.emergencyShield")}</span>
          <span className="sm:hidden">SOS</span>
        </Link>
      </div>

      {/* Stats — compact 2-col on mobile */}
      <div className="mt-3 md:mt-0">
        <SafetyStatisticsPanel stats={stats} />
      </div>

      {/* Search card */}
      <div className="surface-card mt-3 space-y-3.5 rounded-2xl p-4 md:mt-0 md:space-y-5 md:p-6 lg:p-8">
        <div className="flex items-center gap-2 text-[11px] font-medium text-[#71717A] md:text-xs">
          <Sparkles className="h-3 w-3 text-[#3B82F6] md:h-3.5 md:w-3.5" />
          {t("home.pickPlaces")}
        </div>
        {/* FROM field with "Use my location" button */}
        <div className="relative">
          <LocationAutocomplete
            key={`${city}-from`}
            label={t("home.from")}
            placeholder={`Search in ${getCityConfig(city).name}`}
            cityId={city}
            value={source}
            selectedPlace={sourcePlace}
            onValueChange={setSource}
            onPlaceSelect={setSourcePlace}
            disabled={loading || locating}
          />
          {/* Current location button — sits in the top-right of the FROM label row */}
          <button
            type="button"
            onClick={useMyLocation}
            disabled={loading || locating}
            title="Use my current location"
            className="absolute right-0 top-0 flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-[#3B82F6] transition hover:bg-[#3B82F6]/10 disabled:opacity-50 md:text-xs"
          >
            {locating ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[#3B82F6]/30 border-t-[#3B82F6]" />
                Locating…
              </>
            ) : (
              <>
                <Crosshair className="h-3 w-3 md:h-3.5 md:w-3.5" />
                My Location
              </>
            )}
          </button>
        </div>
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

        {/* Departure row — horizontal on mobile */}
        <div className="flex items-center gap-3">
          <label className="flex flex-1 flex-col gap-1 text-[11px] font-semibold text-[#A1A1AA]">
            <span className="flex items-center justify-between">
              {t("home.departure")}
              <span className="text-[12px] font-bold text-white">
                {formatDepartureLabel(effectiveDepartureHour)}
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={23}
              value={effectiveDepartureHour}
              onChange={(e) => setDepartureHour(Number(e.target.value))}
              className="w-full accent-[#3B82F6]"
            />
          </label>
          {lowDataMode && (
            <span className="shrink-0 rounded-lg border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-2 py-1 text-[10px] text-[#93C5FD]">
              Low data
            </span>
          )}
        </div>

        {error && (
          <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2.5 text-xs text-[#FCA5A5] md:px-4 md:py-3 md:text-sm">
            {error}
          </p>
        )}
        <Button onClick={search} disabled={loading} className="w-full py-2.5 md:py-3" size="lg">
          {loading ? t("home.searching") : t("home.search")}
        </Button>
      </div>

      {/* Quick links — horizontal 2-col on mobile */}
      <div className="mt-3 grid grid-cols-2 gap-2.5 md:mt-0 md:hidden">
        <Link
          to="/safety"
          className="group mobile-card flex items-center gap-2.5 transition hover:border-[#3B82F6]/30"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/15">
            <Map className="h-4 w-4 text-[#3B82F6]" />
          </div>
          <p className="text-[12px] font-bold leading-tight text-white">{t("home.safetyHeatmap")}</p>
        </Link>
        <Link
          to="/emergency"
          className="group mobile-card flex items-center gap-2.5 transition hover:border-[#EF4444]/30"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EF4444]/15">
            <Shield className="h-4 w-4 text-[#EF4444]" />
          </div>
          <p className="text-[12px] font-bold leading-tight text-white">{t("home.safeWaiting")}</p>
        </Link>
      </div>

      {/* Community feed + quick links — desktop layout */}
      <div className="hidden gap-6 md:grid lg:grid-cols-2">
        <CommunityActivityFeed items={activity} loading={feedLoading} />
        <div className="grid gap-4">
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

      {/* Community feed — mobile only */}
      <div className="mt-3 md:hidden">
        <CommunityActivityFeed items={activity} loading={feedLoading} />
      </div>
    </div>
  );
}

