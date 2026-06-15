import { isNightHour, isPeakHour } from "@/lib/time-safety";
import type { CityId, PlannedRoute } from "@/types/database";

export type RidePlatformId =
  | "uber_go"
  | "uber_premier"
  | "uber_auto"
  | "ola_mini"
  | "ola_prime"
  | "ola_bike"
  | "rapido_bike"
  | "rapido_auto"
  | "namma_yatri"
  | "local_auto"
  | "safar_transit";

export type VehicleQuote = {
  id: RidePlatformId;
  mode: string;
  fareInr: number;
  fareBreakdown: {
    base: number;
    distance: number;
    toll: number;
    surgeMultiplier: number;
    surgeLabel: string;
  };
  etaMinutes: number;
  safetyScore: number;
  safetyNote: string;
};

export type PlatformBrand = {
  id: string;
  name: string;
  brandColor: string;
  vehicles: VehicleQuote[];
  defaultVehicleId: RidePlatformId;
};

export type PlatformQuote = VehicleQuote & {
  name: string;
  highlights: ("cheapest" | "safest" | "fastest")[];
  brandColor: string;
};

export type VehicleCategory = "auto" | "bike" | "economy" | "premium" | "transit";

export const VEHICLE_CATEGORIES: VehicleCategory[] = [
  "auto",
  "bike",
  "economy",
  "premium",
  "transit",
];

const VEHICLE_CATEGORY_BY_ID: Record<RidePlatformId, VehicleCategory> = {
  uber_go: "economy",
  uber_premier: "premium",
  uber_auto: "auto",
  ola_mini: "economy",
  ola_prime: "premium",
  ola_bike: "bike",
  rapido_bike: "bike",
  rapido_auto: "auto",
  namma_yatri: "auto",
  local_auto: "auto",
  safar_transit: "transit",
};

export type CategoryComparisonRow = {
  brand: PlatformBrand;
  vehicle: VehicleQuote;
};

type RateCard = {
  name: string;
  mode: string;
  base: number;
  perKm: number;
  minFare: number;
  avgSpeedKmh: number;
  safetyModifier: number;
  safetyNote: string;
  brandColor: string;
};

const PLATFORMS: Record<RidePlatformId, RateCard> = {
  uber_go: {
    name: "Uber",
    mode: "Go",
    base: 40,
    perKm: 12,
    minFare: 80,
    avgSpeedKmh: 24,
    safetyModifier: 6,
    safetyNote: "GPS tracking & driver verification",
    brandColor: "#111111",
  },
  uber_premier: {
    name: "Uber",
    mode: "Premier",
    base: 60,
    perKm: 18,
    minFare: 120,
    avgSpeedKmh: 24,
    safetyModifier: 10,
    safetyNote: "Premium cabs, higher driver vetting",
    brandColor: "#111111",
  },
  uber_auto: {
    name: "Uber",
    mode: "Auto",
    base: 28,
    perKm: 11,
    minFare: 55,
    avgSpeedKmh: 18,
    safetyModifier: 0,
    safetyNote: "App-booked autos with trip tracking",
    brandColor: "#111111",
  },
  ola_mini: {
    name: "Ola",
    mode: "Mini",
    base: 35,
    perKm: 11,
    minFare: 75,
    avgSpeedKmh: 23,
    safetyModifier: 5,
    safetyNote: "In-app SOS & ride tracking",
    brandColor: "#1B8F4E",
  },
  ola_prime: {
    name: "Ola",
    mode: "Prime",
    base: 55,
    perKm: 16,
    minFare: 110,
    avgSpeedKmh: 23,
    safetyModifier: 9,
    safetyNote: "Sedan rides with verified drivers",
    brandColor: "#1B8F4E",
  },
  ola_bike: {
    name: "Ola",
    mode: "Bike",
    base: 22,
    perKm: 6,
    minFare: 38,
    avgSpeedKmh: 20,
    safetyModifier: -16,
    safetyNote: "Quick bike rides; wear helmet",
    brandColor: "#1B8F4E",
  },
  rapido_bike: {
    name: "Rapido",
    mode: "Bike",
    base: 20,
    perKm: 5,
    minFare: 35,
    avgSpeedKmh: 20,
    safetyModifier: -18,
    safetyNote: "Lowest cost; helmet & night risk",
    brandColor: "#F4C430",
  },
  rapido_auto: {
    name: "Rapido",
    mode: "Auto",
    base: 25,
    perKm: 10,
    minFare: 50,
    avgSpeedKmh: 18,
    safetyModifier: -4,
    safetyNote: "Quick short trips; limited shelter",
    brandColor: "#F4C430",
  },
  namma_yatri: {
    name: "Namma Yatri",
    mode: "Auto",
    base: 30,
    perKm: 11,
    minFare: 55,
    avgSpeedKmh: 18,
    safetyModifier: 2,
    safetyNote: "Zero commission autos in supported cities",
    brandColor: "#7C3AED",
  },
  local_auto: {
    name: "Local",
    mode: "Auto",
    base: 30,
    perKm: 12,
    minFare: 50,
    avgSpeedKmh: 17,
    safetyModifier: -8,
    safetyNote: "Meter/auto negotiate; no app tracking",
    brandColor: "#71717A",
  },
  safar_transit: {
    name: "Safar",
    mode: "Transit",
    base: 0,
    perKm: 0,
    minFare: 0,
    avgSpeedKmh: 22,
    safetyModifier: 0,
    safetyNote: "Multi-modal public route with community safety score",
    brandColor: "#3B82F6",
  },
};

const BRAND_GROUPS: { id: string; vehicleIds: RidePlatformId[] }[] = [
  { id: "uber", vehicleIds: ["uber_go", "uber_premier", "uber_auto"] },
  { id: "ola", vehicleIds: ["ola_mini", "ola_prime", "ola_bike"] },
  { id: "rapido", vehicleIds: ["rapido_bike", "rapido_auto"] },
  { id: "namma_yatri", vehicleIds: ["namma_yatri"] },
  { id: "local", vehicleIds: ["local_auto"] },
  { id: "safar", vehicleIds: ["safar_transit"] },
];

/* ─────────────────────────────────────────────────────────────────────
   City-specific rate overrides (2024–25 published tariffs)
   Source: Uber/Ola app fare breakdown screens + Rapido in-app pricing
   ───────────────────────────────────────────────────────────────────── */

type CityRateOverride = Partial<Pick<RateCard, "base" | "perKm" | "minFare">>;

const CITY_OVERRIDES: Partial<Record<RidePlatformId, Record<CityId, CityRateOverride>>> = {
  uber_auto: {
    bangalore:  { base: 30, perKm: 14, minFare: 70 },
    chennai:    { base: 28, perKm: 11, minFare: 55 },
    hyderabad:  { base: 30, perKm: 12, minFare: 60 },
    trivandrum: { base: 25, perKm: 10, minFare: 50 },
  },
  uber_go: {
    bangalore:  { base: 50, perKm: 14, minFare: 95 },
    chennai:    { base: 40, perKm: 12, minFare: 80 },
    hyderabad:  { base: 45, perKm: 13, minFare: 85 },
    trivandrum: { base: 35, perKm: 11, minFare: 70 },
  },
  uber_premier: {
    bangalore:  { base: 65, perKm: 20, minFare: 130 },
    chennai:    { base: 60, perKm: 18, minFare: 120 },
    hyderabad:  { base: 60, perKm: 18, minFare: 115 },
    trivandrum: { base: 50, perKm: 15, minFare: 100 },
  },
  ola_mini: {
    bangalore:  { base: 40, perKm: 13, minFare: 85 },
    chennai:    { base: 35, perKm: 11, minFare: 75 },
    hyderabad:  { base: 35, perKm: 12, minFare: 70 },
    trivandrum: { base: 30, perKm: 10, minFare: 60 },
  },
  ola_prime: {
    bangalore:  { base: 60, perKm: 17, minFare: 120 },
    chennai:    { base: 55, perKm: 16, minFare: 110 },
    hyderabad:  { base: 55, perKm: 15, minFare: 105 },
    trivandrum: { base: 45, perKm: 14, minFare: 90 },
  },
  ola_bike: {
    bangalore:  { base: 20, perKm: 6, minFare: 35 },
    chennai:    { base: 22, perKm: 6, minFare: 38 },
    hyderabad:  { base: 20, perKm: 5, minFare: 33 },
    trivandrum: { base: 18, perKm: 5, minFare: 30 },
  },
  rapido_auto: {
    bangalore:  { base: 30, perKm: 12, minFare: 55 },
    chennai:    { base: 25, perKm: 10, minFare: 48 },
    hyderabad:  { base: 25, perKm: 11, minFare: 50 },
    trivandrum: { base: 22, perKm: 9,  minFare: 40 },
  },
  rapido_bike: {
    bangalore:  { base: 22, perKm: 6, minFare: 38 },
    chennai:    { base: 20, perKm: 5, minFare: 35 },
    hyderabad:  { base: 20, perKm: 5, minFare: 33 },
    trivandrum: { base: 18, perKm: 4, minFare: 30 },
  },
  namma_yatri: {
    bangalore:  { base: 30, perKm: 14, minFare: 60 },
    chennai:    { base: 28, perKm: 11, minFare: 55 },
    hyderabad:  { base: 28, perKm: 12, minFare: 50 },
    trivandrum: { base: 25, perKm: 10, minFare: 45 },
  },
  local_auto: {
    bangalore:  { base: 35, perKm: 15, minFare: 50 },
    chennai:    { base: 25, perKm: 12, minFare: 40 },
    hyderabad:  { base: 30, perKm: 13, minFare: 45 },
    trivandrum: { base: 20, perKm: 10, minFare: 35 },
  },
};

/** Merge city-specific overrides on top of the default rate card */
function getEffectiveCard(id: RidePlatformId, cityId?: CityId): RateCard {
  const base = PLATFORMS[id];
  if (!cityId) return base;
  const override = CITY_OVERRIDES[id]?.[cityId];
  return override ? { ...base, ...override } : base;
}

/* ─────────────────────────────────────────────────────────────────────
   Granular surge multipliers
   Based on observed Uber/Ola dynamic pricing patterns (India, 2024)
   ───────────────────────────────────────────────────────────────────── */

export type SurgeInfo = { multiplier: number; label: string };

export function getSurgeInfo(hour: number): SurgeInfo {
  if (hour >= 1 && hour < 5)   return { multiplier: 1.40, label: "Deep night ×1.4" };
  if (hour >= 22 || hour < 1)  return { multiplier: 1.30, label: "Late night ×1.3" };
  if (hour >= 17 && hour < 21) return { multiplier: 1.22, label: "Evening rush ×1.22" };
  if (hour >= 7  && hour < 10) return { multiplier: 1.18, label: "Morning rush ×1.18" };
  return { multiplier: 1.0, label: "Normal" };
}

/* ─────────────────────────────────────────────────────────────────────
   Toll estimation
   Based on NHAI toll plazas on common urban corridors (2024 rates)
   ───────────────────────────────────────────────────────────────────── */

const TOLL_THRESHOLD_KM = 14;

const CITY_TOLL_INR: Record<CityId, number> = {
  bangalore:  45,   // ORR / NICE corridor
  hyderabad:  55,   // ORR inner ring
  chennai:    30,   // ECR / IT corridor
  trivandrum:  0,   // No major toll on urban routes
};

function estimateToll(distanceKm: number, cityId?: CityId): number {
  if (!cityId || distanceKm < TOLL_THRESHOLD_KM) return 0;
  // Only cabs (not autos/bikes) pay tolls
  return CITY_TOLL_INR[cityId] ?? 0;
}

function isTollApplicable(id: RidePlatformId): boolean {
  return ["uber_go", "uber_premier", "ola_mini", "ola_prime"].includes(id);
}

/* ─────────────────────────────────────────────────────────────────────
   Fare calculation
   ───────────────────────────────────────────────────────────────────── */

function estimateFare(
  card: RateCard,
  id: RidePlatformId,
  distanceKm: number,
  departureHour: number,
  cityId?: CityId,
  overrideFare?: number
): VehicleQuote["fareBreakdown"] & { total: number } {
  if (overrideFare != null) {
    return {
      base: 0, distance: 0, toll: 0,
      surgeMultiplier: 1, surgeLabel: "Fixed",
      total: overrideFare,
    };
  }

  const { multiplier, label } = getSurgeInfo(departureHour);
  const rawBase = card.base;
  const rawDist = distanceKm * card.perKm;
  const preRaw = Math.max(card.minFare, rawBase + rawDist);
  const surgedFare = Math.round(preRaw * multiplier);
  const toll = isTollApplicable(id) ? estimateToll(distanceKm, cityId) : 0;
  return {
    base: rawBase,
    distance: Math.round(rawDist),
    toll,
    surgeMultiplier: multiplier,
    surgeLabel: label,
    total: surgedFare + toll,
  };
}

function estimateEta(card: RateCard, distanceKm: number, overrideEta?: number): number {
  if (overrideEta != null) return overrideEta;
  return Math.max(5, Math.round((distanceKm / card.avgSpeedKmh) * 60 + 4));
}

function platformSafetyScore(
  baseScore: number,
  card: RateCard,
  departureHour: number,
  womenMode: boolean
): number {
  let score = baseScore + card.safetyModifier;
  if (womenMode && card.safetyModifier >= 0) score += 4;
  if (isNightHour(departureHour) && card.mode === "Bike") score -= 12;
  if (isNightHour(departureHour) && card.mode === "Auto") score -= 5;
  return Math.max(12, Math.min(98, Math.round(score)));
}

function buildVehicleQuote(
  id: RidePlatformId,
  route: PlannedRoute,
  departureHour: number,
  womenMode: boolean,
  cityId?: CityId
): VehicleQuote {
  const card = getEffectiveCard(id, cityId);
  const isTransit = id === "safar_transit";

  const breakdown = estimateFare(
    card,
    id,
    route.distance_km,
    departureHour,
    cityId,
    isTransit ? route.estimated_cost_inr : undefined
  );

  return {
    id,
    mode: card.mode,
    fareInr: breakdown.total,
    fareBreakdown: breakdown,
    etaMinutes: estimateEta(
      card,
      route.distance_km,
      isTransit ? route.eta_minutes : undefined
    ),
    safetyScore: isTransit
      ? route.safety_score
      : platformSafetyScore(route.safety_score, card, departureHour, womenMode),
    safetyNote: card.safetyNote,
  };
}

export function compareByVehicleCategory(
  route: PlannedRoute,
  category: VehicleCategory,
  options?: { departureHour?: number; womenSafetyMode?: boolean; cityId?: CityId }
): CategoryComparisonRow[] {
  const brands = comparePlatformBrands(route, options);
  return brands
    .map((brand) => {
      const vehicle = brand.vehicles.find(
        (v) => VEHICLE_CATEGORY_BY_ID[v.id] === category
      );
      return vehicle ? { brand, vehicle } : null;
    })
    .filter((row): row is CategoryComparisonRow => row != null);
}

export function comparePlatformBrands(
  route: PlannedRoute,
  options?: { departureHour?: number; womenSafetyMode?: boolean; cityId?: CityId }
): PlatformBrand[] {
  const departureHour = options?.departureHour ?? new Date().getHours();
  const womenMode = options?.womenSafetyMode ?? false;
  const cityId = options?.cityId;

  return BRAND_GROUPS.map(({ id, vehicleIds }) => {
    const vehicles = vehicleIds.map((vid) =>
      buildVehicleQuote(vid, route, departureHour, womenMode, cityId)
    );
    const sample = PLATFORMS[vehicleIds[0]];
    const cheapest = vehicles.reduce((a, b) => (a.fareInr <= b.fareInr ? a : b));
    return {
      id,
      name: sample.name,
      brandColor: sample.brandColor,
      vehicles,
      defaultVehicleId: cheapest.id,
    };
  });
}

export function quoteWithHighlights(
  quote: VehicleQuote & { name: string; brandColor: string },
  allQuotes: VehicleQuote[]
): PlatformQuote {
  const minFare = Math.min(...allQuotes.map((q) => q.fareInr));
  const maxSafety = Math.max(...allQuotes.map((q) => q.safetyScore));
  const minEta = Math.min(...allQuotes.map((q) => q.etaMinutes));
  return {
    ...quote,
    highlights: [
      ...(quote.fareInr === minFare ? (["cheapest"] as const) : []),
      ...(quote.safetyScore === maxSafety ? (["safest"] as const) : []),
      ...(quote.etaMinutes === minEta ? (["fastest"] as const) : []),
    ],
  };
}

/** @deprecated Use comparePlatformBrands — kept for compatibility */
export function comparePlatformFares(
  route: PlannedRoute,
  options?: { departureHour?: number; womenSafetyMode?: boolean }
): PlatformQuote[] {
  const brands = comparePlatformBrands(route, options);
  const allVehicles = brands.flatMap((b) => b.vehicles);
  return brands.map((b) => {
    const v = b.vehicles.find((x) => x.id === b.defaultVehicleId) ?? b.vehicles[0];
    return quoteWithHighlights(
      { ...v, name: b.name, brandColor: b.brandColor },
      allVehicles
    );
  });
}
