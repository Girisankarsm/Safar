import fs from "fs";
import path from "path";

const root = process.cwd();
const envPath = path.join(root, ".env");
const examplePath = path.join(root, ".env.example");
const webEnvLocal = path.join(root, "apps", "web", ".env.local");

if (!fs.existsSync(envPath)) {
  console.error("\n❌ Missing .env in project root.");
  console.error(`   Copy ${examplePath} → ${envPath} and add your Supabase credentials.\n`);
  process.exit(1);
}

const env = fs.readFileSync(envPath, "utf8");
const required = ["DATABASE_URL", "USE_DATABASE=true", "NEXT_PUBLIC_API_URL"];
const missing = required.filter((key) => !env.includes(key.split("=")[0]));

if (missing.length) {
  console.warn(`⚠️  .env may be incomplete. Expected: ${missing.join(", ")}`);
}

function readEnvMap(text) {
  const map = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    map[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return map;
}

const vars = readEnvMap(env);
const publicVars = {
  NEXT_PUBLIC_API_URL: vars.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: vars.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_MAPBOX_TOKEN: vars.NEXT_PUBLIC_MAPBOX_TOKEN,
};

const publicLines = Object.entries(publicVars)
  .filter(([, value]) => value)
  .map(([key, value]) => `${key}=${value}`);

if (publicLines.length) {
  const header = "# Auto-generated from repo root .env — do not edit manually\n";
  fs.writeFileSync(webEnvLocal, header + publicLines.join("\n") + "\n");
  console.log(`✓ Synced ${publicLines.length} public env vars → apps/web/.env.local`);
}

const mapbox = vars.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!mapbox?.startsWith("pk.")) {
  console.warn("⚠️  NEXT_PUBLIC_MAPBOX_TOKEN missing or invalid — maps will use Carto fallback");
}

console.log("✓ Using root .env for backend + frontend");
