import type { RouteLeg } from "@/lib/api";
import { Bus, Footprints, Train } from "lucide-react";

const MODE_META: Record<string, { icon: typeof Footprints; label: string; color: string }> = {
  walk: { icon: Footprints, label: "Walking", color: "#A1A1AA" },
  metro: { icon: Train, label: "Metro", color: "#3B82F6" },
  bus: { icon: Bus, label: "Bus", color: "#22C55E" },
};

export function RouteTimeline({ legs }: { legs: RouteLeg[] }) {
  if (!legs.length) return null;

  return (
    <div className="mt-5 rounded-xl border border-[#262626] bg-[#111111] px-3 py-3">
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {legs.map((leg, i) => {
          const meta = MODE_META[leg.mode] || MODE_META.walk;
          const Icon = meta.icon;
          return (
            <div key={`${leg.mode}-${i}`} className="flex min-w-0 flex-1 items-center">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${meta.color}18` }}
                >
                  <Icon className="h-4 w-4" style={{ color: meta.color }} strokeWidth={2} />
                </div>
                <p className="truncate text-[9px] font-semibold text-white">{meta.label}</p>
                <p className="text-[9px] text-[#A1A1AA]">{leg.duration_min} min</p>
              </div>
              {i < legs.length - 1 && (
                <div className="mx-1 h-px flex-1 min-w-[12px] bg-[#404040]" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
