#!/usr/bin/env node
/**
 * Safar Crime Data Pipeline — full ingestion orchestrator
 *
 * Usage:
 *   node scripts/crime-pipeline/run-pipeline.mjs [--seed-only] [--dry-run]
 *
 * Env:
 *   SUPABASE_URL or VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProjectEnv } from "./lib/load-env.mjs";
import { OFFICIAL_SOURCES, PATHS, SEED_CSV } from "./config.mjs";
import { parseCsv, validateRows } from "./lib/clean.mjs";
import { detectFileType, ensureDir, logEvent } from "./lib/download.mjs";
import { aggregateCityScores } from "./lib/score.mjs";
import {
  getSupabaseAdmin,
  importCityScores,
  importStatistics,
  upsertDataset,
} from "./lib/supabase.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const LOG_PATH = path.join(ROOT, PATHS.logs, "pipeline.jsonl");

const args = new Set(process.argv.slice(2));
const seedOnly = args.has("--seed-only");
const dryRun = args.has("--dry-run");

loadProjectEnv();

async function main() {
  ensureDir(path.join(ROOT, PATHS.raw));
  ensureDir(path.join(ROOT, PATHS.cleaned));
  ensureDir(path.join(ROOT, PATHS.logs));

  console.log("Safar Crime Data Pipeline");
  console.log("=========================");
  console.log(`Mode: ${seedOnly ? "seed-only" : "full"} | dry-run: ${dryRun}`);
  console.log("Official sources registered:", OFFICIAL_SOURCES.length);

  const seedPath = path.join(ROOT, SEED_CSV);
  if (!fs.existsSync(seedPath)) {
    console.error("Seed CSV not found:", seedPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(seedPath, "utf8");
  const cleanedPath = path.join(ROOT, PATHS.cleaned, "ncrb_metropolitan_cities_2022.csv");
  fs.writeFileSync(cleanedPath, raw);

  logEvent(LOG_PATH, { action: "clean_complete", file: cleanedPath, source: "seed" });

  const rows = parseCsv(raw);
  const validation = validateRows(rows);

  console.log(`Parsed ${rows.length} rows, ${validation.mapped.length} mapped to Safar cities`);
  if (validation.errors.length) {
    console.warn("Validation warnings:", validation.errors.slice(0, 5).join("; "));
  }

  const cityScores = aggregateCityScores(validation.mapped);
  console.log("\nComputed city scores:");
  for (const s of cityScores) {
    console.log(`  ${s.city_id}: index=${s.crime_index} risk=${s.risk_label} confidence=${s.mapping_confidence}`);
  }

  if (dryRun) {
    console.log("\nDry run complete — no Supabase writes.");
    return;
  }

  const supabase = getSupabaseAdmin();

  const dataset = await upsertDataset(supabase, {
    source_name: "NCRB Crime in India 2022 — Metropolitan Cities (pipeline import)",
    source_url: OFFICIAL_SOURCES[0].url,
    source_agency: "NCRB",
    file_name: path.basename(seedPath),
    file_type: detectFileType(seedPath),
    report_year: 2022,
    downloaded_at: new Date().toISOString(),
    imported_at: new Date().toISOString(),
    row_count: validation.mapped.length,
    status: "imported",
    metadata: { pipeline: "run-pipeline.mjs", sources: OFFICIAL_SOURCES.map((s) => s.id) },
  });

  const statCount = await importStatistics(supabase, validation.mapped, dataset.id);
  const scoreCount = await importCityScores(supabase, cityScores);

  logEvent(LOG_PATH, {
    action: "import_complete",
    datasetId: dataset.id,
    statistics: statCount,
    cityScores: scoreCount,
  });

  console.log(`\nImported ${statCount} statistics and ${scoreCount} city scores to Supabase.`);
  console.log("Log:", LOG_PATH);
}

main().catch((err) => {
  logEvent(LOG_PATH, { action: "pipeline_failed", error: err.message });
  console.error("Pipeline failed:", err.message);
  process.exit(1);
});
