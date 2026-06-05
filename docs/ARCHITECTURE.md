# SafarAI — System Architecture

## High-Level Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend (Next.js 15)"]
        LP[Landing Page]
        RP[Route Planner]
        LT[Live Trip]
        SM[Safety Map]
        WL[Wallet]
        LB[Leaderboard]
    end

    subgraph Auth["Authentication"]
        Clerk[Clerk Auth]
        Demo[Demo Mode Fallback]
    end

    subgraph API["Backend (FastAPI)"]
        RS[Route Service]
        SS[Safety Scorer]
        CS[Carbon Service]
        SOS[SOS Service]
        CR[Community Reports]
        LB_API[Leaderboard Service]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL)]
        SB[Supabase Storage]
        Mock[Mock Hyderabad GTFS]
    end

    subgraph External["External Services"]
        Mapbox[Mapbox Maps]
        FCM[Firebase FCM]
    end

    Client --> Auth
    Client --> API
    API --> PG
    API --> Mock
    Client --> Mapbox
    API --> FCM
    Client --> SB
```

## Component Architecture

### Frontend Layers

```
app/                    # Next.js App Router pages
components/
  ui/                   # Shadcn primitives
  maps/                 # Mapbox/Leaflet wrappers
  routes/               # Route cards, comparison
  safety/               # SOS, reports, scores
  wallet/               # Token wallet UI
  layout/               # Nav, shell, mobile bar
lib/
  api/                  # API client (fetch wrappers)
  hooks/                # useTrip, useWallet, useSafety
  stores/               # Zustand stores
  utils/                # Formatters, CO₂ calc
  types/                # TypeScript interfaces
```

### Backend Layers

```
app/
  api/v1/               # REST route handlers
  core/                 # Config, security, deps
  models/               # SQLAlchemy ORM models
  schemas/              # Pydantic request/response
  services/
    routing/            # Journey planner + mock GTFS
    safety/             # Safety scoring engine
    carbon/             # Token + CO₂ calculations
    community/          # Reports + votes
    sos/                # Emergency alerts
  data/
    hyderabad/          # Mock stops, routes, roads
```

## Data Flow: Trip Planning

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Next.js
    participant API as FastAPI
    participant RS as Route Service
    participant SS as Safety Scorer
    participant DB as PostgreSQL

    U->>FE: Enter source + destination
    FE->>API: POST /api/v1/routes/search
    API->>RS: Generate 3 route variants
    RS->>RS: Load mock Hyderabad graph
    RS->>SS: Score each route segment
    SS->>SS: Apply factor weights
    SS-->>RS: Safety scores + breakdown
    RS->>RS: Calculate CO₂ + tokens
    RS-->>API: 3 RouteOption objects
    API-->>FE: JSON response
    FE-->>U: Route comparison cards
```

## Data Flow: Active Trip + Rewards

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Next.js
    participant API as FastAPI
    participant DB as PostgreSQL

    U->>FE: Start trip (Safe route)
    FE->>API: POST /api/v1/trips/start
    API->>DB: Create trip (status=active)
    loop Every 30s
        FE->>API: PATCH /api/v1/trips/{id}/location
        API->>API: Check route deviation
    end
    U->>FE: Complete trip
    FE->>API: POST /api/v1/trips/{id}/complete
    API->>API: Calculate tokens + CO₂
    API->>DB: Credit wallet + log transaction
    API->>DB: Update leaderboard
    API-->>FE: Rewards summary
    FE-->>U: "You earned 47 tokens!"
```

## Safety Scoring Engine

```
Input: RouteSegment[]
  - road_type, time_of_day, walking_meters
  - nearby_reports[], crowd_level, lighting_level

Process:
  base_score = 70
  for each factor in SAFETY_FACTORS:
    base_score += factor.weight * factor.value

  clamp(base_score, 0, 100)

Output: SafetyScore
  - total: int
  - label: Safe | Moderate | Risky
  - factors: [{name, impact, description}]
```

## Multi-City Expansion Strategy

```python
# City adapter pattern
class CityAdapter(Protocol):
    def get_stops(self) -> list[Stop]: ...
    def get_routes(self) -> list[Route]: ...
    def get_road_segments(self) -> list[RoadSegment]: ...

# MVP: HyderabadAdapter with mock JSON
# Future: ChennaiAdapter loads GTFS from data/chennai/
```

## Deployment Architecture (Hackathon)

```
┌─────────────────┐     ┌─────────────────┐
│  Vercel         │     │  Railway/Render │
│  Next.js 15     │────▶│  FastAPI        │
│  (Frontend)     │     │  (Backend)      │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │  Supabase       │
                        │  PostgreSQL     │
                        └─────────────────┘
```

## Security Considerations

- Clerk JWT validation on all protected endpoints
- SOS alerts rate-limited (3/hour per user)
- Community reports moderated by trust score
- Location data encrypted at rest
- Demo mode disabled in production

## Performance Targets

| Endpoint | Target |
|----------|--------|
| POST /routes/search | < 500ms |
| GET /safety/reports | < 200ms |
| POST /trips/complete | < 300ms |
| Map tile load | < 1s |
