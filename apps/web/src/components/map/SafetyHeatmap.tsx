import type { HeatmapPoint } from "@/services/supabase/heatmap.service";
import type { ReportType, SafetyReport } from "@/types/database";
import { useSettingsStore } from "@/stores/settings.store";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

import "leaflet.heat";

const MAX_MAP_REPORTS = 30;
const MAX_HEAT_POINTS = 40;

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

// ─── Report type → visual metadata ────────────────────────────────────────────

const REPORT_META: Record<
  ReportType,
  { color: string; glow: string; icon: string; label: string }
> = {
  harassment:          { color: "#ef4444", glow: "#ef444460", icon: "⚠️", label: "Harassment" },
  poor_lighting:       { color: "#f59e0b", glow: "#f59e0b60", icon: "💡", label: "Poor Lighting" },
  unsafe_bus_stop:     { color: "#f97316", glow: "#f9731660", icon: "🚌", label: "Unsafe Stop" },
  suspicious_activity: { color: "#a855f7", glow: "#a855f760", icon: "👁️", label: "Suspicious" },
  flooded_area:        { color: "#3b82f6", glow: "#3b82f660", icon: "🌊", label: "Flooding" },
  road_damage:         { color: "#78716c", glow: "#78716c60", icon: "🚧", label: "Road Damage" },
  stray_animal:        { color: "#84cc16", glow: "#84cc1660", icon: "🐕", label: "Stray Animal" },
  construction:        { color: "#eab308", glow: "#eab30860", icon: "🏗️", label: "Construction" },
  unsafe_area:         { color: "#ef4444", glow: "#ef444460", icon: "🚫", label: "Unsafe Area" },
  broken_light:        { color: "#f59e0b", glow: "#f59e0b60", icon: "🔦", label: "Broken Light" },
  dangerous_crossing:  { color: "#f97316", glow: "#f9731660", icon: "🚦", label: "Crossing" },
};

// ─── CSS injected once per map instance ───────────────────────────────────────

const MAP_STYLES = `
  /* --- shared reset --- */
  .safar-marker { position: relative; }

  /* --- report marker --- */
  .safar-incident {
    width: 48px; height: 48px;
    position: relative;
  }

  /* three concentric rings — centered via translate, always visible at different phases */
  .safar-incident .si-ring {
    position: absolute;
    width: 28px; height: 28px;
    top: 50%; left: 50%;
    border-radius: 50%;
    border: 1.5px solid var(--sc);
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.6);
    animation: si-ripple 2.7s ease-out infinite;
  }
  .safar-incident .si-ring:nth-child(1) { animation-delay: 0s; }
  .safar-incident .si-ring:nth-child(2) { animation-delay: 0.9s; }
  .safar-incident .si-ring:nth-child(3) { animation-delay: 1.8s; }

  .safar-incident .si-core {
    position: absolute;
    width: 28px; height: 28px;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: var(--sc);
    box-shadow: 0 0 12px var(--sg), 0 0 24px var(--sg);
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; line-height: 1;
  }

  @keyframes si-ripple {
    0%   { transform: translate(-50%, -50%) scale(0.55); opacity: 0.9; }
    70%  { opacity: 0.2; }
    100% { transform: translate(-50%, -50%) scale(1.75); opacity: 0; }
  }

  /* --- fresh report — faster, slightly thicker rings --- */
  .safar-incident.si-fresh .si-ring {
    animation-duration: 1.5s;
    border-width: 2px;
  }

  /* --- user location beacon --- */
  .safar-user { width: 28px; height: 28px; }
  .safar-user .su-halo {
    position: absolute; inset: 0;
    border-radius: 50%;
    background: #3b82f640;
    animation: su-expand 2s ease-out infinite;
  }
  .safar-user .su-ring {
    position: absolute; inset: 4px;
    border-radius: 50%;
    border: 2px solid #60a5fa;
    animation: su-expand 2s ease-out 0.4s infinite;
  }
  .safar-user .su-core {
    position: absolute; inset: 9px;
    border-radius: 50%;
    background: #3b82f6;
    box-shadow: 0 0 0 2px #fff, 0 0 12px #3b82f6;
  }
  @keyframes su-expand {
    0%   { transform: scale(0.6); opacity: 0.9; }
    100% { transform: scale(2.2); opacity: 0; }
  }

  /* --- pin marker (report drop location) --- */
  .safar-pin { width: 32px; height: 38px; }
  .safar-pin .sp-glow {
    position: absolute; top: 0; left: 4px; right: 4px; height: 24px;
    border-radius: 50%;
    background: #f59e0b;
    box-shadow: 0 0 14px #f59e0b, 0 0 28px #f59e0b80;
    animation: sp-glow 1.5s ease-in-out infinite alternate;
  }
  .safar-pin .sp-stem {
    position: absolute; bottom: 0; left: 14px;
    width: 4px; height: 14px;
    background: linear-gradient(to bottom, #f59e0b, transparent);
    border-radius: 2px;
  }
  @keyframes sp-glow {
    0%   { box-shadow: 0 0 10px #f59e0b, 0 0 20px #f59e0b80; }
    100% { box-shadow: 0 0 20px #f59e0b, 0 0 40px #f59e0baa; }
  }

  /* --- zone circle popup + dark leaflet popup --- */
  .leaflet-popup-content-wrapper {
    background: #0f0f1aee !important;
    border: 1px solid #2a2a3a !important;
    border-radius: 12px !important;
    backdrop-filter: blur(12px) !important;
    color: #e4e4f0 !important;
    box-shadow: 0 8px 32px #00000088 !important;
    padding: 0 !important;
  }
  .leaflet-popup-content {
    margin: 12px 16px !important;
    font-size: 13px !important;
    line-height: 1.5 !important;
  }
  .leaflet-popup-tip {
    background: #0f0f1aee !important;
  }
  .leaflet-popup-close-button {
    color: #71717a !important;
    font-size: 16px !important;
  }
  .leaflet-popup-close-button:hover { color: #fff !important; }

  /* --- zoom control polish --- */
  .leaflet-control-zoom a {
    background: #0f0f1a !important;
    border-color: #2a2a3a !important;
    color: #a1a1aa !important;
  }
  .leaflet-control-zoom a:hover {
    background: #1a1a2a !important;
    color: #fff !important;
  }
`;

// ─── Marker factory helpers ────────────────────────────────────────────────────

function incidentIcon(report: SafetyReport): L.DivIcon {
  const meta = REPORT_META[report.report_type] ?? REPORT_META.unsafe_area;
  const ageMs = Date.now() - new Date(report.created_at).getTime();
  const isFresh = ageMs < 3 * 60 * 60 * 1000; // < 3 h

  return L.divIcon({
    className: "safar-marker",
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -28],
    html: `<div
      class="safar-incident${isFresh ? " si-fresh" : ""}"
      style="--sc:${meta.color}; --sg:${meta.glow}"
    >
      <div class="si-ring"></div>
      <div class="si-ring"></div>
      <div class="si-ring"></div>
      <div class="si-core">${meta.icon}</div>
    </div>`,
  });
}

function userLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: "safar-marker safar-user",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -18],
    html: `<div style="width:28px;height:28px;position:relative">
      <div class="su-halo"></div>
      <div class="su-ring"></div>
      <div class="su-core"></div>
    </div>`,
  });
}

function pinIcon(): L.DivIcon {
  return L.divIcon({
    className: "safar-marker safar-pin",
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -40],
    html: `<div style="width:32px;height:38px;position:relative">
      <div class="sp-glow"></div>
      <div class="sp-stem"></div>
    </div>`,
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type HeatmapLayers = {
  heatmap: boolean;
  reports: boolean;
  safeZones: boolean;
  userLocation: boolean;
};

const DEFAULT_LAYERS: HeatmapLayers = {
  heatmap: false,
  reports: true,
  safeZones: false,
  userLocation: true,
};

type LeafletContainer = HTMLDivElement & { _leaflet_id?: number };

function clearLeafletContainer(el: LeafletContainer | null) {
  if (!el) return;
  delete el._leaflet_id;
  el.innerHTML = "";
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const lowDataMode = useSettingsStore((s) => s.lowDataMode);
  const mapMaxZoom = lowDataMode ? 15 : 19;

  useEffect(() => { centerRef.current = center; }, [center]);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);

  // ── Map init ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current as LeafletContainer | null;
    if (!container || mapRef.current) return;

    // Inject CSS once
    const styleId = "safar-map-styles";
    if (!container.ownerDocument.getElementById(styleId)) {
      const styleEl = container.ownerDocument.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = MAP_STYLES;
      container.ownerDocument.head.appendChild(styleEl);
    }

    const map = L.map(container, { zoomControl: true }).setView(
      [center.lat, center.lng],
      12
    );

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { attribution: "&copy; OSM &copy; CARTO", maxZoom: mapMaxZoom }
    ).addTo(map);

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

  // ── Center sync ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom(), { animate: false });
    requestAnimationFrame(() => map.invalidateSize());
  }, [center.lat, center.lng]);

  // ── Overlays ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const overlay = overlayRef.current;
    if (!map || !overlay) return;

    overlay.clearLayers();

    const bounds: L.LatLngExpression[] = [];
    const cappedHeat = heatPoints.slice(0, MAX_HEAT_POINTS);
    const cappedReports = reports.slice(0, MAX_MAP_REPORTS);
    const zonePoints = layers.safeZones
      ? cappedHeat.filter((p) => p.source === "ncrb")
      : [];
    const clusterPoints = cappedHeat.filter((p) => p.source !== "ncrb");

    // Heatmap layer
    if (layers.heatmap && cappedHeat.length > 0) {
      const heatData: [number, number, number][] = cappedHeat.map((p) => [
        p.lat,
        p.lng,
        Math.max(0.25, p.weight),
      ]);
      const heat = (
        L as unknown as {
          heatLayer: (d: [number, number, number][], o?: object) => L.Layer;
        }
      ).heatLayer(heatData, {
        radius: lowDataMode ? 28 : 36,
        blur: lowDataMode ? 18 : 24,
        maxZoom: 15,
        max: 1,
        minOpacity: 0.3,
        gradient: HEAT_GRADIENT,
      });
      overlay.addLayer(heat);
    }

    // Zone circles (NCRB baseline + cluster)
    const circlePoints = layers.safeZones
      ? zonePoints
      : layers.heatmap
      ? clusterPoints
      : [];

    circlePoints.forEach((p) => {
      const color = ZONE_COLORS[p.zone_type];
      const isBaseline = p.source === "ncrb";

      // Outer glow circle
      L.circle([p.lat, p.lng], {
        radius: isBaseline ? 950 : 550,
        color,
        fillColor: color,
        fillOpacity: isBaseline ? 0.06 : 0.1,
        weight: 0,
      }).addTo(overlay);

      // Main border circle
      L.circle([p.lat, p.lng], {
        radius: isBaseline ? 800 : 450,
        color,
        fillColor: color,
        fillOpacity: isBaseline ? 0.1 : 0.17,
        weight: isBaseline ? 1.5 : 2,
        opacity: 0.55,
        dashArray: isBaseline ? "6 4" : undefined,
      })
        .bindPopup(
          `<strong>${p.label}</strong><br/><small style="color:#a1a1aa">${
            isBaseline ? "NCRB baseline zone" : "Community report cluster"
          }</small>`
        )
        .addTo(overlay);

      // Center dot
      L.circleMarker([p.lat, p.lng], {
        radius: isBaseline ? 5 : 7,
        color: "#fff",
        fillColor: color,
        fillOpacity: 1,
        weight: 2,
      }).addTo(overlay);

      bounds.push([p.lat, p.lng]);
    });

    // Report incident markers
    if (layers.reports) {
      cappedReports.forEach((r) => {
        const meta = REPORT_META[r.report_type] ?? REPORT_META.unsafe_area;
        const ageMs = Date.now() - new Date(r.created_at).getTime();
        const hoursAgo = Math.round(ageMs / 3_600_000);
        const timeLabel =
          hoursAgo < 1
            ? "Just now"
            : hoursAgo < 24
            ? `${hoursAgo}h ago`
            : `${Math.round(hoursAgo / 24)}d ago`;

        L.marker([r.latitude, r.longitude], { icon: incidentIcon(r) })
          .bindPopup(
            `<div style="min-width:140px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="font-size:16px">${meta.icon}</span>
                <strong style="font-size:13px">${meta.label}</strong>
              </div>
              ${
                r.description
                  ? `<p style="color:#a1a1aa;font-size:12px;margin:0 0 4px">${r.description}</p>`
                  : ""
              }
              <div style="display:flex;gap:8px;font-size:11px;color:#71717a;margin-top:4px">
                <span>🕐 ${timeLabel}</span>
                ${r.is_verified ? '<span style="color:#22c55e">✓ Verified</span>' : ""}
                ${r.upvotes > 0 ? `<span>👍 ${r.upvotes}</span>` : ""}
              </div>
            </div>`
          )
          .addTo(overlay);
        bounds.push([r.latitude, r.longitude]);
      });
    }

    // Pin marker (report drop location)
    if (pinLat != null && pinLng != null) {
      L.marker([pinLat, pinLng], { icon: pinIcon() })
        .bindPopup(
          `<div><strong>📍 Report location</strong><br/><small style="color:#a1a1aa">Tap Submit to flag this spot</small></div>`
        )
        .addTo(overlay);
      bounds.push([pinLat, pinLng]);
    }

    // User location beacon
    if (layers.userLocation && userLat != null && userLng != null) {
      L.marker([userLat, userLng], { icon: userLocationIcon() })
        .bindPopup(`<div><strong>📍 You are here</strong></div>`)
        .addTo(overlay);
      bounds.push([userLat, userLng]);
    }

    if (fitOnLoad && !hasFitRef.current && bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds), {
        padding: [40, 40],
        maxZoom: 13,
      });
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
    lowDataMode,
  ]);

  // ── Recenter ────────────────────────────────────────────────────────────────
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
      className={`overflow-hidden ${
        onMapClick ? "cursor-crosshair" : ""
      } ${className}`}
    />
  );
}
