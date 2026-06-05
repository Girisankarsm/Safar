import { cn } from "@/lib/utils";
import { safetyTier } from "@/lib/safety-copy";

export function SafetyScore({
  score,
  size = "md",
  showLabel,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const tier = safetyTier(score);
  const ring =
    tier === "SAFE"
      ? "border-[#22C55E] text-[#22C55E]"
      : tier === "MODERATE"
        ? "border-[#3B82F6] text-[#3B82F6]"
        : "border-[#EF4444] text-[#EF4444]";
  const sizes = { sm: "h-11 w-11 text-sm", md: "h-14 w-14 text-lg", lg: "h-20 w-20 text-2xl" };

  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border-2 bg-[#111111] font-bold",
          ring,
          sizes[size]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#A1A1AA]">Safety</p>
          <p className="text-sm font-semibold text-white">{tier}</p>
        </div>
      )}
    </div>
  );
}
