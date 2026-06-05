"use client";

import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import { api } from "@/lib/api";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";

export function SafetyMap({ height = "100%", className }: { height?: string; className?: string }) {
  const { city } = useCity();
  const center = CITIES[city].center;
  const [cctv, setCctv] = useState<{ lat: number; lng: number }[]>([]);
  const [stops, setStops] = useState<{ lat: number; lng: number; name: string; mode: string }[]>([]);

  useEffect(() => {
    api.cctv(city).then((r) => setCctv(r.nodes.slice(0, 100)));
    api.transitStops(city).then((r) => {
      setStops([
        ...r.metro_stops.map((s) => ({ ...s, mode: "metro" })),
        ...r.bus_stops.map((s) => ({ ...s, mode: "bus" })),
      ]);
    });
  }, [city]);

  return (
    <div style={{ height }} className={className}>
      <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%", width: "100%" }} zoomControl>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {cctv.map((n, i) => (
          <CircleMarker
            key={`c-${i}`}
            center={[n.lat, n.lng]}
            radius={4}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.5 }}
          >
            <Popup className="text-black">CCTV coverage</Popup>
          </CircleMarker>
        ))}
        {stops.map((s) => (
          <CircleMarker
            key={s.name + s.lat}
            center={[s.lat, s.lng]}
            radius={6}
            pathOptions={{ color: "#ffffff", fillColor: "#ffffff", fillOpacity: 0.8 }}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {s.mode}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
