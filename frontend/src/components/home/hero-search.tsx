"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowRight, LocateFixed, MapPin, Navigation } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const CHIP_META = [
  { emoji: "🏠", label: "Home", idx: 0 },
  { emoji: "🏢", label: "Work", idx: 1 },
  { emoji: "🎓", label: "College", idx: 2 },
  { emoji: "🚉", label: "Metro", idx: 3 },
  { emoji: "✈️", label: "Airport", idx: 4 },
];

export function HeroSearch() {
  const { city } = useCity();
  const router = useRouter();
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const canSearch = Boolean(source && destination);

  const places = CITIES[city].quickPlaces;

  async function search() {
    if (!canSearch) return;
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

  async function useMyLocation() {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Location not available in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => setSource("My location"),
      () => setError("Could not access location")
    );
  }

  function fillChip(idx: number) {
    const place = places[idx] ?? places[places.length - 1];
    if (!source) setSource(place);
    else setDestination(place);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="rounded-2xl border border-[#262626] bg-[#111111] p-5 shadow-xl shadow-black/30 md:p-6"
    >
      <p className="mb-4 text-sm font-semibold text-white">Route planner</p>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
            From
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
            <Input
              className="pl-11"
              placeholder="Starting point"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
            To
          </label>
          <div className="relative">
            <Navigation className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#3B82F6]" />
            <Input
              className="pl-11"
              placeholder="Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">Quick picks</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {CHIP_META.map((chip, i) => (
          <motion.button
            key={chip.label}
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => fillChip(chip.idx)}
            className="rounded-full border border-[#262626] bg-[#171717] px-3 py-1.5 text-xs font-medium text-white transition hover:border-[#3B82F6]/50"
          >
            {chip.emoji} {chip.label}
          </motion.button>
        ))}
      </div>

      {error && <p className="mt-3 text-sm font-medium text-[#EF4444]">{error}</p>}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-5">
        <Button
          className={cn("w-full sm:col-span-3 !font-bold", canSearch && !loading && "btn-glow")}
          size="lg"
          onClick={search}
          disabled={loading || !canSearch}
        >
          {loading ? "Finding routes…" : (
            <>
              Compare Routes
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
        <Button
          className="w-full sm:col-span-2"
          size="lg"
          variant="secondary"
          onClick={useMyLocation}
          disabled={loading}
        >
          <LocateFixed className="h-4 w-4" />
          Use My Location
        </Button>
      </div>
    </motion.div>
  );
}
