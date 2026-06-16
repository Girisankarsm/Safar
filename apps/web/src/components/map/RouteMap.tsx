import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/i18n/use-i18n";
import { addLabeledMarker } from "@/components/map/map-markers";
import { useSettingsStore } from "@/stores/settings.store";
import type { CorridorProfile, CorridorSegment } from "@/lib/corridor-risk";
import { haversineM, ensureRouteGeometryEndpoints } from "@/lib/geo";
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

function decimateCoords<T>(coords: T[], maxPoints: number): T[] {
  if (coords.length <= maxPoints) return coords;
  const step = Math.ceil(coords.length / maxPoints);
  const out: T[] = [];
  for (let i = 0; i < coords.length; i += step) out.push(coords[i]);
  const last = coords[coords.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

type RouteDisplayStyle = {
  spanDeg: number;
  distanceKm: number;
  longRoute: boolean;
  mainWeight: number;
  segmentWeight: number;
  glowWeight: number;
  showGlow: boolean;
  showCorridorPins: boolean;
};

function routeDisplayStyle(
  source: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  geometry?: GeoJSON.LineString
): RouteDisplayStyle {
  const bounds = buildRouteBounds(source, destination, geometry);
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  const spanDeg = Math.max(Math.abs(ne.lat - sw.lat), Math.abs(ne.lng - sw.lng));
  const distanceKm = haversineM(source.lat, source.lng, destination.lat, destination.lng) / 1000;
  const longRoute = spanDeg >= 0.9 || distanceKm >= 60;

  if (spanDeg >= 3 || distanceKm >= 250) {
    return {
      spanDeg,
      distanceKm,
      longRoute: true,
      mainWeight: 2,
      segmentWeight: 2,
      glowWeight: 0,
      showGlow: false,
      showCorridorPins: false,
    };
  }
  if (spanDeg >= 1.5 || distanceKm >= 120) {
    return {
      spanDeg,
      distanceKm,
      longRoute: true,
      mainWeight: 2.5,
      segmentWeight: 2.5,
      glowWeight: 0,
      showGlow: false,
      showCorridorPins: false,
    };
  }
  if (longRoute) {
    return {
      spanDeg,
      distanceKm,
      longRoute: true,
      mainWeight: 3,
      segmentWeight: 3,
      glowWeight: 5,
      showGlow: false,
      showCorridorPins: false,
    };
  }
  if (spanDeg >= 0.35) {
    return {
      spanDeg,
      distanceKm,
      longRoute: false,
      mainWeight: 4,
      segmentWeight: 4,
      glowWeight: 7,
      showGlow: true,
      showCorridorPins: true,
    };
  }
  if (spanDeg >= 0.12) {
    return {
      spanDeg,
      distanceKm,
      longRoute: false,
      mainWeight: 5,
      segmentWeight: 5,
      glowWeight: 9,
      showGlow: true,
      showCorridorPins: true,
    };
  }
  return {
    spanDeg,
    distanceKm,
    longRoute: false,
    mainWeight: 6,
    segmentWeight: 6,
    glowWeight: 10,
    showGlow: true,
    showCorridorPins: true,
  };
}

const LONG_ROUTE_LINE = "#F59E0B";

function prepareDisplayCoords(
  geometry: GeoJSON.LineString,
  source: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  maxPoints: number
): [number, number][] {
  const pinned = ensureRouteGeometryEndpoints(geometry, source, destination);
  const decimated = decimateCoords(pinned.coordinates, maxPoints);
  return decimated.map(([lng, lat]) => [lat, lng] as [number, number]);
}

function drawCasedPolyline(
  map: L.Map,
  latlngs: [number, number][],
  color: string,
  weight: number,
  options?: { dashArray?: string; opacity?: number; popup?: string }
) {
  if (latlngs.length < 2) return;

  L.polyline(latlngs, {
    color: "#050505",
    weight: weight + 4,
    opacity: 0.9,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(map);

  L.polyline(latlngs, {
    color: "#262626",
    weight: weight + 2,
    opacity: 0.85,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(map);

  const line = L.polyline(latlngs, {
    color,
    weight,
    opacity: options?.opacity ?? 0.95,
    dashArray: options?.dashArray,
    lineCap: "round",
    lineJoin: "round",
  }).addTo(map);

  if (options?.popup) line.bindPopup(options.popup);
}

function drawSegmentedRoute(
  map: L.Map,
  geometry: GeoJSON.LineString,
  segments: CorridorSegment[],
  fallbackColor: string,
  segmentWeight: number
): void {
  const coords = geometry.coordinates;

  if (!segments.length) {
    L.polyline(
      coords.map(([lng, lat]) => [lat, lng] as [number, number]),
      {
        color: fallbackColor,
        weight: segmentWeight,
        opacity: 0.92,
        lineCap: "round",
        lineJoin: "round",
      }
    ).addTo(map);
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
      weight: segmentWeight,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round",
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
  if (span < 0.8) return 12;
  if (span < 1.5) return 11;
  if (span < 3) return 10;
  if (span < 6) return 9;
  return 8;
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

    const style = routeDisplayStyle(source, destination, geometry);
    const padding: L.FitBoundsOptions["padding"] = style.longRoute
      ? [72, 72]
      : [56, 56];

    map.invalidateSize({ animate: false });
    map.fitBounds(bounds, {
      padding,
      maxZoom: maxZoomForDistance(source, destination),
      animate: false,
    });
  }, [source, destination, geometry]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const style = routeDisplayStyle(source, destination, geometry);
    const midLat = (source.lat + destination.lat) / 2;
    const midLng = (source.lng + destination.lng) / 2;
    const initialZoom = style.longRoute
      ? maxZoomForDistance(source, destination)
      : 13;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView(
      [midLat, midLng],
      initialZoom
    );
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
  }, [source.lat, source.lng, destination.lat, destination.lng, maxTileZoom, fitToRoute, geometry]);

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
      const style = routeDisplayStyle(source, destination, geometry);
      const maxPoints = style.longRoute ? 900 : 3000;
      const latlngs = prepareDisplayCoords(geometry, source, destination, maxPoints);
      const routeLineColor = style.longRoute ? LONG_ROUTE_LINE : lineColor;

      if (estimate) {
        drawCasedPolyline(map, latlngs, routeLineColor, style.mainWeight, {
          opacity: 0.85,
          dashArray: "10 8",
          popup: "Estimated direct path — search again for road routing",
        });
      } else if (corridorProfile?.segments?.length) {
        if (style.longRoute) {
          drawCasedPolyline(map, latlngs, routeLineColor, style.mainWeight, {
            opacity: 0.92,
          });
        } else {
          const fullLatLngs = prepareDisplayCoords(geometry, source, destination, 3000);
          if (style.showGlow) {
            L.polyline(fullLatLngs, {
              color: lineColor,
              weight: style.glowWeight,
              opacity: 0.18,
              lineCap: "round",
              lineJoin: "round",
            }).addTo(map);
          }

          drawCasedPolyline(map, fullLatLngs, lineColor, Math.max(2, style.mainWeight - 1), {
            opacity: 0.35,
          });

          drawSegmentedRoute(
            map,
            geometry,
            corridorProfile.segments,
            lineColor,
            style.segmentWeight
          );
        }

        if (style.showCorridorPins) {
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
        }
      } else {
        drawCasedPolyline(map, latlngs, routeLineColor, style.mainWeight, {
          opacity: 0.92,
        });

        if (style.showCorridorPins) {
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
    }

    boundsRef.current = buildRouteBounds(
      source,
      destination,
      geometry?.coordinates?.length
        ? ensureRouteGeometryEndpoints(geometry, source, destination)
        : geometry
    );

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
  const displayStyle = routeDisplayStyle(source, destination, geometry);
  const showSegmentLegend = hasSegments && !displayStyle.longRoute;
  const hasHotspots = displayStyle.showCorridorPins && (corridorProfile?.hotspots?.length ?? 0) > 0;
  const hasHospitals = displayStyle.showCorridorPins && (corridorProfile?.hospitals?.length ?? 0) > 0;
  const hasPolice = displayStyle.showCorridorPins && (corridorProfile?.policeStations?.length ?? 0) > 0;

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
        ) : showSegmentLegend ? (
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
        ) : displayStyle.longRoute ? (
          <span className="rounded-md bg-black/80 px-2 py-1 text-[#F59E0B]">Road route</span>
        ) : (
          <span className="rounded-md bg-black/80 px-2 py-1 text-[#3B82F6]">Road route</span>
        )}
      </div>
    </div>
  );
}
