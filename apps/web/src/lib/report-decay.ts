/**
 * Temporal Decay Engine
 *
 * Reports are not permanent fixtures — a harassment incident from 3 hours ago
 * is an active alert; the same incident from 72 hours ago is a historical signal.
 *
 * Formula:  w(t) = InitialWeight × e^(−λ × t)
 *   t      = elapsed time in hours since report was created
 *   λ      = ln(2) / HALF_LIFE_HOURS
 *          → report weight halves every HALF_LIFE_HOURS (24h)
 *
 * Regime transitions (used by map pulse speed + segment scorer):
 *   0–3h   ACTIVE ALERT    → weight ≈ 1.0  — fast pulse, full corridor penalty
 *   3–24h  RECENT RISK     → 0.5–1.0       — normal pulse, included in clustering
 *   24–48h COOLING DOWN    → 0.15–0.5      — slow pulse, demoted in scoring
 *   48h+   HISTORICAL      → < 0.15        — no pulse, baseline trend signal only
 */

export type ReportAgeRegime = "active" | "recent" | "cooling" | "historical";

/** Half-life: weight halves every 24 hours */
const HALF_LIFE_HOURS = 24;
const LAMBDA = Math.LN2 / HALF_LIFE_HOURS; // ≈ 0.02888 per hour

/**
 * High-severity incident types decay more slowly — a harassment report
 * from 30h ago is still more relevant than a pothole from 30h ago.
 * Lambda is reduced by 40% → effective half-life extends to 40h.
 */
const HIGH_SEVERITY_TYPES = new Set(["harassment", "unsafe_area"]);
const HIGH_SEVERITY_LAMBDA = LAMBDA * 0.6;

/**
 * Minimum weight floor — stops a very old report from contributing
 * literally zero; it becomes a weak historical baseline signal instead.
 */
const WEIGHT_FLOOR = 0.05;

/**
 * Returns a 0–1 decay weight for a single report.
 *
 * @param createdAt  ISO timestamp of when the report was filed
 * @param reportType Optional report_type to apply severity-adjusted decay
 * @param now        Injection point for the current time (testable)
 */
export function decayWeight(
  createdAt: string,
  reportType?: string,
  now: Date = new Date()
): number {
  const ageMs = now.getTime() - new Date(createdAt).getTime();
  const ageHours = ageMs / 3_600_000;

  // Active alert window — full weight, no decay applied
  if (ageHours < 3) return 1.0;

  const lambda =
    reportType && HIGH_SEVERITY_TYPES.has(reportType)
      ? HIGH_SEVERITY_LAMBDA
      : LAMBDA;

  return Math.max(WEIGHT_FLOOR, Math.exp(-lambda * ageHours));
}

/**
 * Classifies a report's age into a named regime.
 * Used to drive map animation speed and UI badge colours.
 */
export function reportAgeRegime(createdAt: string): ReportAgeRegime {
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (ageHours < 3) return "active";
  if (ageHours < 24) return "recent";
  if (ageHours < 48) return "cooling";
  return "historical";
}

/**
 * Converts a list of reports near a corridor point into a single
 * decay-weighted effective count.
 *
 * Example: 3 reports where weights are [1.0, 0.6, 0.12] → 1.72 effective reports.
 * This prevents stale ghost-alerts from inflating present-tense risk scores.
 */
export function weightedReportCount(
  reports: Array<{ created_at: string; report_type?: string }>,
  now: Date = new Date()
): number {
  return reports.reduce(
    (sum, r) => sum + decayWeight(r.created_at, r.report_type, now),
    0
  );
}

/**
 * Separates a report list into regime buckets.
 * Used by the Safety Story and real-time alerts panel.
 */
export function classifyReports<T extends { created_at: string }>(reports: T[]): {
  activeAlerts: T[];
  recentRisk: T[];
  cooling: T[];
  historical: T[];
} {
  const buckets = {
    activeAlerts: [] as T[],
    recentRisk: [] as T[],
    cooling: [] as T[],
    historical: [] as T[],
  };
  for (const r of reports) {
    const regime = reportAgeRegime(r.created_at);
    if (regime === "active") buckets.activeAlerts.push(r);
    else if (regime === "recent") buckets.recentRisk.push(r);
    else if (regime === "cooling") buckets.cooling.push(r);
    else buckets.historical.push(r);
  }
  return buckets;
}
