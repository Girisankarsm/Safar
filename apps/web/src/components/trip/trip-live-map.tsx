"use client";

import { SafetyStatusChip } from "@/components/trip/safety-status-chip";
import { CITIES } from "@/config/cities";
import { useCity } from "@/hooks/use-city";
import type { RouteLeg, SafetyReport } from "@/lib/api";
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
import { useEffect, useMemo, useRef } from "react";

export type MapFilter = "all" | "cctv" | "transit" | "incidents" | "lighting" | "women";

function setVisibility(map: mapboxgl.Map, layerId: string, visible: boolean) {
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, "visibility", visible ? "visible" : "none");
  }
}

export function TripLiveMap({
  legs = [],
  currentLat,
  currentLng,
  cctv = [],
  reports = [],
  stops = [],
  safetyScore = 75,
  filter = "all",
  height = "100%",
  recenterKey = 0,
}: {
  legs?: RouteLeg[];
  currentLat?: number;
  currentLng?: number;
  cctv?: { lat: number; lng: number }[];
  reports?: SafetyReport[];
  stops?: { lat: number; lng: number; name: string; mode: string; women_only_coach?: boolean; well_lit?: boolean }[];
  safetyScore?: number;
  filter?: MapFilter;
  height?: string;
  recenterKey?: number;
}) {
  const { city } = useCity();
  const center = CITIES[city].center;
  const lat = currentLat ?? center.lat;
  const lng = currentLng ?? center.lng;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const didInitialFit = useRef(false);
  const lastRecenter = useRef(0);

  const routeCoords = useMemo(() => {
    const coords: [number, number][] = [];
    for (const leg of legs) {
      if (leg.from_lat != null && leg.from_lng != null) coords.push([leg.from_lng, leg.from_lat]);
      if (leg.to_lat != null && leg.to_lng != null) coords.push([leg.to_lng, leg.to_lat]);
    }
    return coords;
  }, [legs]);

  const destination = routeCoords.length ? routeCoords[routeCoords.length - 1] : null;

  const riskReports = useMemo(
    () =>
      reports.filter((r) =>
        ["unsafe_area", "harassment", "dangerous_crossing", "broken_light"].includes(r.report_type)
      ),
    [reports]
  );

  const litStops = useMemo(() => stops.filter((s) => s.well_lit), [stops]);
  const womenStops = useMemo(() => stops.filter((s) => s.women_only_coach), [stops]);

  const fitBounds = useMemo(() => {
    const bounds = new mapboxgl.LngLatBounds();
    let has = false;
    const extend = (lngV: number, latV: number) => {
      bounds.extend([lngV, latV]);
      has = true;
    };
    for (const [lngV, latV] of routeCoords) extend(lngV, latV);
    extend(lng, lat);
    if (destination) extend(destination[0], destination[1]);
    for (const n of cctv.slice(0, 60)) extend(n.lng, n.lat);
    for (const s of stops.slice(0, 40)) extend(s.lng, s.lat);
    return has ? bounds : null;
  }, [routeCoords, lng, lat, destination, cctv, stops]);

  const showCctv = filter === "all" || filter === "cctv";
  const showTransit = filter === "all" || filter === "transit";
  const showIncidents = filter === "all" || filter === "incidents";
  const showLighting = filter === "all" || filter === "lighting";
  const showWomen = filter === "all" || filter === "women";

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = createSafarMap(containerRef.current, {
      center: [lng, lat],
      zoom: 14,
      pitch: MAPBOX_ENABLED ? 25 : 0,
    });
    addSafarMapControls(map);
    const unbindResize = bindMapResize(map, containerRef.current);

    map.on("load", () => {
      applyNightAtmosphere(map);

      map.addSource("route", { type: "geojson", data: EMPTY_FC });
      addRouteGlowLayers(map, "route", "route-line", "#3B82F6", 4);

      map.addSource("cctv", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "cctv-layer",
        type: "circle",
        source: "cctv",
        paint: {
          "circle-radius": 5,
          "circle-color": "#22C55E",
          "circle-opacity": 0.85,
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
          "circle-radius": 4,
          "circle-color": "#3B82F6",
          "circle-opacity": 0.8,
        },
      });

      map.addSource("lighting", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "lighting-layer",
        type: "circle",
        source: "lighting",
        paint: {
          "circle-radius": 4,
          "circle-color": "#EAB308",
          "circle-opacity": 0.8,
        },
      });

      map.addSource("women", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "women-layer",
        type: "circle",
        source: "women",
        paint: {
          "circle-radius": 5,
          "circle-color": "#A855F7",
          "circle-opacity": 0.75,
        },
      });

      map.addSource("incidents", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "incidents-layer",
        type: "circle",
        source: "incidents",
        paint: {
          "circle-radius": 14,
          "circle-color": "#EF4444",
          "circle-opacity": 0.2,
          "circle-stroke-width": 1,
          "circle-stroke-color": "#EF4444",
        },
      });

      map.addSource("destination", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "destination-layer",
        type: "circle",
        source: "destination",
        paint: {
          "circle-radius": 8,
          "circle-color": "#EF4444",
          "circle-opacity": 0.95,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
        },
      });

      map.addSource("position", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "position-layer",
        type: "circle",
        source: "position",
        paint: {
          "circle-radius": 9,
          "circle-color": "#3B82F6",
          "circle-opacity": 1,
          "circle-stroke-width": 3,
          "circle-stroke-color": "#FFFFFF",
        },
      });
    });

    mapRef.current = map;
    return () => {
      unbindResize();
      map.remove();
      mapRef.current = null;
      didInitialFit.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const apply = () => {
      const routeSrc = map.getSource("route") as mapboxgl.GeoJSONSource | undefined;
      routeSrc?.setData(
        routeCoords.length > 1
          ? { type: "FeatureCollection", features: [lineGeoJSON(routeCoords)] }
          : EMPTY_FC
      );

      (map.getSource("cctv") as mapboxgl.GeoJSONSource | undefined)?.setData(pointsGeoJSON(cctv));
      (map.getSource("stops") as mapboxgl.GeoJSONSource | undefined)?.setData(pointsGeoJSON(stops));
      (map.getSource("lighting") as mapboxgl.GeoJSONSource | undefined)?.setData(pointsGeoJSON(litStops));
      (map.getSource("women") as mapboxgl.GeoJSONSource | undefined)?.setData(pointsGeoJSON(womenStops));
      (map.getSource("incidents") as mapboxgl.GeoJSONSource | undefined)?.setData(
        pointsGeoJSON(riskReports.map((r) => ({ lat: r.latitude, lng: r.longitude })))
      );
      (map.getSource("destination") as mapboxgl.GeoJSONSource | undefined)?.setData(
        destination ? pointsGeoJSON([{ lat: destination[1], lng: destination[0] }]) : EMPTY_FC
      );
      (map.getSource("position") as mapboxgl.GeoJSONSource | undefined)?.setData(
        pointsGeoJSON([{ lat, lng }])
      );

      setVisibility(map, "cctv-layer", showCctv);
      setVisibility(map, "stops-layer", showTransit);
      setVisibility(map, "incidents-layer", showIncidents);
      setVisibility(map, "lighting-layer", showLighting);
      setVisibility(map, "women-layer", showWomen);
    };

    onMapReady(map, apply);
  }, [
    routeCoords,
    cctv,
    stops,
    litStops,
    womenStops,
    riskReports,
    destination,
    lat,
    lng,
    showCctv,
    showTransit,
    showIncidents,
    showLighting,
    showWomen,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitBounds || routeCoords.length < 2 || didInitialFit.current) return;

    const run = () => {
      map.fitBounds(fitBounds, { padding: 48, maxZoom: 14, duration: 0, pitch: MAPBOX_ENABLED ? 25 : 0 });
      didInitialFit.current = true;
    };

    if (map.isStyleLoaded()) run();
    else map.once("load", run);
  }, [fitBounds, routeCoords.length]);

  useEffect(() => {
    const map = mapRef.current;
    const key = recenterKey ?? 0;
    if (!map || key <= 0 || key === lastRecenter.current || !fitBounds) return;
    lastRecenter.current = key;
    map.fitBounds(fitBounds, { padding: 48, maxZoom: 14, duration: 600, pitch: MAPBOX_ENABLED ? 25 : 0 });
  }, [recenterKey, fitBounds]);

  return (
    <div style={{ height }} className="relative h-full w-full overflow-hidden rounded-2xl border border-[#262626]">
      <SafetyStatusChip score={safetyScore} />
      <div ref={containerRef} className="h-full w-full" />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[2] rounded-lg border border-[#262626]/80 bg-[#111111]/90 px-2.5 py-1.5 text-[10px] text-[#A1A1AA] backdrop-blur-sm">
        {MAPBOX_ENABLED && <span className="font-semibold text-[#3B82F6]">Mapbox</span>}
        {MAPBOX_ENABLED && " · "}
        <span className="font-semibold text-[#22C55E]">CCTV</span> · OSM Overpass
      </div>
    </div>
  );
}
