import { cn } from "@/lib/utils";

export function SafetyMeter({ score, label }: { score: number; label: string }) {
  const color =
    score >= 75 ? "bg-accent" : score >= 50 ? "bg-warning" : "bg-danger";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-muted">Safety Score</span>
        <span className={cn(
          "font-bold",
          score >= 75 ? "text-accent" : score >= 50 ? "text-warning" : "text-danger"
        )}>
          {score}/100 · {label}
        </span>
      </div>
      <div className="safety-bar">
        <div className={cn("safety-bar-fill", color)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
