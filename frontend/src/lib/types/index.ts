export interface SafetyFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface RouteLeg {
  mode: string;
  from: string;
  to: string;
  duration_min: number;
  distance_km: number;
}

export interface CctvCamera {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  surveillance_type?: string;
  operator?: string;
  distance_m?: number;
  source: string;
}

export interface RouteOption {
  id: string;
  route_type: "fastest" | "safest" | "greenest";
  source: string;
  destination: string;
  eta_minutes: number;
  distance_km: number;
  safety_score: number;
  safety_label: string;
  safety_breakdown: SafetyFactor[];
  cctv_nearby?: number;
  community_reports_nearby?: number;
  carbon_saved_kg: number;
  reward_tokens: number;
  legs: RouteLeg[];
  recommendations: string[];
}

export interface SafetyReport {
  id: string;
  report_type: string;
  description?: string;
  latitude: number;
  longitude: number;
  upvotes: number;
  verifications: number;
  is_verified: boolean;
}

export interface Trip {
  id: string;
  route_id: string;
  route: RouteOption;
  status: string;
  share_link?: string;
  tokens_earned?: number;
  co2_saved_kg?: number;
}

export interface Wallet {
  balance: number;
  lifetime_tokens: number;
  lifetime_co2_kg: number;
  green_trips_count: number;
}

export interface LeaderboardEntry {
  rank: number;
  entity_name: string;
  tokens_earned: number;
  carbon_saved_kg: number;
  green_trips: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  college?: string;
  women_safety_mode: boolean;
  night_safe_preference: boolean;
  trust_score: number;
  wallet?: Wallet;
}
