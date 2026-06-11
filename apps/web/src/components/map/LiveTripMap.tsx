import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

export function LiveTripMap({
  lat,
  lng,
  geometry,
  height = 280,
}: {
  lat?: number | null;
  lng?: number | null;
  geometry?: GeoJSON.LineString;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.CircleMarker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const centerLat = lat ?? 13.08;
    const centerLng = lng ?? 80.27;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([centerLat, centerLng], 14);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://openstreetmap.org">OSM</a> &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Polyline || layer instanceof L.CircleMarker) map.removeLayer(layer);
    });
    markerRef.current = null;

    if (geometry?.coordinates?.length) {
      const latlngs = geometry.coordinates.map(([lngVal, latVal]) => [latVal, lngVal] as [number, number]);
      L.polyline(latlngs, { color: "#3b82f6", weight: 5, opacity: 0.85 }).addTo(map);
      map.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32] });
    }

    if (lat != null && lng != null) {
      const marker = L.circleMarker([lat, lng], {
        radius: 10,
        color: "#22c55e",
        fillColor: "#22c55e",
        fillOpacity: 0.9,
        weight: 3,
      }).addTo(map);
      marker.bindPopup("You are here");
      markerRef.current = marker;
      if (!geometry?.coordinates?.length) map.setView([lat, lng], 15);
    }
  }, [lat, lng, geometry]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="overflow-hidden rounded-2xl border border-[var(--border)] shadow-inner"
    />
  );
}
