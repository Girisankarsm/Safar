export function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Human-readable walking distance — metres under 1 km */
export function formatWalkingDistance(distanceM?: number | null): string {
  if (distanceM == null) return "—";
  if (distanceM < 1000) return `${Math.round(distanceM)} m`;
  return `${(distanceM / 1000).toFixed(1)} km`;
}

export const MAX_WALKING_DISTANCE_M = 1000;

export function cacheKey(parts: (string | number)[]): string {
  return parts.map(String).join("|").toLowerCase();
}

/** Pin route geometry to exact start/end so map lines reach both markers. */
export function ensureRouteGeometryEndpoints(
  geometry: GeoJSON.LineString,
  source: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  snapThresholdM = 800
): GeoJSON.LineString {
  const coords =
    geometry.coordinates?.filter(
      ([lng, lat]) => Number.isFinite(lng) && Number.isFinite(lat)
    ) ?? [];

  if (!coords.length) {
    return {
      type: "LineString",
      coordinates: [
        [source.lng, source.lat],
        [destination.lng, destination.lat],
      ],
    };
  }

  const next = [...coords];
  const startGap = haversineM(next[0][1], next[0][0], source.lat, source.lng);
  const endGap = haversineM(
    next[next.length - 1][1],
    next[next.length - 1][0],
    destination.lat,
    destination.lng
  );

  if (startGap > snapThresholdM) {
    next.unshift([source.lng, source.lat]);
  } else {
    next[0] = [source.lng, source.lat];
  }

  if (endGap > snapThresholdM) {
    next.push([destination.lng, destination.lat]);
  } else {
    next[next.length - 1] = [destination.lng, destination.lat];
  }

  return { type: "LineString", coordinates: next };
}

/** Sample points along a GeoJSON LineString */
export function sampleLineString(
  geometry: GeoJSON.LineString,
  maxPoints = 12
): { lat: number; lng: number }[] {
  const coords = geometry.coordinates;
  if (!coords?.length) return [];
  if (coords.length <= maxPoints) {
    return coords.map(([lng, lat]) => ({ lat, lng }));
  }
  const step = Math.floor(coords.length / maxPoints);
  const out: { lat: number; lng: number }[] = [];
  for (let i = 0; i < coords.length; i += step) {
    const [lng, lat] = coords[i];
    out.push({ lat, lng });
  }
  return out;
}
