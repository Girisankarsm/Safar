"use client";

import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import { api, type SafetyReport } from "@/lib/api";
import {
  EMPTY_FC,
  MAPBOX_ENABLED,
  addSafarMapControls,
  applyNightAtmosphere,
  bindMapResize,
  createSafarMap,
  onMapReady,
  pointsGeoJSON,
} from "@/lib/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";

const RISK_TYPES = new Set(["unsafe_area", "harassment", "dangerous_crossing", "broken_light"]);

export function SafetyMap({
  height = "100%",
  className,
  userLat,
  userLng,
  showHeatmap = false,
}: {
  height?: string;
  className?: string;
  userLat?: number;
  userLng?: number;
  showHeatmap?: boolean;
}) {
  const { city } = useCity();
  const center = CITIES[city].center;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = createSafarMap(containerRef.current, {
      center: [center.lng, center.lat],
      zoom: 11.5,
      pitch: MAPBOX_ENABLED ? 20 : 0,
    });
    addSafarMapControls(map);
    const unbindResize = bindMapResize(map, containerRef.current);
    popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: "220px" });

    map.on("load", () => {
      applyNightAtmosphere(map);

      map.addSource("cctv", {
        type: "geojson",
        data: EMPTY_FC,
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 45,
      });
      map.addLayer({
        id: "cctv-clusters",
        type: "circle",
        source: "cctv",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#14532D",
          "circle-radius": ["step", ["get", "point_count"], 14, 5, 18, 15, 24],
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#22C55E",
        },
      });
      map.addLayer({
        id: "cctv-cluster-count",
        type: "symbol",
        source: "cctv",
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 11,
          "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
        },
        paint: { "text-color": "#FFFFFF" },
      });
      map.addLayer({
        id: "cctv-points",
        type: "circle",
        source: "cctv",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": 5,
          "circle-color": "#22C55E",
          "circle-opacity": 0.9,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#14532D",
        },
      });

      map.addSource("incidents", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "incidents-layer",
        type: "circle",
        source: "incidents",
        paint: {
          "circle-radius": 16,
          "circle-color": "#EF4444",
          "circle-opacity": 0.22,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#EF4444",
        },
      });

      map.addSource("stops", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "stops-layer",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": 4,
          "circle-color": "#FFFFFF",
          "circle-opacity": 0.75,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#3B82F6",
        },
      });

      map.addSource("heatmap", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "heatmap-layer",
        type: "heatmap",
        source: "heatmap",
        paint: {
          "heatmap-weight": ["get", "weight"],
          "heatmap-intensity": 0.8,
          "heatmap-radius": 40,
          "heatmap-opacity": 0.65,
          "heatmap-color": [
            "interpolate",
            ["linear"],
            ["heatmap-density"],
            0, "rgba(34,197,94,0)",
            0.3, "rgba(34,197,94,0.5)",
            0.55, "rgba(245,158,11,0.6)",
            0.8, "rgba(239,68,68,0.75)",
            1, "rgba(239,68,68,0.95)",
          ],
        },
      });

      map.addSource("user", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "user-layer",
        type: "circle",
        source: "user",
        paint: {
          "circle-radius": 9,
          "circle-color": "#3B82F6",
          "circle-opacity": 1,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      map.on("click", "cctv-clusters", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["cctv-clusters"] });
        const clusterId = features[0]?.properties?.cluster_id;
        const source = map.getSource("cctv") as mapboxgl.GeoJSONSource;
        if (clusterId == null) return;
        source.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err || zoom == null) return;
          const [lng, lat] = (features[0].geometry as GeoJSON.Point).coordinates;
          map.easeTo({ center: [lng, lat], zoom });
        });
      });

      map.on("click", "cctv-points", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
        popupRef.current
          ?.setLngLat([lng, lat])
          .setHTML('<p style="margin:0;font-size:12px"><strong>OSM CCTV</strong><br/><span style="opacity:0.7">Surveillance node</span></p>')
          .addTo(map);
      });

      map.on("click", "incidents-layer", (e) => {
        const f = e.features?.[0];
        if (!f?.properties) return;
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates;
        const type = String(f.properties.report_type ?? "incident").replace(/_/g, " ");
        popupRef.current
          ?.setLngLat([lng, lat])
          .setHTML(`<p style="margin:0;font-size:12px"><strong>High risk</strong><br/><span style="opacity:0.7">${type}</span></p>`)
          .addTo(map);
      });

      ["cctv-clusters", "cctv-points", "incidents-layer"].forEach((id) => {
        map.on("mouseenter", id, () => { map.getCanvas().style.cursor = "pointer"; });
        map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; });
      });
    });

    mapRef.current = map;
    return () => {
      unbindResize();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [city, center.lat, center.lng]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.cctv(city, center.lat, center.lng),
      api.reports(city),
      api.transitStops(city),
      showHeatmap ? api.safetyZones(city) : Promise.resolve({ zones: [] as { lat: number; lng: number; weight: number }[] }),
    ]).then(([c, r, t, zones]) => {
      if (!alive) return;
      const map = mapRef.current;
      if (!map) return;

      const riskReports = r.reports.filter((x) => RISK_TYPES.has(x.report_type));

      onMapReady(map, () => {
        (map.getSource("cctv") as mapboxgl.GeoJSONSource | undefined)?.setData(
          pointsGeoJSON(c.nodes)
        );
        (map.getSource("incidents") as mapboxgl.GeoJSONSource | undefined)?.setData(
          pointsGeoJSON(
            riskReports.map((rep: SafetyReport) => ({
              lat: rep.latitude,
              lng: rep.longitude,
              report_type: rep.report_type,
            }))
          )
        );
        (map.getSource("stops") as mapboxgl.GeoJSONSource | undefined)?.setData(
          pointsGeoJSON([
            ...t.metro_stops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name })),
            ...t.bus_stops.slice(0, 60).map((s) => ({ lat: s.lat, lng: s.lng, name: s.name })),
          ])
        );
        if (showHeatmap && zones.zones?.length) {
          (map.getSource("heatmap") as mapboxgl.GeoJSONSource | undefined)?.setData({
            type: "FeatureCollection",
            features: zones.zones.map((z) => ({
              type: "Feature",
              properties: { weight: z.weight },
              geometry: { type: "Point", coordinates: [z.lng, z.lat] },
            })),
          });
        }
      });
    });
    return () => { alive = false; };
  }, [city, center.lat, center.lng, showHeatmap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || userLat == null || userLng == null) return;
    onMapReady(map, () => {
      (map.getSource("user") as mapboxgl.GeoJSONSource | undefined)?.setData(
        pointsGeoJSON([{ lat: userLat, lng: userLng }])
      );
    });
  }, [userLat, userLng]);

  return (
    <div style={{ height }} className={className}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
