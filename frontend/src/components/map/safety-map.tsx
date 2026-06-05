"use client";

import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import { api, type SafetyReport } from "@/lib/api";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";

const RISK_TYPES = new Set(["unsafe_area", "harassment", "dangerous_crossing", "broken_light"]);

export function SafetyMap({
  height = "100%",
  className,
  showHeatmap = true,
}: {
  height?: string;
  className?: string;
  showHeatmap?: boolean;
}) {
  const { city } = useCity();
  const center = CITIES[city].center;
  const [cctv, setCctv] = useState<{ lat: number; lng: number }[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [stops, setStops] = useState<{ lat: number; lng: number; name: string; mode: string }[]>([]);

  useEffect(() => {
    api.cctv(city).then((r) => setCctv(r.nodes.slice(0, 120)));
    api.reports(city).then((r) => setReports(r.reports));
    api.transitStops(city).then((r) => {
      setStops([
        ...r.metro_stops.map((s) => ({ ...s, mode: "metro" })),
        ...r.bus_stops.map((s) => ({ ...s, mode: "bus" })),
      ]);
    });
  }, [city]);

  const cctvClusters = useMemo(() => clusterPoints(cctv, 0.008), [cctv]);
  const riskReports = reports.filter((r) => RISK_TYPES.has(r.report_type));

  return (
    <div style={{ height }} className={className}>
      <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%", width: "100%" }} zoomControl>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {/* CCTV clusters — green heat */}
        {showHeatmap &&
          cctvClusters.map((c, i) => (
            <CircleMarker
              key={`cluster-${i}`}
              center={[c.lat, c.lng]}
              radius={8 + c.count * 2}
              pathOptions={{
                color: "#22c55e",
                fillColor: "#22c55e",
                fillOpacity: Math.min(0.45, 0.12 + c.count * 0.04),
                weight: 1,
              }}
            >
              <Popup>
                <span className="text-black">CCTV cluster · {c.count} cameras</span>
              </Popup>
            </CircleMarker>
          ))}

        {/* High-risk reports — red heat */}
        {showHeatmap &&
          riskReports.map((r) => (
            <CircleMarker
              key={r.id}
              center={[r.latitude, r.longitude]}
              radius={14}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.35,
                weight: 1,
              }}
            >
              <Popup>
                <span className="text-black">
                  High-risk · {r.report_type.replace(/_/g, " ")}
                </span>
              </Popup>
            </CircleMarker>
          ))}

        {/* Verified safe zones — metro stops */}
        {stops.map((s) => (
          <CircleMarker
            key={s.name + s.lat}
            center={[s.lat, s.lng]}
            radius={5}
            pathOptions={{ color: "#ffffff", fillColor: "#ffffff", fillOpacity: 0.7, weight: 1 }}
          >
            <Popup>
              <strong>{s.name}</strong>
              <br />
              Verified safe stop · {s.mode}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

function clusterPoints(points: { lat: number; lng: number }[], cellDeg: number) {
  const buckets = new Map<string, { lat: number; lng: number; count: number }>();
  for (const p of points) {
    const key = `${Math.floor(p.lat / cellDeg)}-${Math.floor(p.lng / cellDeg)}`;
    const b = buckets.get(key);
    if (b) {
      b.count += 1;
      b.lat = (b.lat * (b.count - 1) + p.lat) / b.count;
      b.lng = (b.lng * (b.count - 1) + p.lng) / b.count;
    } else {
      buckets.set(key, { lat: p.lat, lng: p.lng, count: 1 });
    }
  }
  return [...buckets.values()].filter((b) => b.count >= 2);
}
