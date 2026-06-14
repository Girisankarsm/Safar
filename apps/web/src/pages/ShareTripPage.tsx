import { LiveTripMap } from "@/components/map/LiveTripMap";
import { getCityConfig } from "@/config/cities";
import { tripsService } from "@/services/supabase/trips.service";
import type { PlannedRoute, Trip } from "@/types/database";
import { AlertTriangle, MapPin, Navigation, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

export function ShareTripPage() {
  const { token } = useParams<{ token: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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

  useEffect(() => {
    if (!token) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let channel: ReturnType<typeof tripsService.subscribeToTrip> | null = null;

    tripsService.getByShareToken(token).then((t) => {
      if (!t) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setTrip(t);
      setLoading(false);
      channel = tripsService.subscribeToTrip(t.id, setTrip);
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] text-[#A1A1AA]">
        Loading live trip…
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center">
        <Shield className="h-12 w-12 text-[#3B82F6]/50" />
        <h1 className="mt-4 text-xl font-bold text-white">Trip not found</h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">This share link may have expired or is invalid.</p>
        <Link to="/" className="mt-6 text-sm font-semibold text-[#3B82F6]">
          Go to Safar →
        </Link>
      </div>
    );
  }

  const cityName = getCityConfig(trip.city_id).name;
  const lat = trip.current_lat;
  const lng = trip.current_lng;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-[#262626] px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Shield className="h-6 w-6 text-[#3B82F6]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#3B82F6]">Safar Live Share</p>
            <p className="text-sm text-[#A1A1AA]">
              {routeMeta.search
                ? `${routeMeta.search.source} → ${routeMeta.search.destination}`
                : `Trip in ${cityName}`}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-8">
        {trip.sos_triggered && (
          <div className="flex items-center gap-3 rounded-2xl border border-[#EF4444]/40 bg-[#EF4444]/15 px-4 py-4">
            <AlertTriangle className="h-6 w-6 shrink-0 text-[#EF4444]" />
            <div>
              <p className="font-bold text-[#EF4444]">SOS triggered</p>
              <p className="text-sm text-[#FCA5A5]">This traveler has requested emergency help.</p>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#262626]">
          <LiveTripMap
            lat={lat}
            lng={lng}
            geometry={routeMeta.route?.geometry}
            height={360}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#262626] bg-[#111111] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Status</p>
            <p className="mt-1 flex items-center gap-2 text-lg font-bold capitalize">
              <Navigation className="h-4 w-4 text-[#22C55E]" />
              {trip.status}
            </p>
          </div>
          <div className="rounded-2xl border border-[#262626] bg-[#111111] p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Last location</p>
            <p className="mt-1 flex items-center gap-2 text-sm text-[#A1A1AA]">
              <MapPin className="h-4 w-4 shrink-0 text-[#3B82F6]" />
              {lat != null && lng != null ? `${lat.toFixed(5)}°, ${lng.toFixed(5)}°` : "Waiting for GPS…"}
            </p>
          </div>
        </div>

        {lat != null && lng != null && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
            target="_blank"
            rel="noreferrer"
            className="block rounded-2xl bg-[#3B82F6] px-6 py-4 text-center text-sm font-bold text-white hover:bg-[#2563EB]"
          >
            Open in Google Maps
          </a>
        )}

        <p className="text-center text-xs text-[#71717A]">
          Updates automatically while the trip is active. Powered by Safar.
        </p>
      </main>
    </div>
  );
}
