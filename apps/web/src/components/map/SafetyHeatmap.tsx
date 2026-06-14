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

const HEAT_GRADIENT = {
  0.2: "#22c55e",
  0.45: "#84cc16",
  0.6: "#f59e0b",
  0.8: "#f97316",
  1.0: "#ef4444",
};

export type HeatmapLayers = {
  heatmap: boolean;
  reports: boolean;
  safeZones: boolean;
  userLocation: boolean;
};

const DEFAULT_LAYERS: HeatmapLayers = {
  heatmap: true,
  reports: true,
  safeZones: true,
  userLocation: true,
};

type LeafletContainer = HTMLDivElement & { _leaflet_id?: number };

function clearLeafletContainer(el: LeafletContainer | null) {
  if (!el) return;
  delete el._leaflet_id;
  el.innerHTML = "";
}

export function SafetyHeatmap({
  center,
  heatPoints,
  reports,
  userLat,
  userLng,
  pinLat,
  pinLng,
  onMapClick,
  height = "100%",
  layers = DEFAULT_LAYERS,
  recenterSignal = 0,
  recenterToUser = false,
  className = "",
  fitOnLoad = true,
}: {
  center: { lat: number; lng: number };
  heatPoints: HeatmapPoint[];
  reports: SafetyReport[];
  userLat?: number;
  userLng?: number;
  pinLat?: number | null;
  pinLng?: number | null;
  onMapClick?: (lat: number, lng: number) => void;
  height?: string;
  layers?: HeatmapLayers;
  recenterSignal?: number;
  recenterToUser?: boolean;
  className?: string;
  fitOnLoad?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const overlayRef = useRef<L.LayerGroup | null>(null);
  const onMapClickRef = useRef(onMapClick);
  const hasFitRef = useRef(false);
  const centerRef = useRef(center);

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    const container = containerRef.current as LeafletContainer | null;
    if (!container || mapRef.current) return;

    const map = L.map(container, { zoomControl: true }).setView(
      [center.lat, center.lng],
      12
    );

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    overlayRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    map.on("click", (e) => {
      onMapClickRef.current?.(e.latlng.lat, e.latlng.lng);
    });

    requestAnimationFrame(() => map.invalidateSize());

    return () => {
      map.remove();
      mapRef.current = null;
      overlayRef.current = null;
      hasFitRef.current = false;
      clearLeafletContainer(container);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: false });
    requestAnimationFrame(() => map.invalidateSize());
  }, [center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;

    overlay.clearLayers();

    const bounds: L.LatLngExpression[] = [];
    const zonePoints = layers.safeZones
      ? heatPoints.filter((p) => p.source === "ncrb")
      : [];
    const clusterPoints = heatPoints.filter((p) => p.source !== "ncrb");

    if (layers.heatmap && heatPoints.length > 0) {
      const heatData: [number, number, number][] = heatPoints.map((p) => [
        p.lat,
        p.lng,
        Math.max(0.25, p.weight),
      ]);

      const heat = (
        L as unknown as {
          heatLayer: (d: [number, number, number][], o?: object) => L.Layer;
        }
      ).heatLayer(heatData, {
        radius: 42,
        blur: 28,
        maxZoom: 17,
        max: 1,
        minOpacity: 0.35,
        gradient: HEAT_GRADIENT,
      });
      overlay.addLayer(heat);
    }

    const circlePoints = layers.safeZones ? zonePoints : layers.heatmap ? clusterPoints : [];

    circlePoints.forEach((p) => {
      const color = ZONE_COLORS[p.zone_type];
      const isBaseline = p.source === "ncrb";

      L.circle([p.lat, p.lng], {
        radius: isBaseline ? 900 : 500,
        color,
        fillColor: color,
        fillOpacity: isBaseline ? 0.14 : 0.22,
        weight: isBaseline ? 2 : 3,
        opacity: 0.7,
      })
        .bindPopup(
          `<strong>${p.label}</strong>${isBaseline ? "<br/><small>NCRB baseline zone</small>" : "<br/><small>Community report cluster</small>"}`
        )
        .addTo(overlay);

      L.circleMarker([p.lat, p.lng], {
        radius: isBaseline ? 6 : 8,
        color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: 2,
      }).addTo(overlay);

      bounds.push([p.lat, p.lng]);
    });

    if (layers.reports) {
      reports.forEach((r) => {
        L.circleMarker([r.latitude, r.longitude], {
          radius: 10,
          color: "#ffffff",
          fillColor: "#ef4444",
          fillOpacity: 0.95,
          weight: 3,
        })
          .bindPopup(
            `<strong>${r.report_type.replace(/_/g, " ")}</strong>${r.is_verified ? " · verified" : ""}${r.description ? `<br/>${r.description}` : ""}<br/><small>${r.upvotes} upvotes</small>`
          )
          .addTo(overlay);
        bounds.push([r.latitude, r.longitude]);
      });
    }

    if (pinLat != null && pinLng != null) {
      L.circleMarker([pinLat, pinLng], {
        radius: 11,
        color: "#f59e0b",
        fillColor: "#f59e0b",
        fillOpacity: 0.9,
        weight: 3,
      })
        .bindPopup("<strong>Report location</strong><br/>Tap Submit to flag this spot")
        .addTo(overlay);
      bounds.push([pinLat, pinLng]);
    }

    if (layers.userLocation && userLat != null && userLng != null) {
      L.circleMarker([userLat, userLng], {
        radius: 9,
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 1,
        weight: 3,
      })
        .bindPopup("You are here")
        .addTo(overlay);
      bounds.push([userLat, userLng]);
    }

    if (fitOnLoad && !hasFitRef.current && bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 13 });
      hasFitRef.current = true;
    }
  }, [
    heatPoints,
    reports,
    userLat,
    userLng,
    pinLat,
    pinLng,
    layers.heatmap,
    layers.reports,
    layers.safeZones,
    layers.userLocation,
    fitOnLoad,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || recenterSignal === 0) return;

    if (recenterToUser && userLat != null && userLng != null) {
      map.setView([userLat, userLng], 14, { animate: true });
      return;
    }
    const c = centerRef.current;
    map.setView([c.lat, c.lng], 12, { animate: true });
  }, [recenterSignal, recenterToUser, userLat, userLng]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", minHeight: 320 }}
      className={`overflow-hidden ${onMapClick ? "cursor-crosshair" : ""} ${className}`}
    />
  );
}
