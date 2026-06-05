# SafarAI v2 — Real-time Safe Urban Mobility

Rebuilt from scratch with live GTFS transit routing, OSM CCTV safety layers, GPS trip tracking, SOS, and GreenMiles wallet. Uses your existing **Supabase** project and local `.env` files.

## Quick start

```bash
# Backend
cd backend && source venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm run dev
```

Open http://localhost:3000

## Real-time features

| Feature | Source |
|---------|--------|
| Metro/bus routing | GTFS-static stops (Chennai CMRL, Hyderabad HMRL) |
| CCTV safety layer | OpenStreetMap Overpass (cached) |
| Live trip safety | Browser GPS → `/trips/{id}/location` |
| Night-shift filter | GTFS `service_end` + walk limits |
| Community reports | Supabase `safety_reports` |
| SOS + trip share | Twilio (optional) + share token |
| GreenMiles / CO₂ | Trip completion → wallet |

## Database

Run once on Supabase SQL editor:

1. `database/migrations/001_initial_schema.sql`
2. `database/seeds/hyderabad_seed.sql`
3. `database/seeds/chennai_seed.sql`

## Env (kept locally, not in git)

- `backend/.env` — `DATABASE_URL`, `USE_DATABASE=true`, Supabase keys
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`

Optional SOS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` in `backend/.env`.
