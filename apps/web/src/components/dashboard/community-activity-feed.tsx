import type { ActivityItem } from "@/lib/community-activity";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, CheckCircle2, Shield, Users, MapPin } from "lucide-react";

const ICONS = {
  report: MapPin,
  verify: CheckCircle2,
  shield: Shield,
  users: Users,
};

const TYPE_COLORS = {
  new_report: "#EF4444",
  verified: "#22C55E",
  improvement: "#3B82F6",
  community_action: "#EC4899",
};

export function CommunityActivityFeed({
  items,
  loading,
}: {
  items: ActivityItem[];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <Card>
        <p className="text-sm text-[#A1A1AA]">Loading community activity…</p>
      </Card>
    );
  }

  if (!items.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No community activity yet"
        description="Be the first to report a safety issue in your city. Your contribution powers the live heatmap for everyone."
        actionLabel="Report an issue"
        actionTo="/safety"
        className="!py-10"
      />
    );
  }

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#3B82F6]" />
          <h3 className="font-bold text-white">Community Activity</h3>
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-semibold text-[#22C55E]">
            <span className="status-live inline-flex h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
            Live
          </span>
        </div>
      </div>

      <ul className="divide-y divide-[var(--border-subtle)]">
        <AnimatePresence initial={false}>
          {items.map((item, i) => {
            const Icon = ICONS[item.icon];
            const color = TYPE_COLORS[item.type];
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-3 px-5 py-4"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <Icon className="h-4 w-4" style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <span className="shrink-0 text-[10px] text-[#71717A]">{item.timeAgo}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-[#A1A1AA]">{item.description}</p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </Card>
  );
}
