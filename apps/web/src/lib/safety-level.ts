export type SafetyLevel = "very_safe" | "safe" | "moderate" | "high_risk";

export type SafetyLevelInfo = {
  level: SafetyLevel;
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
};

export function getSafetyLevel(score: number): SafetyLevelInfo {
  if (score >= 85) {
    return {
      level: "very_safe",
      label: "Very Safe",
      shortLabel: "Very Safe",
      color: "#22C55E",
      bgColor: "rgba(34,197,94,0.12)",
      borderColor: "rgba(34,197,94,0.35)",
      description: "Excellent safety conditions with strong community and infrastructure support.",
    };
  }
  if (score >= 70) {
    return {
      level: "safe",
      label: "Safe",
      shortLabel: "Safe",
      color: "#3B82F6",
      bgColor: "rgba(59,130,246,0.12)",
      borderColor: "rgba(59,130,246,0.35)",
      description: "Generally safe corridor with reasonable infrastructure nearby.",
    };
  }
  if (score >= 50) {
    return {
      level: "moderate",
      label: "Moderate Risk",
      shortLabel: "Moderate",
      color: "#F59E0B",
      bgColor: "rgba(245,158,11,0.12)",
      borderColor: "rgba(245,158,11,0.35)",
      description: "Some safety factors need attention — stay alert and prefer well-lit routes.",
    };
  }
  return {
    level: "high_risk",
    label: "High Risk",
    shortLabel: "High Risk",
    color: "#EF4444",
    bgColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.35)",
    description: "Elevated risk detected — consider an alternative route or travel during daylight.",
  };
}

export type RiskLevel = "Low" | "Moderate" | "High";

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "Low";
  if (score >= 50) return "Moderate";
  return "High";
}
