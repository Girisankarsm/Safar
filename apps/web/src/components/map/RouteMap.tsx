import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/i18n/use-i18n";
import { addLabeledMarker } from "@/components/map/map-markers";
import { useSettingsStore } from "@/stores/settings.store";
import type { CorridorProfile, CorridorSegment } from "@/lib/corridor-risk";
import { useCallback, useEffect, useRef } from "react";

function isStraightLine(geometry?: GeoJSON.LineString): boolean {
  return !geometry?.coordinates?.length || geometry.coordinates.length <= 2;
}

const SEGMENT_COLORS: Record<string, string> = {
  safe: "#22C55E",
  moderate: "#F59E0B",
  risk: "#EF4444",
};

const ROUTE_TYPE_COLOR: Record<string, string> = {
  balanced: "#3B82F6",
  safest: "#22C55E",
  cheapest: "#F59E0B",
  women_friendly: "#A855F7",
};

function hotspotIcon(riskLevel: string): L.DivIcon {
  const color = riskLevel === "high" ? "#EF4444" : riskLevel === "moderate" ? "#F59E0B" : "#FBBF24";
  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${color}22;border:2px solid ${color};
      display:flex;align-items:center;justify-content:center;
      font-size:9px;color:${color};font-weight:700;
    ">!</div>`,
  });
}

function poiIcon(type: "hospital" | "police"): L.DivIcon {
  const isHospital = type === "hospital";
  const bg = isHospital ? "#06B6D4" : "#3B82F6";
  const label = isHospital ? "H" : "P";
  return L.divIcon({
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -14],
    html: `<div style="
      width:26px;height:26px;border-radius:50%;
      background:${bg};border:2.5px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.5);
      display:flex;align-items:center;justify-content:center;
      font-size:11px;color:white;font-weight:800;letter-spacing:-0.5px;
    ">${label}</div>`,
  });
}

function drawSegmentedRoute(
  map: L.Map,
  geometry: GeoJSON.LineString,
  segments: CorridorSegment[],
  fallbackColor: string
): void {
  const coords = geometry.coordinates;

  if (!segments.length) {
    L.polyline(coords.map(([lng, lat]) => [lat, lng] as [number, number]), {
      color: fallbackColor,
      weight: 6,
      opacity: 0.95,
    }).addTo(map);
    return;
  }

  for (const seg of segments) {
    const from = Math.min(seg.fromCoordIdx, coords.length - 1);
    const to = Math.min(seg.toCoordIdx, coords.length - 1);
    if (from >= to) continue;
    const slice = coords.slice(from, to + 1);
    const latlngs = slice.map(([lng, lat]) => [lat, lng] as [number, number]);
    const color = SEGMENT_COLORS[seg.riskLevel] ?? "#3B82F6";

    L.polyline(latlngs, {
      color,
      weight: 6,
      opacity: 0.9,
    })
      .bindPopup(
        `<b>${seg.riskLevel.charAt(0).toUpperCase() + seg.riskLevel.slice(1)} Risk Segment</b><br/>` +
          `Reports nearby: ${seg.reportCount}<br/>` +
          `Police: ${seg.policeNearby} · Hospital: ${seg.hospitalNearby}`
      )
      .addTo(map);
  }
}

function buildRouteBounds(
  source: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  geometry?: GeoJSON.LineString
): L.LatLngBounds {
  const points: L.LatLngExpression[] = [
    [source.lat, source.lng],
    [destination.lat, destination.lng],
  ];
  if (geometry?.coordinates?.length) {
    for (const [lng, lat] of geometry.coordinates) {
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        points.push([lat, lng]);
      }
    }
  }
  return L.latLngBounds(points);
}

function maxZoomForDistance(source: { lat: number; lng: number }, destination: { lat: number; lng: number }): number {
  const latDiff = Math.abs(source.lat - destination.lat);
  const lngDiff = Math.abs(source.lng - destination.lng);
  const span = Math.max(latDiff, lngDiff);
  if (span < 0.015) return 16;
  if (span < 0.04) return 15;
  if (span < 0.12) return 14;
  if (span < 0.35) return 13;
  return 12;
}

export function RouteMap({
  geometry,
  source,
  destination,
  sourceName,
  destinationName,
  corridorProfile,
  routeType,
  height = 320,
  className,
  focusSegmentIdx,
}: {
  geometry?: GeoJSON.LineString;
  source: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  sourceName?: string;
  destinationName?: string;
  corridorProfile?: CorridorProfile;
  routeType?: string;
  height?: number | string;
  className?: string;
  focusSegmentIdx?: number | null;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const estimate = isStraightLine(geometry);
  const lowDataMode = useSettingsStore((s) => s.lowDataMode);
  const maxTileZoom = lowDataMode ? 14 : 19;
  const lineColor = (routeType && ROUTE_TYPE_COLOR[routeType]) ?? "#3B82F6";

  const fitToRoute = useCallback(() => {
    const map = mapRef.current;
    const bounds = boundsRef.current;
    if (!map || !bounds?.isValid()) return;

    map.invalidateSize({ animate: false });
    map.fitBounds(bounds, {
      padding: [56, 56],
      maxZoom: maxZoomForDistance(source, destination),
      animate: false,
    });
  }, [source, destination]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const midLat = (source.lat + destination.lat) / 2;
    const midLng = (source.lng + destination.lng) / 2;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([midLat, midLng], 13);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OSM &copy; CARTO",
      maxZoom: maxTileZoom,
    }).addTo(map);
    mapRef.current = map;

    const ro = new ResizeObserver(() => {
      fitToRoute();
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [source.lat, source.lng, destination.lat, destination.lng, maxTileZoom, fitToRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (
        layer instanceof L.Polyline ||
        layer instanceof L.CircleMarker ||
        layer instanceof L.Marker
      ) {
        map.removeLayer(layer);
      }
    });

    addLabeledMarker(map, source.lat, source.lng, {
      label: "A",
      color: "#22C55E",
      ringColor: "#22C55E",
      title: sourceName ?? "Start",
      subtitle: "Your departure point",
    });

    addLabeledMarker(map, destination.lat, destination.lng, {
      label: "B",
      color: "#EF4444",
      ringColor: "#EF4444",
      title: destinationName ?? "Destination",
      subtitle: "End of route",
    });

    if (geometry?.coordinates?.length) {
      const latlngs = geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);

      if (estimate) {
        L.polyline(latlngs, {
          color: lineColor,
          weight: 5,
          opacity: 0.85,
          dashArray: "10 8",
        })
          .bindPopup("Estimated direct path — search again for road routing")
          .addTo(map);
      } else if (corridorProfile?.segments?.length) {
        L.polyline(latlngs, {
          color: lineColor,
          weight: 10,
          opacity: 0.18,
        }).addTo(map);

        drawSegmentedRoute(map, geometry, corridorProfile.segments, lineColor);

        for (const hotspot of corridorProfile.hotspots) {
          L.marker([hotspot.lat, hotspot.lng], { icon: hotspotIcon(hotspot.riskLevel) })
            .bindPopup(
              `<b>${hotspot.riskLevel.charAt(0).toUpperCase() + hotspot.riskLevel.slice(1)}-Risk Zone</b><br/>` +
                `${hotspot.reportCount} community report${hotspot.reportCount > 1 ? "s" : ""}<br/>` +
                `Types: ${hotspot.types.slice(0, 3).join(", ")}`
            )
            .addTo(map);
        }

        for (const h of corridorProfile.hospitals ?? []) {
          L.marker([h.lat, h.lng], { icon: poiIcon("hospital"), zIndexOffset: 200 })
            .bindPopup(`<b>🏥 ${h.name}</b><br/><span style="color:#06B6D4">Hospital on corridor</span>`)
            .addTo(map);
        }

        for (const p of corridorProfile.policeStations ?? []) {
          L.marker([p.lat, p.lng], { icon: poiIcon("police"), zIndexOffset: 200 })
            .bindPopup(`<b>🚔 ${p.name}</b><br/><span style="color:#3B82F6">Police station on corridor</span>`)
            .addTo(map);
        }
      } else {
        L.polyline(latlngs, {
          color: lineColor,
          weight: 6,
          opacity: 0.95,
        })
          .bindPopup("Road route")
          .addTo(map);

        for (const h of corridorProfile?.hospitals ?? []) {
          L.marker([h.lat, h.lng], { icon: poiIcon("hospital"), zIndexOffset: 200 })
            .bindPopup(`<b>🏥 ${h.name}</b><br/><span style="color:#06B6D4">Hospital on corridor</span>`)
            .addTo(map);
        }
        for (const p of corridorProfile?.policeStations ?? []) {
          L.marker([p.lat, p.lng], { icon: poiIcon("police"), zIndexOffset: 200 })
            .bindPopup(`<b>🚔 ${p.name}</b><br/><span style="color:#3B82F6">Police station on corridor</span>`)
            .addTo(map);
        }
      }
    }

    boundsRef.current = buildRouteBounds(source, destination, geometry);

    const runFit = () => fitToRoute();
    map.whenReady(runFit);
    requestAnimationFrame(runFit);
    const t1 = window.setTimeout(runFit, 120);
    const t2 = window.setTimeout(runFit, 400);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [
    geometry,
    source,
    destination,
    estimate,
    sourceName,
    destinationName,
    corridorProfile,
    lineColor,
    fitToRoute,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (map == null || focusSegmentIdx == null || !corridorProfile?.segments) return;
    const seg = corridorProfile.segments[focusSegmentIdx];
    if (!seg) return;
    map.setView([seg.lat, seg.lng], 16, { animate: true });
  }, [focusSegmentIdx, corridorProfile]);

  const hasSegments = !estimate && corridorProfile?.segments?.length;
  const hasHotspots = (corridorProfile?.hotspots?.length ?? 0) > 0;
  const hasHospitals = (corridorProfile?.hospitals?.length ?? 0) > 0;
  const hasPolice = (corridorProfile?.policeStations?.length ?? 0) > 0;

  return (
    <div className={`relative h-full min-h-0${className ? ` ${className}` : ""}`}>
      <div
        ref={containerRef}
        style={{ height: typeof height === "number" ? height : height, width: "100%" }}
        className={`h-full min-h-0 overflow-hidden border border-[#262626]${className?.includes("rounded-none") ? "" : " rounded-2xl"}`}
      />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-1.5 text-[10px] font-semibold">
        <span className="rounded-md bg-black/80 px-2 py-1 text-[#22C55E]">{t("map.start")}</span>
        <span className="rounded-md bg-black/80 px-2 py-1 text-[#EF4444]">{t("map.destination")}</span>
        {estimate ? (
          <span className="rounded-md bg-black/80 px-2 py-1 text-[#F59E0B]">Estimated path</span>
        ) : hasSegments ? (
          <>
            <span className="rounded-md bg-black/80 px-2 py-1 text-[#22C55E]">Safe</span>
            <span className="rounded-md bg-black/80 px-2 py-1 text-[#F59E0B]">Moderate</span>
            <span className="rounded-md bg-black/80 px-2 py-1 text-[#EF4444]">Risk</span>
            {hasHotspots && (
              <span className="rounded-md bg-black/80 px-2 py-1 text-[#FBBF24]">! Hotspot</span>
            )}
            {hasHospitals && (
              <span className="rounded-md bg-black/80 px-2 py-1 text-[#06B6D4]">H Hospital</span>
            )}
            {hasPolice && (
              <span className="rounded-md bg-black/80 px-2 py-1 text-[#3B82F6]">P Police</span>
            )}
          </>
        ) : (
          <span className="rounded-md bg-black/80 px-2 py-1 text-[#3B82F6]">Road route</span>
        )}
      </div>
    </div>
  );
}
