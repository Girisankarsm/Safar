import type { SafetyReport, SafetyZone } from "@/types/database";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

const ZONE_COLORS: Record<string, string> = {
  safe: "#22c55e",
  moderate: "#f59e0b",
  high_risk: "#ef4444",
};

export function SafetyHeatmap({
  center,
  zones,
  reports,
  userLat,
  userLng,
  height = "100%",
}: {
  center: { lat: number; lng: number };
  zones: SafetyZone[];
  reports: SafetyReport[];
  userLat?: number;
  userLng?: number;
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [center.lat, center.lng],
      12
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker || layer instanceof L.Circle) {
        if (!(layer as L.TileLayer).getAttribution) map.removeLayer(layer);
      }
    });

    zones.forEach((z) => {
      L.circle([z.latitude, z.longitude], {
        radius: 400 + z.risk_weight * 300,
        color: ZONE_COLORS[z.zone_type],
        fillColor: ZONE_COLORS[z.zone_type],
        fillOpacity: 0.15 + z.risk_weight * 0.25,
        weight: 1,
      })
        .bindPopup(`<strong>${z.label}</strong><br/>${z.zone_type.replace("_", " ")}`)
        .addTo(map);
    });

    reports.forEach((r) => {
      L.circleMarker([r.latitude, r.longitude], {
        radius: 8,
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.7,
      })
        .bindPopup(`<strong>${r.report_type.replace(/_/g, " ")}</strong>${r.description ? `<br/>${r.description}` : ""}`)
        .addTo(map);
    });

    if (userLat != null && userLng != null) {
      L.circleMarker([userLat, userLng], {
        radius: 10,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 1,
      }).addTo(map);
    }
  }, [zones, reports, userLat, userLng]);

  return <div ref={containerRef} style={{ height, width: "100%" }} className="rounded-2xl overflow-hidden" />;
}
