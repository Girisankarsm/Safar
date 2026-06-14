# Safar Crime Data Ingestion Pipeline

Automated ingestion of **official Indian government** crime statistics into Supabase for route safety scoring.

## Architecture

```
Official Sources (NCRB, Data.gov.in)
        │
        ▼
┌───────────────────┐
│ refresh-datasets  │  Download CSV/XLSX/ZIP → data/crime/raw/
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  clean + validate │  Normalize columns, map cities, dedupe
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  score engine     │  Weighted crime_index 0-100 per city
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  Supabase import  │  crime_datasets, crime_statistics, crime_city_scores
└─────────┬─────────┘
          ▼
┌───────────────────┐
│  Safar routes     │  40% community + 25% crime + 15% police + 10% hospital + 10% route
└───────────────────┘
```

## Official Data Sources

| Source | Agency | URL |
|--------|--------|-----|
| Crime in India | NCRB (MHA) | https://ncrb.gov.in/crime-in-india-year-wise.html |
| District IPC Crimes | Data.gov.in | https://www.data.gov.in/catalog/district-wise-crimes-under-various-sections-indian-penal-code-ipc-crimes |
| Crimes Against Women | Data.gov.in | https://www.data.gov.in/catalog/district-wise-crimes-committed-against-women |

> **Note:** NCRB 2024 tables are not yet published on the official portal (as of 2026). Pipeline uses **Crime in India 2022** seed data with clear provenance. When new XLSX files are released, place them in `data/crime/raw/` and re-run the pipeline.

## Setup

1. Run migration: `supabase/migrations/20240615000006_crime_data.sql`
2. Seed data: `supabase/seed_crime.sql` (or run pipeline)
3. Set environment variables:

```bash
export SUPABASE_URL=https://YOUR_PROJECT.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Commands

```bash
# Check import status
node scripts/crime-pipeline/status.mjs

# Attempt official source downloads
node scripts/crime-pipeline/refresh-datasets.mjs

# Import seed CSV → Supabase
node scripts/crime-pipeline/run-pipeline.mjs

# Validate without writing
node scripts/crime-pipeline/run-pipeline.mjs --dry-run
```

## Crime Index Formula

```
weighted = violent×3 + women×2.5 + assault×2 + robbery×1.5 + theft×1
crime_index = 100 - min(100, (weighted / peer_max) × 55)   # higher = safer
```

| Index | Label |
|-------|-------|
| 70–100 | Low Risk |
| 50–69 | Moderate Risk |
| 0–49 | High Risk |

## City Mapping

| Safar City | Primary Mapping | Fallback |
|------------|-----------------|----------|
| Chennai | NCRB Metropolitan | Tamil Nadu district |
| Bengaluru | NCRB Metropolitan | Karnataka district |
| Thiruvananthapuram | District-level | Kerala state |

## Safety

- Only official government / NDSAP open data sources
- No scraping of private websites
- All rows validated before import
- Full audit log in `data/crime/logs/`
