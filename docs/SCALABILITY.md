# SafarAI — Future Scalability Plan

## 1. Multi-City Expansion

### City Adapter Pattern
Each city implements a `CityTransitAdapter`:

```python
class CityTransitAdapter(Protocol):
    city_id: str
    def get_stops(self) -> list[Stop]: ...
    def get_routes(self) -> list[TransitRoute]: ...
    def plan_journey(self, origin, dest, prefs) -> list[Journey]: ...
```

| City | Data Source | Status |
|------|-------------|--------|
| Hyderabad | Mock JSON + HMRL/TGSRTC GTFS | MVP |
| Chennai | MTC GTFS + CMRL | Phase 2 |
| Bengaluru | BMTC + BMRCL (bengaluru-transit SDK) | Phase 2 |
| Delhi | DMRC + DTC GTFS | Phase 3 |
| Mumbai | BEST + Mumbai Metro GTFS | Phase 3 |

Adding a city = new adapter + seed data. No core logic changes.

---

## 2. Real-Time Data Integration

| Layer | MVP | Production |
|-------|-----|------------|
| Schedules | Static GTFS | GTFS + GTFS-RT |
| Vehicle positions | Mock | GTFS-RT feeds |
| Crowd | Time-of-day rules | Historical + ML model |
| Safety | Community + rules | + Safetipin API, CCTV metadata |

---

## 3. AI/ML Roadmap

| Feature | MVP | Future |
|---------|-----|--------|
| Safety scoring | Rule-based engine | ML on incident data |
| Recommendations | Template strings | LLM-personalized nudges |
| Crowd prediction | Peak-hour heuristics | LSTM on historical ridership |
| Voice search | — | Gemini multilingual (Hindi, Telugu, Tamil) |

---

## 4. Infrastructure Scaling

```
MVP (Hackathon):
  Vercel + Render + Supabase Free Tier
  ~100 concurrent users

Phase 2 (1K users):
  + Redis cache for route results
  + CDN for map tiles
  + Read replicas on PostgreSQL

Phase 3 (100K users):
  + Kubernetes on AWS/GCP
  + Event-driven trip tracking (Kafka)
  + Regional API gateways per city
  + PostGIS for geospatial queries
```

---

## 5. Business Model Scaling

| Segment | Model | Timeline |
|---------|-------|----------|
| B2C Commuters | Freemium (premium safety features) | Launch |
| B2B Corporates | ESG dashboard subscription | Phase 2 |
| B2G Transport authorities | Analytics API licensing | Phase 3 |
| Token economy | Brand-sponsored redemptions | Phase 2 |
| Carbon credits | Verified offset partnerships | Phase 4 |

---

## 6. Security & Compliance

- GDPR-style data deletion for location history
- SOS data retained 30 days max
- Community report moderation queue at scale
- India DPDP Act compliance for personal data
- Rate limiting on all public endpoints

---

## 7. OneJourney Integration Path

SafarAI modules map directly to OneJourney super-app:

| SafarAI Module | OneJourney Feature |
|----------------|-------------------|
| Route comparison | Intelligent comparison engine |
| Women Safety Mode | Women safety focus |
| Carbon Tokens | Loyalty / rewards layer |
| Community reports | Trust & safety data layer |
| Multi-modal planner | Core journey booking |

**Integration:** SafarAI exposes REST APIs that OneJourney consumes as a mobility intelligence microservice.
