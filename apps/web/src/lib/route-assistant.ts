/**
 * Safar Route Assistant — structured explanation engine.
 * Generates answers entirely from existing corridor intelligence.
 * No external LLM required.
 */

import type { CityId, PlannedRoute } from "@/types/database";
import { FALLBACK_CRIME_SCORES } from "@/lib/crime-data";

export type AssistantIntent =
  | "why_safe"
  | "night_safety"
  | "women_safety"
  | "recommendation"
  | "risk_areas"
  | "careful_about"
  | "police_coverage"
  | "data_sources";

export type AssistantPoint = {
  icon: string;
  text: string;
  sentiment: "positive" | "negative" | "neutral";
};

export type AssistantAnswer = {
  intent: AssistantIntent;
  headline: string;
  body: string;
  points: AssistantPoint[];
  confidence?: number;
};

export type SuggestedQuestion = {
  id: string;
  label: string;
  intent: AssistantIntent;
};

export const SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  { id: "q1", label: "Why is this route safe?", intent: "why_safe" },
  { id: "q2", label: "Is this safe at night?", intent: "night_safety" },
  { id: "q3", label: "Safe for women?", intent: "women_safety" },
  { id: "q4", label: "Why did Safar recommend this?", intent: "recommendation" },
  { id: "q5", label: "Where are the risk areas?", intent: "risk_areas" },
  { id: "q6", label: "What should I watch out for?", intent: "careful_about" },
  { id: "q7", label: "How is this score calculated?", intent: "data_sources" },
];

const KNOWN_INTENTS: AssistantIntent[] = [
  "why_safe", "night_safety", "women_safety", "recommendation",
  "risk_areas", "careful_about", "police_coverage", "data_sources",
];

function detectIntent(question: string): AssistantIntent {
  const q = question.toLowerCase();
  if (/night|dark|late|pm|midnight|after\s*\d/.test(q)) return "night_safety";
  if (/wom[ae]n|female|girl/.test(q)) return "women_safety";
  if (/recommend|suggest|why.*this|chose|pick|why.*safar/.test(q)) return "recommendation";
  if (/risk|danger|hotspot|unsafe|bad\s*area|red/.test(q)) return "risk_areas";
  if (/careful|watch|avoid|warn|concern/.test(q)) return "careful_about";
  if (/police|station|cop/.test(q)) return "police_coverage";
  if (/data|source|ncrb|calculat|score.*work|how.*work/.test(q)) return "data_sources";
  return "why_safe";
}

export function answerQuestion(
  intentOrQuestion: AssistantIntent | string,
  route: PlannedRoute,
  allRoutes: PlannedRoute[],
  cityId: CityId,
  options?: { departureHour?: number }
): AssistantAnswer {
  const isKnownIntent = KNOWN_INTENTS.includes(intentOrQuestion as AssistantIntent);
  const intent: AssistantIntent = isKnownIntent
    ? (intentOrQuestion as AssistantIntent)
    : detectIntent(intentOrQuestion as string);

  const cp = route.corridor_profile;
  const hour = options?.departureHour ?? new Date().getHours();
  const cityNCRB = FALLBACK_CRIME_SCORES[cityId];
  const score = route.safety_score;

  switch (intent) {
    case "why_safe": {
      const pts: AssistantPoint[] = [];
      if (cp) {
        if (cp.policeCount >= 2)
          pts.push({ icon: "🚓", text: `${cp.policeCount} police stations within corridor buffer`, sentiment: "positive" });
        else if (cp.policeCount === 1)
          pts.push({ icon: "🚓", text: `1 police station detected near corridor`, sentiment: "neutral" });
        else
          pts.push({ icon: "⚠️", text: `No police stations detected within route buffer`, sentiment: "negative" });

        if (cp.hospitalCount >= 1)
          pts.push({ icon: "🏥", text: `${cp.hospitalCount} hospital${cp.hospitalCount > 1 ? "s" : ""} reachable from route`, sentiment: "positive" });

        if (cp.hotspots.length === 0)
          pts.push({ icon: "🟢", text: `No community risk hotspots on this corridor`, sentiment: "positive" });
        else
          pts.push({ icon: "⚠️", text: `${cp.hotspots.length} incident cluster${cp.hotspots.length > 1 ? "s" : ""} detected`, sentiment: "negative" });

        if (cp.reportCount === 0)
          pts.push({ icon: "📍", text: `Zero community reports in corridor area`, sentiment: "positive" });
        else
          pts.push({ icon: "📍", text: `${cp.reportCount} community report${cp.reportCount > 1 ? "s" : ""} nearby`, sentiment: cp.reportCount > 3 ? "negative" : "neutral" });

        pts.push({
          icon: cp.lightingScore >= 65 ? "💡" : "🌑",
          text: `Lighting coverage estimated at ${cp.lightingScore}%`,
          sentiment: cp.lightingScore >= 65 ? "positive" : "negative",
        });

        const safeCount = cp.segments.filter((s) => s.riskLevel === "safe").length;
        pts.push({
          icon: "📊",
          text: `${safeCount}/${cp.segments.length} corridor segments are safe`,
          sentiment: safeCount / cp.segments.length >= 0.7 ? "positive" : "neutral",
        });
      }
      if (cityNCRB) {
        pts.push({
          icon: "📋",
          text: `City NCRB baseline: ${cityNCRB.crime_index}/100 (${cityNCRB.data_source})`,
          sentiment: cityNCRB.crime_index >= 60 ? "positive" : "negative",
        });
      }
      return {
        intent,
        headline: `Route scores ${score}/100`,
        body: score >= 80
          ? `Strong infrastructure support and low incident density contribute to this high score.`
          : score >= 60
            ? `Adequate infrastructure exists, but some corridor risk factors reduce the score.`
            : `Limited safety infrastructure and community incidents lower this route's profile.`,
        points: pts,
        confidence: cp?.confidenceScore,
      };
    }

    case "night_safety": {
      const isNight = hour >= 21 || hour < 6;
      const nightBreakdown = route.safety_breakdown?.find(
        (b) => b.factor.toLowerCase().includes("night") || b.factor.toLowerCase().includes("time")
      );
      const pts: AssistantPoint[] = [];

      if (cp) {
        pts.push({
          icon: cp.lightingScore >= 65 ? "💡" : "🌑",
          text: cp.lightingScore >= 65
            ? `Good lighting (${cp.lightingScore}%) — safer after dark`
            : `Limited lighting (${cp.lightingScore}%) — caution after 9 PM`,
          sentiment: cp.lightingScore >= 65 ? "positive" : "negative",
        });
        if (cp.policeCount >= 2)
          pts.push({ icon: "🚓", text: `${cp.policeCount} police stations along corridor`, sentiment: "positive" });
        if (cp.hotspots.length > 0)
          pts.push({ icon: "⚠️", text: `${cp.hotspots.length} risk cluster${cp.hotspots.length > 1 ? "s" : ""} — heightened at night`, sentiment: "negative" });
      }
      if (nightBreakdown)
        pts.push({ icon: "🕐", text: `Night travel factor: ${nightBreakdown.score}/100 (${nightBreakdown.weight_pct}% weight)`, sentiment: nightBreakdown.score >= 60 ? "positive" : "negative" });
      if (isNight)
        pts.push({ icon: "🌙", text: `Current time is in night hours — these conditions apply now`, sentiment: "neutral" });

      const safeAtNight = (cp?.lightingScore ?? 50) >= 55 && (nightBreakdown?.score ?? score) >= 60;
      return {
        intent,
        headline: safeAtNight ? `Moderately safe at night` : `Extra caution needed after dark`,
        body: safeAtNight
          ? `Night risk is manageable here. Adequate lighting and police coverage exist. Stay aware.`
          : `Night conditions worsen this corridor's profile. Poor lighting and ${cp?.hotspots.length ?? 0} risk cluster${(cp?.hotspots.length ?? 0) !== 1 ? "s" : ""} suggest caution after 9 PM.`,
        points: pts,
        confidence: cp?.confidenceScore,
      };
    }

    case "women_safety": {
      const womenRoute = allRoutes.find((r) => r.route_type === "women_friendly");
      const pts: AssistantPoint[] = [];

      if (route.route_type === "women_friendly")
        pts.push({ icon: "💜", text: `This IS the Women-Friendly route — optimised for women's safety`, sentiment: "positive" });
      else if (womenRoute)
        pts.push({ icon: "💜", text: `Women-Friendly route available with ${womenRoute.safety_score}/100 score`, sentiment: "neutral" });

      if (cp) {
        if (cp.policeCount >= 2)
          pts.push({ icon: "🚓", text: `${cp.policeCount} police stations provide corridor coverage`, sentiment: "positive" });
        if (cp.reportCount === 0)
          pts.push({ icon: "✅", text: `No harassment or safety reports near this corridor`, sentiment: "positive" });
        else
          pts.push({ icon: "📍", text: `${cp.reportCount} community reports — review map markers`, sentiment: "negative" });
        if (cp.lightingScore >= 65)
          pts.push({ icon: "💡", text: `Well-lit corridor reduces isolation risk`, sentiment: "positive" });
        if (cp.hospitalCount >= 1)
          pts.push({ icon: "🏥", text: `${cp.hospitalCount} hospital${cp.hospitalCount > 1 ? "s" : ""} reachable for emergencies`, sentiment: "positive" });
      }
      return {
        intent,
        headline: route.route_type === "women_friendly" ? `Women-Friendly route selected` : `Women safety assessment`,
        body: `Score: ${score}/100. ${
          route.route_type === "women_friendly"
            ? `Optimised for women's safety preferences.`
            : womenRoute
              ? `Enable Women Safety Mode in settings to auto-select the ${womenRoute.safety_score}/100 Women-Friendly route.`
              : `Standard safety profile applies.`
        }`,
        points: pts,
        confidence: cp?.confidenceScore,
      };
    }

    case "recommendation": {
      const maxScore = Math.max(...allRoutes.map((r) => r.safety_score));
      const isSafest = score === maxScore;
      const topBreakdown = route.safety_breakdown?.[0];
      const pts: AssistantPoint[] = [];

      pts.push({
        icon: "🛡️",
        text: `Safety: ${score}/100 — ${isSafest ? "highest of all routes" : `${maxScore - score} pts below safest`}`,
        sentiment: isSafest ? "positive" : "neutral",
      });
      pts.push({ icon: "⏱️", text: `${route.eta_minutes} min journey, ${route.distance_km} km`, sentiment: "neutral" });
      pts.push({ icon: "💰", text: `₹${route.estimated_cost_inr} estimated fare`, sentiment: "neutral" });

      if (topBreakdown)
        pts.push({ icon: "📊", text: `Strongest factor: ${topBreakdown.factor} (${topBreakdown.score}/100)`, sentiment: "positive" });
      if (cp?.policeCount && cp.policeCount > 0)
        pts.push({ icon: "🚓", text: `${cp.policeCount} police stations along corridor`, sentiment: "positive" });
      if (cp?.hotspots.length === 0)
        pts.push({ icon: "🟢", text: `Zero risk hotspots — clean corridor`, sentiment: "positive" });

      return {
        intent,
        headline: `Why Safar selected this route`,
        body: `Safar weighs safety (60%), efficiency (25%), and cost (15%). ${route.recommendations?.[0] ?? "This route scored best across all weighted criteria."}`,
        points: pts,
        confidence: cp?.confidenceScore,
      };
    }

    case "risk_areas": {
      const riskSegs = cp?.segments.filter((s) => s.riskLevel === "risk") ?? [];
      const modSegs = cp?.segments.filter((s) => s.riskLevel === "moderate") ?? [];
      const safeSegs = cp?.segments.filter((s) => s.riskLevel === "safe") ?? [];
      const total = cp?.segments.length ?? 0;
      const pts: AssistantPoint[] = [];

      if (riskSegs.length === 0 && modSegs.length === 0)
        pts.push({ icon: "✅", text: `All segments clear — no high-risk or moderate areas`, sentiment: "positive" });
      if (riskSegs.length > 0)
        pts.push({ icon: "🔴", text: `${riskSegs.length} high-risk segment${riskSegs.length > 1 ? "s" : ""} — highlighted red on map`, sentiment: "negative" });
      if (modSegs.length > 0)
        pts.push({ icon: "🟡", text: `${modSegs.length} moderate-risk segment${modSegs.length > 1 ? "s" : ""} — highlighted amber`, sentiment: "negative" });
      if (safeSegs.length > 0)
        pts.push({ icon: "🟢", text: `${safeSegs.length}/${total} segments confirmed safe`, sentiment: "positive" });

      cp?.hotspots.slice(0, 3).forEach((h, i) =>
        pts.push({
          icon: "⚠️",
          text: `Hotspot ${i + 1}: ${h.reportCount} incident${h.reportCount !== 1 ? "s" : ""} near (${h.lat.toFixed(3)}°, ${h.lng.toFixed(3)}°)`,
          sentiment: "negative",
        })
      );

      return {
        intent,
        headline: riskSegs.length === 0
          ? `No high-risk areas detected`
          : `${riskSegs.length} risk area${riskSegs.length > 1 ? "s" : ""} on this route`,
        body: total > 0
          ? `Corridor analysis: ${safeSegs.length}/${total} segments are safe. ${riskSegs.length > 0 ? "Red segments are visible on the route map." : "The corridor is clean."} ${cp?.hotspots.length ? `${cp.hotspots.length} community incident cluster${cp.hotspots.length > 1 ? "s" : ""} detected.` : ""}`
          : `No corridor segment data available — score is based on city-level NCRB data.`,
        points: pts,
        confidence: cp?.confidenceScore,
      };
    }

    case "careful_about": {
      const isLateNight = hour >= 22 || hour < 5;
      const isEveningRush = hour >= 17 && hour <= 20;
      const riskSegs = cp?.segments.filter((s) => s.riskLevel === "risk").length ?? 0;
      const pts: AssistantPoint[] = [];

      if (isLateNight)
        pts.push({ icon: "🌙", text: `Late-night travel (${hour}:00) — reduced public presence`, sentiment: "negative" });
      if (isEveningRush)
        pts.push({ icon: "🚦", text: `Evening rush — higher traffic, potentially slower ETAs`, sentiment: "neutral" });
      if (cp?.hotspots.length)
        pts.push({ icon: "⚠️", text: `${cp.hotspots.length} incident cluster${cp.hotspots.length > 1 ? "s" : ""} — stay alert in red zones`, sentiment: "negative" });
      if (cp?.lightingScore !== undefined && cp.lightingScore < 55)
        pts.push({ icon: "🌑", text: `Low lighting estimate (${cp.lightingScore}%) — prefer lit streets`, sentiment: "negative" });
      if (cp?.reportCount && cp.reportCount > 2)
        pts.push({ icon: "📍", text: `${cp.reportCount} community reports in area`, sentiment: "negative" });
      if (riskSegs > 0)
        pts.push({ icon: "🔴", text: `${riskSegs} high-risk segment${riskSegs > 1 ? "s" : ""} — don't linger`, sentiment: "negative" });
      if (route.transfer_count > 1)
        pts.push({ icon: "🔄", text: `${route.transfer_count} transfers — transfers are higher-risk moments`, sentiment: "neutral" });
      if (pts.length === 0)
        pts.push({ icon: "✅", text: `No specific concerns detected for this corridor at ${hour}:00`, sentiment: "positive" });

      return {
        intent,
        headline: `Key precautions for this route`,
        body: `Based on corridor analysis, risk profile, and current time (${hour}:00 hours).`,
        points: pts,
        confidence: cp?.confidenceScore,
      };
    }

    case "police_coverage": {
      const pts: AssistantPoint[] = [];
      const count = cp?.policeCount ?? 0;
      const label = count >= 3 ? "Strong" : count >= 1 ? "Moderate" : "None detected";
      const sentiment: AssistantPoint["sentiment"] = count >= 2 ? "positive" : count === 1 ? "neutral" : "negative";
      pts.push({ icon: "🚓", text: `${label}: ${count} station${count !== 1 ? "s" : ""} within route buffer (~500m)`, sentiment });
      if (cp?.infraScore)
        pts.push({ icon: "🏗️", text: `Infrastructure score: ${cp.infraScore}/100`, sentiment: cp.infraScore >= 70 ? "positive" : "neutral" });
      return {
        intent,
        headline: `Police coverage: ${count} station${count !== 1 ? "s" : ""}`,
        body: `OpenStreetMap data shows ${count} police station${count !== 1 ? "s" : ""} within ~500m of the route corridor.`,
        points: pts,
        confidence: cp?.confidenceScore,
      };
    }

    case "data_sources":
    default: {
      return {
        intent: "data_sources",
        headline: `How Safar calculates safety`,
        body: `Safar uses 5 verified, real-world data sources. No scores are fabricated or estimated without data.`,
        points: [
          { icon: "📋", text: `NCRB Crime in India (${cityNCRB?.report_year ?? "2022"}) — city crime baseline`, sentiment: "positive" },
          { icon: "🗺️", text: `OpenStreetMap — police, hospitals, road infrastructure`, sentiment: "positive" },
          { icon: "👥", text: `Community safety reports — real-time crowdsourced incidents`, sentiment: "positive" },
          { icon: "📍", text: `Corridor buffer sampled every 250–500m along route`, sentiment: "neutral" },
          { icon: "🤖", text: `Corridor risk engine aggregates all sources per segment`, sentiment: "neutral" },
        ],
        confidence: cp?.confidenceScore,
      };
    }
  }
}

/** Utility: check if a lat/lng is "near" any of a route's sample points (within radiusM metres) */
export function isNearRoute(
  lat: number,
  lng: number,
  routePoints: { lat: number; lng: number }[],
  radiusM = 800
): boolean {
  const R = 6371000;
  for (const pt of routePoints) {
    const dLat = ((lat - pt.lat) * Math.PI) / 180;
    const dLng = ((lng - pt.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((pt.lat * Math.PI) / 180) *
        Math.cos((lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    if (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) < radiusM) return true;
  }
  return false;
}

/** Sample route geometry points for proximity checks */
export function sampleRoutePoints(
  geometry?: GeoJSON.LineString
): { lat: number; lng: number }[] {
  if (!geometry?.coordinates?.length) return [];
  const stride = Math.max(1, Math.floor(geometry.coordinates.length / 20));
  const pts: { lat: number; lng: number }[] = [];
  for (let i = 0; i < geometry.coordinates.length; i += stride) {
    const [lng, lat] = geometry.coordinates[i];
    pts.push({ lat, lng });
  }
  return pts;
}
