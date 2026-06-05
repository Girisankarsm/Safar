"use client";

import { SafetyStatusChip } from "@/components/trip/safety-status-chip";
import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import type { RouteLeg } from "@/lib/api";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 15, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function TripMap({
  legs,
  currentLat,
  currentLng,
  cctv = [],
  safetyScore = 75,
  height = "360px",
}: {
  legs?: RouteLeg[];
  currentLat?: number;
  currentLng?: number;
  cctv?: { lat: number; lng: number }[];
  safetyScore?: number;
  height?: string;
}) {
  const { city } = useCity();
  const center = CITIES[city].center;

  const routePoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (const leg of legs || []) {
      if (leg.from_lat != null && leg.from_lng != null) pts.push([leg.from_lat, leg.from_lng]);
      if (leg.to_lat != null && leg.to_lng != null) pts.push([leg.to_lat, leg.to_lng]);
    }
    return pts;
  }, [legs]);

  const lat = currentLat ?? center.lat;
  const lng = currentLng ?? center.lng;

  return (
    <div style={{ height }} className="relative overflow-hidden rounded-2xl border border-[#222222]">
      <SafetyStatusChip score={safetyScore} />
      <MapContainer center={[lat, lng]} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <MapController lat={lat} lng={lng} />
        {routePoints.length > 1 && (
          <Polyline positions={routePoints} pathOptions={{ color: "#ffffff", weight: 5, opacity: 0.95 }} />
        )}
        {cctv.slice(0, 15).map((n, i) => (
          <CircleMarker
            key={i}
            center={[n.lat, n.lng]}
            radius={5}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.55 }}
          />
        ))}
        <CircleMarker
          center={[lat, lng]}
          radius={11}
          pathOptions={{ color: "#ffffff", fillColor: "#ffffff", fillOpacity: 1, weight: 2 }}
        />
      </MapContainer>
    </div>
  );
}
