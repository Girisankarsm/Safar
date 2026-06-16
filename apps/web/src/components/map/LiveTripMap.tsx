import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useI18n } from "@/i18n/use-i18n";
import { addLabeledMarker } from "@/components/map/map-markers";
import { useEffect, useRef } from "react";

export function LiveTripMap({
  geometry,
  source,
  destination,
  sourceName,
  destinationName,
  userLat,
  userLng,
  showUser = false,
  height = 280,
}: {
  geometry?: GeoJSON.LineString;
  source?: { lat: number; lng: number };
  destination?: { lat: number; lng: number };
  sourceName?: string;
  destinationName?: string;
  userLat?: number | null;
  userLng?: number | null;
  showUser?: boolean;
  height?: number;
}) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false }).setView(
      [source?.lat ?? 13.08, source?.lng ?? 80.27],
      14
    );

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OSM &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [source?.lat, source?.lng]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (
        layer instanceof L.Polyline ||
        layer instanceof L.CircleMarker ||
        layer instanceof L.Marker
      ) {
        map.removeLayer(layer);
      }
    });

    const bounds: L.LatLngExpression[] = [];

    if (geometry?.coordinates?.length) {
      const latlngs = geometry.coordinates.map(([lngVal, latVal]) => [latVal, lngVal] as [number, number]);
      L.polyline(latlngs, { color: "#3B82F6", weight: 6, opacity: 0.9 }).addTo(map);
      latlngs.forEach((ll) => bounds.push(ll));
    }

    if (source) {
      addLabeledMarker(map, source.lat, source.lng, {
        label: "A",
        color: "#22C55E",
        ringColor: "#22C55E",
        title: sourceName ?? "Start",
        subtitle: "Trip origin",
      });
      bounds.push([source.lat, source.lng]);
    }

    if (destination) {
      addLabeledMarker(map, destination.lat, destination.lng, {
        label: "B",
        color: "#EF4444",
        ringColor: "#EF4444",
        title: destinationName ?? "Destination",
        subtitle: "Trip destination",
      });
      bounds.push([destination.lat, destination.lng]);
    }

    if (showUser && userLat != null && userLng != null) {
      addLabeledMarker(map, userLat, userLng, {
        label: "You",
        color: "#3B82F6",
        ringColor: "#3B82F6",
        title: "You are here",
        subtitle: "Live location",
      });
      bounds.push([userLat, userLng]);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [48, 48], maxZoom: 16 });
    } else if (showUser && userLat != null && userLng != null) {
      map.setView([userLat, userLng], 15);
    }
  }, [
    geometry,
    source,
    destination,
    sourceName,
    destinationName,
    showUser,
    userLat,
    userLng,
  ]);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        style={{ height }}
        className="overflow-hidden rounded-2xl border border-[var(--border)] shadow-inner"
      />
      <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-wrap gap-2 text-[10px] font-semibold">
        <span className="rounded-md bg-black/80 px-2 py-1 text-[#22C55E]">{t("map.start")}</span>
        <span className="rounded-md bg-black/80 px-2 py-1 text-[#EF4444]">{t("map.destination")}</span>
        {showUser && (
          <span className="rounded-md bg-black/80 px-2 py-1 text-[#3B82F6]">{t("map.youLive")}</span>
        )}
      </div>
    </div>
  );
}
