import type { CityId, CommunityComment, ReportType, SafetyReport } from "@/types/database";
import type { ActivityItem, PlatformStats } from "@/lib/community-activity";
import { DEMO_CITY_CENTERS } from "@/lib/demo-data";

const DEMO_USER = "demo-user-0000-0000-0000-000000000001";

function report(
  id: string,
  city: CityId,
  type: ReportType,
  lat: number,
  lng: number,
  opts: Partial<SafetyReport> = {}
): SafetyReport {
  const ago = opts.created_at ?? new Date(Date.now() - Math.random() * 86400000 * 3).toISOString();
  return {
    id,
    user_id: DEMO_USER,
    city_id: city,
    report_type: type,
    description: opts.description ?? null,
    latitude: lat,
    longitude: lng,
    image_url: null,
    upvotes: opts.upvotes ?? Math.floor(Math.random() * 8) + 1,
    verifications: opts.verifications ?? 0,
    is_verified: opts.is_verified ?? false,
    created_at: ago,
  };
}

export function demoReports(cityId: CityId): SafetyReport[] {
  const c = DEMO_CITY_CENTERS[cityId];
  const base = { lat: c.lat, lng: c.lng };

  const sets: Record<CityId, SafetyReport[]> = {
    chennai: [
      report("dr-c1", "chennai", "poor_lighting", base.lat + 0.012, base.lng - 0.008, {
        description: "Dim stretch near bus stop after 9 PM",
        upvotes: 6,
        verifications: 3,
        is_verified: true,
      }),
      report("dr-c2", "chennai", "harassment", base.lat - 0.006, base.lng + 0.014, {
        description: "Reported near T Nagar junction",
        upvotes: 4,
        is_verified: false,
      }),
      report("dr-c3", "chennai", "unsafe_bus_stop", base.lat + 0.018, base.lng + 0.005, {
        upvotes: 5,
        verifications: 2,
        is_verified: true,
      }),
      report("dr-c4", "chennai", "road_damage", base.lat - 0.01, base.lng - 0.012, { upvotes: 2 }),
      report("dr-c5", "chennai", "dangerous_crossing", base.lat + 0.008, base.lng + 0.018, {
        upvotes: 7,
        verifications: 4,
        is_verified: true,
      }),
    ],
    trivandrum: [
      report("dr-t1", "trivandrum", "poor_lighting", base.lat + 0.009, base.lng - 0.006, {
        description: "Street lamps out near Technopark gate",
        upvotes: 5,
        verifications: 2,
        is_verified: true,
      }),
      report("dr-t2", "trivandrum", "suspicious_activity", base.lat - 0.007, base.lng + 0.01, { upvotes: 3 }),
      report("dr-t3", "trivandrum", "unsafe_area", base.lat + 0.014, base.lng + 0.004, {
        upvotes: 6,
        is_verified: true,
        verifications: 3,
      }),
      report("dr-t4", "trivandrum", "flooded_area", base.lat - 0.012, base.lng - 0.008, { upvotes: 2 }),
    ],
    bangalore: [
      report("dr-b1", "bangalore", "harassment", base.lat + 0.011, base.lng - 0.009, {
        description: "Flagged near MG Road metro exit",
        upvotes: 8,
        verifications: 5,
        is_verified: true,
      }),
      report("dr-b2", "bangalore", "poor_lighting", base.lat - 0.008, base.lng + 0.012, { upvotes: 4 }),
      report("dr-b3", "bangalore", "construction", base.lat + 0.006, base.lng + 0.015, { upvotes: 2 }),
      report("dr-b4", "bangalore", "unsafe_bus_stop", base.lat - 0.014, base.lng - 0.005, {
        upvotes: 5,
        is_verified: true,
        verifications: 2,
      }),
      report("dr-b5", "bangalore", "stray_animal", base.lat + 0.004, base.lng - 0.014, { upvotes: 1 }),
    ],
  };

  return sets[cityId] ?? [];
}

export function demoAllReports(): SafetyReport[] {
  return (["chennai", "trivandrum", "bangalore"] as CityId[]).flatMap(demoReports);
}

const DEMO_COMMENT_SEEDS: Record<string, { body: string; author_name: string; hoursAgo: number }[]> = {
  "dr-c1": [
    { body: "I walk here every evening — street lights have been out for weeks.", author_name: "Priya M.", hoursAgo: 5 },
    { body: "Reported to GCC last month, still no fix.", author_name: "Arun K.", hoursAgo: 12 },
  ],
  "dr-c2": [
    { body: "Avoid this stretch after 10 PM if alone.", author_name: "Meera S.", hoursAgo: 8 },
  ],
  "dr-c3": [
    { body: "Bus stop has no shelter and poor visibility.", author_name: "Vikram R.", hoursAgo: 3 },
    { body: "Agree — felt unsafe waiting here last week.", author_name: "Anitha L.", hoursAgo: 6 },
  ],
  "dr-t1": [
    { body: "Technopark gate area needs better lighting.", author_name: "Rahul N.", hoursAgo: 4 },
  ],
  "dr-b1": [
    { body: "Metro exit is crowded and poorly lit at night.", author_name: "Sneha P.", hoursAgo: 7 },
    { body: "Police patrols increased recently — slight improvement.", author_name: "Karthik D.", hoursAgo: 18 },
  ],
};

export function demoComments(reportId: string): CommunityComment[] {
  const seeds = DEMO_COMMENT_SEEDS[reportId] ?? [];
  return seeds.map((c, i) => ({
    id: `demo-comment-${reportId}-${i}`,
    report_id: reportId,
    user_id: "demo-user-0000-0000-0000-000000000001",
    body: c.body,
    created_at: new Date(Date.now() - c.hoursAgo * 3_600_000).toISOString(),
    author_name: c.author_name,
  }));
}

export function demoCommentCount(reportId: string): number {
  return DEMO_COMMENT_SEEDS[reportId]?.length ?? 0;
}

export function demoActivityFeed(cityId: CityId): ActivityItem[] {
  const reports = demoReports(cityId);
  return [
    {
      id: "da-1",
      type: "verified",
      title: "Report verified by community",
      description: "Poor lighting near transit hub confirmed by 3 commuters",
      timeAgo: "12m ago",
      icon: "verify",
    },
    {
      id: "da-2",
      type: "new_report",
      title: "New safety report submitted",
      description: reports[0]?.description ?? "Community member flagged a corridor issue",
      timeAgo: "28m ago",
      icon: "report",
    },
    {
      id: "da-3",
      type: "community_action",
      title: "6 commuters upvoted a report",
      description: "Validation signal added to the live heatmap",
      timeAgo: "1h ago",
      icon: "users",
    },
    {
      id: "da-4",
      type: "improvement",
      title: "Safety coverage improving",
      description: `${DEMO_CITY_CENTERS[cityId].name} heatmap updated with verified data`,
      timeAgo: "2h ago",
      icon: "shield",
    },
    {
      id: "da-5",
      type: "new_report",
      title: "Unsafe bus stop flagged",
      description: "New pin added to community safety map",
      timeAgo: "3h ago",
      icon: "report",
    },
  ];
}

export const DEMO_PLATFORM_STATS: PlatformStats = {
  totalReports: 247,
  verifiedReports: 89,
  activeUsers: 156,
  safetyCoverage: 78,
  citiesSupported: 3,
};

export const DEMO_LANDING_METRICS = {
  safeTrips: 12400,
  communityReports: 247,
  citiesCovered: 3,
  emergencyResponses: 340,
};
