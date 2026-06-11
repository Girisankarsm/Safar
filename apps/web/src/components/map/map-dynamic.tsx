"use client";

import dynamic from "next/dynamic";
import type { MapFilter } from "@/components/trip/trip-live-map";

export const SafetyMapDynamic = dynamic(
  () => import("@/components/map/safety-map").then((m) => m.SafetyMap),
  {
    ssr: false,
    loading: () => <div className="h-full min-h-[280px] animate-pulse rounded-2xl bg-[#111111]" />,
  }
) as React.ComponentType<{
  height?: string;
  className?: string;
  userLat?: number;
  userLng?: number;
  showHeatmap?: boolean;
}>;

export const HomeRouteMapDynamic = dynamic(
  () => import("@/components/home/home-route-map").then((m) => m.HomeRouteMap),
  { ssr: false, loading: () => <div className="h-[480px] animate-pulse rounded-2xl bg-[#111111]" /> }
) as React.ComponentType<{
  routes?: import("@/lib/api").Route[];
  height?: number;
  highlightType?: string;
}>;

export const TripLiveMapDynamic = dynamic(
  () => import("@/components/trip/trip-live-map").then((m) => m.TripLiveMap),
  { ssr: false, loading: () => <div className="h-full min-h-[420px] animate-pulse rounded-2xl bg-[#111111]" /> }
) as React.ComponentType<{
  legs?: import("@/lib/api").RouteLeg[];
  currentLat?: number;
  currentLng?: number;
  cctv?: { lat: number; lng: number }[];
  reports?: import("@/lib/api").SafetyReport[];
  stops?: { lat: number; lng: number; name: string; mode: string; women_only_coach?: boolean; well_lit?: boolean }[];
  safetyScore?: number;
  filter?: MapFilter;
  height?: string;
  recenterKey?: number;
}>;
