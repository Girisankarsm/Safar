# Safar — Travel Smarter. Travel Safer.

**Safar** is a community-powered urban mobility app for Indian commuters. Plan safer routes, report safety issues in real time, find emergency safe waiting spots, and share live trip status — all backed by **Supabase** with no custom API server.

[Live demo](https://github.com/Girisankarsm/Safar-Ai) · [Report a bug](https://github.com/Girisankarsm/Safar-Ai/issues)

---

## Why Safar?

Indian cities need mobility tools that go beyond turn-by-turn directions. Safar combines:

- **Smart routing** — compare safest, cheapest, balanced, and women-friendly routes
- **Community safety** — heatmaps and reports driven by real users, not fake seed data
- **Emergency tools** — SOS shield, helplines, and nearby safe waiting spots (hospitals, police, fuel, transit)
- **Live data** — OpenStreetMap, OpenRouteService, and Supabase Realtime

---

## Features

| Feature | Description |
|---------|-------------|
| **Google & email auth** | Sign in with Google or email/password. Sessions persist via Supabase Auth |
| **Location autocomplete** | Google Maps–style search powered by Nominatim (OSM) with offline fallback |
| **Route planner** | 4 route types with safety scores, ETA, cost, and map geometry |
| **Safety heatmap** | Live community report density with vote & verify |
| **Emergency Shield** | SOS, women's helplines, and ranked safe waiting spots |
| **Trip tracking** | Start trips, share location, trigger SOS |
| **Image reports** | Upload compressed photos to Supabase Storage |
| **Protected routes** | Dashboard, routes, safety, emergency, and profile require login |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite · React 19 · TypeScript · Tailwind CSS · Framer Motion · React Router |
| Maps | Leaflet · OpenStreetMap tiles |
| Routing | [OpenRouteService](https://openrouteservice.org/) |
| Geocoding | [Nominatim](https://nominatim.org/) (OSM) |
| POIs | [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) |
| Backend | **Supabase only** — Auth · PostgreSQL · Storage · Realtime · RLS |
| Deploy | Vercel (frontend) + Supabase (backend) |

No FastAPI, Express, Firebase, or Mapbox required.

---

## Quick start

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenRouteService](https://openrouteservice.org/dev/#/signup) API key (free tier works)

### 1. Clone & install

```bash
git clone https://github.com/Girisankarsm/Safar-Ai.git
cd Safar-Ai
npm install
```

### 2. Environment variables

Create `apps/web/.env.local` (or copy from example):

```bash
cp apps/web/.env.example apps/web/.env.local
```

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENROUTESERVICE_API_KEY=your-ors-key
VITE_DEMO_MODE=false
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key for client |
| `VITE_OPENROUTESERVICE_API_KEY` | Yes* | Route geometry, distance, duration |
| `VITE_DEMO_MODE` | No | `true` = offline fallback without external APIs |

\* Set `VITE_DEMO_MODE=true` to run without ORS during local dev.

### 3. Supabase setup

Run migrations **in this order** (SQL Editor or CLI):

1. `20240611000001_initial_schema.sql`
2. `20240611000002_rls_policies.sql` — choose **Run without RLS** if prompted on step 1
3. `20240611000003_storage.sql`
4. `20240612000004_live_data_cache.sql`
5. `20240612000005_google_oauth_user_metadata.sql`

Then seed cities:

```bash
# SQL Editor: paste contents of supabase/seed.sql
```

**Auth providers**

- Enable **Email** in Authentication → Providers
- Enable **Google** and add OAuth credentials from [Google Cloud Console](https://console.cloud.google.com/)
- Add redirect URLs under Authentication → URL Configuration:
  - `http://localhost:5173/login`
  - `https://your-app.vercel.app/login`

### 4. Run locally

```bash
npm run dev
```

Open **http://localhost:5173**

---

## Deploy

### Vercel (frontend)

| Setting | Value |
|---------|-------|
| Root directory | `apps/web` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Add all `VITE_*` env vars in the Vercel dashboard.

### Supabase (backend)

Migrations + seed run on your Supabase project. Enable Realtime for `safety_reports` and `trips` if you want live updates.

---

## Project structure

```
Safar-Ai/
├── apps/web/                 # Vite + React frontend
│   ├── src/
│   │   ├── features/auth/    # Google OAuth, ProtectedRoute, useAuth
│   │   ├── components/       # UI, maps, location autocomplete
│   │   ├── pages/            # Landing, Home, Routes, Safety, Emergency…
│   │   └── services/
│   │       ├── osm/          # Nominatim + Overpass
│   │       └── supabase/     # Auth, routes, reports, trips, storage
│   └── .env.local            # Local secrets (gitignored)
├── supabase/
│   ├── migrations/           # Schema, RLS, storage, cache tables
│   └── seed.sql              # Chennai, Trivandrum, Bengaluru
└── database/legacy-seeds/    # Deprecated demo data — do not use
```

---

## Live data architecture

| Data | Source | Cached in |
|------|--------|-----------|
| Routes | OpenRouteService | `route_cache` |
| Geocoding & autocomplete | Nominatim (OSM) | `location_cache` |
| Hospitals, police, fuel, pharmacies | Overpass (OSM) | `osm_places` |
| Safe waiting spots | OSM POIs + safety score | computed + fallback list |
| Safety heatmap | User reports + votes | computed live |
| Community reports | Authenticated users | `safety_reports` |

Business logic lives in `apps/web/src/services/` — never query Supabase or OSM directly from UI components.

---

## Supported cities

Seeded in `supabase/seed.sql`:

- **Chennai** (Tamil Nadu)
- **Trivandrum** (Kerala)
- **Bengaluru** (Karnataka)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Routes stuck on "Finding routes…" | Add a valid `VITE_OPENROUTESERVICE_API_KEY` or set `VITE_DEMO_MODE=true` |
| Google login fails | Add redirect URL `http://localhost:5173/login` in Supabase Auth settings |
| Safe spots not loading | Overpass can be slow; app falls back to curated offline list automatically |
| Empty heatmap | Expected until users submit reports — by design in live mode |
| `Could not generate route` | Pick locations from the autocomplete dropdown for accurate coordinates |

---

## Scripts

```bash
npm run dev      # Start dev server (localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

---

## Roadmap

- [ ] Public transit routing (GTFS)
- [ ] Push notifications for SOS contacts
- [ ] Multi-language UI (Tamil, Hindi, Malayalam)
- [ ] PWA offline mode

---

## License

MIT — use freely for learning, hackathons, and production with attribution.

---

<p align="center">
  Built with Supabase · OpenStreetMap · OpenRouteService<br/>
  <strong>Safar</strong> — Travel Smarter. Travel Safer.
</p>
