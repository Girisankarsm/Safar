import { FALLBACK_CRIME_SCORES } from "@/lib/crime-data";
import { supabase } from "@/lib/supabase/client";
import type { CityId } from "@/types/database";

export type CrimeCityScore = {
  id: string;
  city_id: CityId;
  report_year: number;
  violent_crime_count: number;
  crimes_against_women_count: number;
  assault_count: number;
  robbery_count: number;
  theft_count: number;
  total_weighted_crimes: number;
  crime_index: number;
  risk_label: "low_risk" | "moderate_risk" | "high_risk";
  mapping_confidence: "city" | "district" | "state";
  data_source: string;
  source_url: string | null;
  notes: string | null;
  computed_at: string;
};

export type CrimeDataset = {
  id: string;
  source_name: string;
  source_url: string;
  source_agency: string;
  file_name: string | null;
  file_type: string | null;
  report_year: number;
  status: string;
  row_count: number;
  error_log: string | null;
  imported_at: string | null;
  created_at: string;
};

const cache = new Map<CityId, CrimeCityScore | null>();

export const crimeService = {
  async getCityScore(cityId: CityId): Promise<CrimeCityScore> {
    if (cache.has(cityId)) {
      const cached = cache.get(cityId);
      if (cached) return cached;
    }

    const { data, error } = await supabase
      .from("crime_city_scores")
      .select("*")
      .eq("city_id", cityId)
      .order("report_year", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const score = data as CrimeCityScore;
      cache.set(cityId, score);
      return score;
    }

    const fallback = FALLBACK_CRIME_SCORES[cityId];
    return {
      id: `fallback-${cityId}`,
      city_id: cityId,
      report_year: fallback.report_year,
      violent_crime_count: 0,
      crimes_against_women_count: 0,
      assault_count: 0,
      robbery_count: 0,
      theft_count: 0,
      total_weighted_crimes: 0,
      crime_index: fallback.crime_index,
      risk_label: fallback.risk_label,
      mapping_confidence: fallback.mapping_confidence,
      data_source: fallback.data_source,
      source_url: "https://ncrb.gov.in",
      notes: "Fallback from NCRB seed — run crime migration if Supabase table is empty",
      computed_at: new Date().toISOString(),
    };
  },

  async listDatasets(): Promise<CrimeDataset[]> {
    const { data, error } = await supabase
      .from("crime_datasets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) return [];
    return (data ?? []) as CrimeDataset[];
  },

  async listCityScores(): Promise<CrimeCityScore[]> {
    const { data, error } = await supabase
      .from("crime_city_scores")
      .select("*")
      .order("crime_index", { ascending: false });
    if (error) {
      return Object.entries(FALLBACK_CRIME_SCORES).map(([cityId, fb]) => ({
        id: `fallback-${cityId}`,
        city_id: cityId as CityId,
        report_year: fb.report_year,
        violent_crime_count: 0,
        crimes_against_women_count: 0,
        assault_count: 0,
        robbery_count: 0,
        theft_count: 0,
        total_weighted_crimes: 0,
        crime_index: fb.crime_index,
        risk_label: fb.risk_label,
        mapping_confidence: fb.mapping_confidence,
        data_source: fb.data_source,
        source_url: "https://ncrb.gov.in",
        notes: null,
        computed_at: new Date().toISOString(),
      }));
    }
    return (data ?? []) as CrimeCityScore[];
  },

  clearCache() {
    cache.clear();
  },
};
