# SafarAI — Supabase Integration Guide

Your Supabase project is already set up:

| Setting | Value |
|---------|-------|
| **Project** | Safar-Ai |
| **Project URL** | `https://vbrmgcedfsokvtwepuyh.supabase.co` |
| **Region** | Southeast Asia (Singapore) |
| **GitHub** | Connected to `Girisankarsm/Safar-Ai` |

---

## Step 1 — Run SQL in Supabase (if not done yet)

In **Supabase Dashboard → SQL Editor**, run these **in order**:

1. `database/migrations/001_initial_schema.sql` — creates all tables
2. `database/seeds/hyderabad_seed.sql` — adds demo data

Verify in **Table Editor** — you should see `users`, `carbon_wallets`, `safety_reports`, etc.

---

## Step 2 — Get your connection credentials

### A. Database password
**Settings → Database → Database password**  
(Reset if you don't remember it)

### B. Connection string (for backend)
**Settings → Database → Connection string → URI**

Choose **Session pooler** (port `5432`) for FastAPI:

```
postgresql://postgres.vbrmgcedfsokvtwepuyh:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

Replace `[YOUR-PASSWORD]` with your actual database password.

### C. API Keys (for frontend, optional)
**Settings → API → Project API keys**

| Key | Use |
|-----|-----|
| `anon` `public` | Frontend (safe to expose) |
| `service_role` `secret` | Backend only — never put in frontend |

---

## Step 3 — Configure Backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.vbrmgcedfsokvtwepuyh:YOUR_PASSWORD@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
USE_DATABASE=true
SUPABASE_URL=https://vbrmgcedfsokvtwepuyh.supabase.co
DEMO_MODE=false
CORS_ORIGINS=http://localhost:3000
```

Start backend:

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Verify connection:**

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "app": "SafarAI",
  "database": "connected",
  "supabase_url": "https://vbrmgcedfsokvtwepuyh.supabase.co"
}
```

If `"database": "demo"` — check your `DATABASE_URL` and password.

---

## Step 4 — Configure Frontend (optional)

Update `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://vbrmgcedfsokvtwepuyh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
```

```bash
cd frontend
npm install
npm run dev
```

---

## What connects to Supabase?

| Data | Stored in Supabase? |
|------|---------------------|
| Users & profiles | ✅ Yes |
| Carbon wallet & transactions | ✅ Yes |
| Safety reports & votes | ✅ Yes |
| Leaderboard | ✅ Yes |
| Road ratings | ✅ Yes |
| Emergency contacts | ✅ Yes |
| Active trips (live) | ❌ In-memory (session) |
| Route search cache | ❌ In-memory (ephemeral) |

Wallet updates from completed trips **are saved** to Supabase.

---

## Architecture

```
Frontend (Next.js)
    ↓ REST API
Backend (FastAPI)
    ↓ SQLAlchemy
Supabase PostgreSQL
    ↑
Supabase Dashboard (Table Editor, SQL Editor)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `database: demo` in /health | Set `USE_DATABASE=true` and correct `DATABASE_URL` |
| SSL connection error | Connection string auto-adds `sslmode=require` |
| `relation does not exist` | Run `001_initial_schema.sql` in SQL Editor |
| Empty tables | Run `hyderabad_seed.sql` |
| Password auth failed | Reset password in Supabase → Database settings |

---

## Disable Supabase (demo mode)

Set in `backend/.env`:
```env
USE_DATABASE=false
```

App falls back to in-memory demo store — no database needed.
