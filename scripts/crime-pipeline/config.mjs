/**
 * Official government crime data sources for Safar ingestion pipeline.
 * Only NCRB, Data.gov.in, and state police open-data portals.
 */
export const OFFICIAL_SOURCES = [
  {
    id: "ncrb-crime-in-india",
    name: "NCRB Crime in India Year-wise",
    agency: "National Crime Records Bureau (MHA)",
    url: "https://ncrb.gov.in/crime-in-india-year-wise.html",
    catalogUrl: "https://www.data.gov.in/catalog/district-wise-crimes-under-various-sections-indian-penal-code-ipc-crimes",
    formats: ["xlsx", "pdf", "zip"],
    notes: "Primary official source. Latest verified release: 2022. 2024 tables pending on NCRB portal.",
  },
  {
    id: "data-gov-ipc-district",
    name: "District-wise IPC Crimes",
    agency: "Data.gov.in / NCRB",
    url: "https://www.data.gov.in/catalog/district-wise-crimes-under-various-sections-indian-penal-code-ipc-crimes",
    catalogUrl: "https://www.data.gov.in/catalog/district-wise-crimes-under-various-sections-indian-penal-code-ipc-crimes",
    formats: ["zip", "csv"],
    notes: "NDSAP open government dataset. District-level IPC breakdown.",
  },
  {
    id: "data-gov-women-crimes",
    name: "District-wise Crimes Against Women",
    agency: "Data.gov.in / NCRB",
    url: "https://www.data.gov.in/catalog/district-wise-crimes-committed-against-women",
    catalogUrl: "https://www.data.gov.in/catalog/district-wise-crimes-committed-against-women",
    formats: ["zip", "csv"],
    notes: "Women-specific crime categories by district.",
  },
  {
    id: "ncrb-metropolitan",
    name: "NCRB Metropolitan Cities Crime Tables",
    agency: "NCRB",
    url: "https://ncrb.gov.in/en/crime-in-india",
    formats: ["xlsx"],
    notes: "Chennai, Bengaluru listed as metropolitan cities in Crime in India reports.",
  },
];

/** Local seed file (curated from NCRB Crime in India 2022 metropolitan tables) */
export const SEED_CSV = "data/crime/seed/ncrb_metropolitan_cities_2022.csv";

export const CITY_ALIASES = {
  chennai: ["chennai", "madras", "chennai city", "greater chennai"],
  bangalore: ["bengaluru", "bangalore", "bengaluru urban", "bangalore urban"],
  trivandrum: ["thiruvananthapuram", "trivandrum", "tvm"],
};

export const DISTRICT_TO_CITY = {
  chennai: { state: "Tamil Nadu", districts: ["Chennai", "Chengalpattu"] },
  bangalore: { state: "Karnataka", districts: ["Bengaluru Urban", "Bangalore Urban", "Bengaluru"] },
  trivandrum: { state: "Kerala", districts: ["Thiruvananthapuram", "Trivandrum"] },
};

export const CRIME_WEIGHTS = {
  violent_crime: 3.0,
  crimes_against_women: 2.5,
  assault: 2.0,
  robbery: 1.5,
  theft: 1.0,
  murder: 3.5,
  rape: 3.0,
  kidnapping: 2.5,
  other_ipc: 1.0,
};

export const PATHS = {
  raw: "data/crime/raw",
  cleaned: "data/crime/cleaned",
  logs: "data/crime/logs",
  seed: "data/crime/seed",
};
