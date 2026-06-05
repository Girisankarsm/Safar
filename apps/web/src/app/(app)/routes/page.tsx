"use client";

import { motion } from "framer-motion";
import { HomeRouteMapDynamic } from "@/components/map/map-dynamic";
import { RouteCard } from "@/components/routes/route-card";
import { RouteSummaryPanel } from "@/components/routes/route-summary-panel";
import { ButtonLink } from "@/components/ui/button";
import { useActiveTrip } from "@/hooks/use-active-trip";
import { useCity } from "@/hooks/use-city";
import { api, type Route } from "@/lib/api";
import { readSessionJson } from "@/lib/storage";
import { Bus, Moon, Pencil, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function RoutesPage() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [search, setSearch] = useState<{ source: string; destination: string } | null>(null);
  const [starting, setStarting] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [startError, setStartError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { city } = useCity();
  const setTripId = useActiveTrip((s) => s.setTripId);

  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 5;

  const refreshRoutes = useCallback(
    async (searchData: { source: string; destination: string }, opts?: { silent?: boolean }) => {
      if (!opts?.silent) setRefreshing(true);
      try {
        const { routes: fresh } = await api.searchRoutes({
          source: searchData.source,
          destination: searchData.destination,
          city,
          women_mode: true,
          night_mode: isNight,
        });
        setRoutes(fresh);
        sessionStorage.setItem("safarai-routes", JSON.stringify(fresh));
        return fresh;
      } finally {
        if (!opts?.silent) setRefreshing(false);
      }
    },
    [city, isNight]
  );

  useEffect(() => {
    async function load() {
      const searchData = readSessionJson<{ source: string; destination: string }>("safarai-search");
      if (searchData) {
        setSearch(searchData);
        try {
          await refreshRoutes(searchData, { silent: true });
          return;
        } catch {
          // Fall back to cached routes if refresh fails.
        }
      }
      const cached = readSessionJson<Route[]>("safarai-routes");
      if (cached) setRoutes(cached);
    }
    load();
  }, [refreshRoutes]);

  async function start(routeId: string, routeType?: string) {
    setStarting(routeId);
    setStartError("");
    try {
      const trip = await api.startTrip(routeId);
      setTripId(trip.id);
      router.push(`/trip/${trip.id}`);
    } catch {
      if (search) {
        try {
          const fresh = await refreshRoutes(search, { silent: true });
          const match =
            fresh.find((r) => r.route_type === routeType) ??
            fresh.find((r) => r.id === routeId) ??
            fresh[0];
          if (match?.id) {
            const trip = await api.startTrip(match.id);
            setTripId(trip.id);
            router.push(`/trip/${trip.id}`);
            return;
          }
        } catch {
          // handled below
        }
      }
      setStartError("Could not start trip. Search again from Home, then tap Start Trip.");
    } finally {
      setStarting(null);
    }
  }

  const sorted = [...routes].sort((a, b) => {
    const order = { safest: 0, fastest: 1, greenest: 2 };
    return (order[a.route_type as keyof typeof order] ?? 9) - (order[b.route_type as keyof typeof order] ?? 9);
  });

  const safestRoute = useMemo(
    () => sorted.find((r) => r.route_type === "safest") ?? sorted[0] ?? null,
    [sorted]
  );

  const selectedRoute = useMemo(
    () => sorted.find((r) => r.id === selectedId) ?? null,
    [sorted, selectedId]
  );

  if (!routes.length) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center py-24 text-center">
        <h1 className="text-3xl font-bold text-white md:text-4xl">No routes yet</h1>
        <p className="mt-4 text-lg text-[#A1A1AA]">Search from Home to compare your safest options.</p>
        <ButtonLink href="/home" className="mt-10" size="lg">
          Go to Home
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-3xl font-bold text-white md:text-4xl">
              Pick your best route
              <Sparkles className="h-7 w-7 text-[#3B82F6]" />
            </h1>
            {search && (
              <Link
                href="/home"
                className="mt-2 inline-flex items-center gap-2 text-base text-[#A1A1AA] transition hover:text-white"
              >
                {search.source} → {search.destination}
                <Pencil className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {startError && (
          <p className="mt-4 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
            {startError}
          </p>
        )}
        {refreshing && (
          <p className="mt-3 text-sm text-[#A1A1AA]">Refreshing live routes…</p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <FilterChip
            icon={Moon}
            label={isNight ? "Night Mode (10:00 PM)" : "Day Mode"}
            active={isNight}
          />
          <FilterChip icon={Users} label="Women Safety Focus" active />
          <FilterChip icon={Bus} label="Live Transit & CCTV" active />
        </div>
      </motion.div>

      <div className="mb-8 overflow-hidden rounded-2xl border border-[#262626]">
        <HomeRouteMapDynamic
          routes={sorted}
          height={360}
          highlightType={selectedRoute?.route_type ?? safestRoute?.route_type}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {sorted.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="h-full"
          >
            <RouteCard
              route={r}
              selected={selectedId === r.id}
              recommended={r.route_type === "safest"}
              loading={starting === r.id}
              onSelect={() => setSelectedId(r.id!)}
              onStart={() => start(r.id!, r.route_type)}
            />
          </motion.div>
        ))}
      </div>

      <RouteSummaryPanel route={selectedRoute ?? safestRoute} />
    </div>
  );
}

function FilterChip({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Moon;
  label: string;
  active?: boolean;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold",
        active
          ? "border-[#3B82F6]/40 bg-[#3B82F6]/10 text-[#3B82F6]"
          : "border-[#262626] bg-[#111111] text-[#A1A1AA]",
      ].join(" ")}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
