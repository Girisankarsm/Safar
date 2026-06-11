-- Live data cache tables (OSM + routes + geocoding)

-- OSM places cache (hospitals, police, fuel, pharmacy, transit)
CREATE TABLE IF NOT EXISTS public.osm_places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  osm_id BIGINT NOT NULL,
  osm_type TEXT NOT NULL DEFAULT 'node' CHECK (osm_type IN ('node', 'way', 'relation')),
  place_type TEXT NOT NULL CHECK (place_type IN (
    'hospital', 'police', 'petrol_pump', 'pharmacy', 'railway', 'metro', 'bus_stop', 'store'
  )),
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city_id TEXT REFERENCES public.cities(id),
  tags JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (osm_id, place_type)
);

CREATE INDEX IF NOT EXISTS idx_osm_places_type_geo ON public.osm_places(place_type, latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_osm_places_city ON public.osm_places(city_id, place_type);
CREATE INDEX IF NOT EXISTS idx_osm_places_fetched ON public.osm_places(fetched_at);

-- Geocoding cache (Nominatim results)
CREATE TABLE IF NOT EXISTS public.location_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  city_id TEXT REFERENCES public.cities(id),
  source TEXT DEFAULT 'nominatim',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_cache_expires ON public.location_cache(expires_at);

-- Route cache (OpenRouteService responses)
CREATE TABLE IF NOT EXISTS public.route_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  source_lat DOUBLE PRECISION NOT NULL,
  source_lng DOUBLE PRECISION NOT NULL,
  dest_lat DOUBLE PRECISION NOT NULL,
  dest_lng DOUBLE PRECISION NOT NULL,
  route_type TEXT NOT NULL,
  ors_profile TEXT NOT NULL,
  distance_km DOUBLE PRECISION NOT NULL,
  duration_min DOUBLE PRECISION NOT NULL,
  geometry JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_cache_expires ON public.route_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_route_cache_endpoints ON public.route_cache(source_lat, source_lng, dest_lat, dest_lng);

-- Extend safe_waiting_spots for computed scores
ALTER TABLE public.safe_waiting_spots
  ADD COLUMN IF NOT EXISTS osm_place_id UUID REFERENCES public.osm_places(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS safe_waiting_score INTEGER DEFAULT 50 CHECK (safe_waiting_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS computed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_safe_spots_score ON public.safe_waiting_spots(safe_waiting_score DESC);

-- RLS: public read for cached reference data
ALTER TABLE public.osm_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "osm_places_public_read" ON public.osm_places FOR SELECT USING (true);
CREATE POLICY "osm_places_auth_insert" ON public.osm_places FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "location_cache_public_read" ON public.location_cache FOR SELECT USING (true);
CREATE POLICY "location_cache_auth_insert" ON public.location_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "route_cache_public_read" ON public.route_cache FOR SELECT USING (true);
CREATE POLICY "route_cache_auth_insert" ON public.route_cache FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to cache computed safe waiting spots
CREATE POLICY "safe_spots_auth_insert" ON public.safe_waiting_spots FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "safe_spots_public_read" ON public.safe_waiting_spots FOR SELECT USING (true);
