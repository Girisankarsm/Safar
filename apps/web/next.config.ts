import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";
import path from "path";

// Load shared repo-root .env so Supabase keys are entered once.
const appRoot = path.resolve(__dirname);
const repoRoot = path.resolve(__dirname, "../..");
loadEnvConfig(repoRoot);

const nextConfig: NextConfig = {
  // npm workspaces hoist deps to repo root — Turbopack must resolve from there
  turbopack: {
    root: repoRoot,
  },
  outputFileTracingRoot: repoRoot,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "",
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
  },
};

export default nextConfig;
