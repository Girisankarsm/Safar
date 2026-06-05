"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import { api } from "@/lib/api";
import { ArrowRight, MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HeroSearch() {
  const { city } = useCity();
  const router = useRouter();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function search() {
    if (!source || !destination) return;
    setLoading(true);
    setError("");
    try {
      const { routes } = await api.searchRoutes({
        source,
        destination,
        city,
        women_mode: true,
        night_mode: new Date().getHours() >= 22 || new Date().getHours() < 5,
      });
      sessionStorage.setItem("safarai-routes", JSON.stringify(routes));
      sessionStorage.setItem("safarai-search", JSON.stringify({ source, destination }));
      router.push("/routes");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not find routes");
    } finally {
      setLoading(false);
    }
  }

  const places = CITIES[city].quickPlaces.slice(0, 4);

  return (
    <div className="rounded-2xl border border-[#222222] bg-[#111111] p-6">
      <div className="space-y-3">
        <div className="relative">
          <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
          <Input
            className="pl-11"
            placeholder="From — e.g. T Nagar"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>
        <div className="relative">
          <Navigation className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a1aa]" />
          <Input
            className="pl-11"
            placeholder="To — e.g. Chennai Central"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {places.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => (!source ? setSource(p) : setDestination(p))}
            className="rounded-full border border-[#222222] px-3 py-1 text-xs text-[#a1a1aa] transition hover:border-white/30 hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-[#ef4444]">{error}</p>}

      <Button className="mt-4 w-full" size="lg" onClick={search} disabled={loading || !source || !destination}>
        {loading ? "Finding safest routes…" : (
          <>
            Compare routes <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
