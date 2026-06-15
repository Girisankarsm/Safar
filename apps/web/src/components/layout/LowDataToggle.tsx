import { useI18n } from "@/i18n/use-i18n";
import { useSettingsStore } from "@/stores/settings.store";
import { WifiOff } from "lucide-react";

export function LowDataToggle({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { lowDataMode, setLowDataMode } = useSettingsStore();

  if (compact) {
    return (
      <label
        className="flex cursor-pointer items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2 py-1"
        title={t("settings.lowData")}
      >
        <WifiOff className={`h-3 w-3 ${lowDataMode ? "text-[#3B82F6]" : "text-[#71717A]"}`} />
        <input
          type="checkbox"
          checked={lowDataMode}
          onChange={(e) => setLowDataMode(e.target.checked)}
          className="h-3 w-3 rounded accent-[#3B82F6]"
        />
      </label>
    );
  }

  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[#A1A1AA]">
      <WifiOff className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{t("settings.lowData")}</span>
      <input
        type="checkbox"
        checked={lowDataMode}
        onChange={(e) => setLowDataMode(e.target.checked)}
        className="h-3.5 w-3.5 rounded accent-[#3B82F6]"
      />
    </label>
  );
}
