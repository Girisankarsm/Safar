# SafarAI

**India's AI-Powered Safe Mobility Platform**

Built for the OneJourney Mobility Hackathon 2026.

Plan safer, smarter, and greener multi-modal routes across Hyderabad. Earn Green Tokens for public transport. Community-driven safety intelligence.

---

## Quick Start (Demo Mode — No Database Required)

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

App: http://localhost:3000

### 3. Demo Flow

1. Open http://localhost:3000
2. Click **Get Started** → **Continue as Demo User**
3. Dashboard → **Find Routes** (HITEC City → Secunderabad Station)
4. Select **Safest** route → Live Trip → **End** trip
5. View earned tokens in **Wallet**
6. Explore **Safety Map** and **Leaderboard**

---

## Project Structure

```
├── docs/           # PRD, Architecture, API docs, Wireframes, Demo script
├── database/       # PostgreSQL migrations + seed data
├── backend/        # FastAPI — routing, safety engine, wallet APIs
└── frontend/       # Next.js 15 — 12 pages, Mapbox/Leaflet maps
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React, TypeScript, TailwindCSS, Shadcn-style UI, Framer Motion, Zustand |
| Maps | Leaflet + OpenStreetMap (no API key required) |
| Backend | FastAPI, Python |
| Database | PostgreSQL (optional — demo uses in-memory store) |
| Auth | Clerk-ready + demo mode |

---

## Core Features

- **Smart Journey Planner** — Fastest / Safest / Greenest route comparison
- **AI Safety Score** — 0–100 with factor breakdown
- **Women Safety Mode** — SOS, silent alert, trip sharing, deviation alerts
- **Community Safety Layer** — Report, upvote, verify incidents on map
- **Carbon Rewards** — Green Tokens for metro, bus, walk, cycle
- **Leaderboard** — Individuals, colleges, companies
- **Road Intelligence** — Good / Moderate / Poor road overlay

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/routes/search` | Search 3 route options |
| POST | `/api/v1/trips/start` | Start live trip |
| POST | `/api/v1/trips/{id}/complete` | Complete + earn tokens |
| POST | `/api/v1/sos/trigger` | Trigger SOS alert |
| GET/POST | `/api/v1/safety/reports` | Community reports |
| GET | `/api/v1/wallet` | Token balance |
| GET | `/api/v1/leaderboard` | Rankings |

Full docs: `docs/API_DOCUMENTATION.md`

---

## Optional: PostgreSQL

```bash
docker compose up -d postgres
```

Set `DATABASE_URL=postgresql://safarai:safarai@localhost:5432/safarai` in `backend/.env`

---

## Hackathon Deliverables

All documentation in `/docs`:

1. PRD.md
2. ARCHITECTURE.md
3. DATABASE_SCHEMA.md
4. API_DOCUMENTATION.md
5. WIREFRAMES.md
6. USER_FLOWS.md
7. ROADMAP.md
8. PRESENTATION.md
9. DEMO_SCRIPT.md
10. SCALABILITY.md

---

## Team

OneJourney Mobility Hackathon 2026 — Hyderabad MVP
