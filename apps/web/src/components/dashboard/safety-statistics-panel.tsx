import type { PlatformStats } from "@/lib/community-activity";
import { CountUp } from "@/components/ui/count-up";
import { motion } from "framer-motion";
import { BarChart3, CheckCircle2, MapPin, Users, Globe } from "lucide-react";

const STAT_CONFIG = [
  { key: "totalReports" as const, label: "Total Reports", icon: BarChart3, color: "#3B82F6", suffix: "" },
  { key: "verifiedReports" as const, label: "Verified", icon: CheckCircle2, color: "#22C55E", suffix: "" },
  { key: "activeUsers" as const, label: "Active Users", icon: Users, color: "#EC4899", suffix: "" },
  { key: "safetyCoverage" as const, label: "Safety Coverage", icon: MapPin, color: "#F59E0B", suffix: "%" },
  { key: "citiesSupported" as const, label: "Cities", icon: Globe, color: "#60A5FA", suffix: "" },
];

export function SafetyStatisticsPanel({ stats }: { stats: PlatformStats }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[#3B82F6]" />
        <h3 className="font-bold text-white">Safety Intelligence</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STAT_CONFIG.map((cfg, i) => (
          <motion.div
            key={cfg.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ y: -2 }}
            className="surface-card rounded-2xl p-4"
          >
            <div className="flex items-center gap-2">
              <cfg.icon className="h-4 w-4" style={{ color: cfg.color }} />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#71717A]">
                {cfg.label}
              </p>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">
              <CountUp value={stats[cfg.key]} suffix={cfg.suffix} />
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
