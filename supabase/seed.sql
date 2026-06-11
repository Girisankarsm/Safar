-- Safar seed data: Chennai, Trivandrum, Bengaluru
-- Run after migrations (use service role or disable RLS temporarily for bulk insert)

INSERT INTO public.cities (id, name, state, center_lat, center_lng) VALUES
  ('chennai', 'Chennai', 'Tamil Nadu', 13.0827, 80.2707),
  ('trivandrum', 'Trivandrum', 'Kerala', 8.5241, 76.9366),
  ('bangalore', 'Bengaluru', 'Karnataka', 12.9716, 77.5946)
ON CONFLICT (id) DO NOTHING;

-- Safety zones: Chennai
INSERT INTO public.safety_zones (city_id, zone_type, label, latitude, longitude, risk_weight) VALUES
  ('chennai', 'safe', 'Marina corridor', 13.0827, 80.2707, 0.2),
  ('chennai', 'moderate', 'T Nagar market', 13.0478, 80.2422, 0.7),
  ('chennai', 'high_risk', 'Egmore underpass', 13.0604, 80.2496, 0.85),
  ('chennai', 'safe', 'Central metro hub', 13.0732, 80.2609, 0.15),
  ('chennai', 'moderate', 'Guindy industrial', 13.0067, 80.2206, 0.55),
  ('chennai', 'high_risk', 'Dark service lane', 13.0358, 80.2337, 0.9),
  ('chennai', 'safe', 'Anna Nagar main', 13.0896, 80.2209, 0.25);

-- Trivandrum
INSERT INTO public.safety_zones (city_id, zone_type, label, latitude, longitude, risk_weight) VALUES
  ('trivandrum', 'safe', 'Technopark zone', 8.5241, 76.9366, 0.2),
  ('trivandrum', 'moderate', 'East Fort', 8.4875, 76.9525, 0.65),
  ('trivandrum', 'high_risk', 'Palayam junction', 8.5099, 76.9655, 0.8),
  ('trivandrum', 'safe', 'Central station', 8.5036, 76.9498, 0.15);

-- Bengaluru
INSERT INTO public.safety_zones (city_id, zone_type, label, latitude, longitude, risk_weight) VALUES
  ('bangalore', 'safe', 'MG Road metro', 12.9716, 77.5946, 0.25),
  ('bangalore', 'moderate', 'Koramangala 5th block', 12.9352, 77.6245, 0.7),
  ('bangalore', 'high_risk', 'HSR underpass', 12.9279, 77.6271, 0.85),
  ('bangalore', 'safe', 'Indiranagar 100ft', 12.9784, 77.6408, 0.2),
  ('bangalore', 'high_risk', 'Bellandur flyover', 12.9591, 77.6974, 0.75);

-- Safe waiting spots
INSERT INTO public.safe_waiting_spots (city_id, spot_type, name, latitude, longitude, is_24x7) VALUES
  ('chennai', 'petrol_pump', 'Indian Oil — Anna Salai', 13.0604, 80.2642, true),
  ('chennai', 'pharmacy', 'Apollo Pharmacy — T Nagar', 13.0418, 80.2341, false),
  ('chennai', 'metro', 'AG-DMS Metro', 13.0689, 80.2501, true),
  ('chennai', 'railway', 'Chennai Central Railway', 13.0827, 80.2751, true),
  ('chennai', 'police', 'Egmore Police Booth', 13.0732, 80.2609, true),
  ('chennai', 'hospital', 'Apollo Hospital — Greams Rd', 13.0569, 80.2587, true),
  ('chennai', 'store', 'Spencer Plaza', 13.0615, 80.2645, false),
  ('trivandrum', 'petrol_pump', 'BPCL — Technopark', 8.5589, 76.8820, true),
  ('trivandrum', 'pharmacy', 'MedPlus — Palayam', 8.5099, 76.9655, false),
  ('trivandrum', 'metro', 'Technopark Transit Hub', 8.5241, 76.9366, true),
  ('trivandrum', 'railway', 'Trivandrum Central', 8.5036, 76.9498, true),
  ('trivandrum', 'police', 'Museum Police Station', 8.5089, 76.9550, true),
  ('trivandrum', 'hospital', 'KIMS Hospital', 8.5195, 76.9360, true),
  ('bangalore', 'petrol_pump', 'HP Petrol — MG Road', 12.9756, 77.6063, true),
  ('bangalore', 'pharmacy', 'PharmEasy — Indiranagar', 12.9784, 77.6408, false),
  ('bangalore', 'metro', 'MG Road Metro', 12.9755, 77.6066, true),
  ('bangalore', 'railway', 'KSR Bengaluru Station', 12.9770, 77.5686, true),
  ('bangalore', 'police', 'Cubbon Park Police', 12.9763, 77.5929, true),
  ('bangalore', 'hospital', 'Manipal Hospital', 12.9584, 77.6482, true),
  ('bangalore', 'store', 'Forum Mall — Koramangala', 12.9349, 77.6090, false);

-- Sample safety reports (requires at least one auth user — run after first signup, or use a fixed UUID)
-- Uncomment and replace USER_ID after creating your first account:
/*
INSERT INTO public.safety_reports (user_id, city_id, report_type, description, latitude, longitude, upvotes, verifications, is_verified) VALUES
  ('YOUR_USER_UUID', 'chennai', 'poor_lighting', 'Street lights not working near bus stop', 13.0478, 80.2422, 12, 2, true),
  ('YOUR_USER_UUID', 'chennai', 'harassment', 'Reported incident near underpass — avoid after 9 PM', 13.0604, 80.2496, 28, 3, true),
  ('YOUR_USER_UUID', 'bangalore', 'flooded_area', 'Underpass flooded after rain', 12.9279, 77.6271, 15, 2, true),
  ('YOUR_USER_UUID', 'trivandrum', 'unsafe_bus_stop', 'No lighting at Palayam stop', 8.5099, 76.9655, 8, 1, false);
*/
