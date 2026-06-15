import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/i18n/use-i18n";
import { addLabeledMarker } from "@/components/map/map-markers";
import { useSettingsStore } from "@/stores/settings.store";
import type { CorridorProfile, CorridorSegment } from "@/lib/corridor-risk";
import { useEffect, useRef } from "react";

function isStraightLine(geometry?: GeoJSON.LineString): boolean {
  return !geometry?.coordinates?.length || geometry.coordinates.length <= 2;
}

const SEGMENT_COLORS: Record<string, string> = {
  safe: "#22C55E",
  moderate: "#F59E0B",
  risk: "#EF4444",
};

// Primary line color per route type — makes it instantly obvious which route is active
const ROUTE_TYPE_COLOR: Record<string, string> = {
  balanced:       "#3B82F6",   // blue
  safest:         "#22C55E",   // green
  cheapest:       "#F59E0B",   // amber
  women_friendly: "#A855F7",   // purple
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
  /** Optional corridor profile for segment coloring and hotspot markers */
  corridorProfile?: CorridorProfile;
  /** Route type — controls the line color so switching routes is visually obvious */
  routeType?: string;
  /** Height in px (number) or any CSS string like "100%" / "calc(...)" */
  height?: number | string;
  className?: string;
  /** When set, zooms the map to this corridor segment index */
  focusSegmentIdx?: number | null;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const estimate = isStraightLine(geometry);
  const lowDataMode = useSettingsStore((s) => s.lowDataMode);
  const maxZoom = lowDataMode ? 14 : 19;
  const lineColor = (routeType && ROUTE_TYPE_COLOR[routeType]) ?? "#3B82F6";

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([source.lat, source.lng], 13);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [source.lat, source.lng, maxZoom]);

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

    const bounds: L.LatLngExpression[] = [
      [source.lat, source.lng],
      [destination.lat, destination.lng],
    ];

    if (geometry?.coordinates?.length) {
      const latlngs = geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      latlngs.forEach((ll) => bounds.push(ll));

      if (estimate) {
        // Straight-line fallback — dashed in route-type color
        L.polyline(latlngs, {
          color: lineColor,
          weight: 5,
          opacity: 0.85,
          dashArray: "10 8",
        })
          .bindPopup("Estimated direct path — search again for road routing")
          .addTo(map);
      } else if (corridorProfile?.segments?.length) {
        // Segmented route with risk coloring; outer glow in route-type color
        L.polyline(latlngs, {
          color: lineColor,
          weight: 10,
          opacity: 0.18,
        }).addTo(map);   // soft glow underlay

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
      } else {
        // Plain road route — colored by route type
        L.polyline(latlngs, {
          color: lineColor,
          weight: 6,
          opacity: 0.95,
        })
          .bindPopup("Road route")
          .addTo(map);
      }
    }

    map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 15 });
  }, [geometry, source, destination, estimate, sourceName, destinationName, corridorProfile, lineColor]);

  // Zoom to a specific corridor segment when focusSegmentIdx changes
  useEffect(() => {
    const map = mapRef.current;
    if (map == null || focusSegmentIdx == null || !corridorProfile?.segments) return;
    const seg = corridorProfile.segments[focusSegmentIdx];
    if (!seg) return;
    map.setView([seg.lat, seg.lng], 16, { animate: true });
  }, [focusSegmentIdx, corridorProfile]);

  const hasSegments = !estimate && corridorProfile?.segments?.length;
  const hasHotspots = (corridorProfile?.hotspots?.length ?? 0) > 0;

  return (
    <div className={`relative${className ? ` ${className}` : ""}`}>
      <div
        ref={containerRef}
        style={{ height: typeof height === "number" ? height : height, width: "100%" }}
        className={`overflow-hidden border border-[#262626]${className?.includes("rounded-none") ? "" : " rounded-2xl"}`}
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
              <span className="rounded-md bg-black/80 px-2 py-1 text-[#FBBF24]">
                ! Hotspot
              </span>
            )}
          </>
        ) : (
          <span className="rounded-md bg-black/80 px-2 py-1 text-[#3B82F6]">Road route</span>
        )}
      </div>
    </div>
  );
}
