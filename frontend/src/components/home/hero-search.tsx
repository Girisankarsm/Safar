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

  const places = CITIES[city].quickPlaces;

  return (
    <div className="rounded-3xl border border-[#262626] bg-[#171717] p-6 md:p-8">
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">From</label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3B82F6]" />
            <Input
              className="pl-12"
              placeholder="Starting point"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[#A1A1AA]">To</label>
          <div className="relative">
            <Navigation className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#3B82F6]" />
            <Input
              className="pl-12"
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {places.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => (!source ? setSource(p) : setDestination(p))}
            className="rounded-full border border-[#262626] bg-[#111111] px-4 py-1.5 text-xs font-medium text-[#A1A1AA] transition hover:border-[#3B82F6]/50 hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-[#EF4444]">{error}</p>}

      <Button className="mt-6 w-full" size="lg" onClick={search} disabled={loading || !source || !destination}>
        {loading ? "Finding routes…" : (
          <>
            Compare Routes <ArrowRight className="h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  );
}
