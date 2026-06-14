import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

function isStraightLine(geometry?: GeoJSON.LineString): boolean {
  return !geometry?.coordinates?.length || geometry.coordinates.length <= 2;
}

export function RouteMap({
  geometry,
  source,
  destination,
  height = 320,
}: {
  geometry?: GeoJSON.LineString;
  source: { lat: number; lng: number };
  destination: { lat: number; lng: number };
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
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) map.removeLayer(layer);
    });

    L.circleMarker([source.lat, source.lng], { radius: 8, color: "#22c55e", fillColor: "#22c55e", fillOpacity: 1 })
      .bindPopup("Start")
      .addTo(map);
    L.circleMarker([destination.lat, destination.lng], { radius: 8, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 1 })
      .bindPopup("Destination")
      .addTo(map);

    if (geometry?.coordinates?.length) {
      const latlngs = geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
      L.polyline(latlngs, {
        color: estimate ? "#F59E0B" : "#3b82f6",
        weight: 5,
        opacity: 0.9,
        dashArray: estimate ? "10 8" : undefined,
      })
        .bindPopup(estimate ? "Estimated direct path — search again for road routing" : "Road route")
        .addTo(map);
      map.fitBounds(L.latLngBounds(latlngs), { padding: [24, 24] });
    } else {
      map.fitBounds(
        L.latLngBounds([
          [source.lat, source.lng],
          [destination.lat, destination.lng],
        ]),
        { padding: [40, 40] }
      );
    }
  }, [geometry, source, destination, estimate]);

  return (
    <div className="relative">
      <div ref={containerRef} style={{ height, width: "100%" }} className="overflow-hidden rounded-2xl border border-[#262626]" />
      <div className="absolute bottom-3 left-3 z-[500] flex flex-wrap gap-2 text-[10px] font-semibold">
        <span className="rounded-md bg-black/70 px-2 py-1 text-[#22C55E]">● Start</span>
        <span className="rounded-md bg-black/70 px-2 py-1 text-[#EF4444]">● End</span>
        <span className={`rounded-md bg-black/70 px-2 py-1 ${estimate ? "text-[#F59E0B]" : "text-[#3B82F6]"}`}>
          {estimate ? "— Estimated path" : "— Road route"}
        </span>
      </div>
    </div>
  );
}
