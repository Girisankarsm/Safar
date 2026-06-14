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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border border-b-0 border-[#262626] bg-[#111111]/95 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-2 text-xs text-[#A1A1AA]">
            <span
              className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${item.ring ? "ring-2 ring-offset-1 ring-offset-[#111111]" : ""}`}
              style={{
                backgroundColor: item.color,
                ...(item.ring ? { boxShadow: `0 0 0 1px ${item.color}66` } : {}),
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
      <p className="text-xs text-[#71717A]">Tap on the map to pin a location and report an issue</p>
    </div>
  );
}
