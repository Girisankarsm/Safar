#!/usr/bin/env node
/**
 * Dataset refresh — attempts official downloads, falls back to seed on failure.
 * Usage: node scripts/crime-pipeline/refresh-datasets.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OFFICIAL_SOURCES, PATHS } from "./config.mjs";
import { downloadFile, ensureDir, logEvent } from "./lib/download.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const LOG_PATH = path.join(ROOT, PATHS.logs, "refresh.jsonl");

async function main() {
  ensureDir(path.join(ROOT, PATHS.raw));
  console.log("Safar Crime Dataset Refresh");
  console.log("Attempting official government source downloads...\n");

  const results = [];

  for (const source of OFFICIAL_SOURCES) {
    const dest = path.join(ROOT, PATHS.raw, `${source.id}-catalog.html`);
    console.log(`Source: ${source.name}`);
    console.log(`  Agency: ${source.agency}`);
    console.log(`  URL: ${source.url}`);

    const result = await downloadFile(source.url, dest, LOG_PATH);
    results.push({ source: source.id, ...result });

    if (result.ok) {
      console.log(`  Downloaded ${result.bytes} bytes → ${result.destPath}`);
      console.log(`  Note: NCRB/Data.gov.in often serve HTML catalog pages; place XLSX/CSV manually in data/crime/raw/`);
    } else {
      console.log(`  Skipped: ${result.error}`);
      console.log(`  Fallback: use seed CSV at data/crime/seed/`);
    }
    console.log("");
  }

  logEvent(LOG_PATH, { action: "refresh_complete", results });
  console.log("Refresh log:", LOG_PATH);
  console.log("Run import: node scripts/crime-pipeline/run-pipeline.mjs");
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
