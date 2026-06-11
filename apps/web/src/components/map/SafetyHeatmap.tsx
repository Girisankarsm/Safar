import type { HeatmapPoint } from "@/services/supabase/heatmap.service";
import type { SafetyReport } from "@/types/database";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

import "leaflet.heat";

const ZONE_COLORS: Record<string, string> = {
  safe: "#22c55e",
  moderate: "#f59e0b",
  high_risk: "#ef4444",
};

export function SafetyHeatmap({
  center,
  heatPoints,
  reports,
  userLat,
  userLng,
  height = "100%",
}: {
  center: { lat: number; lng: number };
  heatPoints: HeatmapPoint[];
  reports: SafetyReport[];
  userLat?: number;
  userLng?: number;
  height?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);

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

    overlayRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
    };
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;

    overlay.clearLayers();

    if (heatPoints.length > 0) {
      const heatData: [number, number, number][] = heatPoints.map((p) => [
        p.lat,
        p.lng,
        Math.max(0.15, p.weight),
      ]);
      const heat = (
        L as unknown as {
          heatLayer: (d: [number, number, number][], o?: object) => L.Layer;
        }
      ).heatLayer(heatData, { radius: 28, blur: 22, maxZoom: 15, max: 1 });
      overlay.addLayer(heat);

      heatPoints.forEach((p) => {
        L.circleMarker([p.lat, p.lng], {
          radius: 4,
          color: ZONE_COLORS[p.zone_type],
          fillColor: ZONE_COLORS[p.zone_type],
          fillOpacity: 0.5,
          weight: 1,
        })
          .bindPopup(`<strong>${p.label}</strong>`)
          .addTo(overlay);
      });
    }

    reports.forEach((r) => {
      L.circleMarker([r.latitude, r.longitude], {
        radius: 7,
        color: "#ef4444",
        fillColor: "#ef4444",
        fillOpacity: 0.85,
        weight: 2,
      })
        .bindPopup(
          `<strong>${r.report_type.replace(/_/g, " ")}</strong>${r.is_verified ? " · verified" : ""}${r.description ? `<br/>${r.description}` : ""}<br/><small>${r.upvotes} upvotes</small>`
        )
        .addTo(overlay);
    });

    if (userLat != null && userLng != null) {
      L.circleMarker([userLat, userLng], {
        radius: 9,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 1,
        weight: 3,
      }).addTo(overlay);
    }
  }, [heatPoints, reports, userLat, userLng]);

  return (
    <div ref={containerRef} style={{ height, width: "100%" }} className="rounded-2xl overflow-hidden" />
  );
}
