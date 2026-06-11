-- Safar: Initial PostgreSQL schema (Supabase)
-- Run via Supabase CLI or SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Cities ──────────────────────────────────────────────────────────────────
CREATE TABLE public.cities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Users (extends auth.users) ────────────────────────────────────────────
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  city_id TEXT REFERENCES public.cities(id) DEFAULT 'chennai',
  women_safety_mode BOOLEAN DEFAULT TRUE,
  night_safe_preference BOOLEAN DEFAULT FALSE,
  trust_score INTEGER DEFAULT 50 CHECK (trust_score BETWEEN 0 AND 100),
  safety_contribution_score INTEGER DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  reports_submitted INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Safety reports ──────────────────────────────────────────────────────────
CREATE TABLE public.safety_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  city_id TEXT NOT NULL REFERENCES public.cities(id),
  report_type TEXT NOT NULL CHECK (report_type IN (
    'harassment', 'poor_lighting', 'unsafe_bus_stop', 'suspicious_activity',
    'flooded_area', 'road_damage', 'stray_animal', 'construction',
    'unsafe_area', 'broken_light', 'dangerous_crossing'
  )),
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  image_url TEXT,
  upvotes INTEGER DEFAULT 0,
  verifications INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Report votes ────────────────────────────────────────────────────────────
CREATE TABLE public.report_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  report_id UUID NOT NULL REFERENCES public.safety_reports(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'verify')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, report_id, vote_type)
);

-- ── Community comments ──────────────────────────────────────────────────────
CREATE TABLE public.community_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.safety_reports(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Safety zones (heatmap) ───────────────────────────────────────────────────
CREATE TABLE public.safety_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id TEXT NOT NULL REFERENCES public.cities(id),
  zone_type TEXT NOT NULL CHECK (zone_type IN ('safe', 'moderate', 'high_risk')),
  label TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  risk_weight DOUBLE PRECISION NOT NULL CHECK (risk_weight BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Safe waiting spots ───────────────────────────────────────────────────────
CREATE TABLE public.safe_waiting_spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id TEXT NOT NULL REFERENCES public.cities(id),
  spot_type TEXT NOT NULL CHECK (spot_type IN (
    'petrol_pump', 'pharmacy', 'metro', 'railway', 'police', 'hospital', 'store'
  )),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_24x7 BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Routes (cached route plans) ─────────────────────────────────────────────
CREATE TABLE public.routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  city_id TEXT NOT NULL REFERENCES public.cities(id),
  route_type TEXT NOT NULL CHECK (route_type IN ('safest', 'cheapest', 'balanced', 'women_friendly')),
  source_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  source_lat DOUBLE PRECISION,
  source_lng DOUBLE PRECISION,
  dest_lat DOUBLE PRECISION,
  dest_lng DOUBLE PRECISION,
  legs JSONB NOT NULL DEFAULT '[]',
  safety_score INTEGER CHECK (safety_score BETWEEN 0 AND 100),
  safety_breakdown JSONB DEFAULT '[]',
  distance_km DOUBLE PRECISION,
  eta_minutes INTEGER,
  estimated_cost_inr INTEGER,
  reliability_score INTEGER,
  crowd_level TEXT,
  walking_distance_km DOUBLE PRECISION,
  transfer_count INTEGER DEFAULT 0,
  geometry JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Trips ───────────────────────────────────────────────────────────────────
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  route_id UUID REFERENCES public.routes(id),
  city_id TEXT NOT NULL REFERENCES public.cities(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  path_coordinates JSONB DEFAULT '[]',
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  sos_triggered BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ── Emergency contacts ───────────────────────────────────────────────────────
CREATE TABLE public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  relationship TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ───────────────────────────────────────────────────────────
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'safety_alert', 'trip', 'community', 'sos')),
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── User badges ───────────────────────────────────────────────────────────────
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_key)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_users_city ON public.users(city_id);
CREATE INDEX idx_reports_city ON public.safety_reports(city_id, created_at DESC);
CREATE INDEX idx_reports_geo ON public.safety_reports(latitude, longitude);
CREATE INDEX idx_votes_report ON public.report_votes(report_id);
CREATE INDEX idx_comments_report ON public.community_comments(report_id, created_at DESC);
CREATE INDEX idx_zones_city ON public.safety_zones(city_id);
CREATE INDEX idx_spots_city ON public.safe_waiting_spots(city_id);
CREATE INDEX idx_routes_user ON public.routes(user_id, created_at DESC);
CREATE INDEX idx_trips_user_status ON public.trips(user_id, status);
CREATE INDEX idx_trips_share ON public.trips(share_token);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Vote counters ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.increment_report_vote()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.vote_type = 'upvote' THEN
    UPDATE public.safety_reports SET upvotes = upvotes + 1 WHERE id = NEW.report_id;
  ELSIF NEW.vote_type = 'verify' THEN
    UPDATE public.safety_reports
    SET verifications = verifications + 1,
        is_verified = (verifications + 1 >= 2)
    WHERE id = NEW.report_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_report_vote
  AFTER INSERT ON public.report_votes
  FOR EACH ROW EXECUTE FUNCTION public.increment_report_vote();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.safety_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
