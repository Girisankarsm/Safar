import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useI18n } from "@/i18n/use-i18n";

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await deferred.prompt();
        setDeferred(null);
      }}
      className="fixed bottom-20 right-4 z-[600] flex items-center gap-2 rounded-xl bg-[#3B82F6] px-4 py-2.5 text-xs font-bold text-white shadow-lg lg:bottom-6"
    >
      <Download className="h-4 w-4" />
      {t("common.install")}
    </button>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
