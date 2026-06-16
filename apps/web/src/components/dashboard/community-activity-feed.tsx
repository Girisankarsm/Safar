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

const TYPE_LABELS: Record<ActivityItem["type"], string> = {
  new_report: "New report",
  verified: "Verified",
  improvement: "Improvement",
  community_action: "Community",
};

function ActivityRow({
  item,
  index,
  variant,
  isLast,
}: {
  item: ActivityItem;
  index: number;
  variant: "compact" | "full";
  isLast: boolean;
}) {
  const Icon = ICONS[item.icon];
  const color = TYPE_COLORS[item.type];

  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="relative flex gap-3 sm:gap-4"
    >
      {/* Timeline rail */}
      <div className="flex flex-col items-center">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" style={{ color }} />
        </div>
        {!isLast && (
          <div
            className="mt-1 w-px flex-1 min-h-[12px]"
            style={{ backgroundColor: `${color}30` }}
          />
        )}
      </div>

      {/* Content card */}
      <div
        className={
          variant === "full"
            ? "mb-3 min-w-0 flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3.5 sm:px-5 sm:py-4"
            : `min-w-0 flex-1 pb-4${isLast ? "" : " border-b border-[var(--border-subtle)]"}`
        }
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {TYPE_LABELS[item.type]}
          </span>
          <span className="text-[10px] font-medium text-[#71717A]">{item.timeAgo}</span>
        </div>
        <p className="mt-2 text-sm font-semibold leading-snug text-white">{item.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA]">{item.description}</p>
      </div>
    </motion.li>
  );
}

export function CommunityActivityFeed({
  items,
  loading,
  variant = "compact",
  showHeader = true,
}: {
  items: ActivityItem[];
  loading?: boolean;
  variant?: "compact" | "full";
  showHeader?: boolean;
}) {
  if (loading) {
    return (
      <Card className={variant === "full" ? "!p-6" : undefined}>
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

  const list = (
    <ul className={variant === "full" ? "space-y-0" : "px-5 py-4"}>
      <AnimatePresence initial={false}>
        {items.map((item, i) => (
          <ActivityRow
            key={item.id}
            item={item}
            index={i}
            variant={variant}
            isLast={i === items.length - 1}
          />
        ))}
      </AnimatePresence>
    </ul>
  );

  if (variant === "full") {
    return (
      <div>
        {showHeader && (
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="font-bold text-white">Recent updates</h3>
          </div>
        )}
        {list}
      </div>
    );
  }

  return (
    <Card className="!p-0 overflow-hidden">
      {showHeader && (
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
      )}
      {list}
    </Card>
  );
}
