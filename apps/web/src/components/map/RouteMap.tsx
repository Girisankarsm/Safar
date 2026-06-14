import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addLabeledMarker } from "@/components/map/map-markers";
import { useEffect, useRef } from "react";

function isStraightLine(geometry?: GeoJSON.LineString): boolean {
  return !geometry?.coordinates?.length || geometry.coordinates.length <= 2;
}

export function RouteMap({
  geometry,
  source,
  destination,
  sourceName,
  destinationName,
  height = 320,
}: {
  geometry?: GeoJSON.LineString;
  source: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  sourceName?: string;
  destinationName?: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const estimate = isStraightLine(geometry);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([source.lat, source.lng], 13);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [source.lat, source.lng]);

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
      L.polyline(latlngs, {
        color: estimate ? "#F59E0B" : "#3B82F6",
        weight: 6,
        opacity: 0.95,
        dashArray: estimate ? "10 8" : undefined,
      })
        .bindPopup(estimate ? "Estimated direct path — search again for road routing" : "Road route")
        .addTo(map);
      latlngs.forEach((ll) => bounds.push(ll));
    }

    map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 15 });
  }, [geometry, source, destination, estimate, sourceName, destinationName]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ height, width: "100%" }}
        className="overflow-hidden rounded-2xl border border-[#262626]"
      />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-2 text-[10px] font-semibold">
        <span className="rounded-md bg-black/80 px-2 py-1 text-[#22C55E]">A Start</span>
        <span className="rounded-md bg-black/80 px-2 py-1 text-[#EF4444]">B Destination</span>
        <span className={`rounded-md bg-black/80 px-2 py-1 ${estimate ? "text-[#F59E0B]" : "text-[#3B82F6]"}`}>
          {estimate ? "Estimated path" : "Road route"}
        </span>
      </div>
    </div>
  );
}
