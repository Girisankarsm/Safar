import fs from "node:fs";
import path from "node:path";

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function logEvent(logPath, event) {
  ensureDir(path.dirname(logPath));
  const line = JSON.stringify({ ...event, ts: new Date().toISOString() }) + "\n";
  fs.appendFileSync(logPath, line, "utf8");
}

export function readJsonLog(logPath) {
  if (!fs.existsSync(logPath)) return [];
  return fs
    .readFileSync(logPath, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export function detectFileType(fileName) {
  const ext = path.extname(fileName).toLowerCase().replace(".", "");
  if (["csv", "xlsx", "xls", "json", "zip"].includes(ext)) return ext;
  return "unknown";
}

export async function downloadFile(url, destPath, logPath) {
  ensureDir(path.dirname(destPath));
  logEvent(logPath, { action: "download_start", url, destPath });

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Safar-Crime-Pipeline/1.0 (government open data)" },
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for ${url}`);
    }

    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);
    logEvent(logPath, { action: "download_ok", url, destPath, bytes: buf.length });
    return { ok: true, bytes: buf.length, destPath };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logEvent(logPath, { action: "download_failed", url, error: message });
    return { ok: false, error: message };
  }
}
