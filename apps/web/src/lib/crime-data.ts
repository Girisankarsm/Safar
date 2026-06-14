import type { CityId } from "@/types/database";

/** Fallback NCRB 2022 scores when Supabase crime tables are empty */
export const FALLBACK_CRIME_SCORES: Record<
  CityId,
  {
    crime_index: number;
    risk_label: "low_risk" | "moderate_risk" | "high_risk";
    report_year: number;
    mapping_confidence: "city" | "district" | "state";
    data_source: string;
  }
> = {
  chennai: {
    crime_index: 62,
    risk_label: "moderate_risk",
    report_year: 2022,
    mapping_confidence: "city",
    data_source: "NCRB Crime in India 2022",
  },
  bangalore: {
    crime_index: 48,
    risk_label: "moderate_risk",
    report_year: 2022,
    mapping_confidence: "city",
    data_source: "NCRB Crime in India 2022",
  },
  trivandrum: {
    crime_index: 78,
    risk_label: "low_risk",
    report_year: 2022,
    mapping_confidence: "district",
    data_source: "NCRB Crime in India 2022",
  },
  hyderabad: {
    crime_index: 55,
    risk_label: "moderate_risk",
    report_year: 2022,
    mapping_confidence: "city",
    data_source: "NCRB Crime in India 2022",
  },
};

export function crimeRiskLabelHuman(label: string): string {
  const map: Record<string, string> = {
    low_risk: "Low Risk",
    moderate_risk: "Moderate Risk",
    high_risk: "High Risk",
  };
  return map[label] ?? label;
}

export function crimeExplanation(score: number, riskLabel: string): string {
  if (score >= 70) {
    return "This route passes through areas with lower historical crime rates based on official NCRB data.";
  }
  if (score >= 50) {
    return "Historical crime data for this city shows moderate levels — stay alert on less-lit stretches.";
  }
  return "Official crime statistics indicate higher historical incident rates in this metropolitan area.";
}
