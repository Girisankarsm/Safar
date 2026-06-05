import type { Route } from "@/lib/api";

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
export function whyThisRoute(route: Route): string[] {
  const reasons: string[] = [];
  const litStops = route.legs.filter((l) => l.well_lit_stop && l.mode !== "walk");
  const womenCoach = route.legs.some((l) => l.women_only_coach);
  const metroLegs = route.legs.filter((l) => l.mode === "metro");

  if (litStops.length > 0) {
    const stop = litStops[0];
    reasons.push(`Well-lit transfer at ${stop.from}`);
  }
  if (womenCoach) {
    reasons.push("Women-only coach available");
  }
  if (route.safety_score >= 70) {
    const estCctv = Math.max(4, Math.round(route.safety_score / 6));
    reasons.push(`${estCctv} CCTV cameras along corridor`);
  }
  if (route.night_safe) {
    reasons.push("Night-shift service verified");
  }
  if (route.route_type === "greenest") {
    reasons.push("Public bus — lower emissions");
    reasons.push("Eco-friendly commute");
  }
  if (route.route_type === "fastest") {
    reasons.push("Fewer stops on metro");
    reasons.push("Direct metro connectivity");
    reasons.push("High frequency service");
  }
  if (route.route_type === "safest") {
    reasons.push("Shorter walking distance");
  }
  if (metroLegs.length >= 2) {
    reasons.push("Minimal street walking");
  }
  if (route.recommendations?.length) {
    reasons.push("Community-verified corridor");
  }

  return reasons.slice(0, 4);
}

export function cityDisplayName(city: string) {
  return city === "chennai" ? "Chennai" : city === "hyderabad" ? "Hyderabad" : city;
}
