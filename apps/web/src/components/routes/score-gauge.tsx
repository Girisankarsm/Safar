import { tierColor, safetyTier } from "@/lib/safety-copy";

export function ScoreGauge({ score, size = 56 }: { score: number; size?: number }) {
  const tier = safetyTier(score);
  const color = tierColor(tier);
  const r = (size - 8) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#262626"
          strokeWidth="4"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-bold leading-none text-white">{score}</span>
        <span className="mt-0.5 text-[8px] font-medium text-[#A1A1AA]">/100</span>
      </div>
    </div>
  );
}
