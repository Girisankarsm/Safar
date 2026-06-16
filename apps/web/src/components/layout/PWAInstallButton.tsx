import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const INSTALLED_KEY = "safar-pwa-installed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

function wasInstalled() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

function markInstalled() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch { /* ignore */ }
}

export function PWAInstallButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(() => isStandalone() || wasInstalled());

  useEffect(() => {
    // Already installed — never show again
    if (isStandalone() || wasInstalled()) return;

    function onBefore(e: Event) {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      markInstalled();
      setHidden(true);
      setPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", onBefore);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBefore);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      markInstalled();
      setHidden(true);
      setPrompt(null);
    }
  }

  // Hide if already installed or no browser install prompt available
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
        className="flex items-center gap-1.5 rounded-lg border border-[#3B82F6]/35 bg-[#3B82F6]/12 px-2.5 py-1.5 text-[11px] font-bold text-[#93C5FD] shadow-sm shadow-[#3B82F6]/10 transition hover:bg-[#3B82F6]/22 hover:text-white active:scale-95"
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Install</span>
      </motion.button>
    </AnimatePresence>
  );
}
