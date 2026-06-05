import { spawn } from "child_process";
import fs from "fs";
import net from "net";
import path from "path";

function loadRootEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return {};
  const vars = {};
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    vars[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return vars;
}

const root = process.cwd();
const webDir = path.join(root, "apps", "web");
const devUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";
const devPort = Number(new URL(devUrl).port || 3000);
const lockPath = path.join(webDir, ".next/dev/lock");

function portInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(true));
    server.once("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port, "127.0.0.1");
  });
}

function pidAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function cleanStaleNextLock() {
  if (!fs.existsSync(lockPath)) return;
  try {
    const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    if (!pidAlive(lock.pid)) {
      fs.unlinkSync(lockPath);
      console.log("✓ Removed stale Next.js dev lock");
    }
  } catch {
    try {
      fs.unlinkSync(lockPath);
    } catch {
      // ignore
    }
  }
}

async function frontendHealthy() {
  try {
    const res = await fetch(devUrl, { signal: AbortSignal.timeout(2000) });
    return res.status < 500;
  } catch {
    return false;
  }
}

function keepAlive() {
  process.on("SIGINT", () => process.exit(0));
  process.on("SIGTERM", () => process.exit(0));
  setInterval(() => {}, 1 << 30);
}

cleanStaleNextLock();

if ((await portInUse(devPort)) || (await frontendHealthy())) {
  console.log(`✓ Web app already running on port ${devPort} — reusing existing process`);
  keepAlive();
} else {
  console.log(`▶ Web: npm run dev (cwd: apps/web/)`);

  const child = spawn("npm", ["run", "dev"], {
    cwd: webDir,
    stdio: "inherit",
    env: { ...process.env, ...loadRootEnv() },
  });

  child.on("exit", (code) => process.exit(code ?? 1));
}
