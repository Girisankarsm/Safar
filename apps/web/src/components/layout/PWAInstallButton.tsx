import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari PWA
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export function PWAInstallButton({ compact }: { compact?: boolean }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    if (isStandalone()) return; // already running as installed app

    function onBefore(e: Event) {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
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
      setInstalled(true);
      setPrompt(null);
    }
  }

  // Don't render if already installed or no prompt available
  if (installed || !prompt) return null;

  return (
    <AnimatePresence>
      <motion.button
        key="pwa-install"
        type="button"
        onClick={handleInstall}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.25 }}
        title="Install Safar app"
        className="flex items-center gap-1.5 rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-2 py-1.5 text-[11px] font-semibold text-[#93C5FD] transition hover:bg-[#3B82F6]/20 hover:text-white active:scale-95"
      >
        <Download className="h-3.5 w-3.5 shrink-0" />
        {!compact && <span>Install</span>}
      </motion.button>
    </AnimatePresence>
  );
}
