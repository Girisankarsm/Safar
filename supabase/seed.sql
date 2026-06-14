-- Safar production seed: reference cities only (no fake reports, zones, or POIs)
-- Safety data comes from real users. POIs from OpenStreetMap. Routes from OpenRouteService.

INSERT INTO public.cities (id, name, state, center_lat, center_lng) VALUES
  ('chennai', 'Chennai', 'Tamil Nadu', 13.0827, 80.2707),
  ('trivandrum', 'Trivandrum', 'Kerala', 8.5241, 76.9366),
  ('bangalore', 'Bengaluru', 'Karnataka', 12.9716, 77.5946),
  ('hyderabad', 'Hyderabad', 'Telangana', 17.3850, 78.4867)
ON CONFLICT (id) DO NOTHING;

-- No fake safety_reports, safety_zones, or safe_waiting_spots in production seed.
-- Run with VITE_DEMO_MODE=true locally to use minimal in-app demo fallbacks.
