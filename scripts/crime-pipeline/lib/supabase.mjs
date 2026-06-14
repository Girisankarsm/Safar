import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY for pipeline import."
    );
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

export async function upsertDataset(supabase, dataset) {
  const { data, error } = await supabase
    .from("crime_datasets")
    .insert(dataset)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function importStatistics(supabase, rows, datasetId) {
  const payload = rows.map((r) => ({
    dataset_id: datasetId,
    source: r.source,
    report_year: r.report_year,
    state_name: r.state_name,
    district_name: r.district_name,
    city_name: r.city_name,
    city_id: r.city_id,
    crime_category: r.crime_category,
    crime_count: r.crime_count,
    mapping_confidence: r.mapping_confidence,
    raw_row: r.raw_row ?? null,
  }));

  const { error } = await supabase.from("crime_statistics").upsert(payload, {
    onConflict: "source,report_year,state_name,district_name,city_name,crime_category",
  });
  if (error) throw error;
  return payload.length;
}

export async function importCityScores(supabase, scores) {
  const payload = scores.map((s) => ({
    ...s,
    source_url: "https://ncrb.gov.in",
    notes: `Computed by Safar crime pipeline. Weighted index from official NCRB categories.`,
    computed_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("crime_city_scores").upsert(payload, {
    onConflict: "city_id,report_year",
  });
  if (error) throw error;
  return payload.length;
}

export async function fetchPipelineStatus(supabase) {
  const [datasets, stats, scores] = await Promise.all([
    supabase.from("crime_datasets").select("*").order("created_at", { ascending: false }).limit(20),
    supabase.from("crime_statistics").select("id", { count: "exact", head: true }),
    supabase.from("crime_city_scores").select("*").order("crime_index", { ascending: false }),
  ]);

  return {
    datasets: datasets.data ?? [],
    statisticsCount: stats.count ?? 0,
    cityScores: scores.data ?? [],
    errors: [datasets.error, stats.error, scores.error].filter(Boolean),
  };
}
