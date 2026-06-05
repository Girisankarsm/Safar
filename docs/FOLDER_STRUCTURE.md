# SafarAI — Complete Folder Structure

```
safarai/
├── README.md
├── .gitignore
├── docker-compose.yml
│
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE_SCHEMA.md
│   ├── API_DOCUMENTATION.md
│   ├── WIREFRAMES.md
│   ├── USER_FLOWS.md
│   ├── ROADMAP.md
│   ├── PRESENTATION.md
│   ├── DEMO_SCRIPT.md
│   ├── SCALABILITY.md
│   └── FOLDER_STRUCTURE.md
│
├── database/
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seeds/
│       └── hyderabad_seed.sql
│
├── backend/
│   ├── requirements.txt
│   ├── .env.example
│   ├── main.py
│   └── app/
│       ├── __init__.py
│       ├── core/
│       │   ├── config.py
│       │   └── database.py
│       ├── models/
│       │   └── models.py
│       ├── schemas/
│       │   └── schemas.py
│       ├── api/
│       │   └── v1/
│       │       ├── router.py
│       │       ├── routes.py
│       │       ├── trips.py
│       │       ├── safety.py
│       │       ├── wallet.py
│       │       ├── leaderboard.py
│       │       ├── sos.py
│       │       └── users.py
│       ├── services/
│       │   ├── routing/
│       │   │   └── hyderabad_router.py
│       │   ├── safety/
│       │   │   └── scoring_engine.py
│       │   ├── carbon/
│       │   │   └── token_service.py
│       │   └── recommendations/
│       │       └── nudge_engine.py
│       └── data/
│           └── hyderabad/
│               ├── stops.json
│               ├── routes.json
│               └── landmarks.json
│
└── frontend/
    ├── package.json
    ├── .env.example
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── globals.css
    │   │   ├── (auth)/
    │   │   │   └── login/page.tsx
    │   │   └── (app)/
    │   │       ├── dashboard/page.tsx
    │   │       ├── plan/page.tsx
    │   │       ├── routes/page.tsx
    │   │       ├── trip/[id]/page.tsx
    │   │       ├── safety-map/page.tsx
    │   │       ├── report/page.tsx
    │   │       ├── wallet/page.tsx
    │   │       ├── leaderboard/page.tsx
    │   │       ├── profile/page.tsx
    │   │       └── settings/page.tsx
    │   ├── components/
    │   │   ├── ui/
    │   │   ├── layout/
    │   │   ├── maps/
    │   │   ├── routes/
    │   │   ├── safety/
    │   │   └── wallet/
    │   ├── lib/
    │   │   ├── api/
    │   │   ├── hooks/
    │   │   ├── stores/
    │   │   ├── utils/
    │   │   └── types/
    │   └── config/
    │       └── site.ts
    └── public/
        └── logo.svg
```
