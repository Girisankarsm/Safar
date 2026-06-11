import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { routesService } from "@/services/supabase/routes.service";
import { useCityStore } from "@/stores/city.store";
import type { PlannedRoute } from "@/types/database";
import { Shield } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function HomePage() {
  const { city } = useCityStore();
  const navigate = useNavigate();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);

  async function search() {
    if (!source.trim() || !destination.trim()) return;
    setLoading(true);
    try {
      const routes = await routesService.searchRoutes(source, destination, city);
      sessionStorage.setItem("safar-routes", JSON.stringify(routes));
      sessionStorage.setItem("safar-search", JSON.stringify({ source, destination }));
      navigate("/routes");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Route search failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#3B82F6] font-semibold">Safar Command Center</p>
          <h1 className="text-3xl font-bold text-white mt-1">Smart Route Planner</h1>
        </div>
        <Link to="/emergency" className="flex items-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-2 text-sm font-bold text-[#EF4444]">
          <Shield className="h-4 w-4" /> Emergency Shield
        </Link>
      </div>

      <div className="rounded-2xl border border-[#262626] bg-[#111111] p-6 space-y-4">
        <Input placeholder="Source (e.g. T Nagar)" value={source} onChange={(e) => setSource(e.target.value)} />
        <Input placeholder="Destination (e.g. Chennai Central)" value={destination} onChange={(e) => setDestination(e.target.value)} />
        <Button onClick={search} disabled={loading} className="w-full" size="lg">
          {loading ? "Finding routes…" : "Compare routes"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/safety" className="rounded-2xl border border-[#262626] bg-[#111111] p-5 hover:border-[#3B82F6]/30 transition">
          <p className="font-bold text-white">Safety Heatmap</p>
          <p className="text-sm text-[#A1A1AA] mt-1">Live community reports & zones</p>
        </Link>
        <Link to="/emergency" className="rounded-2xl border border-[#262626] bg-[#111111] p-5 hover:border-[#EF4444]/30 transition">
          <p className="font-bold text-white">Safe Waiting Spots</p>
          <p className="text-sm text-[#A1A1AA] mt-1">Nearest safe locations</p>
        </Link>
      </div>
    </div>
  );
}
