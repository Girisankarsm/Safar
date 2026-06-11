import type { PlannedRoute } from "@/types/database";

export type SafetyTier = "SAFE" | "MODERATE" | "RISKY";

export function safetyTier(score: number): SafetyTier {
  if (score >= 75) return "SAFE";
  if (score >= 50) return "MODERATE";
  return "RISKY";
}

export function tierColor(tier: SafetyTier) {
  return { SAFE: "#22C55E", MODERATE: "#3B82F6", RISKY: "#EF4444" }[tier];
}

/** Generate human-readable bullets from existing route data */
export function whyThisRoute(route: PlannedRoute): string[] {
  const reasons: string[] = [];

  if (route.safety_score >= 70) {
    reasons.push("Strong community safety score along this corridor");
  }
  if (route.route_type === "cheapest") {
    reasons.push("Lowest fare option");
  }
  if (route.route_type === "balanced") {
    reasons.push("Best balance of time and safety");
  }
  if (route.route_type === "safest") {
    reasons.push("Highest safety weighting applied");
  }
  if (route.route_type === "women_friendly") {
    reasons.push("Prioritizes well-lit, visible corridors");
  }
  if (route.transfer_count === 0) {
    reasons.push("Direct route with no transfers");
  }
  if (route.recommendations?.length) {
    reasons.push(...route.recommendations.slice(0, 2));
  }

  return reasons.slice(0, 4);
}

export function cityDisplayName(city: string) {
  if (city === "chennai") return "Chennai";
  if (city === "trivandrum") return "Trivandrum";
  if (city === "bangalore") return "Bengaluru";
  return city;
}
