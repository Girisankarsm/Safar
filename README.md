<div align="center">
  <img src="apps/web/public/safar-logo.png" width="90" alt="Safar Logo" />

  # Safar — Travel Smarter. Travel Safer.

  **India's first community-powered urban mobility intelligence platform**  
  Built for real commuters. Backed by real data.

  [![Live Demo](https://img.shields.io/badge/Live%20Demo-safar--travel--web.vercel.app-3B82F6?style=for-the-badge&logo=vercel)](https://safar-travel-web.vercel.app)
  [![GitHub](https://img.shields.io/badge/GitHub-Girisankarsm%2FSafar-181717?style=for-the-badge&logo=github)](https://github.com/Girisankarsm/Safar)
  [![Presentation Deck](https://img.shields.io/badge/Presentation%20Deck-Google%20Slides-F59E0B?style=for-the-badge&logo=googleslides)](https://docs.google.com/presentation/d/1XY18c7GKHgzhzwkFZOJvO7xIkPqXmeHL/edit?usp=sharing)
  [![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](LICENSE)

</div>

---

## What is Safar?

Safar is a premium urban mobility web app that helps Indian commuters plan safer, smarter routes using live community intelligence, OpenStreetMap infrastructure data, and NCRB crime statistics.

It goes far beyond navigation — Safar understands **who is travelling, when, and through which corridor**, and selects the optimal route accordingly.

---

## Core Intelligence

### Candidate-Search Optimization Engine
> Not four versions of the same route. Genuinely different paths.

- Generates **8–12 route candidates** per search from 7 parallel sources:
  - OSRM alternatives (3 geometries)
  - OpenRouteService shortest
  - Commercial corridor waypoints
  - Transit corridor waypoints
  - Police-rich corridor waypoints
  - Hospital-rich corridor waypoints
  - Night-safe corridor waypoints
- Profiles every candidate using: community reports · harassment history · police density · hospital density · commercial activity · lighting score · NCRB crime index · ETA · fare estimate
- Selects winners via **true multi-objective optimization** — no flat bonuses, no artificial shifts

### Multi-Objective Route Types

| Route | Goal | Weights |
|-------|------|---------|
| **Balanced** | Best overall experience | Safety 40% · ETA 35% · Cost 25% |
| **Safest** | Maximum corridor safety | Safety 75% · ETA 15% · Cost 10% |
| **Cheapest** | Lowest travel cost | Cost 70% · ETA 20% · Safety 10% |
| **Women-Friendly** | Most monitored, socially active corridor | Harassment Safety 40% · Lighting 20% · Police 15% · Commercial 10% · Hospital 10% · ETA 5% |

**Women-Friendly constraints:** ETA ≤ fastest + 15% · Distance ≤ fastest + 10% · Never the longest route

### Traffic Intelligence
City-specific historical congestion multipliers applied to all route ETAs:

| City | Morning Rush | Evening Rush | Peak Fri/Sat | Night |
|------|-------------|--------------|--------------|-------|
| Bangalore | ×1.40 | ×1.55 | ×1.20 | ×0.80 |
| Chennai | ×1.30 | ×1.40 | ×1.15 | ×0.83 |
| Hyderabad | ×1.25 | ×1.35 | ×1.12 | ×0.87 |
| Trivandrum | ×1.15 | ×1.22 | ×1.08 | ×0.92 |

---

## Features

### Route Planning
- **Route Evolution Animation** — animated step-by-step search progress ("Finding 12 candidates... Analyzing hotspots...")
- **Route Comparison Radar Chart** — SVG chart comparing Safety / Speed / Cost / Infrastructure / Confidence per route
- **Real Route Quality Metrics** — "Avoided ✓ 3 hotspots · Police ✓ 4 stations · Lighting ✓ High · Commercial ✓ Dense"
- **Judge-Friendly Explanations** — "Why this route? What was avoided? What are the tradeoffs?"
- **Safar Pick** — dynamic recommendation based on time of day, women safety mode, budget sensitivity

### Safety Intelligence
- **Community Safety Heatmap** — live report density with vote & verify system
- **Temporal Decay Algorithm** — fresh reports trigger alerts; older reports become historical baseline (exponential decay `e^{-λt}`)
- **Location-Bounded Reporting** — users must be within 500m of the incident to submit a report
- **Rate Limiting & Moderation** — max 2 reports/minute per user, regex-based profanity filter via Supabase Edge Function
- **Infrastructure-Aware Lighting** — OSM highway class + commercial density informs night safety scoring
- **Real-time Alerts** — live Supabase Realtime subscription notifies when a new report appears near your active route

### Map
- **Sonar-Ring Incident Markers** — multi-ripple animated incident pins
- **Real Hospital & Police Detection** — Overpass API corridor-buffer query along the actual road geometry
- **Floating Filter Panel** — compact icon on map expands to filter report types
- **Current Location Support** — "My Location" in dashboard uses GPS for route start point

### Emergency Shield
- One-tap SOS with WhatsApp alert to saved contacts
- National women's helplines (112, 1091, 181)
- Ranked safe waiting spots (hospitals, police stations, fuel, pharmacies, transit) with real-time OSM data

### User Experience
- **PWA** — installable on Android, iOS (Add to Home Screen), and desktop. Install button appears in header, disappears once installed
- **Desktop-first, fully mobile-responsive** — optimised for all screen sizes
- **Route Evolution Animation** — premium loading experience instead of a spinner
- **Dynamic Learning** — stores route preferences (city, time, type, distance) for intelligence feedback
- **i18n ready** — English / Tamil / Hindi / Malayalam translations

---

## City Profiles

Real OSM-sourced waypoints for corridor routing across 4 cities:

| City | Commercial | Transit | Police | Hospital | Night-Safe |
|------|-----------|---------|--------|----------|-----------|
| **Chennai** | T Nagar, Anna Nagar, Pondy Bazaar | Central, Egmore, CMBT | ✓ | ✓ | ✓ |
| **Bengaluru** | Koramangala, Indiranagar, MG Road | Majestic, Silk Board, Marathahalli | ✓ | ✓ | ✓ |
| **Hyderabad** | Banjara Hills, Jubilee Hills, HITEC City | Secunderabad, LB Nagar, MGBS | ✓ | ✓ | ✓ |
| **Trivandrum** | Chalai, Palayam, Kazhakkoottam | Central, Thampanoor, Technopark | ✓ | ✓ | ✓ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion |
| **Routing** | React Router DOM v7 |
| **State** | Zustand |
| **Maps** | Leaflet · CartoDB dark tiles |
| **Routing APIs** | OSRM (primary) · OpenRouteService (alternative) |
| **Geocoding** | Nominatim (OpenStreetMap) |
| **POIs** | Overpass API (hospitals, police, pharmacies, fuel) |
| **Backend** | Supabase — PostgreSQL · Auth · Realtime · Storage · Edge Functions · RLS |
| **Edge Functions** | Deno (rate limiting, moderation, location validation) |
| **Deploy** | Vercel (frontend) · Supabase (backend) |
| **Crime Data** | NCRB Crime in India reports (static, city-level) |

No FastAPI, Express, Firebase, or Mapbox required.

---

## Project Structure

```
Safar/
├── apps/web/                        # Vite + React frontend
│   ├── public/
│   │   └── safar-logo.png           # Transparent brand logo
│   └── src/
│       ├── components/
│       │   ├── layout/              # AppShell, nav, PWAInstallButton, LanguageSwitcher
│       │   ├── map/                 # RouteMap, SafetyHeatmap, incident markers
│       │   ├── routes/              # RouteRadarChart, RouteSearchProgress, RouteAssistant
│       │   ├── safety/              # SafetyScoreBreakdown, SafetyReportCard
│       │   └── ui/                  # Button, Input, EmptyState, etc.
│       ├── features/auth/           # Google OAuth, ProtectedRoute, useAuth, UserMenu
│       ├── lib/
│       │   ├── ai-insights.ts       # Safar Pick, route trust taglines, explanations
│       │   ├── corridor-risk.ts     # Temporal decay, lighting heuristic, risk engine
│       │   ├── multimodal-legs.ts   # Distance-aware transport mode assignment
│       │   ├── crime-data.ts        # NCRB city crime index
│       │   └── platform-fares.ts    # Fare estimation per mode
│       ├── pages/
│       │   ├── LandingPage.tsx      # Premium animated landing page
│       │   ├── HomePage.tsx         # Dashboard with route search
│       │   ├── RoutesPage.tsx       # Route comparison, map, intelligence panel
│       │   ├── SafetyPage.tsx       # Heatmap + community reports feed
│       │   ├── EmergencyPage.tsx    # SOS shield + safe waiting spots
│       │   └── TripPage.tsx         # Active trip tracking
│       ├── services/
│       │   ├── osm/                 # Nominatim, Overpass
│       │   └── supabase/            # routes.service.ts (core engine), reports, auth, trips
│       ├── stores/                  # Zustand (city, settings)
│       └── i18n/                    # Translations (en, ta, hi, ml)
├── supabase/
│   ├── migrations/                  # Schema, RLS, storage, cache, edge functions
│   ├── functions/                   # rate-limit-reports, validate-location
│   └── seed.sql                     # City seed data
└── data/crime/                      # NCRB crime index by city
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase project ([free tier](https://supabase.com))
- OpenRouteService API key ([free tier](https://openrouteservice.org/dev/#/signup))

### 1. Clone & install
```bash
git clone https://github.com/Girisankarsm/Safar.git
cd Safar
npm install
```

### 2. Environment variables
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
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `VITE_OPENROUTESERVICE_API_KEY` | Yes* | Route geometry, ETA, distance |
| `VITE_DEMO_MODE` | No | `true` = offline fallback with demo data |

> Set `VITE_DEMO_MODE=true` for offline development without API keys.

### 3. Supabase setup
Run migrations in order via Supabase SQL Editor:
1. `20240611000001_initial_schema.sql`
2. `20240611000002_rls_policies.sql`
3. `20240611000003_storage.sql`
4. `20240612000004_live_data_cache.sql`
5. `20240612000005_google_oauth_user_metadata.sql`

Then run `supabase/seed.sql` to add city data.

**Auth setup:**
- Authentication → Providers → Enable **Email** + **Google**
- Authentication → URL Configuration → Add `http://localhost:5173/login` and your Vercel URL

### 4. Run locally
```bash
npm run dev
# → http://localhost:5173
```

---

## Deploy to Vercel

| Setting | Value |
|---------|-------|
| Root directory | `apps/web` |
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Add all `VITE_*` env vars in the Vercel dashboard.

---

## Scoring Architecture

```
Route Score = Σ(weight_i × normalised_metric_i)

Balanced:        0.40×safety + 0.35×(1-eta_norm) + 0.25×(1-cost_norm)
Safest:          0.75×safety + 0.15×(1-eta_norm) + 0.10×(1-cost_norm)
Cheapest:        0.10×safety + 0.20×(1-eta_norm) + 0.70×(1-cost_norm)
Women-Friendly:  0.40×harassment_safety + 0.20×lighting +
                 0.15×police_coverage + 0.10×commercial_density +
                 0.10×hospital_access + 0.05×(1-eta_norm)

Confidence = f(report_coverage, osm_density, police_coverage,
               hospital_coverage, candidate_diversity)

adjustedETA = baseETA × trafficMultiplier(city, hour, dayOfWeek)
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Routes stuck on "Finding routes…" | Add `VITE_OPENROUTESERVICE_API_KEY` or set `VITE_DEMO_MODE=true` |
| Google login fails | Add redirect URL in Supabase Auth → URL Configuration |
| Safe spots not loading | Overpass can be slow; app falls back to curated offline list |
| Empty heatmap | Expected until users submit reports in live mode |
| `Could not generate route` | Pick locations from the autocomplete dropdown (not free text) |
| Signup email not arriving | Disable email confirmation in Auth → Providers → Email |

---

## Scripts

```bash
npm run dev        # Dev server (localhost:5173)
npm run build      # Production build
npm run preview    # Preview production build
npm run typecheck  # TypeScript check
```

---

## Roadmap

- [ ] GTFS public transit routing
- [ ] Push notifications for SOS contacts
- [ ] Offline tile caching (full PWA)
- [ ] User preference learning (city-level route trends)
- [ ] Route history and trip analytics dashboard

---

<div align="center">

Built with **Supabase · OpenStreetMap · OSRM · OpenRouteService · NCRB Data**

**Safar** — Travel Smarter. Travel Safer.

</div>
