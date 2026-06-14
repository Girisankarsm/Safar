import { ChevronDown, Layers } from "lucide-react";
import type { ReportType } from "@/types/database";

export type MapLayers = {
  heatmap: boolean;
  reports: boolean;
  safeZones: boolean;
};

export type TimeFilter = "all" | "24h" | "7d" | "30d";

type Props = {
  layers: MapLayers;
  onLayersChange: (layers: MapLayers) => void;
  categoryFilter: ReportType | "all";
  onCategoryChange: (v: ReportType | "all") => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (v: TimeFilter) => void;
  categories: { id: ReportType | "all"; label: string }[];
};

export function SafetyMapControls({
  layers,
  onLayersChange,
  categoryFilter,
  onCategoryChange,
  timeFilter,
  onTimeFilterChange,
  categories,
}: Props) {
  function toggle(key: keyof MapLayers) {
    onLayersChange({ ...layers, [key]: !layers[key] });
  }

  return (
    <div className="pointer-events-none absolute right-3 top-3 z-[1000] w-52 space-y-2">
      <div className="pointer-events-auto rounded-xl border border-[#262626]/80 bg-[#111111]/95 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
          <Layers className="h-3 w-3" /> Map Layers
        </p>
        {(
          [
            ["heatmap", "Heatmap"],
            ["reports", "Reports"],
            ["safeZones", "Safe Zones"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex cursor-pointer items-center justify-between py-1.5 text-xs text-white">
            <span>{label}</span>
            <input
              type="checkbox"
              checked={layers[key]}
              onChange={() => toggle(key)}
              className="h-4 w-4 rounded accent-[#3B82F6]"
            />
          </label>
        ))}
      </div>

      <div className="pointer-events-auto rounded-xl border border-[#262626]/80 bg-[#111111]/95 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Filter Reports</p>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value as ReportType | "all")}
            className="w-full appearance-none rounded-lg border border-[#262626] bg-[#0a0a0c] py-2 pl-3 pr-8 text-xs text-white outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
        </div>
      </div>

      <div className="pointer-events-auto rounded-xl border border-[#262626]/80 bg-[#111111]/95 p-3 shadow-xl backdrop-blur-md">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">Time</p>
        <div className="relative">
          <select
            value={timeFilter}
            onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)}
            className="w-full appearance-none rounded-lg border border-[#262626] bg-[#0a0a0c] py-2 pl-3 pr-8 text-xs text-white outline-none"
          >
            <option value="all">All Time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#71717A]" />
        </div>
      </div>
    </div>
  );
}
