import { motion } from "framer-motion";

export type BreakdownItem = {
  factor: string;
  weight_pct: number;
  score: number;
  contribution: number;
};

export function SafetyScoreBreakdown({
  score,
  breakdown,
}: {
  score: number;
  breakdown: BreakdownItem[];
}) {
  const category =
    score >= 80 ? "Safe" : score >= 50 ? "Moderate" : "High Risk";
  const color =
    score >= 80 ? "#22C55E" : score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="rounded-2xl border border-[#262626] bg-[#111111] p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA]">
            Safety Intelligence
          </p>
          <p className="mt-1 text-2xl font-bold text-white">{score}/100</p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {category}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {breakdown.map((item, i) => (
          <motion.div
            key={item.factor}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#A1A1AA]">
                {item.factor}{" "}
                <span className="text-[#71717A]">({item.weight_pct}%)</span>
              </span>
              <span className="font-semibold text-white">{item.score}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#262626]">
              <motion.div
                className="h-full rounded-full bg-[#3B82F6]"
                initial={{ width: 0 }}
                animate={{ width: `${item.score}%` }}
                transition={{ delay: 0.2 + i * 0.06, duration: 0.5 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
