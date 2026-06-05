# SafarAI — Product Requirements Document

**Version:** 1.0.0  
**Status:** Hackathon MVP  
**Tagline:** India's AI-Powered Safe Mobility Platform

---

## 1. Executive Summary

SafarAI is a mobile-first web platform for Indian commuters that plans multi-modal journeys across metro, bus, train, and walking — ranking routes by **speed**, **safety**, and **carbon impact**. It rewards public transport usage with **Green Tokens** and enables community-driven safety reporting.

**MVP City:** Hyderabad (HMRL Metro, MMTS, TGSRTC buses)  
**Expansion:** Chennai, Bengaluru, Delhi, Mumbai

---

## 2. Problem Statement

| Problem | Impact |
|---------|--------|
| Route apps optimize for speed only | Women avoid unsafe routes; night commuters lack options |
| Fragmented transit data | Metro, bus, train live in separate apps |
| No reward for green commuting | Public transport usage has no tangible benefit |
| Safety data is siloed | Community knowledge (potholes, harassment, lighting) is lost |

---

## 3. Goals & Success Metrics

### MVP Goals (48-hour build)
- [ ] Plan trip with 3 route comparisons (Fast / Safe / Green)
- [ ] Display safety scores (0–100) with factor breakdown
- [ ] Women Safety Mode with SOS + trip sharing
- [ ] Community safety reports on map
- [ ] Carbon token wallet with earn/redeem flow
- [ ] Leaderboard with sample data
- [ ] Polished demo-ready UI

### Success Metrics (Post-launch vision)
- Daily active users completing ≥1 trip/week
- 30% of users enabling Women Safety Mode
- Avg. 15+ tokens earned per green trip
- 50+ community reports in first month per city

---

## 4. User Personas

### Priya — College Student (Primary)
- Uses metro + bus daily in Hyderabad
- Needs safe routes after evening classes
- Motivated by token rewards for auto discounts

### Anitha — Night Shift Worker
- Works 10 PM–6 AM
- Needs night-safe routes with 24/7 transport
- SOS and live sharing are critical

### Rahul — Corporate Commuter
- Compares metro vs cab for carbon footprint
- Competes on company leaderboard

---

## 5. Feature Specifications

### 5.1 Smart Journey Planner

**Input:** Source, Destination (text search or map pin)  
**Output:** 3 route cards

| Field | Description |
|-------|-------------|
| ETA | Total journey time |
| Distance | Total km |
| Safety Score | 0–100 |
| Carbon Saved | kg CO₂ vs car baseline |
| Reward Tokens | Estimated tokens for completion |
| Legs | Mode breakdown (metro, bus, walk) |

**Route Types:**
1. **Fastest** — Minimize total time
2. **Safest** — Maximize safety score
3. **Greenest** — Maximize tokens + CO₂ savings

### 5.2 AI Safety Score Engine

**Score range:** 0–100

| Factor | Weight | Example |
|--------|--------|---------|
| Time of day | ±15 | Night (10PM–5AM): -10 |
| Road type | ±20 | Main road: +20, Alley: -15 |
| Community reports | ±25 | Verified safe zone: +25 |
| Crowd density | ±15 | Peak hour crowded: -10 |
| Lighting estimate | ±20 | Poor lighting: -20 |
| Walking distance | ±15 | >800m last-mile walk: -15 |

**Labels:** Safe (75–100), Moderate (50–74), Risky (0–49)

### 5.3 Women Safety Mode

When enabled:
- Routes re-ranked with 1.5× safety weight
- SOS button (visible + silent via volume-down double-tap)
- Live trip share link to emergency contacts
- Route deviation alert (>200m off planned path)
- Night-safe preference auto-enabled after 10 PM

### 5.4 Community Safety Layer

**Report types:** Unsafe area, Harassment, Broken light, Pothole, Flooded road, Dangerous crossing

**Actions:** Create report, Upvote, Verify (3 verifications = trusted)

**Trust score:** Reporter reputation based on verified reports

### 5.5 Carbon Rewards

| Mode | Tokens/km |
|------|-----------|
| Metro | 5 |
| Bus | 8 |
| Walking | 10 |
| Cycle | 12 |

**CO₂ factors (kg/km vs car baseline 0.21):**
- Metro: 0.03, Bus: 0.05, Walk: 0, Cycle: 0, Car: 0.21

### 5.6 Leaderboard

**Categories:** Individuals, Colleges, Companies  
**Metrics:** Carbon saved, Tokens earned, Green trips

### 5.7 Road Intelligence Layer

Map overlay colors:
- 🟢 Green — Good (score 75+)
- 🟡 Yellow — Moderate (50–74)
- 🔴 Red — Poor (<50)

### 5.8 Smart Recommendations

Context-aware nudges generated from route comparison and time of day.

---

## 6. Non-Goals (MVP)

- Real payment integration
- Blockchain / crypto tokens
- Live government CCTV feeds
- Native iOS/Android apps (PWA-ready web instead)
- Real-time GTFS-RT (mock ETAs acceptable)

---

## 7. Technical Constraints

- Buildable in 24–48 hours by 2–4 person team
- Mock Hyderabad transit data (no unavailable govt APIs)
- Clerk auth with demo fallback
- PostgreSQL via Supabase or local Docker

---

## 8. Acceptance Criteria

| Feature | Criteria |
|---------|----------|
| Route search | Returns 3 routes in <2s with all metrics |
| Safety score | Shows breakdown of contributing factors |
| SOS | Triggers alert + notifies emergency contacts (mock) |
| Report | Appears on map within 1s of submission |
| Wallet | Tokens credited on trip completion |
| Leaderboard | Shows top 10 with real-time rank updates |

---

## 9. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| No real transit APIs | Curated mock GTFS for Hyderabad |
| Safety data sparse | Seed 50+ community reports |
| Scope creep | Tier 1 features only for demo |
| Auth complexity | Demo mode bypass for judges |

---

## 10. Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Architecture + DB | 4h | Schema, API spec, folder structure |
| Backend core | 8h | Routes, safety engine, wallet APIs |
| Frontend shell | 8h | All 12 pages, design system |
| Integration | 6h | API wiring, map, live trip |
| Demo polish | 6h | Seed data, video script, presentation |

**Total:** ~32 hours (fits 48h hackathon with buffer)
