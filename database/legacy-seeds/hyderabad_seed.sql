-- SafarAI Hyderabad Seed Data

-- Demo user
INSERT INTO users (id, clerk_id, email, name, college, women_safety_mode, night_safe_preference, trust_score, city)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'demo_user_ananya',
    'ananya@annauniv.edu',
    'Ananya Krishnan',
    'Anna University Chennai',
    TRUE, TRUE, 88, 'chennai'
);

INSERT INTO carbon_wallets (user_id, balance, lifetime_tokens, lifetime_co2_kg, green_trips_count)
VALUES ('a0000000-0000-0000-0000-000000000001', 340, 520, 12.40, 28);

INSERT INTO emergency_contacts (user_id, name, phone, relationship) VALUES
('a0000000-0000-0000-0000-000000000001', 'Mom', '+919876543210', 'Mother'),
('a0000000-0000-0000-0000-000000000001', 'Sneha', '+919876543211', 'Friend');

-- Safety reports across Hyderabad
INSERT INTO safety_reports (user_id, report_type, description, latitude, longitude, upvotes, verifications, is_verified, city) VALUES
('a0000000-0000-0000-0000-000000000001', 'broken_light', 'Street light not working near bus stop', 17.4434, 78.3772, 12, 3, TRUE, 'hyderabad'),
('a0000000-0000-0000-0000-000000000001', 'harassment', 'Reported harassment hotspot near interchange', 17.4350, 78.3910, 28, 5, TRUE, 'hyderabad'),
('a0000000-0000-0000-0000-000000000001', 'pothole', 'Large pothole on service road', 17.4480, 78.3650, 8, 2, FALSE, 'hyderabad'),
('a0000000-0000-0000-0000-000000000001', 'unsafe_area', 'Poorly lit alley near metro exit', 17.4200, 78.3400, 15, 4, TRUE, 'hyderabad'),
('a0000000-0000-0000-0000-000000000001', 'dangerous_crossing', 'No zebra crossing, fast traffic', 17.4600, 78.3800, 6, 1, FALSE, 'hyderabad'),
('a0000000-0000-0000-0000-000000000001', 'flooded_road', 'Water logging during rains', 17.4100, 78.4500, 4, 2, FALSE, 'hyderabad');

-- Road ratings
INSERT INTO road_ratings (segment_id, city, latitude, longitude, rating, condition, factors) VALUES
('seg_hitec_main', 'hyderabad', 17.4434, 78.3772, 88, 'good', '{"road_type": "main_road", "lighting": "good"}'),
('seg_necklace', 'hyderabad', 17.4200, 78.4600, 72, 'moderate', '{"road_type": "arterial", "lighting": "moderate"}'),
('seg_secunderabad', 'hyderabad', 17.4340, 78.5010, 85, 'good', '{"road_type": "main_road", "lighting": "good"}'),
('seg_old_city', 'hyderabad', 17.3700, 78.4800, 45, 'poor', '{"road_type": "narrow", "lighting": "poor"}');

-- Leaderboard
INSERT INTO leaderboard_entries (entity_type, entity_name, carbon_saved_kg, tokens_earned, green_trips, rank, period) VALUES
('individual', 'Priya Sharma', 12.40, 340, 28, 1, 'weekly'),
('individual', 'Rahul Kumar', 10.10, 298, 24, 2, 'weekly'),
('individual', 'Anitha Menon', 9.80, 276, 22, 3, 'weekly'),
('individual', 'Dev Team Alpha', 8.20, 245, 19, 4, 'weekly'),
('college', 'CBIT Hyderabad', 45.20, 1240, 98, 1, 'monthly'),
('college', 'IIIT Hyderabad', 38.50, 1080, 85, 2, 'monthly'),
('college', 'JNTU Hyderabad', 32.10, 920, 72, 3, 'monthly'),
('company', 'TechMahindra HYD', 120.50, 3400, 280, 1, 'monthly'),
('company', 'Microsoft IDC', 98.30, 2890, 245, 2, 'monthly');
