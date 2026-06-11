import { IS_DEMO_MODE } from "@/lib/config";
import { demoZones } from "@/lib/demo-data";
import { reportsService } from "@/services/supabase/reports.service";
import type { CityId, SafetyReport } from "@/types/database";

export type HeatmapPoint = {
  lat: number;
  lng: number;
  weight: number;
  label: string;
  zone_type: "safe" | "moderate" | "high_risk";
};

const RISK_TYPES = new Set([
  "harassment",
  "unsafe_area",
  "suspicious_activity",
  "poor_lighting",
  "unsafe_bus_stop",
  "dangerous_crossing",
  "flooded_area",
]);

function reportWeight(r: SafetyReport): number {
  let w = 0.35;
  if (RISK_TYPES.has(r.report_type)) w += 0.25;
  w += Math.min(0.25, (r.upvotes ?? 0) * 0.03);
  w += (r.is_verified ? 0.2 : 0) + Math.min(0.15, (r.verifications ?? 0) * 0.05);
  return Math.min(1, w);
}

function clusterReports(reports: SafetyReport[], cellSize = 0.008): HeatmapPoint[] {
  const grid = new Map<string, { lat: number; lng: number; weight: number; count: number; verified: number }>();

  for (const r of reports) {
    const gx = Math.round(r.latitude / cellSize);
    const gy = Math.round(r.longitude / cellSize);
    const key = `${gx}:${gy}`;
    const w = reportWeight(r);
    const cell = grid.get(key) ?? {
      lat: r.latitude,
      lng: r.longitude,
      weight: 0,
      count: 0,
      verified: 0,
    };
    cell.weight += w;
    cell.count += 1;
    cell.lat = (cell.lat * (cell.count - 1) + r.latitude) / cell.count;
    cell.lng = (cell.lng * (cell.count - 1) + r.longitude) / cell.count;
    if (r.is_verified) cell.verified += 1;
    grid.set(key, cell);
  }

  return Array.from(grid.values()).map((c) => {
    const density = Math.min(1, c.weight / 2);
    const zone_type: HeatmapPoint["zone_type"] =
      density >= 0.65 ? "high_risk" : density >= 0.35 ? "moderate" : "safe";
    return {
      lat: c.lat,
      lng: c.lng,
      weight: density,
      zone_type,
      label: `${c.count} report${c.count > 1 ? "s" : ""}${c.verified ? " · verified" : ""}`,
    };
  });
}

export const heatmapService = {
  async getHeatmapPoints(cityId: CityId): Promise<HeatmapPoint[]> {
    if (IS_DEMO_MODE) {
      return demoZones(cityId).map((z) => ({
        lat: z.latitude,
        lng: z.longitude,
        weight: z.risk_weight,
        label: z.label,
        zone_type: z.zone_type,
      }));
    }

    const reports = await reportsService.listByCity(cityId, 200);
    if (!reports.length) return [];
    return clusterReports(reports);
  },
};
