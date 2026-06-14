import { CRIME_WEIGHTS } from "../config.mjs";

/**
 * Compute crime_index 0-100 where HIGHER = safer (lower historical crime burden).
 * Uses weighted crime counts normalized against metro peer cities.
 */
export function computeWeightedCrimes(counts) {
  let total = 0;
  for (const [cat, count] of Object.entries(counts)) {
    const w = CRIME_WEIGHTS[cat] ?? 1;
    total += (count ?? 0) * w;
  }
  return total;
}

export function computeCrimeIndex(weightedTotal, peerMax = 35000) {
  const normalized = Math.min(1, weightedTotal / peerMax);
  return Math.max(0, Math.min(100, Math.round(100 - normalized * 55)));
}

export function riskLabel(index) {
  if (index >= 70) return "low_risk";
  if (index >= 50) return "moderate_risk";
  return "high_risk";
}

export function riskLabelHuman(label) {
  const map = { low_risk: "Low Risk", moderate_risk: "Moderate Risk", high_risk: "High Risk" };
  return map[label] ?? label;
}

export function aggregateCityScores(rows) {
  const byCity = new Map();

  for (const row of rows) {
    if (!row.city_id) continue;
    const entry = byCity.get(row.city_id) ?? {
      city_id: row.city_id,
      report_year: row.report_year,
      counts: {},
      mapping_confidence: row.mapping_confidence,
      source: row.source,
    };
    entry.counts[row.crime_category] = (entry.counts[row.crime_category] ?? 0) + row.crime_count;
    if (row.mapping_confidence === "city") entry.mapping_confidence = "city";
    byCity.set(row.city_id, entry);
  }

  const weightedValues = [...byCity.values()].map((e) => computeWeightedCrimes(e.counts));
  const peerMax = Math.max(...weightedValues, 1);

  return [...byCity.values()].map((entry) => {
    const weighted = computeWeightedCrimes(entry.counts);
    const crime_index = computeCrimeIndex(weighted, peerMax);
    const risk = riskLabel(crime_index);
    return {
      city_id: entry.city_id,
      report_year: entry.report_year,
      violent_crime_count: entry.counts.violent_crime ?? 0,
      crimes_against_women_count: entry.counts.crimes_against_women ?? 0,
      assault_count: entry.counts.assault ?? 0,
      robbery_count: entry.counts.robbery ?? 0,
      theft_count: entry.counts.theft ?? 0,
      total_weighted_crimes: weighted,
      crime_index,
      risk_label: risk,
      mapping_confidence: entry.mapping_confidence,
      data_source: entry.source,
    };
  });
}
