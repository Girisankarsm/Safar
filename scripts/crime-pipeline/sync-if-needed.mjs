#!/usr/bin/env node
/**
 * Runs before `npm run dev` — imports NCRB seed when service role key is set
 * and Supabase crime tables are empty or stale (>7 days).
 * Without service role key, the web app auto-seeds via Supabase RPC on startup.
 */
import { loadProjectEnv } from "./lib/load-env.mjs";
import { fetchPipelineStatus, getSupabaseAdmin } from "./lib/supabase.mjs";

loadProjectEnv();

const STALE_MS = 7 * 24 * 60 * 60 * 1000;

async function main() {
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const hasUrl = Boolean(process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL);

  if (!hasUrl) {
    console.log("[crime-sync] No Supabase URL in .env.local — skipping pipeline pre-sync.");
    return;
  }

  if (!hasServiceKey) {
    console.log(
      "[crime-sync] No SUPABASE_SERVICE_ROLE_KEY — pipeline import skipped.\n" +
        "           NCRB data will auto-sync via Supabase RPC when the app starts.\n" +
        "           (Run migration 20240615000008_crime_seed_rpc.sql in Supabase SQL Editor.)"
    );
    return;
  }

  try {
    const supabase = getSupabaseAdmin();
    const status = await fetchPipelineStatus(supabase);
    const scores = status.cityScores ?? [];
    const newest = scores.reduce((max, s) => {
      const t = new Date(s.computed_at ?? 0).getTime();
      return t > max ? t : max;
    }, 0);
    const stale = !newest || Date.now() - newest > STALE_MS;
    const incomplete = scores.length < 3;

    if (!incomplete && !stale) {
      console.log(`[crime-sync] Crime data up to date (${scores.length} cities).`);
      return;
    }

    console.log(
      `[crime-sync] Importing NCRB seed (${incomplete ? "tables incomplete" : "data stale"})...`
    );
    const { spawnSync } = await import("node:child_process");
    const { REPO_ROOT } = await import("./lib/load-env.mjs");
    const result = spawnSync("node", ["scripts/crime-pipeline/run-pipeline.mjs"], {
      cwd: REPO_ROOT,
      stdio: "inherit",
      env: process.env,
    });
    if (result.status !== 0) {
      console.warn("[crime-sync] Pipeline import failed — app will try RPC seed on startup.");
    }
  } catch (err) {
    console.warn("[crime-sync] Pre-sync skipped:", err.message);
  }
}

main();
