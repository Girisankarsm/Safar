"use client";

import dynamic from "next/dynamic";

export const SafetyMapDynamic = dynamic(
  () => import("@/components/map/safety-map").then((m) => m.SafetyMap),
  {
    ssr: false,
    loading: () => <div className="h-full min-h-[280px] animate-pulse rounded-2xl bg-[#111111]" />,
  }
) as React.ComponentType<{ height?: string; className?: string }>;

export const TripMapDynamic = dynamic(
  () => import("@/components/map/trip-map").then((m) => m.TripMap),
  { ssr: false, loading: () => <div className="h-[320px] animate-pulse rounded-2xl bg-[#111111]" /> }
);
