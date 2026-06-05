# SafarAI — Hackathon Presentation (8 Slides)

## Slide 1: Title
**SafarAI**  
*India's AI-Powered Safe Mobility Platform*

Team: [Names]  
OneJourney Mobility Hackathon 2026

---

## Slide 2: Problem
- 52% of women skip opportunities due to unsafe commutes
- Route apps optimize speed, not safety
- Metro, bus, train live in separate apps
- No reward for choosing public transport

*"Commuting in India is a daily compromise — especially for women."*

---

## Slide 3: Solution
**SafarAI** — one platform that:
1. Compares **Fastest vs Safest vs Greenest** routes
2. Protects women with **SOS + live sharing**
3. Rewards green trips with **Carbon Tokens**
4. Crowdsources **community safety intelligence**

---

## Slide 4: Live Demo
*[Screen recording or live demo]*
- Plan: HITEC City → Secunderabad
- Show 3 route cards with safety scores
- Start safest route → SOS → complete → earn tokens

---

## Slide 5: Technology
| Layer | Stack |
|-------|-------|
| Frontend | Next.js 15, TypeScript, Tailwind, Shadcn |
| Backend | FastAPI, Python |
| Database | PostgreSQL (Supabase) |
| Maps | Mapbox |
| Auth | Clerk |
| AI | Safety scoring engine + smart nudges |

Mock Hyderabad GTFS — no unavailable govt APIs

---

## Slide 6: Safety Score Engine
```
Base 70 + road type + lighting + crowd + community reports
         - night penalty - long walk penalty
= Score 0–100 (Safe / Moderate / Risky)
```

Community reports with upvote/verify → trust-weighted scoring

---

## Slide 7: Impact & Business Model
**Impact:**
- 10K users × 3 green trips/week = 150 tonnes CO₂/year
- Safer night commutes for women shift workers

**Revenue:**
- B2C: Premium safety features
- B2B: Corporate ESG dashboards
- B2G: City transport analytics

---

## Slide 8: Roadmap & Ask
**Now:** Hyderabad MVP  
**Next:** Chennai, Bengaluru, real GTFS-RT  
**Vision:** India's commute super-app

*We'd love to integrate SafarAI into OneJourney's platform.*

**Thank you!** Questions?

---

## Q&A Prep

| Question | Answer |
|----------|--------|
| How is safety score calculated? | Rule-based engine: 6 weighted factors + community data |
| Real data sources? | Mock Hyderabad transit + crowdsourced reports; GTFS-ready architecture |
| How do tokens have value? | Redeemable for last-mile ride discounts; corporate sponsorship in Phase 2 |
| Privacy for SOS? | Location shared only with user-approved emergency contacts |
| Why web not native? | Faster hackathon build; PWA-ready for mobile |
