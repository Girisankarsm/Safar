"use client";

import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import { api, type Route, type SafetyReport } from "@/lib/api";
import {
  EMPTY_FC,
  MAPBOX_ENABLED,
  addRouteGlowLayers,
  addSafarMapControls,
  applyNightAtmosphere,
  bindMapResize,
  createSafarMap,
  lineGeoJSON,
  onMapReady,
  pointsGeoJSON,
} from "@/lib/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useMemo, useRef, useState } from "react";

const ROUTE_COLORS: Record<string, string> = {
  safest: "#3B82F6",
  fastest: "#22C55E",
  greenest: "#A855F7",
};

function legsToCoords(legs: Route["legs"]): [number, number][] {
  const coords: [number, number][] = [];
  for (const leg of legs ?? []) {
    if (leg.from_lat != null && leg.from_lng != null) coords.push([leg.from_lng, leg.from_lat]);
    if (leg.to_lat != null && leg.to_lng != null) coords.push([leg.to_lng, leg.to_lat]);
  }
  return coords;
}

export function HomeRouteMap({
  routes = [],
  height = 480,
  highlightType,
}: {
  routes?: Route[];
  height?: number;
  highlightType?: string;
}) {
  const { city } = useCity();
  const center = CITIES[city].center;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const layersReady = useRef(false);
  const [stats, setStats] = useState({ cctv: 0, stops: 0, risks: 0 });
  const dataRef = useRef<{
    cctv: { lat: number; lng: number }[];
    reports: SafetyReport[];
    stops: { lat: number; lng: number }[];
  }>({ cctv: [], reports: [], stops: [] });

  const primaryRoute =
    routes.find((r) => r.route_type === highlightType) ??
    routes.find((r) => r.route_type === "safest") ??
    routes[0];

  const routeLayers = useMemo(
    () =>
      routes
        .map((r) => ({
          id: r.route_type,
          coords: legsToCoords(r.legs),
          color: ROUTE_COLORS[r.route_type] ?? "#3B82F6",
          active: !highlightType || r.route_type === highlightType,
        }))
        .filter((r) => r.coords.length > 1),
    [routes, highlightType]
  );

  const endpoints = useMemo(() => {
    if (!primaryRoute) return [];
    const pts: { lat: number; lng: number; label: string }[] = [];
    if (primaryRoute.source_lat != null && primaryRoute.source_lng != null) {
      pts.push({ lat: primaryRoute.source_lat, lng: primaryRoute.source_lng, label: "from" });
    }
    if (primaryRoute.dest_lat != null && primaryRoute.dest_lng != null) {
      pts.push({ lat: primaryRoute.dest_lat, lng: primaryRoute.dest_lng, label: "to" });
    }
    return pts;
  }, [primaryRoute]);

  function applyDataLayers(map: mapboxgl.Map) {
    if (!layersReady.current) return;
    const { cctv, reports, stops } = dataRef.current;
    (map.getSource("cctv") as mapboxgl.GeoJSONSource | undefined)?.setData(pointsGeoJSON(cctv));
    (map.getSource("stops") as mapboxgl.GeoJSONSource | undefined)?.setData(pointsGeoJSON(stops));
    (map.getSource("incidents") as mapboxgl.GeoJSONSource | undefined)?.setData(
      pointsGeoJSON(
        reports
          .filter((r) => ["unsafe_area", "harassment", "dangerous_crossing", "broken_light"].includes(r.report_type))
          .map((r) => ({ lat: r.latitude, lng: r.longitude }))
      )
    );
  }

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.cctv(city, center.lat, center.lng),
      api.reports(city),
      api.transitStops(city),
    ]).then(([c, r, t]) => {
      if (!alive) return;
      const stops = [
        ...t.metro_stops.map((s) => ({ lat: s.lat, lng: s.lng })),
        ...t.bus_stops.map((s) => ({ lat: s.lat, lng: s.lng })),
      ];
      const risks = r.reports.filter((x) =>
        ["unsafe_area", "harassment", "dangerous_crossing", "broken_light"].includes(x.report_type)
      );
      dataRef.current = {
        cctv: c.nodes.slice(0, 150),
        reports: r.reports,
        stops,
      };
      setStats({ cctv: c.nodes.length, stops: stops.length, risks: risks.length });
      const map = mapRef.current;
      if (map) onMapReady(map, () => applyDataLayers(map));
    });
    return () => {
      alive = false;
    };
  }, [city, center.lat, center.lng]);

  useEffect(() => {
    if (!containerRef.current) return;

    layersReady.current = false;
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = createSafarMap(containerRef.current, {
      center: [center.lng, center.lat],
      zoom: 11.5,
      pitch: MAPBOX_ENABLED ? 20 : 0,
    });
    addSafarMapControls(map);
    const unbindResize = bindMapResize(map, containerRef.current);

    map.on("load", () => {
      applyNightAtmosphere(map);

      map.addSource("cctv", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "cctv-layer",
        type: "circle",
        source: "cctv",
        minzoom: 10,
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 10, 3, 14, 7],
          "circle-color": "#22C55E",
          "circle-opacity": 0.9,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#14532D",
        },
      });

      map.addSource("stops", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "stops-layer",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": 5,
          "circle-color": "#3B82F6",
          "circle-opacity": 0.85,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      map.addSource("incidents", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "incidents-layer",
        type: "circle",
        source: "incidents",
        paint: {
          "circle-radius": 18,
          "circle-color": "#EF4444",
          "circle-opacity": 0.28,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#EF4444",
          "circle-stroke-opacity": 0.5,
        },
      });

      for (const type of ["safest", "fastest", "greenest"]) {
        map.addSource(`route-${type}`, { type: "geojson", data: EMPTY_FC });
        if (type === "safest") {
          addRouteGlowLayers(map, `route-${type}`, `route-${type}`, ROUTE_COLORS[type], 5);
        } else {
          map.addLayer({
            id: `route-${type}`,
            type: "line",
            source: `route-${type}`,
            paint: {
              "line-color": ROUTE_COLORS[type],
              "line-width": 3,
              "line-opacity": 0.65,
              ...(type === "fastest" ? { "line-dasharray": [2, 1.5] } : {}),
            },
          });
        }
      }

      map.addSource("endpoints", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "endpoint-from",
        type: "circle",
        source: "endpoints",
        filter: ["==", ["get", "label"], "from"],
        paint: { "circle-radius": 9, "circle-color": "#3B82F6", "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
      });
      map.addLayer({
        id: "endpoint-to",
        type: "circle",
        source: "endpoints",
        filter: ["==", ["get", "label"], "to"],
        paint: { "circle-radius": 9, "circle-color": "#EF4444", "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
      });

      layersReady.current = true;
      applyDataLayers(map);
    });

    mapRef.current = map;
    return () => {
      unbindResize();
      map.remove();
      mapRef.current = null;
      layersReady.current = false;
    };
  }, [city, center.lat, center.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const update = () => {
      applyDataLayers(map);
      for (const layer of routeLayers) {
        const src = map.getSource(`route-${layer.id}`) as mapboxgl.GeoJSONSource | undefined;
        src?.setData({ type: "FeatureCollection", features: [lineGeoJSON(layer.coords)] });
        const lineId = layer.id === "safest" ? "route-safest" : `route-${layer.id}`;
        if (map.getLayer(lineId)) {
          map.setPaintProperty(lineId, "line-width", layer.active ? (layer.id === "safest" ? 5 : 4) : 2);
          map.setPaintProperty(lineId, "line-opacity", layer.active ? 0.95 : 0.2);
        }
        const glowId = `${lineId}-glow`;
        if (map.getLayer(glowId)) {
          map.setPaintProperty(glowId, "line-opacity", layer.active ? 0.25 : 0.05);
        }
      }
      (map.getSource("endpoints") as mapboxgl.GeoJSONSource | undefined)?.setData(pointsGeoJSON(endpoints));

      const bounds = new mapboxgl.LngLatBounds();
      let hasBounds = false;
      for (const layer of routeLayers) {
        for (const [lng, lat] of layer.coords) {
          bounds.extend([lng, lat]);
          hasBounds = true;
        }
      }
      if (hasBounds) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 800, pitch: MAPBOX_ENABLED ? 25 : 0 });
      }
    };

    onMapReady(map, update);
  }, [routeLayers, endpoints]);

  return (
    <div className="relative w-full" style={{ height, minHeight: height }}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 z-[2] flex flex-wrap gap-2">
        <span className="rounded-full border border-[#262626] bg-[#111111]/90 px-2.5 py-1 text-[10px] font-semibold text-[#22C55E] backdrop-blur-sm">
          CCTV {stats.cctv}
        </span>
        <span className="rounded-full border border-[#262626] bg-[#111111]/90 px-2.5 py-1 text-[10px] font-semibold text-[#3B82F6] backdrop-blur-sm">
          Stops {stats.stops}
        </span>
        <span className="rounded-full border border-[#262626] bg-[#111111]/90 px-2.5 py-1 text-[10px] font-semibold text-[#EF4444] backdrop-blur-sm">
          Risks {stats.risks}
        </span>
      </div>
      {routes.length > 0 && (
        <div className="pointer-events-none absolute left-3 top-12 z-[2] flex flex-wrap gap-2">
          {routeLayers.map((r) => (
            <span
              key={r.id}
              className="rounded-full border border-[#262626] bg-[#111111]/90 px-2.5 py-1 text-[10px] font-semibold capitalize text-white backdrop-blur-sm"
            >
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
              {r.id}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
