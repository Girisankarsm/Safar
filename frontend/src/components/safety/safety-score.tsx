import { cn } from "@/lib/utils";

export function SafetyScore({
  score,
  size = "md",
  showLabel,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const ring =
    score >= 80 ? "text-[#22c55e]" : score >= 65 ? "text-white" : score >= 45 ? "text-[#a1a1aa]" : "text-[#ef4444]";
  const sizes = { sm: "h-10 w-10 text-sm", md: "h-14 w-14 text-lg", lg: "h-20 w-20 text-2xl" };

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-2 border-current font-bold",
          ring,
          sizes[size]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <div>
          <p className="text-xs uppercase tracking-wider text-[#a1a1aa]">Safety</p>
          <p className="text-sm font-medium text-white">
            {score >= 80 ? "Excellent" : score >= 65 ? "Good" : score >= 45 ? "Moderate" : "Caution"}
          </p>
        </div>
      )}
    </div>
  );
}
