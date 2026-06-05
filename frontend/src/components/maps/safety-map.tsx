"use client";

import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from "react-leaflet";
import L from "leaflet";
import type { SafetyReport } from "@/lib/types";

const REPORT_COLORS: Record<string, string> = {
  harassment: "#ef4444",
  broken_light: "#f59e0b",
  pothole: "#8b5cf6",
  unsafe_area: "#dc2626",
  flooded_road: "#3b82f6",
  dangerous_crossing: "#f97316",
};

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function SafetyMap({
  reports,
  roadSegments,
  center = [17.44, 78.45] as [number, number],
  height = "400px",
}: {
  reports: SafetyReport[];
  roadSegments?: Array<{ latitude: number; longitude: number; color: string; rating: number; condition: string }>;
  center?: [number, number];
  height?: string;
}) {
  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-2xl">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {roadSegments?.map((seg) => (
          <CircleMarker
            key={`${seg.latitude}-${seg.longitude}`}
            center={[seg.latitude, seg.longitude]}
            radius={10}
            pathOptions={{
              color: seg.color === "green" ? "#22c55e" : seg.color === "yellow" ? "#f59e0b" : "#ef4444",
              fillOpacity: 0.5,
            }}
          >
            <Popup>
              Road: {seg.condition} ({seg.rating}/100)
            </Popup>
          </CircleMarker>
        ))}
        {reports.map((r) => (
          <Marker
            key={r.id}
            position={[r.latitude, r.longitude]}
            icon={defaultIcon}
          >
            <Popup>
              <strong>{r.report_type.replace("_", " ")}</strong>
              <br />
              {r.description}
              <br />
              ↑ {r.upvotes} {r.is_verified ? "✓ Verified" : ""}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
