const LEGEND = [
  { color: "#22c55e", label: "Safe" },
  { color: "#f59e0b", label: "Moderate" },
  { color: "#ef4444", label: "High Risk" },
  { color: "#ef4444", label: "Community Report", ring: true },
  { color: "#f59e0b", label: "Pin", ring: true },
  { color: "#3b82f6", label: "Your Location", ring: true },
];

export function SafetyMapLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2 lg:gap-3 lg:rounded-t-2xl lg:border lg:border-b-0 lg:border-[#262626] lg:bg-[#111111]/95 lg:px-4 lg:py-3">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 lg:gap-x-4 lg:gap-y-2">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-[#A1A1AA] lg:gap-2 lg:text-xs">
            <span
              className={`inline-block h-2 w-2 shrink-0 rounded-full lg:h-2.5 lg:w-2.5 ${item.ring ? "ring-2 ring-offset-1 ring-offset-[#111111]" : ""}`}
              style={{
                backgroundColor: item.color,
                ...(item.ring ? { boxShadow: `0 0 0 1px ${item.color}66` } : {}),
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <p className="hidden text-xs text-[#71717A] sm:block lg:ml-auto">
        Tap on the map to pin a location and report an issue
      </p>
    </div>
  );
}
