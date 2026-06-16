import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/* ── Capture the prompt at module level so we never miss the early event ── */
let _deferredPrompt: BeforeInstallPromptEvent | null = null;
let _listeners: Array<(e: BeforeInstallPromptEvent | null) => void> = [];

function subscribe(fn: (e: BeforeInstallPromptEvent | null) => void) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter((l) => l !== fn); };
}

function notifyAll(e: BeforeInstallPromptEvent | null) {
  _deferredPrompt = e;
  _listeners.forEach((fn) => fn(e));
}

// Attach once at module-load time — fires before React mounts
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    notifyAll(e as BeforeInstallPromptEvent);
  });
  window.addEventListener("appinstalled", () => {
    markInstalled();
    notifyAll(null);
  });
}

const INSTALLED_KEY = "safar-pwa-installed";

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

function wasInstalled() {
  try { return localStorage.getItem(INSTALLED_KEY) === "1"; } catch { return false; }
}

function markInstalled() {
  try { localStorage.setItem(INSTALLED_KEY, "1"); } catch { /* ignore */ }
}

export function PWAInstallButton() {
  const alreadyDone = isStandalone() || wasInstalled();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(
    alreadyDone ? null : _deferredPrompt
  );
  const [hidden, setHidden] = useState(alreadyDone);

  useEffect(() => {
    if (alreadyDone) return;
    // In case the event fires after mount, or we missed it — pick up current value
    if (_deferredPrompt) setPrompt(_deferredPrompt);
    return subscribe((e) => setPrompt(e));
  }, [alreadyDone]);

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      markInstalled();
      setHidden(true);
      setPrompt(null);
      notifyAll(null);
    }
  }

  if (hidden || !prompt) return null;

  return (
    <AnimatePresence>
      <motion.button
        key="pwa-install"
        type="button"
        onClick={handleInstall}
        initial={{ opacity: 0, scale: 0.88, x: 6 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.88, x: 6 }}
        transition={{ duration: 0.22 }}
        title="Install Safar on your device"
        className="flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1.5 text-[11px] font-semibold text-[var(--text-muted)] transition hover:border-[#3B82F6]/40 hover:text-[#93C5FD] active:scale-95"
      >
        <Download className="h-3 w-3 shrink-0" />
        <span className="hidden sm:inline text-[11px]">Install</span>
      </motion.button>
    </AnimatePresence>
  );
}
