/**
 * Corridor Risk Engine
 *
 * Generates route-specific safety intelligence by analysing the spatial
 * context of every route corridor:
 *   - Samples route geometry every ~300 m
 *   - Counts police stations, hospitals, and community reports near each sample
 *   - Detects report clusters (hotspots)
 *   - Produces a CorridorProfile that drives route scoring, AI explanations,
 *     and map segment coloring
 *
 * All analysis uses data already fetched (OSM places + Supabase reports),
 * so no extra API calls are required at scoring time.
 */

import { haversineM, sampleLineString } from "@/lib/geo";
import type { OverpassPlace } from "@/services/osm/overpass.service";

/* ─────────────────────────────── types ──────────────────────────────── */

export type HotspotRisk = "low" | "moderate" | "high";
export type SegmentRisk = "safe" | "moderate" | "risk";

export type CorridorHotspot = {
  lat: number;
  lng: number;
  reportCount: number;
  types: string[];
  riskLevel: HotspotRisk;
};

export type CorridorSegment = {
  /** Index into the route coordinate array where this segment starts */
  fromCoordIdx: number;
  toCoordIdx: number;
  riskLevel: SegmentRisk;
  reportCount: number;
  policeNearby: number;
  hospitalNearby: number;
};

export type CorridorProfile = {
  /** Total distinct police stations within 500 m of any route sample */
  policeCount: number;
  /** Total distinct hospitals within 500 m of any route sample */
  hospitalCount: number;
  /** Community reports within the corridor buffer */
  reportCount: number;
  /** Detected high-density report clusters */
  hotspots: CorridorHotspot[];
  /** Per-segment risk breakdown for map coloring */
  segments: CorridorSegment[];
  /** Fraction of route with police coverage (0–1) */
  policeCoverage: number;
  /** Fraction of route with hospital coverage (0–1) */
  hospitalCoverage: number;
  /** 0–100 — infrastructure (police + hospital) score */
  infraScore: number;
  /** 0–100 — community report density score (higher = fewer/safer reports) */
  communityScore: number;
  /** 0–100 — lighting quality estimate */
  lightingScore: number;
  /** 0–100 — confidence in the data quality of this corridor */
  confidenceScore: number;
  /** Most prevalent risk level along the route */
  dominantRisk: SegmentRisk;
  /** Unique OSM IDs of police stations found along corridor */
  policeNames: string[];
  /** Unique OSM IDs of hospitals found along corridor */
  hospitalNames: string[];
};

/* ─────────────────────────── sampling ───────────────────────────────── */

const SAMPLE_INTERVAL_M = 300;
const POI_BUFFER_M = 500;
const REPORT_BUFFER_M = 400;
const HOTSPOT_CLUSTER_M = 350;
const HOTSPOT_MIN_REPORTS = 3;

/**
 * Sample route coordinates at roughly every SAMPLE_INTERVAL_M metres.
 * Returns sample points with their index into the coordinate array.
 */
export function sampleCorridorPoints(
  geometry: GeoJSON.LineString
): { lat: number; lng: number; coordIdx: number }[] {
  const coords = geometry.coordinates;
  if (!coords?.length) return [];

  const points: { lat: number; lng: number; coordIdx: number }[] = [
    { lat: coords[0][1], lng: coords[0][0], coordIdx: 0 },
  ];

  let accumulated = 0;

  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    accumulated += haversineM(lat1, lng1, lat2, lng2);

    if (accumulated >= SAMPLE_INTERVAL_M) {
      points.push({ lat: lat2, lng: lng2, coordIdx: i });
      accumulated = 0;
    }
  }

  // Always include endpoint
  const last = coords[coords.length - 1];
  if (points[points.length - 1].coordIdx !== coords.length - 1) {
    points.push({ lat: last[1], lng: last[0], coordIdx: coords.length - 1 });
  }

  return points;
}

/* ─────────────────────── POI counting ───────────────────────────────── */

function countPlacesNearPoint(
  places: OverpassPlace[],
  lat: number,
  lng: number,
  bufferM: number
): { police: OverpassPlace[]; hospitals: OverpassPlace[] } {
  const police: OverpassPlace[] = [];
  const hospitals: OverpassPlace[] = [];
  for (const p of places) {
    const d = haversineM(lat, lng, p.latitude, p.longitude);
    if (d <= bufferM) {
      if (p.place_type === "police") police.push(p);
      if (p.place_type === "hospital") hospitals.push(p);
    }
  }
  return { police, hospitals };
}

/* ─────────────────────── hotspot detection ──────────────────────────── */

type Report = { latitude: number; longitude: number; category?: string };

function detectHotspots(reports: Report[]): CorridorHotspot[] {
  const used = new Set<number>();
  const hotspots: CorridorHotspot[] = [];

  for (let i = 0; i < reports.length; i++) {
    if (used.has(i)) continue;
    const cluster = [i];
    for (let j = i + 1; j < reports.length; j++) {
      if (used.has(j)) continue;
      const d = haversineM(
        reports[i].latitude,
        reports[i].longitude,
        reports[j].latitude,
        reports[j].longitude
      );
      if (d <= HOTSPOT_CLUSTER_M) cluster.push(j);
    }
    if (cluster.length >= HOTSPOT_MIN_REPORTS) {
      cluster.forEach((idx) => used.add(idx));
      const avgLat = cluster.reduce((s, idx) => s + reports[idx].latitude, 0) / cluster.length;
      const avgLng = cluster.reduce((s, idx) => s + reports[idx].longitude, 0) / cluster.length;
      const types = [...new Set(cluster.map((idx) => reports[idx].category ?? "incident"))];
      hotspots.push({
        lat: avgLat,
        lng: avgLng,
        reportCount: cluster.length,
        types,
        riskLevel: cluster.length >= 6 ? "high" : cluster.length >= 4 ? "moderate" : "low",
      });
    }
  }
  return hotspots;
}

/* ───────────── reports near corridor ───────────────────────────────── */

function countReportsNearPoint(reports: Report[], lat: number, lng: number): number {
  return reports.filter(
    (r) => haversineM(lat, lng, r.latitude, r.longitude) <= REPORT_BUFFER_M
  ).length;
}

/* ───────────── segment risk level ─────────────────────────────────── */

function segmentRisk(
  reportCount: number,
  policeNearby: number,
  hospitalNearby: number,
  inHotspot: boolean
): SegmentRisk {
  if (inHotspot || reportCount >= 4) return "risk";
  if (reportCount >= 2 || (policeNearby === 0 && hospitalNearby === 0)) return "moderate";
  return "safe";
}

/* ───────────── lighting quality estimate ───────────────────────────── */

/**
 * Estimate lighting quality from route characteristics.
 * In the absence of OSM lighting tags (rarely populated), we use:
 * - Longer routes → more varied lighting
 * - Police presence → better lit areas
 * - Night time → discount
 */
function estimateLightingScore(
  distanceKm: number,
  policeCount: number,
  departureHour: number
): number {
  let base = 65;
  if (policeCount >= 3) base += 10;
  if (policeCount >= 5) base += 5;
  if (distanceKm < 5) base += 8;
  if (distanceKm > 15) base -= 5;
  // Night penalty
  if (departureHour >= 22 || departureHour < 5) base -= 20;
  else if (departureHour >= 20 || departureHour < 7) base -= 8;
  return Math.max(20, Math.min(95, Math.round(base)));
}

/* ───────────── confidence score ───────────────────────────────────── */

function computeConfidence(
  reportCount: number,
  policeCount: number,
  hospitalCount: number,
  sampleCount: number
): number {
  let conf = 50;
  // More data points = higher confidence
  if (reportCount > 0) conf += Math.min(20, reportCount * 3);
  if (policeCount > 0) conf += Math.min(10, policeCount * 2);
  if (hospitalCount > 0) conf += Math.min(8, hospitalCount * 2);
  // More sample points = better coverage
  if (sampleCount >= 8) conf += 10;
  else if (sampleCount >= 4) conf += 5;
  return Math.max(35, Math.min(96, Math.round(conf)));
}

/* ─────────────────── main corridor profile builder ─────────────────── */

export function buildCorridorProfile(
  geometry: GeoJSON.LineString,
  reports: Report[],
  osmPlaces: OverpassPlace[],
  options: {
    distanceKm: number;
    departureHour: number;
    transferCount?: number;
  }
): CorridorProfile {
  const samples = sampleCorridorPoints(geometry);
  const coords = geometry.coordinates;

  // Use simple fallback sampling if geometry is straight-line (2 points)
  const effectiveSamples =
    samples.length >= 2
      ? samples
      : sampleLineString(geometry, 8).map((s, i) => ({ ...s, coordIdx: i }));

  // Gather all police/hospital within corridor
  const seenPolice = new Set<number>();
  const seenHospital = new Set<number>();
  const policeNames: string[] = [];
  const hospitalNames: string[] = [];

  const perSample = effectiveSamples.map((sample) => {
    const { police, hospitals } = countPlacesNearPoint(
      osmPlaces,
      sample.lat,
      sample.lng,
      POI_BUFFER_M
    );
    police.forEach((p) => {
      if (!seenPolice.has(p.osm_id)) {
        seenPolice.add(p.osm_id);
        policeNames.push(p.name);
      }
    });
    hospitals.forEach((h) => {
      if (!seenHospital.has(h.osm_id)) {
        seenHospital.add(h.osm_id);
        hospitalNames.push(h.name);
      }
    });
    const rptCount = countReportsNearPoint(reports, sample.lat, sample.lng);
    return {
      coordIdx: sample.coordIdx,
      policeCount: police.length,
      hospitalCount: hospitals.length,
      reportCount: rptCount,
    };
  });

  const totalPolice = seenPolice.size;
  const totalHospital = seenHospital.size;
  const routeReportCount = reports.filter((r) =>
    effectiveSamples.some(
      (s) => haversineM(r.latitude, r.longitude, s.lat, s.lng) <= REPORT_BUFFER_M
    )
  ).length;

  // Detect hotspots within the corridor
  const corridorReports = reports.filter((r) =>
    effectiveSamples.some(
      (s) => haversineM(r.latitude, r.longitude, s.lat, s.lng) <= REPORT_BUFFER_M * 1.5
    )
  );
  const hotspots = detectHotspots(corridorReports);

  // Build segments (between consecutive sample points)
  const segments: CorridorSegment[] = [];
  for (let i = 0; i < perSample.length - 1; i++) {
    const from = perSample[i];
    const to = perSample[i + 1];
    const avgReports = Math.round((from.reportCount + to.reportCount) / 2);
    const avgPolice = Math.round((from.policeCount + to.policeCount) / 2);
    const avgHospital = Math.round((from.hospitalCount + to.hospitalCount) / 2);

    // Check if any hotspot falls on this segment
    const fromCoord = coords[from.coordIdx];
    const toCoord = coords[to.coordIdx];
    const segMidLat = (fromCoord[1] + toCoord[1]) / 2;
    const segMidLng = (fromCoord[0] + toCoord[0]) / 2;
    const inHotspot = hotspots.some(
      (h) => haversineM(h.lat, h.lng, segMidLat, segMidLng) <= HOTSPOT_CLUSTER_M
    );

    segments.push({
      fromCoordIdx: from.coordIdx,
      toCoordIdx: to.coordIdx,
      riskLevel: segmentRisk(avgReports, avgPolice, avgHospital, inHotspot),
      reportCount: avgReports,
      policeNearby: avgPolice,
      hospitalNearby: avgHospital,
    });
  }

  const safeSegs = segments.filter((s) => s.riskLevel === "safe").length;
  const riskSegs = segments.filter((s) => s.riskLevel === "risk").length;
  const dominantRisk: SegmentRisk =
    riskSegs > segments.length * 0.35
      ? "risk"
      : safeSegs > segments.length * 0.6
      ? "safe"
      : "moderate";

  const policeCoverage =
    segments.length > 0
      ? segments.filter((s) => s.policeNearby > 0).length / segments.length
      : totalPolice > 0
      ? 0.5
      : 0;
  const hospitalCoverage =
    segments.length > 0
      ? segments.filter((s) => s.hospitalNearby > 0).length / segments.length
      : totalHospital > 0
      ? 0.5
      : 0;

  const infraScore = Math.min(
    98,
    Math.round(
      40 +
        Math.min(30, totalPolice * 6) +
        Math.min(20, totalHospital * 5) +
        policeCoverage * 8
    )
  );

  const communityScore = Math.max(15, 100 - routeReportCount * 10);

  const lightingScore = estimateLightingScore(
    options.distanceKm,
    totalPolice,
    options.departureHour
  );

  const confidenceScore = computeConfidence(
    routeReportCount,
    totalPolice,
    totalHospital,
    effectiveSamples.length
  );

  return {
    policeCount: totalPolice,
    hospitalCount: totalHospital,
    reportCount: routeReportCount,
    hotspots,
    segments,
    policeCoverage,
    hospitalCoverage,
    infraScore,
    communityScore,
    lightingScore,
    confidenceScore,
    dominantRisk,
    policeNames: policeNames.slice(0, 4),
    hospitalNames: hospitalNames.slice(0, 4),
  };
}

/* ───────────── derive scoring inputs from profile ─────────────────── */

export function profileToScoringInputs(profile: CorridorProfile): {
  policeNear: number;
  hospitalsNear: number;
  reportsNear: number;
  hotspotPenalty: number;
} {
  const hotspotPenalty = profile.hotspots.reduce((acc, h) => {
    return acc + (h.riskLevel === "high" ? 12 : h.riskLevel === "moderate" ? 6 : 3);
  }, 0);
  return {
    policeNear: profile.policeCount,
    hospitalsNear: profile.hospitalCount,
    reportsNear: profile.reportCount,
    hotspotPenalty: Math.min(30, hotspotPenalty),
  };
}
