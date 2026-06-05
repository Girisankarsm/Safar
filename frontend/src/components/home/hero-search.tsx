"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
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
  const canSearch = Boolean(source && destination);

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

  const places = CITIES[city].quickPlaces;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="rounded-3xl border border-[#404040] bg-[#171717] p-6 shadow-2xl shadow-black/40 md:p-8"
    >
      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">From</label>
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
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-[#A1A1AA]">To</label>
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

      <p className="mt-4 text-xs font-medium text-[#A1A1AA]">Quick picks — tap to fill</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {places.map((p, i) => (
          <motion.button
            key={p}
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.04 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => (!source ? setSource(p) : setDestination(p))}
            className="rounded-full border-2 border-[#404040] bg-[#262626] px-4 py-2 text-xs font-semibold !text-white transition-colors hover:border-[#3B82F6] hover:bg-[#3B82F6]/20"
          >
            {p}
          </motion.button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm font-medium text-[#EF4444]">{error}</p>}

      <motion.div
        className="mt-8"
        whileHover={canSearch ? { scale: 1.01 } : {}}
        whileTap={canSearch ? { scale: 0.98 } : {}}
      >
        <Button
          className={cn(
            "w-full !text-base !font-bold",
            canSearch && !loading && "btn-glow"
          )}
          size="lg"
          onClick={search}
          disabled={loading || !canSearch}
        >
          {loading ? (
            <span className="!text-white">Finding routes…</span>
          ) : (
            <span className="flex items-center gap-2 !text-white">
              Compare Routes
              <ArrowRight className="h-5 w-5 !text-white" />
            </span>
          )}
        </Button>
        {!canSearch && (
          <p className="mt-3 text-center text-xs text-[#A1A1AA]">Enter both locations to compare routes</p>
        )}
      </motion.div>
    </motion.div>
  );
}
