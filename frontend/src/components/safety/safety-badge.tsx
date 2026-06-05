import { cn, safetyColor } from "@/lib/utils";

export function SafetyBadge({ score, label }: { score: number; label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/80 px-3 py-1">
      <span className={cn("text-lg font-bold", safetyColor(score))}>{score}</span>
      <span className="text-xs uppercase tracking-wide text-gray-400">{label || "safety"}</span>
    </div>
  );
}
