# Safar — Travel Smarter. Travel Safer.

AI-powered public transit safety for Indian commuters (Chennai, Hyderabad & Bangalore).

## Project structure

```
safarai/
├── apps/
│   ├── api/                 # FastAPI backend (Python)
│   │   ├── app/             # Application code
│   │   │   ├── api/         # REST routes
│   │   │   ├── core/        # Config, database
│   │   │   ├── models/      # SQLAlchemy models
│   │   │   ├── repositories/# Data access layer
│   │   │   ├── schemas/     # Pydantic schemas
│   │   │   ├── services/    # Business logic (routing, CCTV, safety)
│   │   │   └── data/        # GTFS + OSM cache (Chennai/Hyderabad)
│   │   ├── main.py
│   │   └── requirements.txt
│   └── web/                 # Next.js frontend (TypeScript)
│       ├── src/
│       │   ├── app/         # Pages & layouts
│       │   ├── components/  # UI components
│       │   ├── hooks/       # React hooks
│       │   └── lib/         # API client, utilities
│       └── public/
├── database/
│   ├── migrations/          # Supabase schema
│   └── seeds/               # Demo data
├── scripts/                 # Dev orchestration
├── .env                     # Single env file (not in git)
├── package.json             # Monorepo root (npm workspaces)
└── docker-compose.yml       # Local Postgres (optional)
```

## Quick start

```bash
# 1. Environment
cp .env.example .env
# Fill in Supabase + optional MAPBOX token

# 2. Install (first time)
npm run setup          # Python deps + npm workspaces

# 3. Run API + web together
npm run dev
```

- **Web:** http://localhost:3000  
- **API:** http://localhost:8000/health  

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API + web (hot reload) |
| `npm run build` | Production build (web) |
| `npm run start` | Production servers |
| `npm run lint` | ESLint (web) |
| `npm run health` | Check API status |

## Database (Supabase)

Run once in SQL editor:

1. `database/migrations/001_initial_schema.sql`
2. `database/seeds/update_demo_user.sql`
3. `database/seeds/chennai_seed.sql`

## Environment

Single root `.env` — see `.env.example`. Key variables:

- `DATABASE_URL`, `USE_DATABASE=true`, `SUPABASE_*`
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MAPBOX_TOKEN` (optional, for map tiles)

## Tech stack

| Layer | Technology |
|-------|------------|
| Web | Next.js 16, React 19, Tailwind 4, Mapbox GL |
| API | FastAPI, SQLAlchemy, Supabase PostgreSQL |
| Data | GTFS transit, OSM Overpass CCTV, Nominatim geocoding |
