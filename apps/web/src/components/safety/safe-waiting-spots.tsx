"use client";

import { api, type SafeSpot } from "@/lib/api";
import { useLiveLocation } from "@/hooks/use-live-location";
import { motion } from "framer-motion";
import {
  Building2,
  Cross,
  Fuel,
  MapPin,
  Pill,
  Shield,
  Train,
} from "lucide-react";
import { useEffect, useState } from "react";

const TYPE_META: Record<string, { icon: typeof MapPin; label: string; color: string }> = {
  petrol_pump: { icon: Fuel, label: "Petrol pump", color: "#F59E0B" },
  pharmacy: { icon: Pill, label: "Pharmacy", color: "#22C55E" },
  metro: { icon: Train, label: "Metro", color: "#3B82F6" },
  railway: { icon: Train, label: "Railway", color: "#3B82F6" },
  police: { icon: Shield, label: "Police", color: "#6366F1" },
  hospital: { icon: Cross, label: "Hospital", color: "#EF4444" },
  store: { icon: Building2, label: "Store", color: "#A1A1AA" },
};

export function SafeWaitingSpots({ city }: { city: string }) {
  const { coords } = useLiveLocation();
  const [spots, setSpots] = useState<SafeSpot[]>([]);

  useEffect(() => {
    api
      .safeSpots(city, coords?.lat, coords?.lng)
      .then((r) => setSpots(r.spots.slice(0, 6)))
      .catch(() => null);
  }, [city, coords?.lat, coords?.lng]);

  if (!spots.length) return null;

  return (
    <div className="rounded-2xl border border-[#22C55E]/20 bg-gradient-to-b from-[#22C55E]/5 to-transparent p-5">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-[#22C55E]" />
        <h3 className="text-sm font-bold text-white">Safe Waiting Spots</h3>
        <span className="rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[9px] font-bold uppercase text-[#22C55E]">
          Nearby
        </span>
      </div>
      <p className="mt-1 text-xs text-[#A1A1AA]">
        Well-lit, public locations to wait during emergencies
      </p>

      <div className="mt-4 space-y-2">
        {spots.map((spot, i) => {
          const meta = TYPE_META[spot.type] ?? TYPE_META.store;
          const Icon = meta.icon;
          const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${spot.lat},${spot.lng}`;

          return (
            <motion.a
              key={spot.name}
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between gap-3 rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 transition hover:border-[#22C55E]/30"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${meta.color}18` }}
                >
                  <Icon className="h-4 w-4" style={{ color: meta.color }} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{spot.name}</p>
                  <p className="text-[10px] text-[#A1A1AA]">{meta.label}</p>
                </div>
              </div>
              {spot.distance_m != null && (
                <span className="shrink-0 text-xs font-bold text-[#22C55E]">
                  {spot.distance_m < 1000
                    ? `${spot.distance_m}m`
                    : `${(spot.distance_m / 1000).toFixed(1)}km`}
                </span>
              )}
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}
