-- SafarAI Initial Schema
-- PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    college VARCHAR(255),
    company VARCHAR(255),
    avatar_url TEXT,
    women_safety_mode BOOLEAN DEFAULT FALSE,
    night_safe_preference BOOLEAN DEFAULT FALSE,
    trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
    city VARCHAR(50) DEFAULT 'hyderabad',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE carbon_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    lifetime_tokens INTEGER DEFAULT 0,
    lifetime_co2_kg DECIMAL(10, 2) DEFAULT 0,
    green_trips_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_type VARCHAR(20) NOT NULL CHECK (route_type IN ('fastest', 'safest', 'greenest')),
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    source_lat DECIMAL(10, 7),
    source_lng DECIMAL(10, 7),
    dest_lat DECIMAL(10, 7),
    dest_lng DECIMAL(10, 7),
    legs JSONB NOT NULL DEFAULT '[]',
    safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
    safety_label VARCHAR(20),
    safety_breakdown JSONB DEFAULT '[]',
    distance_km DECIMAL(8, 2),
    eta_minutes INTEGER,
    carbon_saved_kg DECIMAL(8, 2),
    reward_tokens INTEGER,
    recommendations JSONB DEFAULT '[]',
    city VARCHAR(50) DEFAULT 'hyderabad',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES routes(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    path_coordinates JSONB DEFAULT '[]',
    current_lat DECIMAL(10, 7),
    current_lng DECIMAL(10, 7),
    co2_saved_kg DECIMAL(8, 2),
    tokens_earned INTEGER,
    deviation_alerted BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(64) UNIQUE,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE safety_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN (
        'unsafe_area', 'harassment', 'broken_light', 'pothole', 'flooded_road', 'dangerous_crossing'
    )),
    description TEXT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    upvotes INTEGER DEFAULT 0,
    verifications INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    city VARCHAR(50) DEFAULT 'hyderabad',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES safety_reports(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) NOT NULL CHECK (vote_type IN ('upvote', 'verify')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, report_id, vote_type)
);

CREATE TABLE token_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES carbon_wallets(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'redeem', 'bonus')),
    amount INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    relationship VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE road_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    segment_id VARCHAR(100) NOT NULL,
    city VARCHAR(50) DEFAULT 'hyderabad',
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    rating INTEGER CHECK (rating >= 0 AND rating <= 100),
    condition VARCHAR(20) CHECK (condition IN ('good', 'moderate', 'poor')),
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('individual', 'college', 'company')),
    entity_id UUID,
    entity_name VARCHAR(255) NOT NULL,
    carbon_saved_kg DECIMAL(10, 2) DEFAULT 0,
    tokens_earned INTEGER DEFAULT 0,
    green_trips INTEGER DEFAULT 0,
    rank INTEGER,
    period VARCHAR(20) DEFAULT 'weekly',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sos_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id),
    silent BOOLEAN DEFAULT FALSE,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    contacts_notified INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_trips_user_status ON trips(user_id, status);
CREATE INDEX idx_safety_reports_geo ON safety_reports(latitude, longitude);
CREATE INDEX idx_safety_reports_city ON safety_reports(city);
CREATE INDEX idx_leaderboard_lookup ON leaderboard_entries(entity_type, period, rank);
CREATE INDEX idx_token_tx_wallet ON token_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_routes_search ON routes(source, destination, city);
