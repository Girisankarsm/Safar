/**
 * Infrastructure-Aware Lighting Heuristic
 *
 * Replaces the simplistic "is it after 8 PM?" check with a two-axis model:
 *
 *   Axis 1 — Road Class (from OSM via ORS extra_info or inferred from route)
 *     primary / trunk   → designed for high-volume traffic → well-lit
 *     residential / path → low-traffic, often no street lighting
 *
 *   Axis 2 — Commercial Density (counted from OSM Overpass data)
 *     High (5+ nodes within 200m) → active area, ambient commercial lighting
 *     Zero commercial nodes       → isolated corridor, no ambient light
 *
 * This lets us distinguish:
 *   Anna Salai at 11 PM  → primary + dense commercial → SAFE, 0.4× night penalty
 *   Back lane in Adyar   → residential + no shops     → RISKY, 1.5× night penalty
 */

export type OsmHighwayClass =
  | "motorway" | "trunk" | "primary" | "secondary"
  | "tertiary" | "residential" | "unclassified"
  | "path" | "footway" | "cycleway" | "service" | "unknown";

export type LightingTier = "commercial" | "arterial" | "residential" | "isolated";

export type LightingModifier = {
  /**
   * Multiplier on the raw night-time risk penalty.
   * < 1.0 = safer than average (well-lit commercial corridor)
   * > 1.0 = riskier (dark residential / isolated path)
   */
  nightRiskMultiplier: number;
  /** Adjusted 0–100 lighting score after applying road-class + density model */
  adjustedLightingScore: number;
  /** Plain-English explanation — surfaces in the Safety Analysis panel */
  explanation: string;
  tier: LightingTier;
};

// Highway class sets ─────────────────────────────────────────────────────────
const WELL_LIT: Set<OsmHighwayClass> = new Set([
  "motorway", "trunk", "primary", "secondary",
]);
const QUIET: Set<OsmHighwayClass> = new Set([
  "residential", "unclassified", "path", "footway", "cycleway", "service",
]);

// Commercial density thresholds (within 200m of the corridor centre line)
const DENSE_COMMERCIAL = 5;  // 5+ nodes → busy corridor, ambient lighting
const SOME_COMMERCIAL  = 2;  // 2–4 nodes → mixed

/**
 * Computes the lighting modifier for a given route context.
 *
 * @param dominantHighwayClass  The most prevalent OSM highway class on the route
 * @param commercialNodeCount   # of shops/restaurants/cafes/metros within 200m of route
 * @param departureHour         0–23 hour of travel
 * @param baseLightingScore     Current 0–100 base lighting score from police/distance heuristic
 */
export function computeLightingModifier(
  dominantHighwayClass: OsmHighwayClass,
  commercialNodeCount: number,
  departureHour: number,
  baseLightingScore: number
): LightingModifier {
  const isNight = departureHour >= 20 || departureHour < 6;
  const isDusk  = (departureHour >= 18 && departureHour < 20) ||
                  (departureHour >= 6  && departureHour < 7);

  // Daytime: lighting model is irrelevant — return neutral
  if (!isNight && !isDusk) {
    return {
      nightRiskMultiplier: 1.0,
      adjustedLightingScore: baseLightingScore,
      explanation: "Daylight travel — road-class lighting not a significant factor",
      tier: inferTier(dominantHighwayClass, commercialNodeCount),
    };
  }

  const wellLit = WELL_LIT.has(dominantHighwayClass);
  const quiet   = QUIET.has(dominantHighwayClass);
  const dense   = commercialNodeCount >= DENSE_COMMERCIAL;
  const some    = commercialNodeCount >= SOME_COMMERCIAL;

  // Tier 1 — Primary/trunk corridor + dense commercial activity
  // Example: MG Road Bengaluru, Anna Salai Chennai — bright even at midnight
  if ((wellLit && dense) || (dense && !quiet)) {
    return {
      nightRiskMultiplier: 0.4,
      adjustedLightingScore: Math.min(95, Math.round(baseLightingScore * 1.25)),
      explanation:
        `${dominantHighwayClass} road · ${commercialNodeCount} active commercial nodes — ` +
        "well-lit corridor, ambient commercial lighting provides strong visibility",
      tier: "commercial",
    };
  }

  // Tier 2 — Main road + moderate commercial presence
  if (wellLit && some) {
    return {
      nightRiskMultiplier: 0.7,
      adjustedLightingScore: Math.min(90, Math.round(baseLightingScore * 1.1)),
      explanation:
        `${dominantHighwayClass} arterial with ${commercialNodeCount} commercial nodes — ` +
        "reasonable street infrastructure, moderate ambient lighting",
      tier: "arterial",
    };
  }

  // Tier 3 — Primary/secondary road but commercially quiet
  if (wellLit) {
    return {
      nightRiskMultiplier: 0.85,
      adjustedLightingScore: baseLightingScore,
      explanation:
        `${dominantHighwayClass} road — arterial lighting present but limited commercial activity`,
      tier: "arterial",
    };
  }

  // Tier 4 — Residential / unclassified / path with zero commercial nodes
  // Example: quiet back lane, unlit footpath
  if (quiet && commercialNodeCount === 0) {
    return {
      nightRiskMultiplier: 1.5,
      adjustedLightingScore: Math.max(20, Math.round(baseLightingScore * 0.65)),
      explanation:
        `${dominantHighwayClass} road · 0 commercial nodes — ` +
        "isolated corridor with no ambient lighting; night travel not recommended",
      tier: "isolated",
    };
  }

  // Default — residential with some footfall
  return {
    nightRiskMultiplier: 1.15,
    adjustedLightingScore: Math.max(30, Math.round(baseLightingScore * 0.85)),
    explanation:
      `${dominantHighwayClass} residential road with limited street infrastructure`,
    tier: "residential",
  };
}

function inferTier(h: OsmHighwayClass, c: number): LightingTier {
  if (c >= DENSE_COMMERCIAL)         return "commercial";
  if (WELL_LIT.has(h))               return "arterial";
  if (QUIET.has(h) && c === 0)       return "isolated";
  return "residential";
}

/**
 * Maps ORS waytype integer codes to OSM highway class strings.
 *
 * ORS encodes road type in `extra_info.waytypes` when
 * `extra_info: ["waytype"]` is included in the route request.
 * Values: 0=unknown 1=stateRoad 2=road 3=path 4=street
 *         5=cycleway 6=footway 7=steps 9=constructionTrack
 */
export function orsWaytypeToDominantClass(
  waytypeValues?: number[]
): OsmHighwayClass {
  if (!waytypeValues?.length) return "unknown";

  const freq = new Map<number, number>();
  for (const v of waytypeValues) freq.set(v, (freq.get(v) ?? 0) + 1);
  const dominant = [...freq.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;

  const map: Record<number, OsmHighwayClass> = {
    0: "unknown", 1: "primary", 2: "secondary",
    3: "residential", 4: "residential",
    5: "cycleway", 6: "footway", 7: "path",
    9: "unclassified", 10: "service",
  };
  return map[dominant] ?? "unknown";
}

/**
 * Counts commercial/active-use nodes from an existing OSM places array.
 * Uses already-fetched Overpass data — no extra API calls needed.
 *
 * "Commercial" here means anything that creates ambient lighting:
 * bus stops, metro entries, petrol pumps, pharmacies, stores.
 */
export function countCommercialNodes(
  osmPlaces: Array<{ place_type: string }>,
  commercialTypes = new Set(["bus_stop", "metro", "railway", "store", "pharmacy", "petrol_pump"])
): number {
  return osmPlaces.filter((p) => commercialTypes.has(p.place_type)).length;
}
