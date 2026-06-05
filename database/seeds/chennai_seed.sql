-- SafarAI Chennai Seed Data (run after 001_initial_schema.sql)

INSERT INTO users (id, clerk_id, email, name, college, women_safety_mode, night_safe_preference, trust_score, city)
VALUES (
    'a0000000-0000-0000-0000-000000000002',
    'demo_user_ananya',
    'ananya@annauniv.edu',
    'Ananya Krishnan',
    'Anna University Chennai',
    TRUE, TRUE, 88, 'chennai'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO carbon_wallets (user_id, balance, lifetime_tokens, lifetime_co2_kg, green_trips_count)
VALUES ('a0000000-0000-0000-0000-000000000002', 340, 520, 12.40, 28)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO safety_reports (user_id, report_type, description, latitude, longitude, upvotes, verifications, is_verified, city) VALUES
('a0000000-0000-0000-0000-000000000002', 'broken_light', 'Dim street lighting near T Nagar bus terminus', 13.0418, 80.2341, 18, 4, TRUE, 'chennai'),
('a0000000-0000-0000-0000-000000000002', 'harassment', 'Harassment reported near Guindy evening hours', 13.0067, 80.2206, 32, 6, TRUE, 'chennai'),
('a0000000-0000-0000-0000-000000000002', 'unsafe_area', 'Poorly lit lane behind Egmore station', 13.0732, 80.2609, 21, 5, TRUE, 'chennai'),
('a0000000-0000-0000-0000-000000000002', 'pothole', 'Large pothole on Anna Salai service road', 13.0604, 80.2426, 11, 2, FALSE, 'chennai'),
('a0000000-0000-0000-0000-000000000002', 'dangerous_crossing', 'No pedestrian signal at OMR junction', 12.9010, 80.2279, 9, 3, TRUE, 'chennai'),
('a0000000-0000-0000-0000-000000000002', 'flooded_road', 'Water logging near Marina loop road', 13.0500, 80.2824, 7, 2, FALSE, 'chennai');

INSERT INTO road_ratings (segment_id, city, latitude, longitude, rating, condition, factors) VALUES
('t_nagar', 'chennai', 13.0418, 80.2341, 82, 'good', '{"road_type": "main_road", "lighting": "good"}'),
('anna_salai', 'chennai', 13.0604, 80.2426, 78, 'moderate', '{"road_type": "arterial", "lighting": "moderate"}'),
('central', 'chennai', 13.0827, 80.2750, 90, 'good', '{"road_type": "main_road", "lighting": "good"}'),
('marina', 'chennai', 13.0500, 80.2824, 86, 'good', '{"road_type": "main_road", "lighting": "good"}'),
('guindy', 'chennai', 13.0067, 80.2206, 58, 'moderate', '{"road_type": "arterial", "lighting": "poor"}');
