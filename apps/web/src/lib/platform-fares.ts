import { isNightHour, isPeakHour } from "@/lib/time-safety";
import type { PlannedRoute } from "@/types/database";

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

function surgeMultiplier(departureHour: number): number {
  if (isNightHour(departureHour)) return 1.22;
  if (isPeakHour(departureHour)) return 1.12;
  return 1;
}

function estimateFare(
  card: RateCard,
  distanceKm: number,
  departureHour: number,
  overrideFare?: number
): number {
  if (overrideFare != null) return overrideFare;
  const raw = card.base + distanceKm * card.perKm;
  return Math.round(Math.max(card.minFare, raw) * surgeMultiplier(departureHour));
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
  womenMode: boolean
): VehicleQuote {
  const card = PLATFORMS[id];
  const isTransit = id === "safar_transit";
  return {
    id,
    mode: card.mode,
    fareInr: estimateFare(
      card,
      route.distance_km,
      departureHour,
      isTransit ? route.estimated_cost_inr : undefined
    ),
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

export function comparePlatformBrands(
  route: PlannedRoute,
  options?: { departureHour?: number; womenSafetyMode?: boolean }
): PlatformBrand[] {
  const departureHour = options?.departureHour ?? new Date().getHours();
  const womenMode = options?.womenSafetyMode ?? false;

  return BRAND_GROUPS.map(({ id, vehicleIds }) => {
    const vehicles = vehicleIds.map((vid) =>
      buildVehicleQuote(vid, route, departureHour, womenMode)
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
