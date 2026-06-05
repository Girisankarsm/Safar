import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const apiDir = path.join(root, "apps", "api");
const venvPython = path.join(apiDir, "venv", "bin", "python");
const python = fs.existsSync(venvPython) ? venvPython : "python3";
const prod = process.argv.includes("--prod");
const healthUrl = "http://127.0.0.1:8000/health";

async function backendHealthy() {
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

function keepAlive() {
  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
  setInterval(() => {}, 1 << 30);
}

const args = ["-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000"];
if (!prod) args.push("--reload");

if (!prod && (await backendHealthy())) {
  console.log(`✓ API already running at ${healthUrl} — reusing existing process`);
  keepAlive();
} else {
  console.log(`▶ API: ${python} ${args.join(" ")} (cwd: apps/api/)`);

  const child = spawn(python, args, {
    cwd: apiDir,
    stdio: "inherit",
    env: { ...process.env },
  });

  child.on("exit", (code) => process.exit(code ?? 1));
}
