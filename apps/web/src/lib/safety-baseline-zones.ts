import { getCityConfig } from "@/config/cities";
import { FALLBACK_CRIME_SCORES } from "@/lib/crime-data";
import type { CityId } from "@/types/database";
import type { HeatmapPoint } from "@/services/supabase/heatmap.service";

type ZoneSeed = {
  latOffset: number;
  lngOffset: number;
  zone_type: HeatmapPoint["zone_type"];
  label: string;
  weight: number;
};

const CITY_ZONE_SEEDS: Record<CityId, ZoneSeed[]> = {
  chennai: [
    { latOffset: 0, lngOffset: 0, zone_type: "moderate", label: "Central Chennai · NCRB moderate", weight: 0.5 },
    { latOffset: 0.012, lngOffset: -0.008, zone_type: "high_risk", label: "T Nagar corridor · higher IPC", weight: 0.72 },
    { latOffset: -0.01, lngOffset: 0.014, zone_type: "moderate", label: "Egmore · moderate risk", weight: 0.48 },
    { latOffset: 0.018, lngOffset: 0.006, zone_type: "safe", label: "OMR IT corridor · safer", weight: 0.28 },
    { latOffset: -0.014, lngOffset: -0.01, zone_type: "safe", label: "Anna Nagar · lower crime", weight: 0.22 },
  ],
  bangalore: [
    { latOffset: 0, lngOffset: 0, zone_type: "moderate", label: "MG Road · NCRB moderate", weight: 0.55 },
    { latOffset: 0.011, lngOffset: -0.009, zone_type: "high_risk", label: "Indiranagar · higher theft IPC", weight: 0.78 },
    { latOffset: -0.008, lngOffset: 0.012, zone_type: "moderate", label: "Majestic · moderate", weight: 0.52 },
    { latOffset: 0.015, lngOffset: 0.008, zone_type: "high_risk", label: "Koramangala · elevated reports", weight: 0.68 },
    { latOffset: -0.012, lngOffset: -0.008, zone_type: "safe", label: "Malleshwaram · safer zone", weight: 0.3 },
  ],
  trivandrum: [
    { latOffset: 0, lngOffset: 0, zone_type: "safe", label: "City centre · NCRB low risk", weight: 0.25 },
    { latOffset: 0.009, lngOffset: -0.006, zone_type: "moderate", label: "Technopark gate · lighting flags", weight: 0.45 },
    { latOffset: -0.007, lngOffset: 0.01, zone_type: "safe", label: "Palayam · lower crime", weight: 0.2 },
    { latOffset: 0.014, lngOffset: 0.004, zone_type: "moderate", label: "Kazhakkoottam · moderate", weight: 0.42 },
    { latOffset: -0.01, lngOffset: -0.008, zone_type: "safe", label: "Medical College · safer", weight: 0.18 },
  ],
};

/** Always-visible NCRB-informed baseline zones (shown even with zero community reports) */
export function getBaselineSafetyZones(cityId: CityId): HeatmapPoint[] {
  const center = getCityConfig(cityId);
  const crime = FALLBACK_CRIME_SCORES[cityId];
  const seeds = CITY_ZONE_SEEDS[cityId];

  return seeds.map((z) => ({
    lat: center.center_lat + z.latOffset,
    lng: center.center_lng + z.lngOffset,
    weight: z.weight,
    zone_type: z.zone_type,
    label: `${z.label} (${crime.data_source}, index ${crime.crime_index}/100)`,
    source: "ncrb" as const,
  }));
}
