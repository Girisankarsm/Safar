import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Layers, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReportType } from "@/types/database";

export type MapLayers = {
  heatmap: boolean;
  reports: boolean;
  safeZones: boolean;
  wellLit: boolean;
  womenSafe: boolean;
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

const LAYER_DEFS = [
  { key: "heatmap",   label: "Heatmap",        color: "#F97316" },
  { key: "reports",   label: "Reports",         color: "#3B82F6" },
  { key: "safeZones", label: "Safe Zones",      color: "#22C55E" },
  { key: "wellLit",   label: "Well-lit zones",  color: "#EAB308" },
  { key: "womenSafe", label: "Women-safe",      color: "#A855F7" },
] as const;

function Toggle({
  checked,
  onChange,
  color,
}: {
  checked: boolean;
  onChange: () => void;
  color: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
      style={{ backgroundColor: checked ? color : "#3F3F46" }}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </button>
  );
}

export function SafetyMapControls({
  layers,
  onLayersChange,
  categoryFilter,
  onCategoryChange,
  timeFilter,
  onTimeFilterChange,
  categories,
}: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeCount = Object.values(layers).filter(Boolean).length;

  function toggle(key: keyof MapLayers) {
    onLayersChange({ ...layers, [key]: !layers[key] });
  }

  // close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div
      ref={panelRef}
      className="pointer-events-none absolute right-3 top-3 z-[1000] flex flex-col items-end gap-2"
    >
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#262626]/80 bg-[#111111]/95 text-white shadow-xl backdrop-blur-md transition hover:bg-[#1a1a1a] focus:outline-none"
        aria-label="Map layers"
        title="Map layers"
      >
        <Layers className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        {/* Active badge */}
        {activeCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#3B82F6] text-[9px] font-bold text-white leading-none">
            {activeCount}
          </span>
        )}
      </button>

      {/* Expandable panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto w-52 origin-top-right overflow-hidden rounded-xl border border-[#262626]/80 bg-[#111111]/98 shadow-2xl backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#262626]/60 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
                <Layers style={{ width: 11, height: 11 }} />
                Map Layers
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-0.5 text-[#71717A] hover:text-white transition"
                aria-label="Close"
              >
                <X style={{ width: 13, height: 13 }} />
              </button>
            </div>

            {/* Layer toggles */}
            <div className="px-3 py-2 space-y-0.5">
              {LAYER_DEFS.map(({ key, label, color }) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ backgroundColor: layers[key] ? color : "#3F3F46" }}
                    />
                    <span className="text-xs text-white">{label}</span>
                  </div>
                  <Toggle
                    checked={layers[key]}
                    onChange={() => toggle(key)}
                    color={color}
                  />
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="mx-3 border-t border-[#262626]/60" />

            {/* Filters */}
            <div className="px-3 py-2.5 space-y-2">
              {/* Category */}
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#71717A]">
                  Category
                </p>
                <div className="relative">
                  <select
                    value={categoryFilter}
                    onChange={(e) => onCategoryChange(e.target.value as ReportType | "all")}
                    className="w-full appearance-none rounded-lg border border-[#262626] bg-[#0a0a0c] py-1.5 pl-2.5 pr-7 text-xs text-white outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#71717A]"
                    style={{ width: 12, height: 12 }}
                  />
                </div>
              </div>

              {/* Time */}
              <div>
                <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-[#71717A]">
                  Time Range
                </p>
                <div className="relative">
                  <select
                    value={timeFilter}
                    onChange={(e) => onTimeFilterChange(e.target.value as TimeFilter)}
                    className="w-full appearance-none rounded-lg border border-[#262626] bg-[#0a0a0c] py-1.5 pl-2.5 pr-7 text-xs text-white outline-none"
                  >
                    <option value="all">All Time</option>
                    <option value="24h">Last 24 hours</option>
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#71717A]"
                    style={{ width: 12, height: 12 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
