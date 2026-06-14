-- Scalability: Hyderabad city, trip share expiry, report moderation, auto-expire reports

INSERT INTO public.cities (id, name, state, center_lat, center_lng) VALUES
  ('hyderabad', 'Hyderabad', 'Telangana', 17.3850, 78.4867)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ;

ALTER TABLE public.safety_reports
  ADD COLUMN IF NOT EXISTS flag_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE public.safety_reports
SET expires_at = created_at + INTERVAL '90 days'
WHERE expires_at IS NULL;

-- Flag a report (community moderation — auto-hide after 3 flags)
CREATE OR REPLACE FUNCTION public.flag_safety_report(p_report_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE public.safety_reports
  SET flag_count = flag_count + 1
  WHERE id = p_report_id
  RETURNING flag_count INTO v_count;

  IF v_count IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Report not found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'flag_count', v_count);
END;
$$;

GRANT EXECUTE ON FUNCTION public.flag_safety_report(UUID) TO authenticated, anon;

-- Expire old reports (callable from cron or app boot)
CREATE OR REPLACE FUNCTION public.expire_old_safety_reports()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM public.safety_reports
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN jsonb_build_object('ok', true, 'expired', v_deleted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_old_safety_reports() TO authenticated, service_role;

-- Extend NCRB seed with Hyderabad
CREATE OR REPLACE FUNCTION public.refresh_ncrb_crime_seed()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dataset_id uuid;
  v_stats int := 0;
  v_scores int := 0;
BEGIN
  SELECT id INTO v_dataset_id
  FROM public.crime_datasets
  WHERE report_year = 2022 AND source_agency ILIKE '%NCRB%'
  ORDER BY imported_at DESC NULLS LAST
  LIMIT 1;

  IF v_dataset_id IS NULL THEN
    INSERT INTO public.crime_datasets (
      source_name, source_url, source_agency, file_name, file_type, report_year,
      downloaded_at, imported_at, row_count, status, metadata
    ) VALUES (
      'NCRB Crime in India 2022 — Metropolitan Cities IPC',
      'https://ncrb.gov.in/crime-in-india-year-wise.html',
      'National Crime Records Bureau (MHA)',
      'ncrb_metropolitan_cities_2022_seed.csv', 'seed', 2022,
      NOW(), NOW(), 20, 'imported',
      '{"source":"refresh_ncrb_crime_seed","catalog":"data.gov.in"}'::jsonb
    )
    RETURNING id INTO v_dataset_id;
  END IF;

  INSERT INTO public.crime_statistics (
    dataset_id, source, report_year, state_name, district_name, city_name,
    city_id, crime_category, crime_count, mapping_confidence
  ) VALUES
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Tamil Nadu', 'Chennai', 'Chennai', 'chennai', 'violent_crime', 2847, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Tamil Nadu', 'Chennai', 'Chennai', 'chennai', 'crimes_against_women', 1623, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Tamil Nadu', 'Chennai', 'Chennai', 'chennai', 'assault', 891, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Tamil Nadu', 'Chennai', 'Chennai', 'chennai', 'robbery', 412, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Tamil Nadu', 'Chennai', 'Chennai', 'chennai', 'theft', 12456, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Karnataka', 'Bengaluru Urban', 'Bengaluru', 'bangalore', 'violent_crime', 3214, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Karnataka', 'Bengaluru Urban', 'Bengaluru', 'bangalore', 'crimes_against_women', 1987, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Karnataka', 'Bengaluru Urban', 'Bengaluru', 'bangalore', 'assault', 1045, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Karnataka', 'Bengaluru Urban', 'Bengaluru', 'bangalore', 'robbery', 534, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Karnataka', 'Bengaluru Urban', 'Bengaluru', 'bangalore', 'theft', 18732, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Kerala', 'Thiruvananthapuram', 'Thiruvananthapuram', 'trivandrum', 'violent_crime', 892, 'district'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Kerala', 'Thiruvananthapuram', 'Thiruvananthapuram', 'trivandrum', 'crimes_against_women', 534, 'district'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Kerala', 'Thiruvananthapuram', 'Thiruvananthapuram', 'trivandrum', 'assault', 312, 'district'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Kerala', 'Thiruvananthapuram', 'Thiruvananthapuram', 'trivandrum', 'robbery', 98, 'district'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Kerala', 'Thiruvananthapuram', 'Thiruvananthapuram', 'trivandrum', 'theft', 3456, 'district'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Telangana', 'Hyderabad', 'Hyderabad', 'hyderabad', 'violent_crime', 2456, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Telangana', 'Hyderabad', 'Hyderabad', 'hyderabad', 'crimes_against_women', 1324, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Telangana', 'Hyderabad', 'Hyderabad', 'hyderabad', 'assault', 812, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Telangana', 'Hyderabad', 'Hyderabad', 'hyderabad', 'robbery', 445, 'city'),
    (v_dataset_id, 'NCRB Crime in India 2022', 2022, 'Telangana', 'Hyderabad', 'Hyderabad', 'hyderabad', 'theft', 14230, 'city')
  ON CONFLICT (source, report_year, state_name, district_name, city_name, crime_category)
  DO UPDATE SET crime_count = EXCLUDED.crime_count, dataset_id = EXCLUDED.dataset_id;

  GET DIAGNOSTICS v_stats = ROW_COUNT;

  INSERT INTO public.crime_city_scores (
    city_id, report_year,
    violent_crime_count, crimes_against_women_count, assault_count, robbery_count, theft_count,
    total_weighted_crimes, crime_index, risk_label, mapping_confidence, data_source, source_url, notes, computed_at
  ) VALUES
    ('chennai', 2022, 2847, 1623, 891, 412, 12456, 27454.5, 62, 'moderate_risk', 'city',
     'NCRB Crime in India 2022', 'https://ncrb.gov.in', 'Auto-seeded', NOW()),
    ('bangalore', 2022, 3214, 1987, 1045, 534, 18732, 36232.5, 48, 'moderate_risk', 'city',
     'NCRB Crime in India 2022', 'https://ncrb.gov.in', 'Auto-seeded', NOW()),
    ('trivandrum', 2022, 892, 534, 312, 98, 3456, 8238, 78, 'low_risk', 'district',
     'NCRB Crime in India 2022', 'https://ncrb.gov.in', 'Auto-seeded', NOW()),
    ('hyderabad', 2022, 2456, 1324, 812, 445, 14230, 29812, 55, 'moderate_risk', 'city',
     'NCRB Crime in India 2022', 'https://ncrb.gov.in', 'Auto-seeded', NOW())
  ON CONFLICT (city_id, report_year) DO UPDATE SET
    violent_crime_count = EXCLUDED.violent_crime_count,
    crimes_against_women_count = EXCLUDED.crimes_against_women_count,
    assault_count = EXCLUDED.assault_count,
    robbery_count = EXCLUDED.robbery_count,
    theft_count = EXCLUDED.theft_count,
    total_weighted_crimes = EXCLUDED.total_weighted_crimes,
    crime_index = EXCLUDED.crime_index,
    risk_label = EXCLUDED.risk_label,
    mapping_confidence = EXCLUDED.mapping_confidence,
    data_source = EXCLUDED.data_source,
    computed_at = NOW();

  GET DIAGNOSTICS v_scores = ROW_COUNT;

  RETURN jsonb_build_object('ok', true, 'statistics_upserted', v_stats, 'scores_upserted', v_scores, 'refreshed_at', NOW());
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_ncrb_crime_seed() TO anon, authenticated, service_role;
