import { LiveTripMap } from "@/components/map/LiveTripMap";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCityConfig } from "@/config/cities";
import { supabase } from "@/lib/supabase/client";
import { useCityStore } from "@/stores/city.store";
import { tripsService } from "@/services/supabase/trips.service";
import type { PlannedRoute, Trip } from "@/types/database";
import { CheckCircle2, Copy, MapPin, Navigation, Share2, Siren } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function formatCoords(lat: number, lng: number) {
  return `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
}

export function TripPage() {
  const { id } = useParams<{ id: string }>();
  const { city } = useCityStore();
  const navigate = useNavigate();
  const cityCenter = getCityConfig(city);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [completing, setCompleting] = useState(false);

  const routeMeta = useMemo(() => {
    try {
      const search = sessionStorage.getItem("safar-search");
      const routes = sessionStorage.getItem("safar-routes");
      return {
        search: search ? (JSON.parse(search) as { source: string; destination: string }) : null,
        route: routes ? (JSON.parse(routes) as PlannedRoute[])[0] : null,
      };
    } catch {
      return { search: null, route: null };
    }
  }, []);

  const shareUrl = trip?.share_token
    ? `${window.location.origin}/share/${trip.share_token}`
    : null;

  useEffect(() => {
    if (!id) return;

    let watchId: number | null = null;

    async function loadTrip() {
      const { data, error: fetchError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (fetchError) {
        setError(fetchError.message);
        return;
      }
      if (data) setTrip(data as Trip);
    }

    loadTrip();
    const channel = tripsService.subscribeToTrip(id, setTrip);

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (p) => {
          tripsService
            .updateLocation(id, p.coords.latitude, p.coords.longitude)
            .then(setTrip)
            .catch(() => null);
        },
        () => setError("Enable location to share live updates with your contacts."),
        { enableHighAccuracy: true, maximumAge: 10_000 }
      );
    }

    return () => {
      channel.unsubscribe();
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
    };
  }, [id]);

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
      navigate("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete trip");
    } finally {
      setCompleting(false);
    }
  }

  if (!id) {
    return (
      <EmptyState
        icon={Navigation}
        title="No active trip"
        description="Plan a route from the dashboard, compare AI-scored options, and start tracking to share your live location with family."
        actionLabel="Go to dashboard"
        onAction={() => navigate("/home")}
      />
    );
  }

  const isActive = trip?.status === "active";

  return (
    <div className="page-container mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Live tracking"
        title="Your trip"
        subtitle={
          routeMeta.search
            ? `${routeMeta.search.source} → ${routeMeta.search.destination}`
            : "Location updates while you travel"
        }
        action={
          <Link
            to="/emergency"
            className="inline-flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2.5 text-sm font-semibold text-[#EF4444] transition hover:bg-[#EF4444]/15"
          >
            <Siren className="h-4 w-4" />
            Emergency
          </Link>
        }
      />

      {error && (
        <div className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
          {error}
        </div>
      )}

      <LiveTripMap
        lat={trip?.current_lat ?? cityCenter.center_lat}
        lng={trip?.current_lng ?? cityCenter.center_lng}
        geometry={routeMeta.route?.geometry}
        height={300}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Status</p>
          <div className="mt-2 flex items-center gap-2">
            {isActive && (
              <span className="status-live inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            )}
            <p className="text-xl font-bold capitalize text-white">{trip?.status ?? "Loading…"}</p>
          </div>
          {trip?.sos_triggered && (
            <p className="mt-2 text-xs font-semibold text-[#EF4444]">SOS was triggered on this trip</p>
          )}
        </Card>

        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Current location</p>
          {trip?.current_lat != null && trip.current_lng != null ? (
            <>
              <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
                <MapPin className="h-4 w-4 text-[#3B82F6]" />
                {formatCoords(trip.current_lat, trip.current_lng)}
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
            <p className="mt-2 text-sm text-[#A1A1AA]">Waiting for GPS signal…</p>
          )}
        </Card>
      </div>

      {shareUrl && (
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/15">
              <Share2 className="h-5 w-5 text-[#3B82F6]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">Share live trip</p>
              <p className="mt-1 text-xs text-[#A1A1AA]">
                Send this link to family or friends so they can follow your journey.
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={shareUrl}
                  className="min-w-0 flex-1 truncate rounded-xl border border-[#2a2a32] bg-[#0a0a0c] px-3 py-2 text-xs text-[#A1A1AA]"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={copyShareLink}
                  className="shrink-0 gap-2"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {routeMeta.route && (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Route summary</p>
            <p className="mt-1 text-sm text-white">
              {routeMeta.route.distance_km} km · {routeMeta.route.eta_minutes} min · Safety{" "}
              <span className="font-bold text-[#22C55E]">{routeMeta.route.safety_score}/100</span>
            </p>
          </div>
          <p className="text-xs text-[#71717A]">₹{routeMeta.route.estimated_cost_inr} est.</p>
        </Card>
      )}

      <Button
        variant="outline"
        className="w-full"
        onClick={complete}
        disabled={completing || !isActive}
        size="lg"
      >
        {completing ? "Completing…" : "Complete trip"}
      </Button>
    </div>
  );
}
