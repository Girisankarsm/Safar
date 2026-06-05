import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "success" | "default";
}) {
  return (
    <div className="rounded-2xl border border-[#222222] bg-[#111111] p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[#a1a1aa]">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tracking-tight",
          accent === "success" ? "text-[#22c55e]" : "text-white"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-[#a1a1aa]">{sub}</p>}
    </div>
  );
}
