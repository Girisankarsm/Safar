import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { tripsService } from "@/services/supabase/trips.service";
import { useCityStore } from "@/stores/city.store";
import type { PlannedRoute, RouteType } from "@/types/database";
import { Clock, IndianRupee, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const LABELS: Record<RouteType, string> = {
  safest: "Safest Route",
  cheapest: "Cheapest Route",
  balanced: "Balanced Route",
  women_friendly: "Women-Friendly",
};

export function RoutesPage() {
  const { city } = useCityStore();
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<PlannedRoute[]>([]);
  const [search, setSearch] = useState<{ source: string; destination: string } | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem("safar-routes");
    const s = sessionStorage.getItem("safar-search");
    if (cached) setRoutes(JSON.parse(cached));
    if (s) setSearch(JSON.parse(s));
  }, []);

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
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white">No routes yet</h1>
        <Link to="/home" className="text-[#3B82F6] mt-4 inline-block">Search from dashboard →</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Pick your route</h1>
        {search && <p className="text-[#A1A1AA] mt-1">{search.source} → {search.destination}</p>}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {routes.map((r) => (
          <Card key={r.route_type} className="flex flex-col">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#3B82F6]" />
              <p className="font-bold text-white">{LABELS[r.route_type]}</p>
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{r.safety_score}<span className="text-sm text-[#A1A1AA]">/100</span></p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <span className="flex items-center gap-1 text-[#A1A1AA]"><Clock className="h-3 w-3" />{r.eta_minutes} min</span>
              <span className="flex items-center gap-1 text-[#A1A1AA]"><IndianRupee className="h-3 w-3" />₹{r.estimated_cost_inr}</span>
              <span className="text-[#A1A1AA]">Walk {r.walking_distance_km} km</span>
              <span className="text-[#A1A1AA]">{r.transfer_count} transfers</span>
            </div>
            <Button className="mt-auto pt-4 w-full" onClick={() => startTrip(r)} disabled={starting}>
              Start trip
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
