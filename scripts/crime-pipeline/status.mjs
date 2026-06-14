#!/usr/bin/env node
/**
 * Import status dashboard (CLI)
 * Usage: node scripts/crime-pipeline/status.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadProjectEnv } from "./lib/load-env.mjs";
import { OFFICIAL_SOURCES, PATHS } from "./config.mjs";
import { readJsonLog } from "./lib/download.mjs";
import { riskLabelHuman } from "./lib/score.mjs";
import { fetchPipelineStatus, getSupabaseAdmin } from "./lib/supabase.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

loadProjectEnv();

async function main() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║       Safar Crime Data — Import Status           ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  console.log("Official Sources:");
  for (const s of OFFICIAL_SOURCES) {
    console.log(`  • ${s.name} (${s.agency})`);
    console.log(`    ${s.url}`);
  }
  console.log("");

  try {
    const supabase = getSupabaseAdmin();
    const status = await fetchPipelineStatus(supabase);

    console.log("Supabase Datasets:");
    if (!status.datasets.length) {
      console.log("  (none — run seed_crime.sql or run-pipeline.mjs)");
    } else {
      for (const d of status.datasets) {
        console.log(`  [${d.status}] ${d.source_name} (${d.report_year}) — ${d.row_count} rows`);
        if (d.error_log) console.log(`    Error: ${d.error_log}`);
      }
    }

    console.log(`\nStatistics rows: ${status.statisticsCount}`);

    console.log("\nCity Crime Index:");
    if (!status.cityScores.length) {
      console.log("  (none imported)");
    } else {
      for (const s of status.cityScores) {
        console.log(
          `  ${s.city_id}: ${s.crime_index}/100 (${riskLabelHuman(s.risk_label)}) [${s.mapping_confidence}] year=${s.report_year}`
        );
      }
    }
  } catch (err) {
    console.log("Supabase: unavailable —", err.message);
    console.log("Run migration 20240615000006_crime_data.sql and seed_crime.sql in SQL Editor.");
  }

  const pipelineLog = path.join(ROOT, PATHS.logs, "pipeline.jsonl");
  const events = readJsonLog(pipelineLog);
  if (events.length) {
    console.log(`\nRecent pipeline events (${events.length}):`);
    for (const e of events.slice(-5)) {
      console.log(`  ${e.ts} — ${e.action}${e.error ? `: ${e.error}` : ""}`);
    }
  }

  console.log("\nCommands:");
  console.log("  node scripts/crime-pipeline/refresh-datasets.mjs");
  console.log("  node scripts/crime-pipeline/run-pipeline.mjs");
  console.log("  node scripts/crime-pipeline/run-pipeline.mjs --dry-run");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
