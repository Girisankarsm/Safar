import { LiveTripMap } from "@/components/map/LiveTripMap";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/use-i18n";
import { tripsService } from "@/services/supabase/trips.service";
import type { PlannedRoute, Trip } from "@/types/database";
import {
  CheckCircle2,
  Copy,
  Crosshair,
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Share2,
  Siren,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
}

function loadActiveRoute(): PlannedRoute | null {
  try {
    const active = sessionStorage.getItem("safar-active-route");
    if (active) return JSON.parse(active) as PlannedRoute;
    const routes = sessionStorage.getItem("safar-routes");
    return routes ? (JSON.parse(routes) as PlannedRoute[])[0] : null;
  } catch {
    return null;
  }
}

export function TripPage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [hasLiveGps, setHasLiveGps] = useState(false);
  const [mapFullscreen, setMapFullscreen] = useState(false);
  const [trackUser, setTrackUser] = useState(true);
  const [mapResizeSignal, setMapResizeSignal] = useState(0);

  const activeRoute = useMemo(() => loadActiveRoute(), [id]);

  const routeMeta = useMemo(() => {
    try {
      const search = sessionStorage.getItem("safar-search");
      return {
        search: search ? (JSON.parse(search) as { source: string; destination: string }) : null,
      };
    } catch {
      return { search: null };
    }
  }, []);

  const shareUrl = trip?.share_token
    ? `${window.location.origin}/share/${trip.share_token}`
    : null;

  useEffect(() => {
    if (!id) return;

    let watchId: number | null = null;

    async function loadTrip() {
      const { data, error: fetchError } = await tripsService.getById(id!);
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      if (data) setTrip(data as Trip);
    }

    loadTrip();
    const channel = tripsService.subscribeToTrip(id, setTrip);

    return () => {
      channel.unsubscribe();
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [id]);

  useEffect(() => {
    if (!id || trip?.status !== "active") return;

    if (!navigator.geolocation) {
      setError(t("trip.enableGps"));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        setHasLiveGps(true);
        tripsService
          .updateLocation(id, p.coords.latitude, p.coords.longitude)
          .then(setTrip)
          .catch(() => null);
      },
      () => setError(t("trip.enableGps")),
      { enableHighAccuracy: true, maximumAge: 10_000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [id, trip?.status, t]);

  useEffect(() => {
    if (!mapFullscreen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMapFullscreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mapFullscreen]);

  useEffect(() => {
    const timer = window.setTimeout(() => setMapResizeSignal((n) => n + 1), 150);
    return () => window.clearTimeout(timer);
  }, [mapFullscreen]);

  async function copyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function complete() {
    if (!id) return;
    setCompleting(true);
    try {
      await tripsService.complete(id);
      sessionStorage.removeItem("safar-active-trip");
      sessionStorage.removeItem("safar-active-route");
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete trip");
    } finally {
      setCompleting(false);
    }
  }

  if (!id) {
    return (
      <div className="app-page-scroll px-5 py-8 md:px-8">
        <EmptyState
          icon={Navigation}
          title={t("trip.noTrip")}
          description={t("trip.noTripDesc")}
          actionLabel={t("trip.goDashboard")}
          onAction={() => navigate("/home")}
        />
      </div>
    );
  }

  const isActive = trip?.status === "active";
  const routeLabel =
    routeMeta.search
      ? `${routeMeta.search.source} → ${routeMeta.search.destination}`
      : activeRoute
        ? `${activeRoute.source_name} → ${activeRoute.destination_name}`
        : t("trip.subtitle");

  const mapPanel = (
  <div
    className={cn(
      "relative flex min-h-0 flex-col bg-[var(--bg)]",
      mapFullscreen
        ? "fixed inset-0 z-[100000] h-[100dvh] w-full"
        : "h-[min(52vh,420px)] shrink-0 sm:h-[min(58vh,480px)] lg:h-auto lg:min-h-0 lg:flex-1"
    )}
  >
    {activeRoute && (
      <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2.5 md:px-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
          {t("trip.eyebrow")}
        </p>
        <p className="mt-0.5 truncate text-[11px] font-semibold text-white md:text-xs">
          <span className="text-[#22C55E]">A</span> {activeRoute.source_name}
          <span className="mx-1.5 text-[var(--text-dim)]">→</span>
          <span className="text-[#EF4444]">B</span> {activeRoute.destination_name}
        </p>
      </div>
    )}

    <div className="relative min-h-0 flex-1">
      <LiveTripMap
        geometry={activeRoute?.geometry}
        source={
          activeRoute
            ? { lat: activeRoute.source_lat, lng: activeRoute.source_lng }
            : undefined
        }
        destination={
          activeRoute
            ? { lat: activeRoute.dest_lat, lng: activeRoute.dest_lng }
            : undefined
        }
        sourceName={activeRoute?.source_name}
        destinationName={activeRoute?.destination_name}
        showUser={isActive && hasLiveGps}
        followUser={trackUser && isActive && hasLiveGps}
        userLat={hasLiveGps ? trip?.current_lat : null}
        userLng={hasLiveGps ? trip?.current_lng : null}
        height="100%"
        resizeSignal={mapResizeSignal}
        className={cn(
          "absolute inset-0 h-full w-full",
          mapFullscreen ? "rounded-none" : "rounded-none"
        )}
      />

      <div className="absolute bottom-3 right-3 z-[500] flex flex-wrap items-center justify-end gap-2 sm:bottom-4 sm:right-4">
        {isActive && hasLiveGps && (
          <button
            type="button"
            onClick={() => setTrackUser((v) => !v)}
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-xl border px-3 shadow-lg backdrop-blur-md transition",
              trackUser
                ? "border-[#3B82F6]/50 bg-[#3B82F6]/20 text-[#93C5FD]"
                : "border-[#262626] bg-[#111111]/95 text-white hover:border-[#3B82F6]/50 hover:text-[#3B82F6]"
            )}
            aria-label={trackUser ? "Stop tracking location" : "Track my location"}
            title={trackUser ? "Tracking on" : "Track me"}
          >
            {trackUser ? <LocateFixed className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />}
            <span className="hidden text-xs font-semibold sm:inline">
              {trackUser ? "Tracking" : "Track me"}
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setMapFullscreen((v) => !v)}
          className="flex h-10 items-center gap-1.5 rounded-xl border border-[#262626] bg-[#111111]/95 px-3 text-white shadow-lg backdrop-blur-md transition hover:border-[#3B82F6]/50 hover:text-[#3B82F6]"
          aria-label={mapFullscreen ? "Exit full screen map" : "Expand map"}
          title={mapFullscreen ? "Exit full screen" : "Expand map"}
        >
          {mapFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="text-xs font-semibold">
            {mapFullscreen ? "Exit" : "Expand"}
          </span>
        </button>
      </div>

      {mapFullscreen && isActive && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 z-[500] -translate-x-1/2 rounded-full border border-[#3B82F6]/30 bg-[#111111]/90 px-4 py-2 text-[11px] font-semibold text-[#93C5FD] backdrop-blur-md sm:bottom-20">
          {trackUser && hasLiveGps ? "Live tracking your position" : "Full screen map · Esc to exit"}
        </div>
      )}
    </div>
  </div>
  );

  const detailsPanel = (
    <aside className="safar-scroll-y flex min-h-0 flex-col gap-4 overflow-y-auto border-t border-[var(--border-subtle)] bg-[var(--bg-panel)] px-4 py-4 pb-[var(--bottom-safe)] lg:w-[380px] lg:shrink-0 lg:border-l lg:border-t-0 lg:px-5 lg:py-5 lg:pb-5">
      {!hasLiveGps && isActive && (
        <p className="rounded-xl border border-[#3B82F6]/25 bg-[#3B82F6]/10 px-4 py-3 text-xs text-[#93C5FD]">
          {t("trip.waitingGps")}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">{t("trip.status")}</p>
          <div className="mt-2 flex items-center gap-2">
            {isActive && (
              <span className="status-live inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            )}
            <p className="text-lg font-bold capitalize text-white">{trip?.status ?? "Loading…"}</p>
          </div>
          {trip?.sos_triggered && (
            <p className="mt-2 text-xs font-semibold text-[#EF4444]">SOS was triggered on this trip</p>
          )}
        </Card>

        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">
            {t("trip.currentLocation")}
          </p>
          {hasLiveGps && trip?.current_lat != null && trip.current_lng != null ? (
            <>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
                <MapPin className="h-4 w-4 shrink-0 text-[#3B82F6]" />
                <span className="truncate">{formatCoords(trip.current_lat, trip.current_lng)}</span>
              </p>
              <a
                href={`https://www.google.com/maps?q=${trip.current_lat},${trip.current_lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-semibold text-[#3B82F6] hover:underline"
              >
                Open in Google Maps →
              </a>
            </>
          ) : (
            <p className="mt-2 text-sm text-[#A1A1AA]">
              {isActive ? t("trip.waitingGpsShort") : t("trip.notActive")}
            </p>
          )}
        </Card>
      </div>

      {shareUrl && (
        <Card className="!p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15">
              <Share2 className="h-5 w-5 text-[#3B82F6]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{t("trip.shareLive")}</p>
              <p className="mt-1 text-xs text-[#A1A1AA]">{t("trip.shareDesc")}</p>
              <div className="mt-3 flex flex-col gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="min-w-0 w-full truncate rounded-xl border border-[#2a2a32] bg-[#0a0a0c] px-3 py-2 text-xs text-[#A1A1AA]"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyShareLink}
                  className="w-full gap-2 sm:w-auto"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? t("trip.copied") : t("trip.copyLink")}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeRoute && (
        <Card className="!p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">
            {t("trip.routeSummary")}
          </p>
          <p className="mt-2 text-sm text-white">
            {activeRoute.distance_km} km · {activeRoute.eta_minutes} min · Safety{" "}
            <span className="font-bold text-[#22C55E]">{activeRoute.safety_score}/100</span>
          </p>
          <p className="mt-1 text-xs text-[#71717A]">
            {activeRoute.source_name} → {activeRoute.destination_name}
          </p>
          <p className="mt-2 text-xs text-[#71717A]">₹{activeRoute.estimated_cost_inr} est.</p>
        </Card>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={complete}
        disabled={completing || !isActive}
        size="lg"
      >
        {completing ? t("trip.completing") : t("trip.complete")}
      </Button>
    </aside>
  );

  return (
    <div className="app-page-fill">
      {!mapFullscreen && (
        <div className="shrink-0 border-b border-[var(--border-subtle)] bg-[var(--bg)] px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#3B82F6]">{t("trip.eyebrow")}</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight text-white md:text-2xl">
                {t("trip.title")}
              </h1>
              <p className="mt-1 truncate text-sm text-[#A1A1AA]">{routeLabel}</p>
            </div>
            <Link
              to="/emergency"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/15"
            >
              <Siren className="h-4 w-4" />
              {t("trip.emergency")}
            </Link>
          </div>
          {error && (
            <div className="mt-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
              {error}
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col lg:flex-row lg:overflow-hidden",
          mapFullscreen && "overflow-hidden"
        )}
      >
        {mapPanel}
        {!mapFullscreen && detailsPanel}
      </div>
    </div>
  );
}
