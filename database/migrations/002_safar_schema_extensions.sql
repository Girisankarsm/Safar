-- Safar Schema Extensions
-- Run after 001_initial_schema.sql

-- Extend route types for Safar route planner
ALTER TABLE routes DROP CONSTRAINT IF EXISTS routes_route_type_check;
ALTER TABLE routes ADD CONSTRAINT routes_route_type_check
  CHECK (route_type IN ('safest', 'cheapest', 'balanced', 'women_friendly', 'fastest', 'greenest'));

-- Extend report types for community safety reports
ALTER TABLE safety_reports DROP CONSTRAINT IF EXISTS safety_reports_report_type_check;
ALTER TABLE safety_reports ADD CONSTRAINT safety_reports_report_type_check
  CHECK (report_type IN (
    'unsafe_area', 'harassment', 'broken_light', 'pothole', 'flooded_road',
    'dangerous_crossing', 'poor_lighting', 'unsafe_bus_stop', 'suspicious_activity',
    'road_damage', 'stray_animal', 'construction'
  ));

-- Cities reference table
CREATE TABLE IF NOT EXISTS cities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    center_lat DECIMAL(10, 7) NOT NULL,
    center_lng DECIMAL(10, 7) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO cities (id, name, state, center_lat, center_lng) VALUES
    ('chennai', 'Chennai', 'Tamil Nadu', 13.0827, 80.2707),
    ('trivandrum', 'Trivandrum', 'Kerala', 8.5241, 76.9366),
    ('bangalore', 'Bengaluru', 'Karnataka', 12.9716, 77.5946),
    ('hyderabad', 'Hyderabad', 'Telangana', 17.3850, 78.4867),
    ('mumbai', 'Mumbai', 'Maharashtra', 19.0760, 72.8777),
    ('pune', 'Pune', 'Maharashtra', 18.5204, 73.8567),
    ('kochi', 'Kochi', 'Kerala', 9.9312, 76.2673),
    ('delhi', 'Delhi', 'Delhi', 28.6139, 77.2090)
ON CONFLICT (id) DO NOTHING;

-- Safety zones for heatmap
CREATE TABLE IF NOT EXISTS safety_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city VARCHAR(50) NOT NULL REFERENCES cities(id),
    zone_type VARCHAR(20) NOT NULL CHECK (zone_type IN ('safe', 'moderate', 'high_risk')),
    label VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    risk_weight DECIMAL(3, 2) CHECK (risk_weight >= 0 AND risk_weight <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safety_zones_city ON safety_zones(city);

-- Transport hubs
CREATE TABLE IF NOT EXISTS transport_hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city VARCHAR(50) NOT NULL REFERENCES cities(id),
    hub_type VARCHAR(30) NOT NULL,
    name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    is_safe_waiting_spot BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transport_hubs_city ON transport_hubs(city);

-- Community comments on reports
CREATE TABLE IF NOT EXISTS community_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES safety_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_report ON community_comments(report_id, created_at DESC);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- User badges
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_key VARCHAR(50) NOT NULL,
    badge_name VARCHAR(100) NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_key)
);

-- RLS policies (Supabase)
ALTER TABLE safety_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read safety zones" ON safety_zones FOR SELECT USING (true);
CREATE POLICY "Public read transport hubs" ON transport_hubs FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON community_comments FOR SELECT USING (true);
CREATE POLICY "Users read own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users read own badges" ON user_badges FOR SELECT USING (auth.uid()::text = user_id::text);
