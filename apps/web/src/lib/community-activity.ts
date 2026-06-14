import type { SafetyReport } from "@/types/database";

export type ActivityItem = {
  id: string;
  type: "new_report" | "verified" | "improvement" | "community_action";
  title: string;
  description: string;
  timeAgo: string;
  icon: "report" | "verify" | "shield" | "users";
};

const TYPE_LABELS: Record<string, string> = {
  harassment: "Harassment flagged",
  poor_lighting: "Poor lighting reported",
  unsafe_bus_stop: "Unsafe bus stop flagged",
  flooded_area: "Flooded area reported",
  road_damage: "Road damage reported",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function buildActivityFromReports(reports: SafetyReport[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const r of reports.slice(0, 8)) {
    items.push({
      id: `report-${r.id}`,
      type: "new_report",
      title: TYPE_LABELS[r.report_type] ?? r.report_type.replace(/_/g, " "),
      description: r.description ?? "New community safety report submitted",
      timeAgo: timeAgo(r.created_at),
      icon: "report",
    });

    if (r.is_verified) {
      items.push({
        id: `verify-${r.id}`,
        type: "verified",
        title: "Report verified by community",
        description: `${TYPE_LABELS[r.report_type] ?? "Safety issue"} confirmed by ${r.verifications} commuter(s)`,
        timeAgo: timeAgo(r.created_at),
        icon: "verify",
      });
    }

    if (r.upvotes >= 3) {
      items.push({
        id: `action-${r.id}`,
        type: "community_action",
        title: `${r.upvotes} commuters supported this report`,
        description: "Community validation strengthens the safety heatmap",
        timeAgo: timeAgo(r.created_at),
        icon: "users",
      });
    }
  }

  if (reports.filter((r) => r.is_verified).length >= 2) {
    items.unshift({
      id: "improvement-zone",
      type: "improvement",
      title: "Safety coverage improving",
      description: "Verified reports are refining heatmap accuracy in your city",
      timeAgo: "Today",
      icon: "shield",
    });
  }

  return items.slice(0, 10);
}

export type PlatformStats = {
  totalReports: number;
  verifiedReports: number;
  activeUsers: number;
  safetyCoverage: number;
  citiesSupported: number;
};

export function computePlatformStats(
  reports: SafetyReport[],
  citiesCount = 3
): PlatformStats {
  const verified = reports.filter((r) => r.is_verified).length;
  const uniqueUsers = new Set(reports.map((r) => r.user_id)).size;
  const coverage = reports.length === 0 ? 0 : Math.min(98, 40 + reports.length * 4 + verified * 6);

  return {
    totalReports: reports.length,
    verifiedReports: verified,
    activeUsers: Math.max(uniqueUsers, reports.length > 0 ? uniqueUsers : 0),
    safetyCoverage: coverage,
    citiesSupported: citiesCount,
  };
}
