# SafarAI — Database Schema

## ER Diagram

```mermaid
erDiagram
    users ||--o{ trips : takes
    users ||--o{ safety_reports : creates
    users ||--o{ emergency_contacts : has
    users ||--|| carbon_wallets : owns
    users ||--o{ community_votes : casts

    trips ||--|| routes : uses
    trips ||--o{ token_transactions : generates

    safety_reports ||--o{ community_votes : receives
    carbon_wallets ||--o{ token_transactions : records

    users {
        uuid id PK
        string clerk_id UK
        string email
        string name
        string college
        string company
        boolean women_safety_mode
        int trust_score
        timestamp created_at
    }

    trips {
        uuid id PK
        uuid user_id FK
        uuid route_id FK
        string status
        jsonb path_coordinates
        float co2_saved_kg
        int tokens_earned
        timestamp started_at
        timestamp completed_at
    }

    routes {
        uuid id PK
        string route_type
        string source
        string destination
        jsonb legs
        int safety_score
        jsonb safety_breakdown
        float distance_km
        int eta_minutes
        float carbon_saved_kg
        int reward_tokens
        string city
    }

    safety_reports {
        uuid id PK
        uuid user_id FK
        string report_type
        string description
        float latitude
        float longitude
        int upvotes
        int verifications
        boolean is_verified
        timestamp created_at
    }

    community_votes {
        uuid id PK
        uuid user_id FK
        uuid report_id FK
        string vote_type
        timestamp created_at
    }

    carbon_wallets {
        uuid id PK
        uuid user_id FK
        int balance
        int lifetime_tokens
        float lifetime_co2_kg
        int green_trips_count
    }

    token_transactions {
        uuid id PK
        uuid wallet_id FK
        uuid trip_id FK
        string type
        int amount
        string description
        timestamp created_at
    }

    emergency_contacts {
        uuid id PK
        uuid user_id FK
        string name
        string phone
        string relationship
    }

    road_ratings {
        uuid id PK
        string segment_id
        string city
        float latitude
        float longitude
        int rating
        string condition
        jsonb factors
    }

    leaderboard_entries {
        uuid id PK
        string entity_type
        string entity_name
        float carbon_saved_kg
        int tokens_earned
        int green_trips
        int rank
        string period
    }
```

## SQL Migration

See `database/migrations/001_initial_schema.sql`

## Indexes

```sql
CREATE INDEX idx_trips_user_status ON trips(user_id, status);
CREATE INDEX idx_safety_reports_geo ON safety_reports(latitude, longitude);
CREATE INDEX idx_safety_reports_type ON safety_reports(report_type);
CREATE INDEX idx_leaderboard_period ON leaderboard_entries(period, entity_type, rank);
CREATE INDEX idx_token_tx_wallet ON token_transactions(wallet_id, created_at DESC);
```

## Seed Data

See `database/seeds/hyderabad_seed.sql` and `backend/app/data/hyderabad/`
