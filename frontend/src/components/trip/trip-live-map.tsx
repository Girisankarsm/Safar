"use client";

import { SafetyStatusChip } from "@/components/trip/safety-status-chip";
import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import type { RouteLeg, SafetyReport } from "@/lib/api";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, useMap } from "react-leaflet";

export type MapFilter = "all" | "cctv" | "transit" | "incidents" | "lighting" | "women";

function MapController({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function TripLiveMap({
  legs = [],
  currentLat,
  currentLng,
  cctv = [],
  reports = [],
  stops = [],
  safetyScore = 75,
  filter = "all",
  height = "100%",
}: {
  legs?: RouteLeg[];
  currentLat?: number;
  currentLng?: number;
  cctv?: { lat: number; lng: number }[];
  reports?: SafetyReport[];
  stops?: { lat: number; lng: number; name: string; mode: string; women_only_coach?: boolean; well_lit?: boolean }[];
  safetyScore?: number;
  filter?: MapFilter;
  height?: string;
}) {
  const { city } = useCity();
  const center = CITIES[city].center;
  const lat = currentLat ?? center.lat;
  const lng = currentLng ?? center.lng;

  const routePoints = useMemo(() => {
    const pts: [number, number][] = [];
    for (const leg of legs) {
      if (leg.from_lat != null && leg.from_lng != null) pts.push([leg.from_lat, leg.from_lng]);
      if (leg.to_lat != null && leg.to_lng != null) pts.push([leg.to_lat, leg.to_lng]);
    }
    return pts;
  }, [legs]);

  const destination = routePoints.length ? routePoints[routePoints.length - 1] : null;
  const riskReports = reports.filter((r) =>
    ["unsafe_area", "harassment", "dangerous_crossing", "broken_light"].includes(r.report_type)
  );

  const showCctv = filter === "all" || filter === "cctv";
  const showTransit = filter === "all" || filter === "transit";
  const showIncidents = filter === "all" || filter === "incidents";
  const showLighting = filter === "all" || filter === "lighting";
  const showWomen = filter === "all" || filter === "women";

  const litStops = stops.filter((s) => s.well_lit);
  const womenStops = stops.filter((s) => s.women_only_coach);

  return (
    <div style={{ height }} className="relative h-full w-full overflow-hidden rounded-2xl border border-[#262626]">
      <SafetyStatusChip score={safetyScore} />
      <MapContainer center={[lat, lng]} zoom={14} style={{ height: "100%", width: "100%" }} zoomControl>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        <MapController lat={lat} lng={lng} />

        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{ color: "#3B82F6", weight: 4, opacity: 0.9, dashArray: "8 6" }}
          />
        )}

        {showIncidents &&
          riskReports.map((r) => (
            <Circle
              key={r.id}
              center={[r.latitude, r.longitude]}
              radius={400}
              pathOptions={{ color: "#EF4444", fillColor: "#EF4444", fillOpacity: 0.15, weight: 1 }}
            />
          ))}

        {showCctv &&
          cctv.slice(0, 40).map((n, i) => (
            <CircleMarker
              key={`cctv-${i}`}
              center={[n.lat, n.lng]}
              radius={6}
              pathOptions={{ color: "#22C55E", fillColor: "#22C55E", fillOpacity: 0.7, weight: 1 }}
            />
          ))}

        {showTransit &&
          stops.map((s) => (
            <CircleMarker
              key={`stop-${s.name}`}
              center={[s.lat, s.lng]}
              radius={5}
              pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 0.75, weight: 1 }}
            />
          ))}

        {showLighting &&
          litStops.map((s) => (
            <CircleMarker
              key={`lit-${s.name}`}
              center={[s.lat, s.lng]}
              radius={5}
              pathOptions={{ color: "#EAB308", fillColor: "#EAB308", fillOpacity: 0.7, weight: 1 }}
            />
          ))}

        {showWomen &&
          womenStops.map((s) => (
            <CircleMarker
              key={`women-${s.name}`}
              center={[s.lat, s.lng]}
              radius={6}
              pathOptions={{ color: "#A855F7", fillColor: "#A855F7", fillOpacity: 0.65, weight: 1 }}
            />
          ))}

        {destination && (
          <CircleMarker
            center={destination}
            radius={10}
            pathOptions={{ color: "#EF4444", fillColor: "#EF4444", fillOpacity: 0.9, weight: 2 }}
          />
        )}

        <CircleMarker
          center={[lat, lng]}
          radius={10}
          pathOptions={{ color: "#3B82F6", fillColor: "#3B82F6", fillOpacity: 1, weight: 3 }}
        />
      </MapContainer>
    </div>
  );
}
