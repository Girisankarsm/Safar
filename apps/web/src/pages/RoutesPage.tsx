import { PageHeader } from "@/components/layout/page-header";
import { RouteMap } from "@/components/map/RouteMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCityConfig } from "@/config/cities";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { PlannedRoute, RouteType } from "@/types/database";
import { Clock, IndianRupee, MapPin, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<PlannedRoute[]>([]);
  const [search, setSearch] = useState<{ source: string; destination: string } | null>(null);
  const [selected, setSelected] = useState<PlannedRoute | null>(null);
  const [starting, setStarting] = useState(false);

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
    setSelected(parsed[0] ?? null);
    if (s) setSearch(JSON.parse(s));
  }, [city]);

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
      <div className="py-20 text-center">
        <Shield className="mx-auto h-12 w-12 text-[#3B82F6]/50" />
        <h1 className="mt-4 text-2xl font-bold text-white">No routes for {getCityConfig(city).name}</h1>
        <p className="mt-2 text-sm text-[#A1A1AA]">Search from the dashboard to compare options in this city.</p>
        <Link to="/home" className="mt-6 inline-block text-sm font-semibold text-[#3B82F6]">
          Go to dashboard →
        </Link>
      </div>
    );
  }

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

      {selected && (
        <div className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] shadow-lg">
          <RouteMap
            geometry={selected.geometry}
            source={{ lat: selected.source_lat, lng: selected.source_lng }}
            destination={{ lat: selected.dest_lat, lng: selected.dest_lng }}
            height={340}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {routes.map((r) => {
          const isSelected = selected?.route_type === r.route_type;
          return (
            <Card
              key={r.route_type}
              className={`flex cursor-pointer flex-col transition hover:border-[#3B82F6]/25 ${
                isSelected ? "border-[#3B82F6]/50 ring-2 ring-[#3B82F6]/20" : ""
              }`}
              onClick={() => setSelected(r)}
            >
              <div className="flex items-center gap-2">
                <Shield className={`h-5 w-5 ${BADGE[r.route_type]}`} />
                <p className="font-bold text-white">{LABELS[r.route_type]}</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-white">
                {r.safety_score}
                <span className="text-base font-medium text-[#71717A]">/100</span>
              </p>
              <p className="mt-1 text-xs text-[#71717A]">safety score</p>
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
          );
        })}
      </div>
    </div>
  );
}
