import { useSettingsStore } from "@/stores/settings.store";
import { WifiOff } from "lucide-react";

export function LowDataToggle() {
  const { lowDataMode, setLowDataMode } = useSettingsStore();

  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 text-xs font-semibold text-[#A1A1AA]">
      <WifiOff className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Low-data</span>
      <input
        type="checkbox"
        checked={lowDataMode}
        onChange={(e) => setLowDataMode(e.target.checked)}
        className="h-3.5 w-3.5 rounded accent-[#3B82F6]"
      />
    </label>
  );
}
