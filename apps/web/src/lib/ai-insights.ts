import type { PlannedRoute, RouteType } from "@/types/database";
import { crimeExplanation, crimeRiskLabelHuman } from "@/lib/crime-data";
import { getRiskLevel } from "@/lib/safety-level";

export type AIInsight = {
  riskLevel: "Low" | "Moderate" | "High";
  safetyConfidence: number;
  nearbyInfrastructure: string;
  communityReportDensity: string;
  historicalCrime: string;
  lightingQuality: string;
  recommendedTravelTime: string;
  summary: string;
  highlights: string[];
  crimeNarrative: string;
};

function breakdownScore(route: PlannedRoute, keyword: string): number {
  const item = route.safety_breakdown.find((b) =>
    b.factor.toLowerCase().includes(keyword.toLowerCase())
  );
  return item?.score ?? 50;
}

export function generateAIInsights(route: PlannedRoute): AIInsight {
  const community = breakdownScore(route, "community");
  const crime = breakdownScore(route, "crime");
  const police = breakdownScore(route, "police");
  const hospital = breakdownScore(route, "hospital");
  const routeChars = breakdownScore(route, "route");
  const hour = new Date().getHours();

  const riskLevel = getRiskLevel(route.safety_score);
  const safetyConfidence = Math.min(
    98,
    Math.round(route.safety_score * 0.7 + route.reliability_score * 0.3)
  );

  const infraParts: string[] = [];
  if (police >= 60) infraParts.push("police coverage");
  if (hospital >= 55) infraParts.push("hospital access");
  if (route.distance_km < 8) infraParts.push("urban corridors");
  const nearbyInfrastructure =
    infraParts.length > 0
      ? `Strong ${infraParts.slice(0, 2).join(" & ")} along this corridor`
      : "Limited safety infrastructure detected nearby";

  const communityReportDensity =
    community >= 80 ? "Low — few recent flags" : community >= 60 ? "Moderate activity" : "Higher report density";

  const crimeRec = route.recommendations.find((r) => r.includes("NCRB") || r.includes("crime index"));
  const historicalCrime = crimeRec
    ? crimeRec.replace("NCRB ", "")
    : `Crime index ${crime}/100 — ${crime >= 70 ? "lower historical rates" : crime >= 50 ? "moderate historical rates" : "elevated historical rates"}`;

  const lightingQuality =
    routeChars >= 75
      ? hour >= 20 || hour < 6
        ? "Good — well-lit arterial expected"
        : "Excellent daylight visibility"
      : routeChars >= 55
        ? "Moderate — some dim stretches possible"
        : "Limited — prefer daytime travel";

  const recommendedTravelTime =
    hour >= 22 || hour < 5
      ? "Avoid now — travel between 7 AM–8 PM for best safety"
      : hour >= 18
        ? "Acceptable now — earlier daylight hours are safer"
        : "Ideal window — daytime travel recommended";

  const crimeNarrative = buildCrimeNarrative(route, crime, community, police, hospital);

  const highlights = [
    route.recommendations[0] ?? "Corridor analyzed with live community data",
    route.recommendations[1] ?? historicalCrime,
    `${route.distance_km} km · ${route.eta_minutes} min · ₹${route.estimated_cost_inr}`,
  ];

  const summary =
    riskLevel === "Low"
      ? `Safar AI rates this ${routeLabel(route.route_type)} as a strong choice with ${safetyConfidence}% confidence. ${crimeNarrative}`
      : riskLevel === "Moderate"
        ? `This route is viable but carries moderate risk — ${crimeNarrative}`
        : `Exercise caution on this corridor. ${crimeNarrative}`;

  return {
    riskLevel,
    safetyConfidence,
    nearbyInfrastructure,
    communityReportDensity,
    historicalCrime,
    lightingQuality,
    recommendedTravelTime,
    summary,
    highlights,
    crimeNarrative,
  };
}

function buildCrimeNarrative(
  route: PlannedRoute,
  crime: number,
  community: number,
  police: number,
  hospital: number
): string {
  const parts: string[] = [];

  if (crime >= 65) parts.push("lower historical crime rates from official NCRB data");
  else if (crime >= 45) parts.push("moderate historical crime levels in this city");
  else parts.push("higher historical crime burden in metropolitan records");

  if (community >= 75) parts.push("fewer community reports");
  else if (community < 55) parts.push("active community safety flags nearby");

  if (police >= 65 && hospital >= 55) parts.push("better emergency-service coverage");
  else if (police >= 55) parts.push("reasonable police infrastructure");

  const riskFromRec = route.recommendations.find((r) => r.includes("crime index"));
  const riskLabel = riskFromRec?.match(/low_risk|moderate_risk|high_risk/)?.[0];
  if (riskLabel) {
    return `This route passes through areas with ${parts.slice(0, 2).join(", ")}, classified as ${crimeRiskLabelHuman(riskLabel)} by NCRB ${route.recommendations.find((r) => r.includes("NCRB"))?.match(/\d{4}/)?.[0] ?? "2022"} data.`;
  }

  return crimeExplanation(crime, crime >= 70 ? "low_risk" : crime >= 50 ? "moderate_risk" : "high_risk") +
    (parts.length > 1 ? ` Combined with ${parts.slice(1).join(" and ")}.` : "");
}

function routeLabel(type: RouteType): string {
  const labels: Record<RouteType, string> = {
    safest: "safest route",
    cheapest: "budget route",
    balanced: "balanced route",
    women_friendly: "women-friendly route",
  };
  return labels[type];
}

export type RouteRecommendation = {
  route: PlannedRoute;
  score: number;
  reasons: string[];
};

export function recommendRoute(
  routes: PlannedRoute[],
  options?: { womenSafetyMode?: boolean; nightSafePreference?: boolean }
): RouteRecommendation | null {
  if (!routes.length) return null;

  const maxSafety = Math.max(...routes.map((r) => r.safety_score));
  const minEta = Math.min(...routes.map((r) => r.eta_minutes));
  const maxEta = Math.max(...routes.map((r) => r.eta_minutes));
  const minCost = Math.min(...routes.map((r) => r.estimated_cost_inr));
  const maxCost = Math.max(...routes.map((r) => r.estimated_cost_inr));

  const hour = new Date().getHours();
  const isNight = hour >= 21 || hour < 6;

  let best: RouteRecommendation | null = null;

  for (const route of routes) {
    const safetyNorm = route.safety_score / Math.max(maxSafety, 1);
    const etaNorm = 1 - (route.eta_minutes - minEta) / Math.max(maxEta - minEta, 1);
    const costNorm = 1 - (route.estimated_cost_inr - minCost) / Math.max(maxCost - minCost, 1);
    const reliabilityNorm = route.reliability_score / 100;

    let weighted =
      safetyNorm * 0.42 +
      etaNorm * 0.22 +
      costNorm * 0.12 +
      reliabilityNorm * 0.14;

    if (options?.womenSafetyMode && route.route_type === "women_friendly") weighted += 0.18;
    if (options?.nightSafePreference && route.route_type === "safest") weighted += 0.12;
    if (isNight && route.route_type === "safest") weighted += 0.08;
    if (route.route_type === "balanced") weighted += 0.04;

    const reasons: string[] = [];
    if (route.safety_score === maxSafety) reasons.push("Highest safety score in comparison");
    if (route.eta_minutes === minEta) reasons.push("Fastest estimated arrival");
    if (options?.womenSafetyMode && route.route_type === "women_friendly")
      reasons.push("Women Safety Mode prioritizes this corridor");
    if (isNight && route.route_type === "safest") reasons.push("Night travel — safest profile selected");
    const crime = breakdownScore(route, "crime");
    if (crime >= 70) reasons.push("Favorable historical crime index from NCRB data");
    if (crime < 50) reasons.push("Higher historical crime burden — consider safest route");
    const police = breakdownScore(route, "police");
    if (police >= 70) reasons.push("Strong police infrastructure proximity");
    if (reasons.length === 0) reasons.push("Best overall balance of safety, time, and cost");

    const candidate = { route, score: weighted, reasons };
    if (!best || candidate.score > best.score) best = candidate;
  }

  return best;
}
