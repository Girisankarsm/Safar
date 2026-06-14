-- Crime data pipeline tables (NCRB / Data.gov.in / official government sources)
-- Run after 20240612000005_google_oauth_user_metadata.sql

CREATE TYPE crime_category AS ENUM (
  'violent_crime',
  'crimes_against_women',
  'assault',
  'robbery',
  'theft',
  'murder',
  'rape',
  'kidnapping',
  'other_ipc'
);

CREATE TYPE crime_risk_label AS ENUM ('low_risk', 'moderate_risk', 'high_risk');

CREATE TYPE mapping_confidence AS ENUM ('city', 'district', 'state');

CREATE TABLE IF NOT EXISTS public.crime_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_agency TEXT NOT NULL DEFAULT 'NCRB',
  file_name TEXT,
  file_type TEXT CHECK (file_type IN ('csv', 'xlsx', 'xls', 'json', 'zip', 'seed')),
  report_year INTEGER NOT NULL,
  downloaded_at TIMESTAMPTZ,
  imported_at TIMESTAMPTZ,
  row_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'downloaded', 'cleaned', 'imported', 'failed')),
  error_log TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.crime_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES public.crime_datasets(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  report_year INTEGER NOT NULL,
  state_name TEXT NOT NULL,
  district_name TEXT,
  city_name TEXT,
  city_id TEXT REFERENCES public.cities(id),
  crime_category crime_category NOT NULL,
  crime_count INTEGER NOT NULL DEFAULT 0 CHECK (crime_count >= 0),
  population INTEGER,
  rate_per_100k NUMERIC(10, 2),
  mapping_confidence mapping_confidence NOT NULL DEFAULT 'district',
  raw_row JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source, report_year, state_name, district_name, city_name, crime_category)
);

CREATE TABLE IF NOT EXISTS public.crime_city_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  report_year INTEGER NOT NULL,
  violent_crime_count INTEGER NOT NULL DEFAULT 0,
  crimes_against_women_count INTEGER NOT NULL DEFAULT 0,
  assault_count INTEGER NOT NULL DEFAULT 0,
  robbery_count INTEGER NOT NULL DEFAULT 0,
  theft_count INTEGER NOT NULL DEFAULT 0,
  total_weighted_crimes NUMERIC(12, 2) NOT NULL DEFAULT 0,
  crime_index INTEGER NOT NULL CHECK (crime_index BETWEEN 0 AND 100),
  risk_label crime_risk_label NOT NULL,
  mapping_confidence mapping_confidence NOT NULL,
  data_source TEXT NOT NULL,
  source_url TEXT,
  notes TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (city_id, report_year)
);

CREATE INDEX IF NOT EXISTS idx_crime_stats_city ON public.crime_statistics(city_id);
CREATE INDEX IF NOT EXISTS idx_crime_stats_year ON public.crime_statistics(report_year);
CREATE INDEX IF NOT EXISTS idx_crime_stats_category ON public.crime_statistics(crime_category);
CREATE INDEX IF NOT EXISTS idx_crime_city_scores_city ON public.crime_city_scores(city_id);
CREATE INDEX IF NOT EXISTS idx_crime_datasets_status ON public.crime_datasets(status);

-- RLS: public read for scores (route safety), write via service role only
ALTER TABLE public.crime_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crime_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crime_city_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crime_datasets_read" ON public.crime_datasets FOR SELECT USING (true);
CREATE POLICY "crime_statistics_read" ON public.crime_statistics FOR SELECT USING (true);
CREATE POLICY "crime_city_scores_read" ON public.crime_city_scores FOR SELECT USING (true);

-- Authenticated users can read; inserts/updates via service role in pipeline scripts
CREATE POLICY "crime_datasets_service" ON public.crime_datasets FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "crime_statistics_service" ON public.crime_statistics FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "crime_city_scores_service" ON public.crime_city_scores FOR ALL
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.crime_datasets IS 'Registry of downloaded government crime datasets (NCRB, Data.gov.in)';
COMMENT ON TABLE public.crime_statistics IS 'Normalized district/city crime statistics from official sources';
COMMENT ON TABLE public.crime_city_scores IS 'Computed 0-100 crime safety index per Safar city';
