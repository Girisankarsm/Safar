import type { PlannedRoute, RouteType } from "@/types/database";
import type { CorridorProfile } from "@/lib/corridor-risk";
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
  /** Corridor-specific explanation (not generic city-level) */
  corridorExplanation: string;
};

function breakdownScore(route: PlannedRoute, keyword: string): number {
  const item = route.safety_breakdown.find((b) =>
    b.factor.toLowerCase().includes(keyword.toLowerCase())
  );
  return item?.score ?? 50;
}

/* ─────────────────── corridor-specific explanation ──────────────────── */

function buildCorridorExplanation(
  _route: PlannedRoute,
  profile: CorridorProfile
): string {
  const parts: string[] = [];

  // Police presence
  if (profile.policeCount >= 3) {
    const named = profile.policeNames.length
      ? ` including ${profile.policeNames[0]}`
      : "";
    parts.push(
      `passes near ${profile.policeCount} police station${profile.policeCount > 1 ? "s" : ""}${named}`
    );
  } else if (profile.policeCount === 0) {
    parts.push("has limited police station coverage along the corridor");
  }

  // Hospital presence
  if (profile.hospitalCount >= 2) {
    const named = profile.hospitalNames.length
      ? ` (${profile.hospitalNames.slice(0, 2).join(", ")})`
      : "";
    parts.push(
      `is within reach of ${profile.hospitalCount} hospitals${named}`
    );
  } else if (profile.hospitalCount === 1) {
    parts.push(
      `has one hospital accessible${profile.hospitalNames.length ? ` — ${profile.hospitalNames[0]}` : ""}`
    );
  }

  // Hotspots
  const highHotspots = profile.hotspots.filter((h) => h.riskLevel === "high");
  const modHotspots = profile.hotspots.filter((h) => h.riskLevel === "moderate");
  if (highHotspots.length > 0) {
    parts.push(
      `traverses ${highHotspots.length} high-density community report cluster${highHotspots.length > 1 ? "s" : ""} requiring heightened awareness`
    );
  } else if (modHotspots.length > 0) {
    parts.push(
      `passes through ${modHotspots.length} moderate report zone${modHotspots.length > 1 ? "s" : ""}`
    );
  } else if (profile.reportCount === 0) {
    parts.push("shows no community-flagged incidents on this specific corridor");
  }

  // Lighting
  if (profile.lightingScore >= 75) {
    parts.push("has well-lit infrastructure characteristics");
  } else if (profile.lightingScore < 50) {
    parts.push("may have limited lighting — night travel is not recommended");
  }

  // Segment coloring summary
  const totalSegs = profile.segments.length;
  if (totalSegs > 0) {
    const riskSegs = profile.segments.filter((s) => s.riskLevel === "risk").length;
    const safeSegs = profile.segments.filter((s) => s.riskLevel === "safe").length;
    if (riskSegs > 0) {
      parts.push(
        `with ${riskSegs} of ${totalSegs} corridor segment${riskSegs > 1 ? "s" : ""} flagged as elevated risk`
      );
    } else if (safeSegs === totalSegs) {
      parts.push(`with all ${totalSegs} corridor segments rated safe`);
    }
  }

  if (parts.length === 0) {
    return "This route has been analyzed with available corridor data. No specific risk factors were identified.";
  }

  const sentence =
    "This route " +
    parts.slice(0, 3).join(", ") +
    (parts.length > 3 ? `, and ${parts.slice(3).join(", ")}` : "") +
    ".";

  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/* ─────────────────── main export ────────────────────────────────────── */

export function generateAIInsights(route: PlannedRoute): AIInsight {
  const community = breakdownScore(route, "community");
  const crime = breakdownScore(route, "crime");
  const police = breakdownScore(route, "police");
  const hospital = breakdownScore(route, "hospital");
  const lighting = breakdownScore(route, "lighting");
  const hour = new Date().getHours();

  const profile = route.corridor_profile;
  const riskLevel = getRiskLevel(route.safety_score);

  // Confidence: prefer profile confidence, otherwise derive from score
  const safetyConfidence = profile
    ? profile.confidenceScore
    : Math.min(96, Math.round(route.safety_score * 0.7 + route.reliability_score * 0.3));

  /* ── Infrastructure ── */
  let nearbyInfrastructure: string;
  if (profile) {
    const pCount = profile.policeCount;
    const hCount = profile.hospitalCount;
    if (pCount > 0 || hCount > 0) {
      nearbyInfrastructure = `${pCount} police station${pCount !== 1 ? "s" : ""} & ${hCount} hospital${hCount !== 1 ? "s" : ""} detected along corridor`;
    } else {
      nearbyInfrastructure = "No police or hospital OSM records found within corridor buffer";
    }
  } else {
    const infraParts: string[] = [];
    if (police >= 60) infraParts.push("police coverage");
    if (hospital >= 55) infraParts.push("hospital access");
    if (route.distance_km < 8) infraParts.push("urban corridors");
    nearbyInfrastructure =
      infraParts.length > 0
        ? `Strong ${infraParts.slice(0, 2).join(" & ")} along this corridor`
        : "Limited safety infrastructure detected nearby";
  }

  /* ── Community reports ── */
  let communityReportDensity: string;
  if (profile) {
    const rCount = profile.reportCount;
    const hCount = profile.hotspots.length;
    if (rCount === 0) {
      communityReportDensity = "None — no community reports on this corridor";
    } else if (hCount > 0) {
      communityReportDensity = `${rCount} report${rCount > 1 ? "s" : ""}, ${hCount} cluster${hCount > 1 ? "s" : ""} detected`;
    } else {
      communityReportDensity = `${rCount} report${rCount > 1 ? "s" : ""} — no dense clusters`;
    }
  } else {
    communityReportDensity =
      community >= 80
        ? "Low — few recent flags"
        : community >= 60
          ? "Moderate activity"
          : "Higher report density";
  }

  /* ── Crime ── */
  const crimeRec = route.recommendations.find(
    (r) => r.includes("NCRB") || r.includes("crime index")
  );
  const historicalCrime = crimeRec
    ? crimeRec.replace("NCRB ", "")
    : `Crime index ${crime}/100 — ${crime >= 70 ? "lower" : crime >= 50 ? "moderate" : "elevated"} historical rates`;

  /* ── Lighting ── */
  const lightScore = profile ? profile.lightingScore : lighting;
  const lightingQuality =
    lightScore >= 75
      ? hour >= 20 || hour < 6
        ? "Good — well-lit arterials expected"
        : "Excellent daylight visibility"
      : lightScore >= 55
        ? "Moderate — some dim stretches possible"
        : "Limited — prefer daytime travel";

  /* ── Travel time ── */
  const recommendedTravelTime =
    hour >= 22 || hour < 5
      ? "Avoid now — travel between 7 AM–8 PM for best safety"
      : hour >= 18
        ? "Acceptable now — earlier daylight hours are safer"
        : "Ideal window — daytime travel recommended";

  /* ── Corridor explanation (specific, not generic) ── */
  const corridorExplanation = profile
    ? buildCorridorExplanation(route, profile)
    : buildGenericCrimeNarrative(route, crime, community, police, hospital);

  const crimeNarrative = buildGenericCrimeNarrative(route, crime, community, police, hospital);

  /* ── Highlights ── */
  const highlights: string[] = [];
  if (profile) {
    highlights.push(corridorExplanation.split(".")[0] + ".");
    if (profile.hotspots.length > 0) {
      const h = profile.hotspots[0];
      highlights.push(
        `${h.riskLevel.charAt(0).toUpperCase() + h.riskLevel.slice(1)}-risk hotspot detected (${h.reportCount} reports near cluster)`
      );
    } else {
      highlights.push("No hotspot clusters detected on this corridor");
    }
  } else {
    highlights.push(route.recommendations[0] ?? "Corridor analyzed with live community data");
    highlights.push(route.recommendations[1] ?? historicalCrime);
  }
  highlights.push(
    `${route.distance_km} km · ${route.eta_minutes} min · ₹${route.estimated_cost_inr}`
  );

  /* ── Summary ── */
  const summary =
    riskLevel === "Low"
      ? `Safar AI rates this ${routeLabel(route.route_type)} as a strong choice with ${safetyConfidence}% confidence. ${corridorExplanation}`
      : riskLevel === "Moderate"
        ? `This route is viable with moderate risk. ${corridorExplanation}`
        : `Exercise caution on this corridor. ${corridorExplanation}`;

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
    corridorExplanation,
  };
}

/* ─────────────── generic fallback when no profile ───────────────────── */

function buildGenericCrimeNarrative(
  _route: PlannedRoute,
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

  const riskFromRec = _route.recommendations.find((r) => r.includes("crime index"));
  const riskLabel = riskFromRec?.match(/low_risk|moderate_risk|high_risk/)?.[0];
  if (riskLabel) {
    return `This route passes through areas with ${parts.slice(0, 2).join(", ")}, classified as ${crimeRiskLabelHuman(riskLabel)} by NCRB data.`;
  }

  return (
    crimeExplanation(crime, crime >= 70 ? "low_risk" : crime >= 50 ? "moderate_risk" : "high_risk") +
    (parts.length > 1 ? ` Combined with ${parts.slice(1).join(" and ")}.` : "")
  );
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

/* ─────────────────── route recommender ─────────────────────────────── */

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

    // Boost routes with fewer hotspots (corridor intelligence)
    const corridorBonus = route.corridor_profile
      ? Math.max(0, (1 - route.corridor_profile.hotspots.length * 0.15)) * 0.06
      : 0;

    let weighted =
      safetyNorm * 0.42 +
      etaNorm * 0.22 +
      costNorm * 0.12 +
      reliabilityNorm * 0.14 +
      corridorBonus;

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

    if (route.corridor_profile?.hotspots.length === 0 && route.corridor_profile.reportCount === 0) {
      reasons.push("Clean corridor — no hotspots or community reports detected");
    }

    if (reasons.length === 0) reasons.push("Best overall balance of safety, time, and cost");

    const candidate = { route, score: weighted, reasons };
    if (!best || candidate.score > best.score) best = candidate;
  }

  return best;
}
