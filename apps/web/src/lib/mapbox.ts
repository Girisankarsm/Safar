import mapboxgl, { type StyleSpecification } from "mapbox-gl";

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
export const MAPBOX_ENABLED = MAPBOX_TOKEN.startsWith("pk.");
export const MAPBOX_STYLE = "mapbox://styles/mapbox/navigation-night-v1";
export const MAPBOX_STYLE_FALLBACK = "mapbox://styles/mapbox/dark-v11";

export const EMPTY_FC = { type: "FeatureCollection" as const, features: [] };

/** Carto dark raster fallback when no Mapbox token is configured. */
export const CARTO_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

export type SafarMapOptions = {
  center: [number, number];
  zoom?: number;
  pitch?: number;
  bearing?: number;
};

export function createSafarMap(container: HTMLElement, opts: SafarMapOptions) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
  const map = new mapboxgl.Map({
    container,
    style: MAPBOX_ENABLED ? MAPBOX_STYLE : CARTO_FALLBACK_STYLE,
    center: opts.center,
    zoom: opts.zoom ?? 12,
    pitch: opts.pitch ?? 0,
    bearing: opts.bearing ?? 0,
    antialias: true,
    attributionControl: false,
    failIfMajorPerformanceCaveat: false,
  });

  if (MAPBOX_ENABLED) {
    let triedFallback = false;
    map.on("error", (e) => {
      const msg = String(e.error?.message || "");
      if (!triedFallback && (msg.includes("Style") || msg.includes("401") || msg.includes("403"))) {
        triedFallback = true;
        map.setStyle(MAPBOX_STYLE_FALLBACK);
      }
    });
  }

  return map;
}

export function bindMapResize(map: mapboxgl.Map, container: HTMLElement) {
  const resize = () => {
    try {
      map.resize();
    } catch {
      // ignore during teardown
    }
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  requestAnimationFrame(resize);
  setTimeout(resize, 200);
  return () => observer.disconnect();
}

export function addSafarMapControls(map: mapboxgl.Map) {
  map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), "bottom-right");
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");
  map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "metric" }), "bottom-left");
}

export function applyNightAtmosphere(map: mapboxgl.Map) {
  if (!MAPBOX_ENABLED || !map.getStyle()) return;
  try {
    map.setFog({
      color: "rgb(12, 12, 18)",
      "high-color": "rgb(30, 41, 59)",
      "horizon-blend": 0.04,
      "space-color": "rgb(5, 5, 5)",
      "star-intensity": 0.08,
    });
  } catch {
    // fog not supported on all styles
  }
}

export function addRouteGlowLayers(
  map: mapboxgl.Map,
  sourceId: string,
  lineId: string,
  color: string,
  width = 5
) {
  map.addLayer({
    id: `${lineId}-glow`,
    type: "line",
    source: sourceId,
    paint: {
      "line-color": color,
      "line-width": width + 6,
      "line-opacity": 0.2,
      "line-blur": 4,
    },
  });
  map.addLayer({
    id: lineId,
    type: "line",
    source: sourceId,
    paint: {
      "line-color": color,
      "line-width": width,
      "line-opacity": 0.95,
    },
  });
}

export function pointsGeoJSON(points: { lat: number; lng: number; [key: string]: unknown }[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p, i) => ({
      type: "Feature" as const,
      id: i,
      properties: { ...p },
      geometry: { type: "Point" as const, coordinates: [p.lng, p.lat] },
    })),
  };
}

export function lineGeoJSON(coords: [number, number][]) {
  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "LineString" as const, coordinates: coords },
  };
}

export function onMapReady(map: mapboxgl.Map, fn: () => void) {
  if (map.isStyleLoaded()) fn();
  else map.once("load", fn);
}
