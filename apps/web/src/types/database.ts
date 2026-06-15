export type CityId = "chennai" | "trivandrum" | "bangalore" | "hyderabad";

export type ReportType =
  | "harassment"
  | "poor_lighting"
  | "unsafe_bus_stop"
  | "suspicious_activity"
  | "flooded_area"
  | "road_damage"
  | "stray_animal"
  | "construction"
  | "unsafe_area"
  | "broken_light"
  | "dangerous_crossing";

export type RouteType = "safest" | "cheapest" | "balanced" | "women_friendly";

export type OsmPlaceType =
  | "hospital"
  | "police"
  | "petrol_pump"
  | "pharmacy"
  | "railway"
  | "metro"
  | "bus_stop"
  | "store";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  city_id: CityId;
  women_safety_mode: boolean;
  night_safe_preference: boolean;
  trust_score: number;
  safety_contribution_score: number;
  total_trips: number;
  reports_submitted: number;
}

export interface SafetyReport {
  id: string;
  user_id: string;
  city_id: CityId;
  report_type: ReportType;
  description: string | null;
  latitude: number;
  longitude: number;
  image_url: string | null;
  upvotes: number;
  verifications: number;
  is_verified: boolean;
  flag_count?: number;
  expires_at?: string | null;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  report_id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name?: string | null;
}

export interface SafeWaitingSpot {
  id: string;
  city_id: CityId;
  spot_type: OsmPlaceType | "store";
  name: string;
  latitude: number;
  longitude: number;
  is_24x7: boolean;
  safe_waiting_score?: number;
  distance_m?: number;
}

export interface RouteLeg {
  mode: string;
  from: string;
  to: string;
  duration_min: number;
  distance_km: number;
}

export interface PlannedRoute {
  id?: string;
  route_type: RouteType;
  source_name: string;
  destination_name: string;
  source_lat: number;
  source_lng: number;
  dest_lat: number;
  dest_lng: number;
  legs: RouteLeg[];
  safety_score: number;
  safety_breakdown: SafetyBreakdownItem[];
  distance_km: number;
  eta_minutes: number;
  estimated_cost_inr: number;
  reliability_score: number;
  crowd_level: string;
  walking_distance_km: number;
  transfer_count: number;
  geometry?: GeoJSON.LineString;
  recommendations: string[];
  /** Corridor-level safety intelligence — populated during route scoring */
  corridor_profile?: import("@/lib/corridor-risk").CorridorProfile;
}

export interface SafetyBreakdownItem {
  factor: string;
  weight_pct: number;
  score: number;
  contribution: number;
}

export interface Trip {
  id: string;
  user_id: string;
  route_id: string | null;
  city_id: CityId;
  status: "active" | "completed" | "cancelled";
  current_lat: number | null;
  current_lng: number | null;
  share_token: string | null;
  share_expires_at: string | null;
  sos_triggered: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
}

export interface Notification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      cities: { Row: { id: string; name: string; center_lat: number; center_lng: number } };
      users: { Row: UserProfile };
      safety_reports: { Row: SafetyReport };
      safe_waiting_spots: { Row: SafeWaitingSpot };
      osm_places: { Row: Record<string, unknown> };
      location_cache: { Row: Record<string, unknown> };
      route_cache: { Row: Record<string, unknown> };
      trips: { Row: Trip };
      emergency_contacts: { Row: EmergencyContact };
      notifications: { Row: Notification };
    };
  };
}
