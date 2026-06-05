-- SafarAI Chennai Seed Data (run after hyderabad_seed.sql / update_demo_user.sql)
-- Uses the SAME demo user id (...0001) to avoid duplicate clerk_id errors

INSERT INTO safety_reports (user_id, report_type, description, latitude, longitude, upvotes, verifications, is_verified, city) VALUES
('a0000000-0000-0000-0000-000000000001', 'broken_light', 'Dim street lighting near T Nagar bus terminus', 13.0418, 80.2341, 18, 4, TRUE, 'chennai'),
('a0000000-0000-0000-0000-000000000001', 'harassment', 'Harassment reported near Guindy evening hours', 13.0067, 80.2206, 32, 6, TRUE, 'chennai'),
('a0000000-0000-0000-0000-000000000001', 'unsafe_area', 'Poorly lit lane behind Egmore station', 13.0732, 80.2609, 21, 5, TRUE, 'chennai'),
('a0000000-0000-0000-0000-000000000001', 'pothole', 'Large pothole on Anna Salai service road', 13.0604, 80.2426, 11, 2, FALSE, 'chennai'),
('a0000000-0000-0000-0000-000000000001', 'dangerous_crossing', 'No pedestrian signal at OMR junction', 12.9010, 80.2279, 9, 3, TRUE, 'chennai'),
('a0000000-0000-0000-0000-000000000001', 'flooded_road', 'Water logging near Marina loop road', 13.0500, 80.2824, 7, 2, FALSE, 'chennai');

INSERT INTO road_ratings (segment_id, city, latitude, longitude, rating, condition, factors) VALUES
('t_nagar', 'chennai', 13.0418, 80.2341, 82, 'good', '{"road_type": "main_road", "lighting": "good"}'),
('anna_salai', 'chennai', 13.0604, 80.2426, 78, 'moderate', '{"road_type": "arterial", "lighting": "moderate"}'),
('central', 'chennai', 13.0827, 80.2750, 90, 'good', '{"road_type": "main_road", "lighting": "good"}'),
('marina', 'chennai', 13.0500, 80.2824, 86, 'good', '{"road_type": "main_road", "lighting": "good"}'),
('guindy', 'chennai', 13.0067, 80.2206, 58, 'moderate', '{"road_type": "arterial", "lighting": "poor"}');
