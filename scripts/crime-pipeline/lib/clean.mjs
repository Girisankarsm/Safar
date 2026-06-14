import { CITY_ALIASES, DISTRICT_TO_CITY } from "../config.mjs";

const COLUMN_ALIASES = {
  source: ["source", "data_source", "dataset"],
  report_year: ["report_year", "year", "yr"],
  state_name: ["state_name", "state", "state/ut", "state_ut"],
  district_name: ["district_name", "district", "dist"],
  city_name: ["city_name", "city", "metro_city", "metropolitan_city"],
  city_id: ["city_id", "safar_city_id"],
  crime_category: ["crime_category", "category", "crime_type", "crime_head"],
  crime_count: ["crime_count", "count", "cases", "incidents", "total"],
  mapping_confidence: ["mapping_confidence", "confidence"],
};

const CATEGORY_MAP = {
  "violent crime": "violent_crime",
  violent_crime: "violent_crime",
  "crimes against women": "crimes_against_women",
  crimes_against_women: "crimes_against_women",
  assault: "assault",
  robbery: "robbery",
  theft: "theft",
  murder: "murder",
  rape: "rape",
  kidnapping: "kidnapping",
  other: "other_ipc",
  other_ipc: "other_ipc",
};

function normalizeHeader(h) {
  return h.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^\w]/g, "");
}

function resolveColumn(headers, field) {
  const aliases = COLUMN_ALIASES[field] ?? [field];
  for (const alias of aliases) {
    const idx = headers.indexOf(normalizeHeader(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}

function normalizeCityName(name) {
  return name?.trim().toLowerCase().replace(/\s+/g, " ") ?? "";
}

export function mapToSafarCity(state, district, city) {
  const stateNorm = normalizeCityName(state);
  const districtNorm = normalizeCityName(district);
  const cityNorm = normalizeCityName(city);

  for (const [cityId, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.some((a) => cityNorm.includes(a) || districtNorm.includes(a))) {
      const conf = cityNorm && aliases.some((a) => cityNorm.includes(a)) ? "city" : "district";
      return { city_id: cityId, mapping_confidence: conf };
    }
  }

  for (const [cityId, cfg] of Object.entries(DISTRICT_TO_CITY)) {
    if (cfg.state.toLowerCase() === stateNorm || cfg.districts.some((d) => districtNorm.includes(d.toLowerCase()))) {
      const conf = cfg.districts.some((d) => districtNorm.includes(d.toLowerCase())) ? "district" : "state";
      return { city_id: cityId, mapping_confidence: conf };
    }
  }

  return { city_id: null, mapping_confidence: "state" };
}

export function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const headers = lines[0].split(",").map(normalizeHeader);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const get = (field) => {
      const idx = resolveColumn(headers, field);
      return idx >= 0 ? cols[idx] : "";
    };

    const state = get("state_name");
    const district = get("district_name");
    const city = get("city_name");
    const mapping = get("city_id")
      ? { city_id: get("city_id"), mapping_confidence: get("mapping_confidence") || "city" }
      : mapToSafarCity(state, district, city);

    const rawCategory = get("crime_category").toLowerCase();
    const crime_category = CATEGORY_MAP[rawCategory] ?? rawCategory.replace(/\s+/g, "_");

    const count = parseInt(get("crime_count"), 10);
    if (!Number.isFinite(count) || count < 0) continue;

    rows.push({
      source: get("source") || "NCRB Crime in India",
      report_year: parseInt(get("report_year"), 10) || 2022,
      state_name: state,
      district_name: district || null,
      city_name: city || null,
      city_id: mapping.city_id,
      crime_category,
      crime_count: count,
      mapping_confidence: mapping.mapping_confidence,
      raw_row: Object.fromEntries(headers.map((h, j) => [h, cols[j]])),
    });
  }

  return dedupeRows(rows);
}

function dedupeRows(rows) {
  const seen = new Map();
  for (const row of rows) {
    const key = `${row.source}|${row.report_year}|${row.state_name}|${row.district_name}|${row.city_name}|${row.crime_category}`;
    seen.set(key, row);
  }
  return [...seen.values()];
}

export function validateRows(rows) {
  const errors = [];
  const validCategories = new Set([
    "violent_crime", "crimes_against_women", "assault", "robbery", "theft",
    "murder", "rape", "kidnapping", "other_ipc",
  ]);

  for (const [i, row] of rows.entries()) {
    if (!row.state_name) errors.push(`Row ${i}: missing state_name`);
    if (!validCategories.has(row.crime_category)) errors.push(`Row ${i}: invalid category ${row.crime_category}`);
    if (!row.city_id) errors.push(`Row ${i}: unmapped city for ${row.district_name ?? row.city_name}`);
  }

  return { valid: errors.length === 0, errors, mapped: rows.filter((r) => r.city_id) };
}
