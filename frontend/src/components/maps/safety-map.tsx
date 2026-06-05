"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { SafetyReport, CctvCamera } from "@/lib/types";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const cctvIcon = L.divIcon({
  className: "",
  html: `<div style="width:28px;height:28px;border-radius:50%;background:#1d4ed8;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);display:flex;align-items:center;justify-content:center;font-size:14px">📹</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const userIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:20px;height:20px">
    <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(37,99,235,0.25);animation:gps-pulse 2s infinite"></div>
    <div style="width:20px;height:20px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>
  </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function MapUpdater({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
  }, [center, zoom, map]);
  return null;
}

export function SafetyMap({
  reports,
  roadSegments,
  cctvCameras,
  center = [17.44, 78.45] as [number, number],
  height = "400px",
  userPosition,
  pathTrail,
  followUser = false,
  zoom = 14,
}: {
  reports: SafetyReport[];
  roadSegments?: Array<{ latitude: number; longitude: number; color: string; rating: number; condition: string }>;
  cctvCameras?: CctvCamera[];
  center?: [number, number];
  height?: string;
  userPosition?: [number, number] | null;
  pathTrail?: [number, number][];
  followUser?: boolean;
  zoom?: number;
}) {
  const mapCenter = followUser && userPosition ? userPosition : center;

  return (
    <div style={{ height }} className="w-full overflow-hidden rounded-2xl">
      <MapContainer center={mapCenter} zoom={zoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {followUser && userPosition && <MapUpdater center={userPosition} zoom={zoom} />}
        {pathTrail && pathTrail.length > 1 && (
          <Polyline positions={pathTrail} pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.7 }} />
        )}
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
        {cctvCameras?.map((cam) => (
          <Marker key={`cctv-${cam.id}`} position={[cam.latitude, cam.longitude]} icon={cctvIcon}>
            <Popup>
              <strong>CCTV (OpenStreetMap)</strong>
              <br />
              {cam.name || "Surveillance camera"}
              {cam.surveillance_type && <><br />Type: {cam.surveillance_type}</>}
              {cam.distance_m != null && <><br />{cam.distance_m}m away</>}
            </Popup>
          </Marker>
        ))}
        {reports.map((r) => (
          <Marker key={r.id} position={[r.latitude, r.longitude]} icon={defaultIcon}>
            <Popup>
              <strong>{r.report_type.replace("_", " ")}</strong>
              <br />
              {r.description}
              <br />
              ↑ {r.upvotes} {r.is_verified ? "✓ Verified" : ""}
            </Popup>
          </Marker>
        ))}
        {userPosition && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              <strong>Your location</strong>
              <br />
              Live GPS tracking active
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
