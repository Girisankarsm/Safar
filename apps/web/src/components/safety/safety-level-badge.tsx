import { getSafetyLevel } from "@/lib/safety-level";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function SafetyLevelBadge({
  score,
  showBar = true,
  size = "md",
  className,
}: {
  score: number;
  showBar?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const info = getSafetyLevel(score);
  const sizes = {
    sm: { text: "text-xs", score: "text-lg", bar: "h-1" },
    md: { text: "text-sm", score: "text-2xl", bar: "h-1.5" },
    lg: { text: "text-base", score: "text-4xl", bar: "h-2" },
  };
  const s = sizes[size];

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn("rounded-full px-3 py-1 font-bold uppercase tracking-wider", s.text)}
          style={{
            color: info.color,
            backgroundColor: info.bgColor,
            border: `1px solid ${info.borderColor}`,
          }}
        >
          {info.label}
        </span>
        <span className={cn("font-bold text-white", s.score)}>
          {score}
          <span className="text-base font-medium text-[#71717A]">/100</span>
        </span>
      </div>
      {showBar && (
        <div className={cn("overflow-hidden rounded-full bg-[#262626]", s.bar)}>
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: info.color }}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      )}
      <p className="text-xs text-[#71717A]">{info.description}</p>
    </div>
  );
}
