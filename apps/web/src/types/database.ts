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

// ── Supabase insert/update helpers ──────────────────────────────────────────

type SafetyReportInsert = {
  user_id: string;
  city_id: CityId;
  report_type: ReportType;
  description?: string | null;
  latitude: number;
  longitude: number;
  image_url?: string | null;
  upvotes?: number;
  verifications?: number;
  is_verified?: boolean;
  status?: string;
};

type SafetyReportUpdate = Partial<Pick<SafetyReport, "upvotes" | "verifications" | "is_verified" | "flag_count">>;

type LocationCacheRow = {
  query_key: string;
  display_name: string;
  latitude: number;
  longitude: number;
  city_id: CityId;
  expires_at: string;
  source?: string | null;
};

type RouteCacheRow = {
  cache_key: string;
  source_lat: number;
  source_lng: number;
  dest_lat: number;
  dest_lng: number;
  route_type: string;
  ors_profile: string;
  distance_km: number;
  duration_min: number;
  geometry: GeoJSON.LineString;
  expires_at: string;
};

type TripInsert = {
  user_id: string;
  city_id: CityId;
  route_id?: string | null;
  status?: string;
  current_lat?: number | null;
  current_lng?: number | null;
  share_token?: string | null;
  share_expires_at?: string | null;
  sos_triggered?: boolean;
};

type EmergencyContactInsert = {
  user_id: string;
  name: string;
  phone: string;
  relationship?: string | null;
};

type ReportUpvoteInsert = {
  report_id: string;
  user_id?: string | null;
};

type ReportCommentInsert = {
  report_id: string;
  user_id?: string | null;
  body: string;
};

type OsmPlaceInsert = {
  osm_id: number;
  osm_type: string;
  place_type: OsmPlaceType;
  name: string;
  latitude: number;
  longitude: number;
  city_id: CityId;
  tags: Record<string, string>;
  fetched_at: string;
};

// ── Database schema ──────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      cities: {
        Row: { id: string; name: string; center_lat: number; center_lng: number };
        Insert: { id: string; name: string; center_lat: number; center_lng: number };
        Update: Partial<{ name: string; center_lat: number; center_lng: number }>;
      };
      users: {
        Row: UserProfile;
        Insert: Partial<UserProfile> & { id: string };
        Update: Partial<UserProfile>;
      };
      safety_reports: {
        Row: SafetyReport;
        Insert: SafetyReportInsert;
        Update: SafetyReportUpdate;
      };
      safe_waiting_spots: {
        Row: SafeWaitingSpot;
        Insert: Omit<SafeWaitingSpot, "id">;
        Update: Partial<SafeWaitingSpot>;
      };
      osm_places: {
        Row: OsmPlaceInsert & { id: string };
        Insert: OsmPlaceInsert;
        Update: Partial<OsmPlaceInsert>;
      };
      location_cache: {
        Row: LocationCacheRow;
        Insert: LocationCacheRow;
        Update: Partial<LocationCacheRow>;
      };
      route_cache: {
        Row: RouteCacheRow;
        Insert: RouteCacheRow;
        Update: Partial<RouteCacheRow>;
      };
      trips: {
        Row: Trip;
        Insert: TripInsert;
        Update: Partial<Omit<Trip, "id" | "user_id" | "started_at">>;
      };
      emergency_contacts: {
        Row: EmergencyContact & { user_id: string };
        Insert: EmergencyContactInsert;
        Update: Partial<EmergencyContactInsert>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, "id" | "created_at">;
        Update: Partial<Pick<Notification, "is_read">>;
      };
      report_upvotes: {
        Row: ReportUpvoteInsert & { id: string; created_at: string };
        Insert: ReportUpvoteInsert;
        Update: never;
      };
      report_comments: {
        Row: CommunityComment;
        Insert: ReportCommentInsert;
        Update: Partial<Pick<CommunityComment, "body">>;
      };
      routes: {
        Row: PlannedRoute & { id: string; user_id: string; city_id: CityId; created_at: string };
        Insert: Omit<PlannedRoute, "id"> & { user_id: string; city_id: CityId };
        Update: Partial<PlannedRoute>;
      };
    };
    Functions: {
      increment_upvotes: {
        Args: { p_report_id: string };
        Returns: void;
      };
    };
  };
}
