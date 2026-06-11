# Safar — Travel Smarter. Travel Safer.

India's community-powered mobility platform. **Supabase is the entire backend** — no custom API server required.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite · React 19 · TypeScript · Tailwind CSS · React Router |
| Maps | Leaflet · OpenStreetMap |
| Routing | OpenRouteService API |
| Backend | **Supabase only** (Auth · PostgreSQL · Storage · Realtime · RLS) |
| Deploy | Vercel (frontend) + Supabase (backend) |

## Environment variables

Create `apps/web/.env`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENROUTESERVICE_API_KEY=your-ors-key
VITE_DEMO_MODE=false   # default — use live OSM + ORS + user reports
```

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_*` | Auth, database, storage, realtime |
| `VITE_OPENROUTESERVICE_API_KEY` | Real route geometry, distance, duration |
| `VITE_DEMO_MODE` | `false` = production live data. `true` = minimal offline fallback only |

No `DATABASE_URL`, `API_URL`, or `MAPBOX_TOKEN` required.

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order (SQL Editor or `supabase db push`):
   - `supabase/migrations/20240611000001_initial_schema.sql`
   - `supabase/migrations/20240611000002_rls_policies.sql`
   - `supabase/migrations/20240611000003_storage.sql`
   - `supabase/migrations/20240612000004_live_data_cache.sql`
3. Run seed data: `supabase/seed.sql` (cities only — no fake reports or POIs)
4. Enable Email auth in Authentication → Providers

### 2. Local development

```bash
cp apps/web/.env.example apps/web/.env
# Fill in your Supabase + ORS keys

npm install
npm run dev
```

Open http://localhost:5173

### 3. Deploy to Vercel

- Root directory: `apps/web`
- Framework: Vite
- Add the three `VITE_*` environment variables in Vercel dashboard

## Live data architecture

| Data | Source | Cache table |
|------|--------|-------------|
| Routes | OpenRouteService Directions API | `route_cache` |
| Geocoding | Nominatim (OpenStreetMap) | `location_cache` |
| Hospitals, police, fuel, pharmacies, transit | Overpass API (OSM) | `osm_places` |
| Safe waiting spots | Computed from OSM POIs + score | `safe_waiting_spots` |
| Safety heatmap | User reports + votes + verifications | (computed live) |
| Community reports | Real authenticated users | `safety_reports` |

Legacy demo SQL files live in `database/legacy-seeds/` — **do not use in production**.

```
apps/web/src/services/
  osm/overpass.service.ts      # Fetch POIs from OpenStreetMap
  osm/nominatim.service.ts     # Geocode places
  supabase/places.service.ts   # OSM cache + safe waiting scores
  supabase/heatmap.service.ts  # Report-density heatmap
  supabase/route-cache.service.ts
  supabase/routes.service.ts   # ORS routing + community/OSM scoring
```

**Never** put Supabase or OSM queries in UI components.

## Features

- Email signup / login / password reset
- Protected routes with session persistence
- Smart route planner (4 route types)
- Safety heatmap with realtime community reports
- Report voting & verification (Realtime)
- Emergency Shield + safe waiting spots
- Image uploads with compression (Supabase Storage)

## Cities (seeded)

Chennai · Trivandrum · Bengaluru
