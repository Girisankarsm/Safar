import { cn } from "@/lib/utils";
import { Radio } from "lucide-react";

export function SafetyMeter({
  score,
  label,
  live,
  previousScore,
}: {
  score: number;
  label: string;
  live?: boolean;
  previousScore?: number;
}) {
  const color = score >= 75 ? "bg-accent" : score >= 50 ? "bg-warning" : "bg-danger";
  const delta = previousScore != null ? score - previousScore : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-muted">
          Safety Score
          {live && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
              <Radio className="h-2.5 w-2.5" /> LIVE
            </span>
          )}
        </span>
        <span
          className={cn(
            "font-bold",
            score >= 75 ? "text-accent" : score >= 50 ? "text-warning" : "text-danger"
          )}
        >
          {score}/100 · {label}
          {delta !== 0 && (
            <span className={cn("ml-1", delta > 0 ? "text-accent" : "text-danger")}>
              ({delta > 0 ? "+" : ""}{delta})
            </span>
          )}
        </span>
      </div>
      <div className="safety-bar">
        <div
          className={cn("safety-bar-fill transition-all duration-700", color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
