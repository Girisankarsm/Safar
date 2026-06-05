"use client";

import { motion } from "framer-motion";
import { RouteCard } from "@/components/routes/route-card";
import { ButtonLink } from "@/components/ui/button";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { api, type Route } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState<{ source: string; destination: string } | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const router = useRouter();
  const setTripId = useActiveTrip((s) => s.setTripId);

  useEffect(() => {
    const raw = sessionStorage.getItem("safarai-routes");
    const s = sessionStorage.getItem("safarai-search");
    if (raw) setRoutes(JSON.parse(raw));
    if (s) setSearch(JSON.parse(s));
  }, []);

  async function start(routeId: string) {
    setStarting(routeId);
    try {
      const trip = await api.startTrip(routeId);
      setTripId(trip.id);
      router.push(`/trip/${trip.id}`);
    } finally {
      setStarting(null);
    }
  }

  const sorted = [...routes].sort((a, b) => {
    const order = { safest: 0, fastest: 1, greenest: 2 };
    return (order[a.route_type as keyof typeof order] ?? 9) - (order[b.route_type as keyof typeof order] ?? 9);
  });

  if (!routes.length) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <h1 className="text-3xl font-semibold text-white">No routes yet</h1>
        <p className="mt-3 text-[#a1a1aa]">Search from Home to see your safest options.</p>
        <ButtonLink href="/home" className="mt-8" size="lg">
          Go to Home
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Pick your route</h1>
        {search && (
          <p className="mt-3 text-lg text-[#a1a1aa]">
            {search.source} → {search.destination}
          </p>
        )}
        <p className="mt-2 text-sm text-[#a1a1aa]">
          <span className="text-white">Safest</span> is recommended for solo and night travel.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {sorted.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.45 }}
          >
            <RouteCard
              route={r}
              recommended={r.route_type === "safest"}
              loading={starting === r.id}
              onStart={() => start(r.id!)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
