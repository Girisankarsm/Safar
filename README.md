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

Create `apps/web/.env` with **only** these three keys:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENROUTESERVICE_API_KEY=your-ors-key
```

No `DATABASE_URL`, `API_URL`, `MAPBOX_TOKEN`, or service role key needed in the frontend.

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Run migrations in order (SQL Editor or `supabase db push`):
   - `supabase/migrations/20240611000001_initial_schema.sql`
   - `supabase/migrations/20240611000002_rls_policies.sql`
   - `supabase/migrations/20240611000003_storage.sql`
3. Run seed data: `supabase/seed.sql`
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

## Architecture

```
apps/web/src/services/supabase/
  auth.service.ts        # Supabase Auth
  reports.service.ts     # Safety reports + Realtime
  routes.service.ts      # OpenRouteService + route cache in Supabase
  trips.service.ts       # Live trips + SOS + Realtime
  notifications.service.ts
  storage.service.ts     # Image compression + Supabase Storage
  zones.service.ts       # Heatmap zones + safe waiting spots
  contacts.service.ts    # Emergency contacts
```

**Never** put Supabase queries in UI components — always use the service layer.

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
